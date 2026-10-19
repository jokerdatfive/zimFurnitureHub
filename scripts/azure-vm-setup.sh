#!/usr/bin/env bash
# ==============================================================================
# KK Furnitures / ZimFurnitureHub - Evolution API v2 Azure VM Installer
# ==============================================================================
set -e

echo "🚀 [1/4] Configuring 2GB Swap Memory..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "📦 [2/4] Installing Docker Engine..."
sudo apt-get update -y
sudo apt-get install -y docker.io

echo "🛑 [3/4] Stopping any existing Evolution API containers..."
sudo docker rm -f evolution_api 2>/dev/null || true

echo "🔥 [4/4] Launching Evolution API v2 Container..."
# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

AUTHENTICATION_API_KEY="${AUTHENTICATION_API_KEY:-kk_evolution_secret_token_2026}"
if [ -z "$DATABASE_CONNECTION_URI" ]; then
  echo "⚠️ Warning: DATABASE_CONNECTION_URI not set. Please export it or set in .env"
fi

sudo docker run -d \
  --name evolution_api \
  --restart always \
  -p 8080:8080 \
  -e SERVER_PORT=8080 \
  -e DOCKER_ENV=true \
  -e AUTHENTICATION_API_KEY="${AUTHENTICATION_API_KEY}" \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI="${DATABASE_CONNECTION_URI}" \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=false \
  -e DATABASE_SAVE_MESSAGE_UPDATE=false \
  -e DATABASE_SAVE_DATA_CONTACTS=false \
  -e DATABASE_SAVE_DATA_CHATS=false \
  -e DATABASE_SAVE_DATA_LABELS=false \
  -e DATABASE_SAVE_DATA_HISTORIC=false \
  -e CACHE_REDIS_ENABLED=true \
  -e CACHE_REDIS_URI="${CACHE_REDIS_URI}" \
  -e CACHE_REDIS_SAVE_INSTANCES=true \
  -e CACHE_LOCAL_ENABLED=false \
  -e DEL_INSTANCE=false \
  -e LOG_LEVEL=ERROR,WARN,INFO \
  evoapicloud/evolution-api:latest

echo "⏳ Waiting 15 seconds for container initialization..."
sleep 15

echo "🔍 Checking container status..."
sudo docker ps --filter "name=evolution_api"

echo "🧪 Running health check..."
curl -s http://localhost:8080/ || true

echo -e "\n\n✅ EVOLUTION API IS LIVE AND RUNNING ON PORT 8080!"
