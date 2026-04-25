@echo off
REM ============================================================
REM  ESTEIRA AUTONOMA - MCP NOTEBOOKLM
REM  Agendado pelo Windows Task Scheduler para rodar em loop.
REM  Para instalar: abra o Task Scheduler do Windows e aponte
REM  este .bat como aÃ§Ã£o da tarefa agendada.
REM ============================================================

set "SCRIPT_DIR=C:\Users\GILBERTO\.gemini\antigravity\scratch\MCP NotebookLM"

cd /d "%SCRIPT_DIR%"
node scripts\watcher.js --loop 30

