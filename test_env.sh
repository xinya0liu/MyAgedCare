#!/bin/bash

echo "Testing environment variables..."

# 加载.env文件中的环境变量
if [ -f .env ]; then
  set -a  # 自动导出所有变量
  source .env
  set +a  # 停止自动导出
  echo "Loaded variables from .env file"
else
  echo "Warning: .env file not found!"
fi

# 显示Google Maps API密钥
echo "GOOGLE_MAPS_API_KEY: $GOOGLE_MAPS_API_KEY"

# 使用elixir命令检查Phoenix配置
echo "Checking Phoenix configuration..."
cd $(dirname $0) && elixir -e '
  IO.puts("Application config:")
  api_key = Application.get_env(:my_phoenix_app, :google_maps_api_key)
  IO.puts("google_maps_api_key = #{inspect(api_key)}")
' 