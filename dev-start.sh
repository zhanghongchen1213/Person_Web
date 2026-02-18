#!/bin/bash
# 一键启动开发环境：SSH 隧道 + 开发服务器
# 用法: ./dev-start.sh [stop|status]

LOCAL_PORT=3307
REMOTE_HOST="person-web-server"
REMOTE_DB_PORT=3306
DIR="$(cd "$(dirname "$0")" && pwd)"

pid_of_tunnel() {
  lsof -ti :$LOCAL_PORT -sTCP:LISTEN 2>/dev/null
}

cleanup() {
  echo ""
  echo "正在关闭..."
  PID=$(pid_of_tunnel)
  [ -n "$PID" ] && kill $PID && echo "✓ SSH 隧道已关闭"
  exit 0
}

case "${1:-start}" in
  start)
    PID=$(pid_of_tunnel)
    if [ -z "$PID" ]; then
      echo "正在建立 SSH 隧道 (localhost:$LOCAL_PORT -> $REMOTE_HOST:$REMOTE_DB_PORT)..."
      ssh -f -N -L $LOCAL_PORT:127.0.0.1:$REMOTE_DB_PORT $REMOTE_HOST 2>&1
      if [ $? -ne 0 ]; then
        echo "✗ 隧道建立失败，请检查 SSH 配置"
        exit 1
      fi
      echo "✓ SSH 隧道已建立"
    else
      echo "✓ SSH 隧道已在运行 (PID: $PID)"
    fi
    trap cleanup INT TERM
    echo "启动开发服务器..."
    cd "$DIR" && pnpm dev
    cleanup
    ;;
  stop)
    PID=$(pid_of_tunnel)
    if [ -n "$PID" ]; then
      kill $PID
      echo "✓ 隧道已关闭 (PID: $PID)"
    else
      echo "没有运行中的隧道"
    fi
    ;;
  status)
    PID=$(pid_of_tunnel)
    if [ -n "$PID" ]; then
      echo "✓ 隧道运行中 (PID: $PID), 端口 $LOCAL_PORT"
    else
      echo "✗ 隧道未运行"
    fi
    ;;
  *)
    echo "用法: $0 [start|stop|status]"
    ;;
esac
