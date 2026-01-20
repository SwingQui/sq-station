@echo off
chcp 65001 >nul
title SQ Station 数据同步工具
cd /d "%~dp0"
node ../scripts/sync-tool.cjs
pause
