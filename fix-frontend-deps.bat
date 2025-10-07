@echo off
echo Fixing frontend dependencies...

cd /d D:\Adrian\primrosebackend\frontend

echo Removing node_modules...
rmdir /s /q node_modules 2>nul

echo Removing package-lock.json...
del package-lock.json 2>nul

echo Clearing npm cache...
npm cache clean --force

echo Reinstalling dependencies...
npm install

echo Done! Try running 'npm start' now.
pause
