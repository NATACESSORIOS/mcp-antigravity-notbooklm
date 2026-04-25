@echo off
REM ============================================================
REM  ESTEIRA AUTONOMA - MCP NOTEBOOKLM
REM  Agendado pelo Windows Task Scheduler para rodar em loop.
REM  Para instalar: abra o Task Scheduler do Windows e aponte
REM  este .bat como a acao da tarefa agendada.
REM ============================================================

set "SCRIPT_DIR=%USERPROFILE%\.gemini\antigravity\scratch\MCP NotebookLM\mcp-antigravity-notbooklm"

cd /d "%SCRIPT_DIR%"
node scripts\watcher.js --loop 30
