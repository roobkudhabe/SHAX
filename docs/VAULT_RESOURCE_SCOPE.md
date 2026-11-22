# SHAX v3.4.3 Vault Resource Scope Diagnostic (TEST)

This is an experimental fix, not a public production release. It addresses the error “Could not pack 3 linked resource(s)” reported with v3.4.2.

### Change

- Only linked footage reachable from the **Active Comp**, its nested compositions and static expression references is collected. Other project footage is deliberately skipped to prevent unrelated broken links from blocking Vault.
- Saves a resource manifest for each required file. If any required resource still fails, Vault reports its **name and failure reason** instead of only a count.
- Imports ignore unreferenced, unpacked media retained in the original project snapshot, while continuing to fail if a required packed resource is missing.
- The original project is reopened after saving, and earlier Vault packs are not overwritten.

### Test

1. Make a backup of the original `.aep` and the existing Vault data.
2. Quit After Effects and install this test build.
3. Open the original nested character/scene comp, then use **Vault > Active Comp**, `Pack Resources` ON, and **Save Asset Pack** under a new name.
4. If a resource error remains, note the file names shown in the error. Find/relink those exact items in After Effects Project panel.
5. In a new `.aep` open the destination comp, enable `Insert on Apply`, and apply the freshly saved asset.
6. Verify the animation over its full duration, all linked resources, rig parenting, expressions, 3D, and precomps.

### Important limits

- This is a code-level regression-tested patch; we have **not** verified it inside Adobe After Effects on your actual project.
- It does not bundle fonts or third-party effects, and dynamically constructed expression dependencies may still need manual checking.
- A lossless snapshot keeps other items from the source project in the `.aep`, but unrelated media are **not bundled** and may show missing in the Project panel. They must not affect the active asset if they are truly unused.
- `Selected Layers` remains temporarily disabled; use `Active Comp` for testing complex nested rigs.
