@echo off
echo 正在启动AI笔记应用...

echo.
echo 1. 启动后端服务器...
cd ai-notes-backend
start "后端服务器" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo 2. 等待3秒后启动前端...
timeout /t 3 /nobreak > nul

cd ..\ai-notes-frontend
start "前端开发服务器" cmd /k "npm run dev"

echo.
echo 应用启动完成！
echo 后端地址: http://localhost:8000
echo 前端地址: http://localhost:5173
echo.
pause