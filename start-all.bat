@echo off
echo ========================================================
echo Starting Digital Store Services (Backend & Frontend)
echo ========================================================
echo.
start "Digital Store Backend" cmd /k "cd /d %~dp0backend && java -jar target/digital-store-backend-0.0.1-SNAPSHOT.jar"
start "Digital Store Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo All services started!
