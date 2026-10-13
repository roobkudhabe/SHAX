# SHAX v3.4.0 | Installer Preview

SHAX is an Adobe After Effects motion design extension. The runtime is the 3.3.1 release candidate with version metadata updated to 3.4.0; this release changes its **distribution and installation**, not its feature set.

## Downloads

- **macOS**: `SHAX-v3.4.0-macOS.pkg` (Apple Installer application, installs a system-wide CEP extension). You may be prompted for an administrator password.
- **Windows**: `SHAX-Setup-v3.4.0.exe` (NSIS installer with welcome / install / finish screens; installs for the current user without administrator rights).

Quit Adobe After Effects before installing. After installation, reopen it and go to **Window > Extensions (Legacy) > SHAX**.

## Security and compatibility notes

**These installer binaries are unsigned and unnotarized preview builds.**
macOS Gatekeeper and Windows SmartScreen may warn or block them. Do not distribute as trusted, production-signed applications. Official release distribution requires signing and (on macOS) notarization using your own developer credentials.

SHAX is a legacy CEP extension for After Effects 2023+ where Adobe still exposes Extensions (Legacy); it is not a native UXP plugin. The installers enable CEP developer mode for unsigned panels in the current user's profile. SHAX remains a release candidate: test Vault, Animate, Resize, and other features on your real host before wider distribution.

This installer does not delete personal Vault packs or Brand Kits. Code remains visible to an end user after installation, and the SHAX GitHub repository is public.