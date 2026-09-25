#!/usr/bin/env bash
set -euo pipefail

target=${1:-test}
ssh_host=${SSH_HOST:-195.133.196.237}
ssh_user=${SSH_USER:-adalia-deploy}

case "$target" in
  test)
    deploy_path=/var/www/adalia-test
    site_url=https://test.adaliagame.ru/
    ;;
  production|prod)
    deploy_path=/var/www/adalia-production
    site_url=https://adaliagame.ru/
    ;;
  *)
    echo "Usage: $0 test|production" >&2
    exit 1
    ;;
esac

for command_name in npm rsync ssh curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is missing: $command_name" >&2
    exit 1
  fi
done

if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
  echo "Installing dependencies from package-lock.json..."
  npm ci --no-audit --no-fund
fi

echo "Building frontend..."
CI=false npm run build

release_id=$(date +%s%N)
release_path="$deploy_path/releases/$release_id"
remote="$ssh_user@$ssh_host"
ssh_options=(-o BatchMode=yes -o ConnectTimeout=10)

if [[ "$target" == production || "$target" == prod ]]; then
  if ! ssh "${ssh_options[@]}" "$remote" "test -f '$deploy_path/.enabled'"; then
    echo "Production deploy is not enabled yet. Verify the test site first." >&2
    exit 1
  fi

  printf 'Deploy current changes to PRODUCTION? Type "deploy": '
  read -r confirmation
  if [[ "$confirmation" != deploy ]]; then
    echo "Production deploy cancelled."
    exit 1
  fi
fi

echo "Preparing $target release $release_id..."
ssh "${ssh_options[@]}" "$remote" "mkdir -p '$release_path'"

echo "Uploading changed files..."
rsync \
  --archive \
  --delete \
  --human-readable \
  --info=progress2,stats2 \
  --link-dest="$deploy_path/current" \
  -e "ssh -o BatchMode=yes -o ConnectTimeout=10" \
  build/ "$remote:$release_path/"

echo "Activating release..."
ssh "${ssh_options[@]}" "$remote" \
  "test -f '$release_path/index.html' && ln -sfn '$release_path' '$deploy_path/current.next' && mv -Tf '$deploy_path/current.next' '$deploy_path/current'"

echo "Checking $site_url..."
if ! curl --fail --silent --show-error --retry 2 --retry-delay 2 "$site_url" >/dev/null; then
  if [[ "$target" == test ]] && curl --fail --silent --show-error \
    -H "Host: test.adaliagame.ru" "http://$ssh_host/" >/dev/null; then
    echo "Release is online over HTTP; public DNS/HTTPS is still updating."
  else
    echo "Release was activated, but the page health check failed." >&2
    exit 1
  fi
fi

echo "Deployed successfully: $site_url"
