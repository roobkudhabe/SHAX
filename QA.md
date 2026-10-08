# SHAX v3.3.1 Dropdown Hotfix QA

Bug: The original `<select>` remained visible because `.native-select-hidden` had no CSS rule in v3.3. The custom options menu also lacked a closed-state CSS rule.

Fixes:
- Hide native select only after custom enhancement
- Render custom options menu only in `.rk-select.open`
- Remove duplicate arrow indicator
- Close on option selection, second trigger click, outside click, `Esc`, and tab switch
- Keep native `<select>` value/change propagation to existing tool code

Browser integration checks: `shax_dropdown_test.py` uses Chromium and the same CEP panel HTML/CSS/JS. Actual After Effects runtime validation must still be done on an installed Mac or Windows system.