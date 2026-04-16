@echo off
chcp 65001 >nul
echo 正在导出项目...

REM 创建导出目录
if exist "project-export" rmdir /s /q "project-export"
mkdir "project-export"

REM 复制源代码
xcopy /E /I /Y "src" "project-export\src"
xcopy /E /I /Y "public" "project-export\public"
xcopy /E /I /Y "database" "project-export\database"

REM 复制server（排除node_modules和uploads）
mkdir "project-export\server"
mkdir "project-export\server\config"
mkdir "project-export\server\middleware"
mkdir "project-export\server\routes"
mkdir "project-export\server\uploads"
mkdir "project-export\server\uploads\avatars"
copy /Y "server\index.js" "project-export\server\"
copy /Y "server\package.json" "project-export\server\"
copy /Y "server\.env.example" "project-export\server\"
xcopy /E /I /Y "server\config" "project-export\server\config"
xcopy /E /I /Y "server\middleware" "project-export\server\middleware"
xcopy /E /I /Y "server\routes" "project-export\server\routes"

REM 复制根目录配置文件
copy /Y "package.json" "project-export\"
copy /Y "vite.config.js" "project-export\"
copy /Y "index.html" "project-export\"
copy /Y "jsconfig.json" "project-export\"
copy /Y "README.md" "project-export\"
copy /Y "DEPLOY.md" "project-export\"
copy /Y ".gitignore" "project-export\"
copy /Y "start.bat" "project-export\"
copy /Y "stop.bat" "project-export\"

REM 压缩
echo 正在压缩...
powershell Compress-Archive -Path "project-export\*" -DestinationPath "bishe-project.zip" -Force

REM 清理
rmdir /s /q "project-export"

echo.
echo ========================================
echo   导出完成！文件：bishe-project.zip
echo ========================================
pause
