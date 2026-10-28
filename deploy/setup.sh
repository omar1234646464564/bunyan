#!/usr/bin/env bash
# Bunyan — one-shot production setup for a fresh Ubuntu VM (Oracle Cloud Always Free, or any Docker host).
#
#   bash setup.sh                     # uses the public repo + auto-detects the host's public IP
#   SITE_ADDRESS=bunyan.example.com bash setup.sh
#   ADMIN_PASSWORD='...' bash setup.sh
#
# Idempotent: re-running updates the code and rebuilds the image, keeping the database volume.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/omar1234646464564/bunyan.git}"
APP_DIR="${APP_DIR:-/srv/bunyan}"
ADMIN_EMAIL="${ADMIN_EMAIL:-om@r.sa}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Omar2020@}"
ADMIN_NAME="${ADMIN_NAME:-مدير النظام}"
SEED="${SEED:-1}"
SITE_ADDRESS="${SITE_ADDRESS:-}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] && SUDO="" || SUDO="sudo"
command -v apt-get >/dev/null || die "This script targets Debian/Ubuntu (apt-get not found)."

# ---------------------------------------------------------------- 1. base packages
log "Installing base packages"
$SUDO apt-get update -qq
$SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ca-certificates curl git openssl

# ---------------------------------------------------------------- 2. swap (small VMs)
mem_kb=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
if (( mem_kb < 3_000_000 )) && ! swapon --show | grep -q '/swapfile'; then
  log "Only $((mem_kb / 1024))MB RAM detected — adding a 2GB swap file so the Next.js build does not OOM"
  $SUDO fallocate -l 2G /swapfile 2>/dev/null || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  $SUDO chmod 600 /swapfile
  $SUDO mkswap /swapfile >/dev/null
  $SUDO swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
fi

# ---------------------------------------------------------------- 3. docker
if ! command -v docker >/dev/null; then
  log "Installing Docker Engine"
  . /etc/os-release
  distro="${ID:-ubuntu}"
  case "$distro" in ubuntu|debian) ;; *) distro="ubuntu" ;; esac
  $SUDO install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${distro}/gpg" | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${distro} ${VERSION_CODENAME} stable" \
    | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
  $SUDO apt-get update -qq
  $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  $SUDO systemctl enable --now docker
fi
$SUDO docker info >/dev/null 2>&1 || die "Docker daemon is not running."
DC="$SUDO docker compose"

# ---------------------------------------------------------------- 4. code
log "Syncing code into $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  $SUDO git -C "$APP_DIR" fetch --quiet origin
  $SUDO git -C "$APP_DIR" reset --hard --quiet origin/main
else
  $SUDO mkdir -p "$(dirname "$APP_DIR")"
  $SUDO git clone --quiet --depth 1 "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR/deploy"

# ---------------------------------------------------------------- 5. config
if [[ -z "$SITE_ADDRESS" ]]; then
  log "Detecting this host's public IP"
  PUBLIC_IP=$(curl -fsS --max-time 15 https://api.ipify.org || true)
  [[ -n "$PUBLIC_IP" ]] || die "Could not detect the public IP. Re-run with SITE_ADDRESS=your.domain.com"
  # sslip.io resolves <ip-with-dashes>.sslip.io to that IP, so Let's Encrypt can issue a real certificate.
  SITE_ADDRESS="${PUBLIC_IP//./-}.sslip.io"
fi

if [[ -f .env ]]; then
  SESSION_SECRET=$(grep -E '^SESSION_SECRET=' .env | cut -d= -f2- || true)
fi
[[ -n "${SESSION_SECRET:-}" ]] || SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n=/+' | cut -c1-48)

log "Writing deploy/.env (site: $SITE_ADDRESS)"
umask 077
cat > .env <<EOF
SITE_ADDRESS=$SITE_ADDRESS
SESSION_SECRET=$SESSION_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=$ADMIN_NAME
EOF

# ---------------------------------------------------------------- 6. firewall (Oracle images block 80/443 by default)
if [[ -n "$(iptables -L INPUT -n 2>/dev/null | grep -i reject)" ]]; then
  log "Allowing ports 80/443 through iptables (Oracle Cloud image default)"
  $SUDO iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
  $SUDO iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
  $SUDO iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
  if command -v netfilter-persistent >/dev/null; then
    $SUDO netfilter-persistent save >/dev/null
  else
    $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent >/dev/null
    $SUDO netfilter-persistent save >/dev/null
  fi
  echo "    (also open TCP 80 and 443 in the Oracle console: Subnet -> Security List -> Add Ingress Rule)"
fi

# ---------------------------------------------------------------- 7. build + run
FRESH=0
if ! $SUDO docker run --rm -v bunyan-data:/data alpine:3 sh -c 'test -f /data/bunyan.db' >/dev/null 2>&1; then
  FRESH=1
fi

log "Building the image (first run takes 5-10 min on a free Ampere VM)"
$DC build app

log "Starting the stack"
$DC up -d --remove-orphans

log "Waiting for the app to come up"
for _ in $(seq 1 90); do
  if $DC logs app 2>/dev/null | grep -qiE 'Ready in|started server'; then break; fi
  sleep 2
done

if [[ "$FRESH" == "1" && "$SEED" == "1" ]]; then
  log "Loading demo data (first boot only)"
  $DC exec -T app npm run db:seed || echo "    seed skipped (already populated?)"
fi

# ---------------------------------------------------------------- 8. done
cat <<EOF

------------------------------------------------------------
 Bunyan is running.

   URL     https://$SITE_ADDRESS
   Admin   $ADMIN_EMAIL / $ADMIN_PASSWORD

 HTTPS is issued automatically; give Caddy ~30s after the
 first request. Logs:  docker compose -f $APP_DIR/deploy/docker-compose.yml logs -f
 Update:  bash $APP_DIR/deploy/setup.sh
 Backup:  docker run --rm -v bunyan-data:/data -v "\$PWD":/backup alpine \\
            tar czf /backup/bunyan-\$(date +%F).tar.gz -C /data .
------------------------------------------------------------
EOF
