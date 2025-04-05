#!/bin/bash

# 终止任何正在运行的Phoenix服务器进程
echo "Terminating any running Phoenix server..."
pkill -f "phx.server" || true

# 加载环境变量
echo "Loading environment variables from .env file..."
if [ -f .env ]; then
  # 直接加载环境变量到当前shell
  set -a
  source .env
  set +a
  echo "Using Google Maps API Key: $GOOGLE_MAPS_API_KEY"
else
  echo "Warning: .env file not found!"
fi

# 清理构建文件
echo "Cleaning build files..."
mix deps.get
mix compile

# 启动Phoenix服务器
echo "Starting Phoenix server..."
mix phx.server 