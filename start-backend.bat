@echo off
echo Starting Digital Store Backend Server...
cd /d "%~dp0backend"
java -jar target/digital-store-backend-0.0.1-SNAPSHOT.jar
pause
