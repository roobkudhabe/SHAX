# SHAX v3.4.1 Vault Reliability Test Build

## What's improved

- **Source project restored after packing:** saves a temporary reduced .aep, then reopens the original. If packaging fails, the incomplete pack is removed.
- **Selected characters preserve rig dependencies:** parent nulls, matte layers, and statically referenced `thisComp.layer()` controllers are added to the selection before precompose.
- **Expression-only comp and footage references:** keeps statically named `comp("...")` and `footage("...")` sources while reducing.
- **Portable file dependencies:** packs footage, records package-relative resource paths and relinks after import. Missing resource errors are explicit.
- **Correct timeline placement:** Apply inserts the saved composition into the active destination comp, at the playhead, trimming leading empty time based on source layer in-points or a custom work area.
- **Unambiguous composition matching:** uses the saved composition's unique tag instead of selecting the first same-named comp.
- **Inline preview metadata fix:** does not try to serialize the temporary ExtendScript Folder object.
- **Clear messaging:** if no active destination comp, or if Insert on Apply is disabled, the UI explains the result instead of silently appearing blank.

## How to test safely

1. **Back up** your original `.aep` and Vault data (usually inside your OS user application-data `SHAX/AssetVault` directory).
2. Quit After Effects, unzip this test build, then run the Mac or Windows install script.
3. Open your **original project**, select your character layers, enable **Pack Resources**, choose `Selected Layers` and **SAVE ASSET PACK**. Old packs do not acquire missing dependencies retroactively.
4. Create/open a **new project** with a destination composition, position playhead near the start, keep **Insert on Apply** enabled and press **APPLY**.
5. Confirm animation, parent controllers, effects, images and timing survive. Repeat with nested precomps and a PSD/AI or image sequence.
6. Undo and restore from your backups if something differs from the original. Keep the source project unchanged until satisfied.

## Limitations

- Legacy packs created without the needed assets might have to be **saved again from their original project**.
- Scripts cannot bundle third-party plugins, installed fonts, externally referenced expression files or footage sources managed by other integrations. The source machine must have those resources; receiving machines must install required plugins/fonts.
- Dynamic expressions such as `comp(variable)` or `thisComp.layer(variable)` cannot be safely inferred and trigger a clear error when detected.
- These are **mocked code regression tests**, not a certification of After Effects runtime behavior on Mac or Windows. Do not distribute as a stable production release until real-project testing passes.

Run tests with `node tests/vault-regression.test.js`.
