@echo off
setlocal EnableExtensions
set "SCRIPT_DIR=%~dp0"
set "EXT_DIR=%APPDATA%\Adobe\CEP\extensions"
set "DEST=%EXT_DIR%\com.shax.panel"
set "TEMP_DEST=%EXT_DIR%\shax-install-%RANDOM%-%RANDOM%"

if not exist "%SCRIPT_DIR%CSXS\manifest.xml" goto missing
if not exist "%SCRIPT_DIR%index.html" goto missing
if not exist "%EXT_DIR%" mkdir "%EXT_DIR%"
if errorlevel 1 goto fail
mkdir "%TEMP_DEST%"
if errorlevel 1 goto fail
for %%D in (CSXS css js jsx) do (
    xcopy "%SCRIPT_DIR%%%D" "%TEMP_DEST%\%%D\" /E /I /Y /H /Q >nul
    if errorlevel 1 goto fail
)
copy /Y "%SCRIPT_DIR%index.html" "%TEMP_DEST%\index.html" >nul
if errorlevel 1 goto fail
if exist "%DEST%" rmdir /S /Q "%DEST%"
move "%TEMP_DEST%" "%DEST%" >nul
if errorlevel 1 goto fail
if exist "%EXT_DIR%\com.roobkudhabe.panel" rmdir /S /Q "%EXT_DIR%\com.roobkudhabe.panel"
if exist "%EXT_DIR%\com.scenepilot.panel" rmdir /S /Q "%EXT_DIR%\com.scenepilot.panel"
for %%V in (9 10 11 12 13) do (
    reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo.
echo SHAX v3.3.1 installed. Restart After Effects and open Window ^> Extensions ^(Legacy^) ^> SHAX.
pause
exit /b 0

:missing
echo SHAX runtime files are missing. Extract the complete ZIP and try again.
pause
exit /b 1
:fail
echo SHAX installation failed. Check folder permissions and try again.
if exist "%TEMP_DEST%" rmdir /S /Q "%TEMP_DEST%"
pause
exit /b 1
