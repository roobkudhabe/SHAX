# Installing SHAX

## Before you begin

- Close After Effects.
- Save and back up active projects.
- Use a version of After Effects with CEP/Legacy Extensions support. Manifest declares AEFT 23.0 or higher.
- This extension is unsigned. Its installers set CEP `PlayerDebugMode` for the current user; this is a development-mode setting, not official Adobe signing. Install only code you trust.

## macOS

1. Download and extract the repository or release ZIP.
2. Control-click `install-mac.command` and choose **Open** if macOS blocks it.
3. Wait for the installation completion message.
4. Restart After Effects.
5. In AE choose **Window → Extensions (Legacy) → SHAX** (some versions label this menu differently).

The extension goes to `~/Library/Application Support/Adobe/CEP/extensions/com.shax.panel`.

## Windows

1. Download and extract the repository or release ZIP.
2. Double-click `install-windows.bat`.
3. Wait for the completion message. If installation fails, check folder permissions.
4. Restart After Effects.
5. In AE choose **Window → Extensions (Legacy) → SHAX**.

The extension goes to `%APPDATA%\Adobe\CEP\extensions\com.shax.panel`.

## Update

Reinstall the newer package. Your existing code installation is replaced. Personal assets, Vault packs and Brand Kits may live outside the extension directory. Back them up before a major upgrade.

## Troubleshooting

**Panel not visible:** Confirm the extension folder contains `CSXS/manifest.xml`, `index.html`, `css/`, `js/` and `jsx/`. Restart AE after installing. Confirm your AE build supports CEP Legacy Extensions.

**Panel is blank:** Restart AE and check whether the panel's files are complete. If the problem persists, test with the latest release ZIP rather than a partial file copy.

**Vault item is blank:** Ensure every required media asset exists and that any external third-party effects and fonts are installed. Some renders need additional setup.

**Complex Resize results look wrong:** Undo and use the duplicated source. Nested comps, parenting, expressions and 3D layers can require manual adjustments.