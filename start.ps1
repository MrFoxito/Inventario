Write-Host "Iniciando Backend (Servidor)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command node --watch api/index.js"

Write-Host "Iniciando Frontend (React/Vite)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit -Command .\node_modules\.bin\vite"

Write-Host "¡Todo listo! Revisa las dos ventanas nuevas que se acaban de abrir." -ForegroundColor Green
