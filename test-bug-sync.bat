@echo off
echo 🚀 启动Bug同步服务测试
echo ================================

echo 📝 编译TypeScript...
call npm run build

echo 🔧 启动服务...
start /B npm run start

echo ⏳ 等待服务启动...
timeout /t 5 /nobreak >nul

echo 🏥 测试健康检查...
curl -s http://localhost:3000/health

echo.
echo 🐛 测试Bug同步状态...
curl -s http://localhost:3000/api/bugs/sync/status

echo.
echo 🔍 测试Bug同步健康状态...
curl -s http://localhost:3000/api/bugs/sync/health

echo.
echo 🎯 手动触发同步测试...
curl -s -X POST http://localhost:3000/api/bugs/sync/trigger

echo.
echo ================================
echo ✅ 测试完成！
echo 📊 Bug同步状态面板: http://localhost:3000/api/bugs/sync/status
echo 🎣 WebHook端点: http://localhost:3000/api/bugs/sync/webhook
echo 🏥 健康检查: http://localhost:3000/api/bugs/sync/health
echo.
echo 💡 使用 Ctrl+C 停止服务
echo.
pause
