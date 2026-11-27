#!/usr/bin/env bash
set -euo pipefail

here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

if (( EUID != 0 )); then
  echo "Run as root on the new VPS." >&2
  exit 1
fi

install_config() {
  local source=$1 destination=$2
  if [[ -e "$destination" ]] && ! cmp -s "$source" "$destination"; then
    echo "Existing config differs: $destination" >&2
    return 1
  fi
  install -m 0644 "$source" "$destination"
}

load_nginx_config() {
  local name=$1 destination="/etc/nginx/conf.d/$1" created=0
  [[ -e "$destination" ]] || created=1
  install_config "$here/nginx/$name" "$destination"
  if ! nginx -t; then
    if (( created )); then rm -- "$destination"; fi
    return 1
  fi
  systemctl reload nginx
}

if [[ $# == 1 && $1 == tls ]]; then
  for domain in adaliagame.ru test.adaliagame.ru; do
    for file in fullchain.pem privkey.pem; do
      if [[ ! -s "/etc/letsencrypt/live/$domain/$file" ]]; then
        echo "Certificate file missing for $domain: $file" >&2
        exit 1
      fi
    done
  done
  load_nginx_config adalia-tls.conf
  exit
fi

if [[ $# != 2 ]]; then
  echo "Usage: $0 DEPLOY_PUBLIC_KEY TUNNEL_PUBLIC_KEY | $0 tls" >&2
  exit 2
fi

read_key() {
  local file=$1 type="" blob=""
  read -r type blob _ <"$file" || true
  case "$type" in
    ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521) ;;
    *) echo "Expected an OpenSSH public key: $file" >&2; return 1 ;;
  esac
  ssh-keygen -lf "$file" >/dev/null
  printf '%s %s\n' "$type" "$blob"
}

deploy_key=$(read_key "$1")
tunnel_key=$(read_key "$2")

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx openssh-server rsync certbot ca-certificates curl

add_key() {
  local account=$1 key=$2 home
  if ! id "$account" >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "$account"
  fi
  home=$(getent passwd "$account" | cut -d: -f6)
  runuser -u "$account" -- bash -eu -c '
    umask 077
    mkdir -p -- "$1/.ssh"
    chmod 0700 "$1/.ssh"
    authorized="$1/.ssh/authorized_keys"
    touch "$authorized"
    chmod 0600 "$authorized"
    if ! grep -Fxq "$2" "$authorized"; then
      printf "\n%s\n" "$2" >>"$authorized"
    fi
  ' bash "$home" "$key"
}

add_key adalia-deploy "$deploy_key"
add_key adalia-tunnel "$tunnel_key"
for site in adalia-production adalia-test; do
  install -d -m 0755 -o adalia-deploy -g adalia-deploy "/var/www/$site" "/var/www/$site/releases"
done
install -d -m 0755 /var/www/adalia-acme

ssh_config=/etc/ssh/sshd_config.d/60-adalia-tunnel.conf
ssh_config_created=0
[[ -e "$ssh_config" ]] || ssh_config_created=1
install_config "$here/adalia-tunnel.sshd.conf" "$ssh_config"
if ! /usr/sbin/sshd -t; then
  if (( ssh_config_created )); then rm -- "$ssh_config"; fi
  exit 1
fi
if systemctl is-active --quiet ssh.service; then
  systemctl reload ssh.service
fi

for snippet in headers site proxy; do
  install_config "$here/nginx/adalia-$snippet.conf" "/etc/nginx/snippets/adalia-$snippet.conf"
done
install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
install -m 0755 "$here/reload-nginx-after-renewal" /etc/letsencrypt/renewal-hooks/deploy/adalia-nginx
systemctl enable --now nginx
load_nginx_config adalia-http.conf
