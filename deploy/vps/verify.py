#!/usr/bin/env python3
"""Read-only HTTPS checks. Pass the new IP to bypass DNS before cutover."""

import argparse
import ipaddress
import json
from pathlib import Path
import subprocess
import tempfile
from urllib.parse import quote


PRODUCTION = "adaliagame.ru"
WWW = "www.adaliagame.ru"
TEST = "test.adaliagame.ru"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ip", nargs="?", type=ipaddress.ip_address)
    parser.add_argument("--cacert", type=Path, help="Use a separate CA for a local rehearsal")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as scratch:
        check_sites(args, Path(scratch))


def check_sites(args, scratch):
    def fetch(host, path, *, statuses=(200,), mime=None, scheme="https", options=()):
        url = f"{scheme}://{host}{quote(path, safe='/%')}"
        body_file = scratch / "body"
        header_file = scratch / "headers"
        command = [
            "curl", "--silent", "--show-error", "--noproxy", "*",
            "--connect-timeout", "8", "--max-time", "20",
            "--output", str(body_file), "--dump-header", str(header_file),
            "--write-out", "%{http_code}\n%{content_type}\n%{redirect_url}",
        ]
        if args.ip:
            address = f"[{args.ip}]" if args.ip.version == 6 else str(args.ip)
            port = 443 if scheme == "https" else 80
            command.extend(["--resolve", f"{host}:{port}:{address}"])
        if args.cacert:
            command.extend(["--cacert", str(args.cacert)])
        command.extend((*options, url))
        result = subprocess.run(command, check=True, stdout=subprocess.PIPE, text=True)
        status, actual_mime, redirect = result.stdout.split("\n", 2)
        if int(status) not in statuses:
            raise ValueError(f"{url}: HTTP {status}, expected {statuses}")
        if mime and actual_mime.partition(";")[0] not in mime:
            raise ValueError(f"{url}: unexpected Content-Type {actual_mime}")
        print(f"OK {status} {host}{path}", flush=True)
        return body_file.read_bytes(), header_file.read_text(encoding="iso-8859-1"), redirect

    for host in (PRODUCTION, WWW, TEST):
        _, _, redirect = fetch(host, "/help", statuses=(301,), scheme="http")
        canonical = PRODUCTION if host == WWW else host
        if redirect != f"https://{canonical}/help":
            raise ValueError(f"{host}: unexpected HTTP redirect")
        page, _, _ = fetch(host, "/help", mime=("text/html",))
        manifest, _, _ = fetch(host, "/asset-manifest.json", mime=("application/json",))
        main_script = json.loads(manifest)["files"]["main.js"]
        if not main_script.startswith("/static/js/") or main_script.encode() not in page:
            raise ValueError(f"{host}: HTML and the build manifest disagree")
        fetch(host, main_script, mime=("application/javascript", "text/javascript"),
              statuses=(200, 206), options=("--range", "0-127"))
        fetch(host, "/help-images/__migration_probe_missing__.webp", statuses=(404,))

    for host in (PRODUCTION, WWW):
        body, _, _ = fetch(host, "/api/", mime=("application/json",))
        if json.loads(body).get("status") != 200:
            raise ValueError(f"{host}: the backend health route is not ready")

    body, _, _ = fetch(TEST, "/api/", mime=("application/json",), statuses=(200, 403))
    if not isinstance(json.loads(body), dict):
        raise ValueError("The test host did not return a backend JSON response")
    fetch(TEST, "/navyi/api/access", mime=("application/json",), statuses=(401,))
    _, _, redirect = fetch(TEST, "/navyi", statuses=(308,))
    if redirect != f"https://{TEST}/navyi/":
        raise ValueError("Unexpected Navyi redirect")

    _, headers, _ = fetch(
        PRODUCTION, "/api/", statuses=(204,),
        options=("-X", "OPTIONS", "-H", f"Origin: https://{PRODUCTION}",
                 "-H", "Access-Control-Request-Method: GET"),
    )
    allowed = [line.partition(":")[2].strip() for line in headers.splitlines()
               if line.lower().startswith("access-control-allow-origin:")]
    if allowed != [f"https://{PRODUCTION}"]:
        raise ValueError("Unexpected production CORS response")

    preview, _, _ = fetch(PRODUCTION, "/help-images/classes/t1-cards/Воин.webp",
                          mime=("image/webp",), statuses=(200, 206), options=("--range", "0-11"))
    if preview[:4] != b"RIFF" or preview[8:12] != b"WEBP":
        raise ValueError("The class card is not a WebP image")
    fetch(PRODUCTION, "/help-books/adalia-class-book.pdf", mime=("application/pdf",),
          statuses=(200, 206), options=("--range", "0-7"))


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        raise SystemExit(f"curl check failed with exit code {error.returncode}") from None
    except (KeyError, TypeError, ValueError) as error:
        raise SystemExit(f"VPS verification failed: {error}") from None
