# Release candidate test checklist

The checks below are **for maintainers to run on actual After Effects installations**. They are not claims that every platform has already passed.

## Installation and appearance

- [ ] Install on macOS, open Window → Extensions (Legacy) → SHAX.
- [ ] Install on Windows, open Window → Extensions (Legacy) → SHAX.
- [ ] Check dark and light themes, narrow dock and large undocked panel.
- [ ] Test dropdown open/close, outside click and Escape, particularly Vault Category.

## Features

- [ ] Animate: select 2D shape/text, apply a preset; verify editable keyframes and undo.
- [ ] Animate: test preset search, Favorites, My Mixes and SHAX Picks.
- [ ] Sequence: test selected layers with stagger/overlap, validate existing keyframes.
- [ ] Align: test left/center/right, vertical alignment and 9-point anchors.
- [ ] Resize: duplicate a disposable comp and validate scale, position and nested assets manually.
- [ ] Brand: save/load colors, fonts, logo and motion signature.
- [ ] Vault: save animated layers with imported media; preview, switch project and apply.
- [ ] Organize: verify project folders and item references remain intact.

## Release decision

Only publish as a fully validated stable release after host tests, including failure/recovery scenarios, pass on the target versions and operating systems.