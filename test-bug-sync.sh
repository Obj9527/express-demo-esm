#!/bin/bash

echo "🚀 启动Bug同步服务测试"
echo "================================"

# 启动应用（后台运行）
echo "📝 编译TypeScript..."
npm run build

echo "🔧 启动服务..."
npm run start &
APP_PID=$!

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 测试健康检查
echo "🏥 测试健康检查..."
curl -s http://localhost:3000/health | jq .

echo ""
echo "🐛 测试Bug同步状态..."
curl -s http://localhost:3000/api/bugs/sync/status | jq .

echo ""
echo "🔍 测试Bug同步健康状态..."
curl -s http://localhost:3000/api/bugs/sync/health | jq .

echo ""
echo "🎯 手动触发同步测试..."
curl -s -X POST http://localhost:3000/api/bugs/sync/trigger | jq .

echo ""
echo "================================"
echo "✅ 测试完成！"
echo "📊 Bug同步状态面板: http://localhost:3000/api/bugs/sync/status"
echo "🎣 WebHook端点: http://localhost:3000/api/bugs/sync/webhook"
echo "🏥 健康检查: http://localhost:3000/api/bugs/sync/health"
echo ""
echo "💡 使用 Ctrl+C 停止服务"

# 等待用户中断
wait $APP_PID
