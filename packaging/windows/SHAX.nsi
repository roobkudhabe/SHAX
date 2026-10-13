; SHAX v3.4.0 | User-level, no-admin CEP installer for Windows.
; Compile from repository root: makensis packaging/windows/SHAX.nsi

!cd "${__FILEDIR__}\..\.."

Unicode true
!include "MUI2.nsh"

!define PRODUCT_NAME "SHAX"
!define PRODUCT_VERSION "3.4.0"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\SHAX"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${__FILEDIR__}\..\..\dist\SHAX-Setup-v3.4.0.exe"
InstallDir "$APPDATA\Adobe\CEP\extensions\com.shax.panel"
RequestExecutionLevel user
SetCompressor /SOLID lzma
ShowInstDetails show
BrandingText "SHAX | After Effects Motion Toolkit"

!define MUI_ICON "${__FILEDIR__}\assets\shax.ico"
!define MUI_UNICON "${__FILEDIR__}\assets\shax.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${__FILEDIR__}\assets\welcome.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${__FILEDIR__}\assets\welcome.bmp"
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

VIProductVersion "3.4.0.0"
VIAddVersionKey /LANG=1033 "ProductName" "SHAX"
VIAddVersionKey /LANG=1033 "FileDescription" "SHAX After Effects Extension Installer"
VIAddVersionKey /LANG=1033 "FileVersion" "3.4.0"
VIAddVersionKey /LANG=1033 "CompanyName" "SHAX"

Section "Install SHAX" SEC_INSTALL
  SetShellVarContext current
  SetOverwrite on
  SetOutPath "$INSTDIR"
  File "${__FILEDIR__}\..\..\index.html"
  SetOutPath "$INSTDIR\CSXS"
  File "${__FILEDIR__}\..\..\CSXS\manifest.xml"
  SetOutPath "$INSTDIR\css"
  File "${__FILEDIR__}\..\..\css\style.css"
  SetOutPath "$INSTDIR\js"
  File "${__FILEDIR__}\..\..\js\app.js"
  SetOutPath "$INSTDIR\jsx"
  File "${__FILEDIR__}\..\..\jsx\host.jsx"

  ; Unsigned CEP panels require per-user development-mode registration.
  WriteRegStr HKCU "Software\Adobe\CSXS.9" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.10" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.11" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.12" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.13" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.14" "PlayerDebugMode" "1"

  CreateDirectory "$LOCALAPPDATA\Programs\SHAX"
  WriteUninstaller "$LOCALAPPDATA\Programs\SHAX\Uninstall.exe"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "SHAX ${PRODUCT_VERSION}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "SHAX"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" '"$LOCALAPPDATA\Programs\SHAX\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  RMDir /r "$APPDATA\Adobe\CEP\extensions\com.shax.panel"
  Delete "$LOCALAPPDATA\Programs\SHAX\Uninstall.exe"
  RMDir "$LOCALAPPDATA\Programs\SHAX"
  DeleteRegKey HKCU "${UNINSTALL_KEY}"
  ; Personal Vaults, Brand Kits, and related user data are intentionally retained.
SectionEnd