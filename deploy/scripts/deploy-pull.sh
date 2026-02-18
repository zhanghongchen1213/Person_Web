#!/bin/bash
set -e

COMPOSE_FILE="docker-compose.prod.yml"
IMAGE="ghcr.io/zhanghongchen1213/person_web:latest"

echo "=== 拉取最新镜像 ==="
docker pull "$IMAGE"

echo "=== 重启应用容器 ==="
docker compose -f "$COMPOSE_FILE" up -d app

echo "=== 等待健康检查 ==="
for i in $(seq 1 12); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' person_web_app 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "部署成功！应用已健康运行"
    docker compose -f "$COMPOSE_FILE" ps
    exit 0
  fi
  echo "等待中... ($i/12)"
  sleep 5
done

echo "警告：健康检查超时，请手动检查"
docker compose -f "$COMPOSE_FILE" logs --tail=20 app
