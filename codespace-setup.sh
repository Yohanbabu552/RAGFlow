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
echo "  RAGFlow + RBAC — Codespace Setup"
echo "============================================================"

# ------ Step 0: Create docker/.env if missing ------
if [ ! -f "$PROJECT_ROOT/docker/.env" ]; then
  echo ""
  echo "[0] Creating docker/.env (excluded from git)..."
  cat > "$PROJECT_ROOT/docker/.env" <<'ENVFILE'
DOC_ENGINE=elasticsearch
DEVICE=cpu
COMPOSE_PROFILES=elasticsearch,cpu
STACK_VERSION=8.11.3
ES_HOST=es01
ES_PORT=1200
ELASTIC_PASSWORD=infini_rag_flow
OS_PORT=1201
OS_HOST=opensearch01
OPENSEARCH_PASSWORD=infini_rag_flow_OS_01
MEM_LIMIT=419430400
INFINITY_HOST=infinity
INFINITY_THRIFT_PORT=23817
INFINITY_HTTP_PORT=23820
INFINITY_PSQL_PORT=5432
MYSQL_PASSWORD=infini_rag_flow
MYSQL_HOST=mysql
MYSQL_DBNAME=rag_flow
MYSQL_PORT=3306
EXPOSE_MYSQL_PORT=5455
MYSQL_MAX_PACKET=1073741824
MINIO_HOST=minio
MINIO_CONSOLE_PORT=9001
MINIO_PORT=9000
MINIO_USER=rag_flow
MINIO_PASSWORD=infini_rag_flow
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=infini_rag_flow
SVR_WEB_HTTP_PORT=80
SVR_WEB_HTTPS_PORT=443
SVR_HTTP_PORT=9380
ADMIN_SVR_HTTP_PORT=9381
SVR_MCP_PORT=9382
RAGFLOW_IMAGE=infiniflow/ragflow:v0.24.0
TEI_IMAGE_CPU=infiniflow/text-embeddings-inference:cpu-1.8
TEI_IMAGE_GPU=infiniflow/text-embeddings-inference:1.8
TEI_MODEL=Qwen/Qwen3-Embedding-0.6B
TEI_HOST=tei
TEI_PORT=6380
TZ=Asia/Kolkata
REGISTER_ENABLED=1
DOC_BULK_SIZE=1
EMBEDDING_BATCH_SIZE=4
DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
THREAD_POOL_MAX_WORKERS=16
USE_DOCLING=false
ENVFILE
  echo "    ✅ docker/.env created"
fi

# ------ Step 1: Install frontend dependencies ------
echo ""
echo "[1/2] Installing frontend dependencies..."
cd "$PROJECT_ROOT/web"

echo "    Running npm install (this takes ~2 minutes)..."
npm install 2>&1 | tail -5
echo "    ✅ Frontend dependencies installed"

# ------ Step 2: Done ------
cd "$PROJECT_ROOT"

echo ""
echo "============================================================"
echo "  ✅ Setup Complete!"
echo "============================================================"
echo ""
echo "  ▶ START THE FRONTEND:"
echo "    cd /workspaces/RAGFlow/web"
echo "    npm run dev"
echo ""
echo "  Then click 'Open in Browser' when Codespace shows port 5173."
echo ""
echo "  ▶ WHAT TO LOOK FOR (RBAC changes):"
echo "    • 'Projects' tab in the top navigation bar"
echo "    • Click it to see the Project list page"
echo "    • 'New Project' button (Super Admin only)"
echo "    • Project detail page with team user management"
echo ""
echo "  ▶ FOR FULL BACKEND + DB (optional, takes ~30 min):"
echo "    # Install Python deps via uv:"
echo "    pip install uv && uv sync"
echo "    # Start infra:"
echo "    cd docker && source .env && docker compose -f docker-compose-base.yml \\"
echo "      --profile elasticsearch --profile cpu up -d mysql redis es01 minio"
echo "    # Generate config:"
echo "    mkdir -p conf && cat codespace-setup.sh  # copy the YAML section"
echo "    # Start backend:"
echo "    export PYTHONPATH=/workspaces/RAGFlow"
echo "    uv run python api/ragflow_server.py"
echo "============================================================"
