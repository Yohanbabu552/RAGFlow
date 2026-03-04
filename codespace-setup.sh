#!/bin/bash
# ============================================================
# RAGFlow + RBAC Demo — GitHub Codespaces Setup Script
# ============================================================
# Run this script once after creating your Codespace:
#   chmod +x codespace-setup.sh && ./codespace-setup.sh
# ============================================================

set -e

PROJECT_ROOT="/workspaces/RAGFlow"

echo "============================================================"
echo "  RAGFlow Codespace Setup — Starting..."
echo "============================================================"

# ------ Step 1: Start infrastructure services via Docker ------
echo ""
echo "[1/6] Starting infrastructure services (MySQL, Redis, ES, MinIO)..."
cd "$PROJECT_ROOT/docker"

# Source the .env file so docker compose has all variables
set -a
source .env
set +a

# Start only the services we need (elasticsearch profile + cpu)
# Use --profile to select only elasticsearch and cpu services
docker compose -f docker-compose-base.yml --profile elasticsearch --profile cpu up -d mysql redis es01 minio

echo "    Waiting for MySQL to be healthy..."
for i in $(seq 1 60); do
  if docker compose -f docker-compose-base.yml exec -T mysql mysqladmin ping -h localhost -u root -pinfini_rag_flow --silent 2>/dev/null; then
    echo "    ✅ MySQL is ready!"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "    ⚠️  MySQL is still starting... continue anyway"
  fi
  sleep 2
done

echo "    Waiting for Elasticsearch to be healthy..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:1200/_cluster/health" -u "elastic:infini_rag_flow" 2>/dev/null | grep -q "200"; then
    echo "    ✅ Elasticsearch is ready!"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "    ⚠️  Elasticsearch is still starting... continue anyway"
  fi
  sleep 3
done

cd "$PROJECT_ROOT"

# ------ Step 2: Set up Python environment ------
echo ""
echo "[2/6] Setting up Python environment..."

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --quiet -r requirements.txt 2>&1 | tail -5
echo "    ✅ Python dependencies installed"

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
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"

python3 -c "
import sys, os
sys.path.insert(0, '$PROJECT_ROOT')
os.chdir('$PROJECT_ROOT')
from api.settings import init_settings
init_settings()
from api.db.db_models import init_database_tables
init_database_tables()
print('    ✅ Database tables created!')
" 2>&1 || echo "    ⚠️  DB init had issues (may be fine if tables exist)"

# ------ Step 5: Run RBAC migration ------
echo ""
echo "[5/6] Running RBAC data migration..."

cd "$PROJECT_ROOT"
source .venv/bin/activate
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"

python3 -m api.db.migrate_rbac 2>&1 || echo "    ⚠️  Migration had issues (may be fine if already run)"

# ------ Step 6: Install frontend dependencies ------
echo ""
echo "[6/6] Installing frontend dependencies..."

cd "$PROJECT_ROOT/web"
npm install 2>&1 | tail -5

cd "$PROJECT_ROOT"

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
echo "    export PYTHONPATH=/workspaces/RAGFlow"
echo "    python3 api/ragflow_server.py"
echo ""
echo "  Terminal 2 (Frontend Dev):"
echo "    cd /workspaces/RAGFlow/web"
echo "    npm run dev"
echo ""
echo "  Then open port 5173 in your browser (Codespace will prompt)."
echo "  The 'Projects' tab in the navigation is the RBAC feature!"
echo "============================================================"
