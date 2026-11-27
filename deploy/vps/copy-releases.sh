#!/usr/bin/env bash
set -euo pipefail

if [[ $# != 2 ]]; then
  echo "Usage: $0 OLD_SSH_ALIAS NEW_SSH_ALIAS" >&2
  exit 2
fi
for alias in "$@"; do
  if [[ ! "$alias" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.@-]*$ ]]; then
    echo "Use SSH aliases or user@host for both servers." >&2
    exit 2
  fi
done
old=$1 new=$2
ssh_options=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=12 -o ServerAliveInterval=10 -o ServerAliveCountMax=3)
rsync_ssh="ssh ${ssh_options[*]}"
old_machine=$(ssh -n "${ssh_options[@]}" "$old" 'cat /etc/machine-id')
new_machine=$(ssh -n "${ssh_options[@]}" "$new" 'cat /etc/machine-id')
if [[ -z "$old_machine" || -z "$new_machine" || "$old_machine" == "$new_machine" ]]; then
  echo "Could not verify that the source and destination are different VPS instances." >&2
  exit 1
fi

if [[ -n "${RELEASE_CACHE:-}" ]]; then
  scratch="$RELEASE_CACHE"
  mkdir -p -- "$scratch"
else
  scratch=$(mktemp -d)
  trap 'rm -rf -- "$scratch"' EXIT
fi
release=$(date +%s%N)
sites=(adalia-production adalia-test)

for site in "${sites[@]}"; do
  source_release=$(ssh -n "${ssh_options[@]}" "$old" "readlink -f /var/www/$site/current")
  if [[ ! "$source_release" =~ ^/var/www/$site/releases/[a-zA-Z0-9_-]+$ ]]; then
    echo "Unexpected source release for $site." >&2
    exit 1
  fi
  echo "Copying $source_release."
  cached="$scratch/$site/${source_release##*/}"
  mkdir -p -- "$cached"
  rsync -a --safe-links --no-owner --no-group --partial-dir=.rsync-partial --timeout=90 -e "$rsync_ssh" \
    "$old:$source_release/" "$cached/"
  for entry in index.html asset-manifest.json; do test -s "$cached/$entry"; done

  destination="/var/www/$site/releases/$release"
  ssh -n "${ssh_options[@]}" "$new" "mkdir '$destination'"
  rsync -a --safe-links --no-owner --no-group --timeout=90 -e "$rsync_ssh" \
    --exclude=.rsync-partial "$cached/" "$new:$destination/"
  expected=$(cd "$cached" && sha256sum index.html asset-manifest.json)
  actual=$(ssh -n "${ssh_options[@]}" "$new" "cd '$destination' && sha256sum index.html asset-manifest.json")
  if [[ "$expected" != "$actual" ]]; then
    echo "Release entry points differ on the destination for $site." >&2
    exit 1
  fi
  ssh -n "${ssh_options[@]}" "$new" \
    "cd '$destination' && test -z \"\$(find . -xtype l -print -quit)\""
done

# Publish both staged builds on the destination. Public DNS still resolves to the old VPS.
for site in "${sites[@]}"; do
  root="/var/www/$site"
  ssh -n "${ssh_options[@]}" "$new" \
    "ln -s '$root/releases/$release' '$root/current.$release.next' && mv -Tf '$root/current.$release.next' '$root/current'"
done
echo "Published release $release on $new."
