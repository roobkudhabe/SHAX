# SHAX Design System v3.3

## Purpose
SHAX is a compact, dockable Adobe After Effects work panel. This is an **Operate** interface: designers should find, preview, adjust and apply a tool quickly. Brand personality belongs in the blue mark, clear vector icon language, and differentiated motion previews, not decorative UI motion.

## Layout
- 52px toolbar, 114px navigation rail on wide docks.
- Under 680px: all seven tools in a two-row, fully visible toolstrip.
- 11–15px core typography, with compact supplementary numbers at 10px.
- 5–7px control and panel radii; 6–14px spatial rhythm.
- One active primary action per section.

## Palette

| Token | Dark | Light |
| --- | --- | --- |
| Canvas | `#23262b` | `#eceff3` |
| Panels | `#2d3138` | `#fafbfd` |
| Input | `#272b31` | `#e9edf2` |
| Text | `#f0f2f5` | `#232a34` |
| Secondary | `#c3c9d2` | `#454e5c` |
| Muted | `#a0a9b5` | `#637082` |
| Blue action | `#396eb5` | `#2868b5` |

The wordmark retains **SH** in white and **AX** in blue on permanent dark toolbar chrome even in Light mode. Brand Kit user color swatches are user content, not system UI tokens.

## Interaction rules
- Buttons: background/border/color feedback only. No cursor-follow glow, gradient borders, ripple effects, magnetic hover, moving cards or bouncy chrome.
- Animation library: motion can play *inside a preview*; the panel itself remains still.
- Visible keyboard focus, hover, selected, disabled, empty and status states.
- Explicit tool labels accompany vector navigation icons.
- Dark/light changes underlying interface surfaces, not the dark stage used to preview animation.

## Impeccable-informed passes
Used design review guidance from [Impeccable](https://github.com/pbakaus/impeccable), especially `distill`, `craft-floor`, and `polish`. The official CLI is not embedded in SHAX or required to run SHAX.

### Removed legacy artifacts
- Several per-version CSS overrides (229KB original replaced by ~52KB unified tokens/classes).
- Purple-blue gradients, radial-glow backgrounds, decorative card shadows, tiny 5–8px labels, fake 'LIVE' ornament, floating or pulsing cards, pixelated emoji navigation symbols, scroll-hidden tool groups.
- Unused JavaScript implementations for cursor glow, card tilt, magnetic movement and DOM ripples.

### Protected behaviors
Animate, Sequence, Resize, Align/Anchor, Brand, Vault, Organize, Saved Mixes, and Smart Picks remain intact. The JavaScript AE bridge functions and ExtendScript host logic are unchanged.