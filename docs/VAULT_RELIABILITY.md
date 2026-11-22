# SHAX v3.4.2 Vault Reliability Test Build

## What's improved

- **Lossless full-project snapshot:** the active composition is saved with the ENTIRE original project instead of Reduce Project. Expression-only controllers, nested compositions, fonts/effect references and timing contexts are not discarded by a cleanup pass. A pack may be substantially larger.
- **Selected Layers temporarily disabled:** automatically moving partial rigs into a precomp can change expression context; open the actual character precomp in the original project and save using Active Comp.
- **Expression-only comp and footage references:** preservation no longer relies on guessing them or stripping unrelated compositions.
- **Portable file dependencies:** packs footage, records package-relative resource paths and relinks after import. Missing resource errors are explicit.
- **Correct timeline placement:** Apply inserts the saved composition into the active destination comp, at the playhead, trimming leading empty time based on source layer in-points or a custom work area.
- **Unambiguous composition matching:** uses the saved composition's unique tag instead of selecting the first same-named comp.
- **Inline preview metadata fix:** does not try to serialize the temporary ExtendScript Folder object.
- **Clear messaging:** if no active destination comp, or if Insert on Apply is disabled, the UI explains the result instead of silently appearing blank.

## How to test safely

1. **Back up** your original `.aep` and Vault data (usually inside your OS user application-data `SHAX/AssetVault` directory).
2. Quit After Effects, unzip this test build, then run the Mac or Windows install script.
3. Open your **original project**, open the original nested character or scene **composition itself**, enable **Pack Resources**, choose `Active Comp` and **SAVE ASSET PACK**. Old packs do not acquire missing dependencies retroactively.
4. Create/open a **new project** with a destination composition, position playhead near the start, keep **Insert on Apply** enabled and press **APPLY**.
5. Confirm animation, parent controllers, effects, images and timing survive. Repeat with nested precomps and a PSD/AI or image sequence.
6. Undo and restore from your backups if something differs from the original. Keep the source project unchanged until satisfied.

## Limitations

- Legacy packs created without the needed assets might have to be **saved again from their original project**.
- Scripts cannot bundle third-party plugins, installed fonts, externally referenced expression files or footage sources managed by other integrations. The source machine must have those resources; receiving machines must install required plugins/fonts.
- Dynamic expressions such as `comp(variable)` or `thisComp.layer(variable)` cannot be safely inferred and trigger a clear error when detected.
- These are **mocked code regression tests**, not a certification of After Effects runtime behavior on Mac or Windows. Do not distribute as a stable production release until real-project testing passes.

Run tests with `node tests/vault-regression.test.js`.

## Important diagnostic limitation

This is a **lossless packaging experiment**, not a verified repair of the user-specific visual glitch. If a newly saved asset still appears corrupted even when opened directly as the imported nested composition, compare the original .aep and the Vault-generated `asset.aep`; a screenshot alone cannot identify broken expressions, effect licensing, media interpretations, name collisions or time-remapping changes.

Adobe documents that Reduce Project can drop non-subordinate compositions referenced by expressions: https://helpx.adobe.com/after-effects/desktop/work-with-footage-items/manage-footage-items/footage-items.html
