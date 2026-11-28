#!/bin/sh
set -eu
cd "$(dirname "$0")"
umask 077
mkdir -p certs
if [ -e certs/redis.crt ] || [ -e certs/redis.key ]; then
  if [ ! -s certs/redis.crt ] || [ ! -s certs/redis.key ]; then
    echo 'Incomplete Redis TLS files in dev/redis/certs; inspect them before retrying.' >&2
    exit 1
  fi
  echo 'Redis TLS certificate and key already exist; keeping them.'
else
  openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 365 \
    -keyout certs/redis.key -out certs/redis.crt \
    -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' \
    -addext 'basicConstraints=critical,CA:TRUE' >/dev/null 2>&1
  echo 'Created a local Redis certificate in dev/redis/certs.'
fi
if [ -e .env ]; then
  # The password must be safe in a URL and Redis ACL file.
  password=$(sed -n 's/^REDIS_PASSWORD=//p' .env)
  case "$password" in ''|*[!0123456789abcdef]*) echo 'Invalid local Redis credentials; inspect dev/redis/.env.' >&2; exit 1;; esac
else
  password=$(openssl rand -hex 32)
  printf 'REDIS_PASSWORD=%s\n' "$password" > .env
  chmod 600 .env
  echo 'Generated local Redis credentials in dev/redis/.env.'
fi
# Redis runs as a container user and needs to read the local-only TLS and ACL files.
printf 'user default off\nuser nerdos on >%s ~* +@all\n' "$password" > certs/users.acl
chmod 755 certs
chmod 644 certs/redis.key certs/redis.crt certs/users.acl
