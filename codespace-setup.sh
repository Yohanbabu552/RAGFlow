#!/bin/bash
# ============================================================
# RAGFlow + RBAC Demo — GitHub Codespaces Setup Script
# ============================================================
# Run this script once after creating your Codespace:
#   chmod +x codespace-setup.sh && ./codespace-setup.sh
# ============================================================

set -e

echo "============================================================"
echo "  RAGFlow Codespace Setup — Starting..."
echo "============================================================"

# ------ Step 1: Start infrastructure services via Docker ------
echo ""
echo "[1/6] Starting infrastructure services (MySQL, Redis, ES, MinIO)..."
cd /workspaces/RAGFlow/docker

# Start only the base infrastructure
docker compose -f docker-compose-base.yml up -d

echo "    Waiting for MySQL to be healthy..."
for i in {1..60}; do
  if docker compose -f docker-compose-base.yml exec -T mysql mysqladmin ping -h localhost -u root -pinfini_rag_flow --silent 2>/dev/null; then
    echo "    ✅ MySQL is ready!"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "    ⚠️  MySQL is still starting... continue anyway"
  fi
  sleep 2
done

echo "    Waiting for Elasticsearch to be healthy..."
for i in {1..60}; do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:1200/_cluster/health" 2>/dev/null | grep -q "200"; then
    echo "    ✅ Elasticsearch is ready!"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "    ⚠️  Elasticsearch is still starting... continue anyway"
  fi
  sleep 3
done

cd /workspaces/RAGFlow

# ------ Step 2: Set up Python environment ------
echo ""
echo "[2/6] Setting up Python environment..."

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --quiet -r requirements.txt 2>&1 | tail -5

# ------ Step 3: Generate config file ------
echo ""
echo "[3/6] Generating service configuration..."

mkdir -p conf

cat > conf/service_conf.yaml <<'YAML'
ragflow:
  host: 0.0.0.0
  http_port: 9380
mysql:
  name: 'rag_flow'
  user: 'root'
  password: 'infini_rag_flow'
  host: '127.0.0.1'
  port: 5455
  max_connections: 100
  stale_timeout: 30
minio:
  user: 'rag_flow'
  password: 'infini_rag_flow'
  host: '127.0.0.1:9000'
es:
  hosts: 'http://127.0.0.1:1200'
  username: 'elastic'
  password: 'infini_rag_flow'
redis:
  db: 1
  password: 'infini_rag_flow'
  host: '127.0.0.1'
  port: 6379
YAML

echo "    ✅ Config written to conf/service_conf.yaml"

# ------ Step 4: Initialize the database ------
echo ""
echo "[4/6] Initializing database tables..."

source .venv/bin/activate
python3 -c "
import sys
sys.path.insert(0, '.')
from api.settings import init_settings
init_settings()
from api.db.db_models import init_database_tables
init_database_tables()
print('    ✅ Database tables created!')
" 2>&1 || echo "    ⚠️  DB init had issues (may be fine if tables exist)"

# ------ Step 5: Run RBAC migration ------
echo ""
echo "[5/6] Running RBAC data migration..."

source .venv/bin/activate
python3 -m api.db.migrate_rbac 2>&1 || echo "    ⚠️  Migration had issues (may be fine if already run)"

# ------ Step 6: Install frontend dependencies ------
echo ""
echo "[6/6] Installing frontend dependencies..."

cd /workspaces/RAGFlow/web
npm install --quiet 2>&1 | tail -3

echo ""
echo "============================================================"
echo "  ✅ Setup Complete!"
echo "============================================================"
echo ""
echo "  To start the app, open TWO terminal tabs:"
echo ""
echo "  Terminal 1 (Backend API):"
echo "    cd /workspaces/RAGFlow"
echo "    source .venv/bin/activate"
echo "    python3 api/ragflow_server.py"
echo ""
echo "  Terminal 2 (Frontend Dev):"
echo "    cd /workspaces/RAGFlow/web"
echo "    npm run dev"
echo ""
echo "  Then open port 5173 in your browser (Codespace will prompt)."
echo "  The 'Projects' tab in the navigation is the RBAC feature!"
echo "============================================================"
