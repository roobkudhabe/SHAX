# SHAX architecture

SHAX is a CEP-based After Effects extension.

- `index.html` creates the interactive panel.
- `css/style.css` defines typography, controls, layout and two theme variants.
- `js/app.js` handles UI state, event callbacks, local preferences, presets and communication with After Effects.
- `jsx/host.jsx` runs ExtendScript in the AE host, where composition/layer operations occur.
- `CSXS/manifest.xml` registers the panel with After Effects.

```
After Effects
  ↕ CEP JavaScript bridge
Panel (HTML, CSS, JS)
  ↕ ExtendScript evaluation
AE host operations (jsx/host.jsx)
  ↕
Project, comps, timeline and layers
```

The bundle is self-contained with no build command required. Changes to JavaScript or ExtendScript must be tested both in a browser-like panel and in the AE host, because browser-only testing does not validate scripting calls or media/render behavior.

Personal Vault/library data should not be committed to source control. Debug/development mode set by the installers is intended for unsigned extension testing and does not replace signing/distribution review.