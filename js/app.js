(function () {
  "use strict";

  var state = {
    direction: "auto",
    selectedLayers: [],
    customOrder: [],
    resizeRatio: "9:16",
    activeBrandId: null,
    vaultPresets: [],
    vaultSourceMode: "comp",
    motionCategory: "all",
    motionView: "all",
    motionPresetId: "smooth-rise",
    motionSearch: ""
  };

  function qs(selector) { return document.querySelector(selector); }
  function qsa(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  function setStatus(message, type) {
    qs("#statusText").textContent = message;
    var dot = qs("#statusDot");
    dot.className = "status-dot" + (type ? " " + type : "");
  }

  function evalAE(script, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      setStatus("Open SHAX inside After Effects", "error");
      if (callback) callback("__NO_CEP__");
      return;
    }
    window.__adobe_cep__.evalScript(script, function (result) {
      if (callback) callback(result);
    });
  }

  function aeString(value) {
    return '"' + String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n") + '"';
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }


  /* ---------- v2.8 Expanded Visual Motion Library ---------- */
  var SHAX_MOTION_FAVORITES_KEY = "shax.motion.favorites.v1";
  var SHAX_MOTION_RECENT_KEY = "shax.motion.recent.v1";
  var SHAX_MOTION_MIXES_KEY = "shax.motion.mixes.v1";
  var motionPresets = [
    { id:'smooth-rise', name:'Smooth Rise', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'glide', direction:'up', supportsDirection:true, energy:52, stagger:18, duration:0.85, preview:'rise', description:'Smooth directional entrance with a soft velocity finish.' },
    { id:'silk-slide', name:'Silk Slide', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'silk', direction:'left', supportsDirection:true, energy:48, stagger:16, duration:0.95, preview:'glide', description:'Long, elegant travel with restrained scale and premium easing.' },
    { id:'soft-drop', name:'Soft Drop', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'drop', direction:'down', supportsDirection:true, energy:46, stagger:16, duration:0.82, preview:'drop', description:'A gentle top-down entrance that settles without bounce.' },
    { id:'clean-drift', name:'Clean Drift', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'precision', direction:'right', supportsDirection:true, energy:44, stagger:12, duration:0.72, preview:'micro', description:'Small directional motion for clean interface layouts.' },
    { id:'edge-glide', name:'Edge Glide', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'panel', direction:'left', supportsDirection:true, energy:58, stagger:12, duration:0.82, preview:'panel', description:'A wider, polished glide for panels and grouped artwork.' },
    { id:'quiet-enter', name:'Quiet Enter', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'micro', direction:'up', supportsDirection:true, energy:28, stagger:8, duration:0.62, preview:'micro', description:'Very small movement when the design should stay understated.' },
    { id:'gentle-sweep', name:'Gentle Sweep', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'glide', direction:'right', supportsDirection:true, energy:60, stagger:18, duration:0.88, preview:'glide', description:'Balanced lateral entrance with subtle transform support.' },
    { id:'precision-in', name:'Precision In', category:'entrance', categoryLabel:'Entrances', badge:"IN", recipe:'precision', direction:'up', supportsDirection:true, energy:38, stagger:10, duration:0.68, preview:'rise', description:'Tight, controlled entrance with almost no decorative motion.' },
    { id:'soft-pop', name:'Soft Pop', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'pop', direction:'auto', supportsDirection:false, energy:54, stagger:10, duration:0.58, preview:'pop', description:'Soft scale entrance with a controlled finish and no directional slide.' },
    { id:'micro-pop', name:'Micro Pop', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'microPop', direction:'auto', supportsDirection:false, energy:42, stagger:8, duration:0.46, preview:'micro-pop', description:'Compact scale-in for small icons, controls and badges.' },
    { id:'focus-in', name:'Focus In', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'focus', direction:'auto', supportsDirection:false, energy:52, stagger:12, duration:0.72, preview:'focus', description:'Starts slightly larger and settles into focus.' },
    { id:'gentle-zoom', name:'Gentle Zoom', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'zoomSoft', direction:'auto', supportsDirection:false, energy:40, stagger:14, duration:0.92, preview:'zoom', description:'Slow scale treatment for illustrations and larger visuals.' },
    { id:'depth-in', name:'Depth In', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'depth', direction:'auto', supportsDirection:false, energy:56, stagger:14, duration:0.82, preview:'depth', description:'Combines subtle depth, fade and a small fixed lift.' },
    { id:'flat-scale', name:'Flat Scale', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'pop', direction:'auto', supportsDirection:false, energy:34, stagger:8, duration:0.5, preview:'pop', description:'Minimal scale entrance with restrained opacity change.' },
    { id:'expand-soft', name:'Expand Soft', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'microPop', direction:'auto', supportsDirection:false, energy:62, stagger:10, duration:0.62, preview:'micro-pop', description:'A slightly stronger expansion while remaining smooth.' },
    { id:'precision-pop', name:'Precision Pop', category:'scale', categoryLabel:'Scale', badge:"IN", recipe:'precisionPop', direction:'auto', supportsDirection:false, energy:48, stagger:6, duration:0.44, preview:'pop', description:'Short, exact scale-in tuned for interface elements.' },
    { id:'ui-snap', name:'UI Snap', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'snap', direction:'right', supportsDirection:true, energy:68, stagger:8, duration:0.48, preview:'snap', description:'Fast interface motion with crisp timing and controlled scale.' },
    { id:'card-in', name:'Card In', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'panel', direction:'up', supportsDirection:true, energy:50, stagger:12, duration:0.68, preview:'panel', description:'Polished entrance for cards and UI surfaces.' },
    { id:'badge-pop', name:'Badge Pop', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'microPop', direction:'auto', supportsDirection:false, energy:58, stagger:6, duration:0.42, preview:'micro-pop', description:'Quick scale entrance for badges and compact indicators.' },
    { id:'panel-glide', name:'Panel Glide', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'silk', direction:'left', supportsDirection:true, energy:54, stagger:10, duration:0.78, preview:'glide', description:'Smooth panel movement with a longer easing tail.' },
    { id:'chip-enter', name:'Chip Enter', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'precision', direction:'right', supportsDirection:true, energy:46, stagger:7, duration:0.52, preview:'micro', description:'Small clean motion for chips, tabs and labels.' },
    { id:'modal-settle', name:'Modal Settle', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'focus', direction:'auto', supportsDirection:false, energy:44, stagger:8, duration:0.66, preview:'focus', description:'Subtle depth settle for modal or popup surfaces.' },
    { id:'control-float', name:'Control Float', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'float', direction:'up', supportsDirection:true, energy:38, stagger:10, duration:0.76, preview:'float', description:'Light floating entrance for controls and icon groups.' },
    { id:'dock-in', name:'Dock In', category:'ui', categoryLabel:'UI Motion', badge:"IN", recipe:'snap', direction:'up', supportsDirection:true, energy:62, stagger:8, duration:0.5, preview:'snap', description:'Compact snappy entrance with premium UI timing.' },
    { id:'soft-float', name:'Soft Float', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'float', direction:'up', supportsDirection:true, energy:36, stagger:18, duration:1.05, preview:'float', description:'Gentle floating motion for illustrations and supporting graphics.' },
    { id:'gentle-drift', name:'Gentle Drift', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'drift', direction:'left', supportsDirection:true, energy:34, stagger:16, duration:1.1, preview:'drift', description:'Slow directional drift with subtle scale and rotation.' },
    { id:'airy-lift', name:'Airy Lift', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'float', direction:'up', supportsDirection:true, energy:30, stagger:20, duration:1.2, preview:'float', description:'Lightweight upward motion with more breathing room.' },
    { id:'feather-in', name:'Feather In', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'silk', direction:'right', supportsDirection:true, energy:32, stagger:18, duration:1.05, preview:'glide', description:'Very soft directional travel with relaxed easing.' },
    { id:'slow-bloom', name:'Slow Bloom', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'zoomSoft', direction:'auto', supportsDirection:false, energy:32, stagger:20, duration:1.25, preview:'zoom', description:'Calm scale bloom for organic illustrations and shapes.' },
    { id:'calm-drift', name:'Calm Drift', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'drift', direction:'right', supportsDirection:true, energy:28, stagger:18, duration:1.18, preview:'drift', description:'Quiet drift with little rotation and a long finish.' },
    { id:'soft-tilt', name:'Soft Tilt', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'tilt', direction:'up', supportsDirection:true, energy:38, stagger:16, duration:0.95, preview:'tilt', description:'Subtle tilt and travel that stays controlled.' },
    { id:'weightless', name:'Weightless', category:'organic', categoryLabel:'Organic', badge:"IN", recipe:'depth', direction:'auto', supportsDirection:false, energy:30, stagger:22, duration:1.2, preview:'depth', description:'Soft depth motion with almost weightless pacing.' },
    { id:'fast-sweep', name:'Fast Sweep', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'sweep', direction:'right', supportsDirection:true, energy:76, stagger:8, duration:0.48, preview:'sweep', description:'Large fast travel with a short clean fade.' },
    { id:'sharp-snap', name:'Sharp Snap', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'snap', direction:'left', supportsDirection:true, energy:82, stagger:6, duration:0.4, preview:'snap', description:'High-energy movement without cartoon bounce.' },
    { id:'power-in', name:'Power In', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'impact', direction:'auto', supportsDirection:false, energy:72, stagger:8, duration:0.48, preview:'impact', description:'Strong scale and opacity entrance with minimal travel.' },
    { id:'tilt-rush', name:'Tilt Rush', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'tilt', direction:'right', supportsDirection:true, energy:72, stagger:8, duration:0.56, preview:'tilt', description:'Fast directional movement paired with controlled rotation.' },
    { id:'swift-glide', name:'Swift Glide', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'panel', direction:'left', supportsDirection:true, energy:74, stagger:7, duration:0.52, preview:'panel', description:'Fast wide glide for energetic graphic layouts.' },
    { id:'quick-focus', name:'Quick Focus', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'focus', direction:'auto', supportsDirection:false, energy:66, stagger:7, duration:0.46, preview:'focus', description:'Rapid depth settle that lands cleanly.' },
    { id:'impact-lite', name:'Impact Lite', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'impact', direction:'auto', supportsDirection:false, energy:58, stagger:8, duration:0.54, preview:'impact', description:'Impact-style entrance kept refined and compact.' },
    { id:'punch-slide', name:'Punch Slide', category:'dynamic', categoryLabel:'Dynamic', badge:"IN", recipe:'sweep', direction:'up', supportsDirection:true, energy:70, stagger:7, duration:0.5, preview:'sweep', description:'Punchy directional movement with disciplined easing.' },
    { id:'cinematic-lift', name:'Cinematic Lift', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'cinema', direction:'up', supportsDirection:true, energy:48, stagger:18, duration:1.18, preview:'cinematic', description:'Slow premium lift for hero graphics and title cards.' },
    { id:'slow-push', name:'Slow Push', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'push', direction:'auto', supportsDirection:false, energy:42, stagger:16, duration:1.3, preview:'push', description:'Subtle camera-like push that settles into the final scale.' },
    { id:'hero-drift', name:'Hero Drift', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'drift', direction:'right', supportsDirection:true, energy:40, stagger:18, duration:1.28, preview:'drift', description:'Measured lateral drift for large visual elements.' },
    { id:'premium-zoom', name:'Premium Zoom', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'cinemaZoom', direction:'auto', supportsDirection:false, energy:44, stagger:18, duration:1.35, preview:'zoom', description:'Slow premium scale movement with a restrained fade.' },
    { id:'film-slide', name:'Film Slide', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'silk', direction:'left', supportsDirection:true, energy:46, stagger:16, duration:1.15, preview:'glide', description:'Elegant lateral motion with long cinematic easing.' },
    { id:'deep-focus', name:'Deep Focus', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'focus', direction:'auto', supportsDirection:false, energy:38, stagger:18, duration:1.15, preview:'focus', description:'Depth-first scale treatment for hero imagery.' },
    { id:'soft-reveal', name:'Soft Reveal', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'fade', direction:'auto', supportsDirection:false, energy:28, stagger:14, duration:1, preview:'fade', description:'Opacity-led reveal with almost no transform distraction.' },
    { id:'grand-enter', name:'Grand Enter', category:'cinematic', categoryLabel:'Cinematic', badge:"IN", recipe:'cinema', direction:'up', supportsDirection:true, energy:58, stagger:20, duration:1.35, preview:'cinematic', description:'A larger cinematic entrance while keeping motion elegant.' },
    { id:'minimal-in', name:'Minimal In', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'micro', direction:'up', supportsDirection:true, energy:24, stagger:8, duration:0.6, preview:'micro', description:'Very small motion for refined minimal layouts.' },
    { id:'micro-shift', name:'Micro Shift', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'precision', direction:'left', supportsDirection:true, energy:20, stagger:6, duration:0.52, preview:'micro', description:'Tiny positional shift with clean opacity timing.' },
    { id:'fade-settle', name:'Fade Settle', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'fade', direction:'auto', supportsDirection:false, energy:22, stagger:8, duration:0.72, preview:'fade', description:'Simple fade with a nearly invisible scale settle.' },
    { id:'quiet-scale', name:'Quiet Scale', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'precisionPop', direction:'auto', supportsDirection:false, energy:26, stagger:6, duration:0.56, preview:'pop', description:'Subtle scale motion that stays almost static.' },
    { id:'tiny-lift', name:'Tiny Lift', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'micro', direction:'up', supportsDirection:true, energy:18, stagger:8, duration:0.52, preview:'rise', description:'Small lift intended for already-finished layouts.' },
    { id:'gentle-appear', name:'Gentle Appear', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'fade', direction:'auto', supportsDirection:false, energy:18, stagger:10, duration:0.84, preview:'fade', description:'Soft opacity entrance for clean compositions.' },
    { id:'neutral-glide', name:'Neutral Glide', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'precision', direction:'right', supportsDirection:true, energy:26, stagger:8, duration:0.62, preview:'micro', description:'Neutral directional motion with minimal styling.' },
    { id:'clean-fade', name:'Clean Fade', category:'minimal', categoryLabel:'Minimal', badge:"IN", recipe:'fade', direction:'auto', supportsDirection:false, energy:30, stagger:6, duration:0.58, preview:'fade', description:'Short, clean fade for elements that need no movement.' }
  ];

  function motionLoadArray(key) {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(key) : null;
      var data = raw ? JSON.parse(raw) : [];
      return data instanceof Array ? data : [];
    } catch (e) { return []; }
  }

  function motionSaveArray(key, value) {
    try { if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value || [])); } catch (e) {}
  }

  function motionFavorites() { return motionLoadArray(SHAX_MOTION_FAVORITES_KEY); }
  function motionRecents() { return motionLoadArray(SHAX_MOTION_RECENT_KEY); }

  function clampMotionSetting(value, low, high, fallback) {
    value = Number(value);
    return isFinite(value) ? Math.max(low, Math.min(high, value)) : fallback;
  }

  function motionMixes() {
    return motionLoadArray(SHAX_MOTION_MIXES_KEY).slice(0, 60).map(function (item) {
      if (!item || typeof item !== "object") return null;
      var base = null;
      for (var i = 0; i < motionPresets.length; i++) {
        if (motionPresets[i].id === item.baseId) { base = motionPresets[i]; break; }
      }
      if (!base || !/^mix-[0-9]+-[0-9]+$/.test(String(item.id || ""))) return null;
      var direction = String(item.direction || base.direction);
      if (["left", "up", "right", "down", "auto"].indexOf(direction) < 0) direction = base.direction;
      return {
        id: item.id, name: String(item.name || "My Motion").slice(0, 48),
        category: "my", categoryLabel: "My Mixes", badge: "MY",
        baseId: base.id, recipe: base.recipe, preview: base.preview,
        supportsDirection: base.supportsDirection, direction: direction,
        energy: clampMotionSetting(item.energy, 0, 100, base.energy),
        stagger: clampMotionSetting(item.stagger, 0, 100, base.stagger),
        duration: clampMotionSetting(item.duration, 0.2, 20, base.duration),
        transformMix: item.transformMix !== false,
        expressionPolish: item.expressionPolish !== false,
        motionBlur: item.motionBlur !== false,
        description: "Saved SHAX mix based on " + base.name + ". Adjust and apply to any project."
      };
    }).filter(Boolean);
  }

  function allMotionPresets() { return motionPresets.concat(motionMixes()); }

  function findMotionPreset(id) {
    var list = allMotionPresets();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return motionPresets[0];
  }

  function motionMixBase(preset) {
    if (!preset) return motionPresets[0];
    return preset.baseId ? findMotionPreset(preset.baseId) : preset;
  }

  function hideMixEditor() {
    if (qs("#motionMixSaveForm")) qs("#motionMixSaveForm").hidden = true;
  }

  function openMixEditor() {
    var preset = findMotionPreset(state.motionPresetId);
    var form = qs("#motionMixSaveForm");
    if (!form) return;
    form.hidden = false;
    qs("#motionMixName").value = preset.baseId ? preset.name : preset.name + " · Custom";
    qs("#motionMixName").focus();
    qs("#motionMixName").select();
  }

  function saveMotionMix() {
    var name = String(qs("#motionMixName").value || "").replace(/^\s+|\s+$/g, "").slice(0, 48);
    if (!name) { setStatus("Name your motion mix first", "error"); qs("#motionMixName").focus(); return; }
    var preset = findMotionPreset(state.motionPresetId);
    var base = motionMixBase(preset);
    var mixes = motionLoadArray(SHAX_MOTION_MIXES_KEY);
    var id = preset.baseId ? preset.id : "mix-" + Date.now() + "-" + Math.floor(Math.random() * 999999);
    var item = {
      id: id, baseId: base.id, name: name,
      energy: clampMotionSetting(qs("#energy").value, 0, 100, base.energy),
      stagger: clampMotionSetting(qs("#stagger").value, 0, 100, base.stagger),
      duration: clampMotionSetting(qs("#duration").value, 0.2, 20, base.duration),
      direction: state.direction,
      transformMix: qs("#transformMix").checked,
      expressionPolish: qs("#expressionPolish").checked,
      motionBlur: qs("#motionBlur").checked
    };
    mixes = mixes.filter(function (m) { return m && m.id !== id; });
    mixes.unshift(item);
    motionSaveArray(SHAX_MOTION_MIXES_KEY, mixes.slice(0, 60));
    hideMixEditor();
    state.motionView = "mixes";
    state.motionCategory = "all";
    state.motionSearch = "";
    if (qs("#motionSearch")) qs("#motionSearch").value = "";
    qsa("[data-motion-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-motion-view") === "mixes");
    });
    qsa("[data-motion-category]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-motion-category") === "all");
    });
    selectMotionPreset(id, false);
    setStatus("Saved to My Mixes · " + name + " · available in future projects", "ok");
  }

  function deleteMotionMix() {
    var preset = findMotionPreset(state.motionPresetId);
    if (!preset.baseId) return;
    var mixes = motionLoadArray(SHAX_MOTION_MIXES_KEY).filter(function (m) { return m && m.id !== preset.id; });
    motionSaveArray(SHAX_MOTION_MIXES_KEY, mixes);
    state.motionPresetId = motionPresets[0].id;
    hideMixEditor();
    updateMotionInspector(motionPresets[0], false);
    renderMotionLibrary();
    setStatus("Deleted mix · Built-in presets are unchanged", "ok");
  }

  function renderSmartPicks() {
    var root = qs("#shaxPicks");
    if (!root) return;
    var layers = state.selectedLayers || [];
    root.hidden = !layers.length;
    if (!layers.length) { qs("#shaxPicksButtons").innerHTML = ""; return; }
    var types = {};
    for (var i = 0; i < layers.length; i++) {
      types[layers[i].type] = (types[layers[i].type] || 0) + 1;
    }
    var ids, reason;
    if (types.Text === layers.length) {
      ids = ["precision-in", "silk-slide", "clean-fade"];
      reason = "Recommended for selected text layers";
    } else if (types.Shape === layers.length) {
      ids = ["soft-pop", "card-in", "soft-float"];
      reason = "Recommended for shapes and UI elements";
    } else if (types.AV === layers.length) {
      ids = ["focus-in", "gentle-zoom", "slow-push"];
      reason = "Recommended for images, footage and precomps";
    } else {
      ids = ["silk-slide", "panel-glide", "clean-drift"];
      reason = "Balanced motion for this layer combination";
    }
    qs("#shaxPicksReason").textContent = reason;
    qs("#shaxPicksButtons").innerHTML = ids.map(function (id) {
      var p = findMotionPreset(id);
      return '<button type="button" data-smart-pick="' + escapeHTML(id) + '" title="Choose ' + escapeHTML(p.name) + '">' + escapeHTML(p.name) + '</button>';
    }).join("");
  }

  function motionPreviewMarkup(preset) {
    return '<div class="motion-preview-art preview-' + escapeHTML(preset.preview) + '">' +
      '<i class="demo-shadow"></i><i class="demo-object"></i><i class="demo-line"></i></div>';
  }

  function motionIsFavorite(id) {
    return motionFavorites().indexOf(id) !== -1;
  }

  function toggleMotionFavorite(id) {
    var list = motionFavorites();
    var index = list.indexOf(id);
    if (index === -1) list.unshift(id); else list.splice(index, 1);
    motionSaveArray(SHAX_MOTION_FAVORITES_KEY, list.slice(0, 100));
    renderMotionLibrary();
    updateMotionInspector(findMotionPreset(state.motionPresetId), true);
  }

  function recordMotionRecent(id) {
    var list = motionRecents();
    var index = list.indexOf(id);
    if (index !== -1) list.splice(index, 1);
    list.unshift(id);
    motionSaveArray(SHAX_MOTION_RECENT_KEY, list.slice(0, 16));
  }

  function updateDirectionButtons(direction) {
    state.direction = direction || "auto";
    qsa("#directionGroup .segment").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-value") === state.direction);
    });
  }


  function replayInspectorPreview() {
    var stage = qs("#motionInspectorStage");
    var subject = stage ? stage.querySelector(".motion-demo-object") : null;
    if (!subject || typeof subject.animate !== "function") return;
    if (state.previewAnimation) { try { state.previewAnimation.cancel(); } catch (e) {} }
    stage.classList.add("shax-preview-controlled");
    var preset = findMotionPreset(state.motionPresetId);
    var amount = clampMotionSetting(qs("#energy").value, 0, 100, preset.energy) / 100;
    var duration = clampMotionSetting(qs("#duration").value, 0.2, 20, preset.duration);
    var direction = state.direction;
    var travel = preset.supportsDirection === false ? 0 : (9 + Math.round(amount * 30));
    var x = direction === "left" ? -travel : direction === "right" ? travel : 0;
    var y = direction === "up" ? travel : direction === "down" ? -travel : 0;
    if (direction === "auto" && preset.supportsDirection !== false) y = travel;
    var recipe = preset.recipe;
    var startScale = (recipe === "pop" || recipe === "microPop" || recipe === "impact" || recipe === "precisionPop") ? 0.7 + amount * 0.18 :
      (recipe === "focus" || recipe === "zoomSoft" || recipe === "cinema") ? 1.15 + amount * 0.12 : 0.96;
    var tilt = (recipe === "tilt" || recipe === "drift") ? (direction === "left" ? -6 : 6) * amount : 0;
    try {
      state.previewAnimation = subject.animate([
        { opacity: 0.14, transform: "translate(" + x + "px," + y + "px) rotate(" + tilt + "deg) scale(" + startScale.toFixed(3) + ")" },
        { opacity: 1, transform: "translate(0px,0px) rotate(0deg) scale(1)" }
      ], {duration: Math.round(duration * 850), easing: "cubic-bezier(.18,.82,.22,1)", fill: "both", iterations: 1});
    } catch (e) { stage.classList.remove("shax-preview-controlled"); }
  }

  function updateMotionInspector(preset, preserveTweaks) {
    if (!preset) return;
    state.motionPresetId = preset.id;
    if (qs("#motionPresetTitle")) qs("#motionPresetTitle").textContent = preset.name;
    if (qs("#motionPresetCategory")) qs("#motionPresetCategory").textContent = preset.categoryLabel;
    if (qs("#motionPresetBadge")) qs("#motionPresetBadge").textContent = preset.badge || "IN";
    if (qs("#motionPresetDescription")) qs("#motionPresetDescription").textContent = preset.description || "";
    if (qs("#motionPresetEngine")) qs("#motionPresetEngine").textContent = "SHAX · " + String(preset.recipe || "motion").replace(/([A-Z])/g, " $1").toUpperCase();
    var directionSetting = qs("#directionSetting");
    if (directionSetting) directionSetting.classList.toggle("is-disabled", preset.supportsDirection === false);
    qsa("#directionGroup .segment").forEach(function (button) { button.disabled = preset.supportsDirection === false; });
    if (qs("#directionHint")) qs("#directionHint").textContent = preset.supportsDirection === false ? "Preset controlled" : "Orientation only";
    var stage = qs("#motionInspectorStage");
    if (stage) stage.className = "motion-preview-stage preview-" + preset.preview;
    if (qs("#deleteMotionMix")) qs("#deleteMotionMix").hidden = !preset.baseId;
    if (qs("#saveMotionMix")) qs("#saveMotionMix").textContent = preset.baseId ? "Edit My Mix" : "+ Save as My Mix";
    hideMixEditor();
    var fav = qs("#motionFavoriteLarge");
    if (fav) {
      var active = motionIsFavorite(preset.id);
      fav.classList.toggle("active", active);
      fav.textContent = active ? "♥" : "♡";
      fav.setAttribute("title", active ? "Remove from favorites" : "Add to favorites");
    }
    if (!preserveTweaks) {
      if (qs("#energy")) { qs("#energy").value = preset.energy; qs("#energyValue").textContent = preset.energy + "%"; }
      if (qs("#stagger")) { qs("#stagger").value = preset.stagger; qs("#staggerValue").textContent = preset.stagger + "%"; }
      if (qs("#duration")) qs("#duration").value = preset.duration;
      updateDirectionButtons(preset.direction);
      if (preset.baseId) {
        qs("#transformMix").checked = preset.transformMix;
        qs("#expressionPolish").checked = preset.expressionPolish;
        qs("#motionBlur").checked = preset.motionBlur;
      }
    }
    replayInspectorPreview();
    qsa(".motion-preset-card").forEach(function (card) {
      card.classList.toggle("selected", card.getAttribute("data-motion-id") === preset.id);
    });
  }

  function motionFilteredPresets() {
    var query = String(state.motionSearch || "").toLowerCase().replace(/^\s+|\s+$/g, "");
    var favorites = motionFavorites();
    var recents = motionRecents();
    var list = allMotionPresets();
    if (state.motionView === "mixes") list = list.filter(function (p) { return !!p.baseId; });
    if (state.motionView === "favorites") list = list.filter(function (p) { return favorites.indexOf(p.id) !== -1; });
    if (state.motionView === "recent") {
      list = list.filter(function (p) { return recents.indexOf(p.id) !== -1; });
      list.sort(function (a,b) { return recents.indexOf(a.id) - recents.indexOf(b.id); });
    }
    if (state.motionCategory !== "all") list = list.filter(function (p) { return p.category === state.motionCategory; });
    if (query) list = list.filter(function (p) {
      return (p.name + " " + p.categoryLabel + " " + p.description + " " + p.recipe).toLowerCase().indexOf(query) !== -1;
    });
    return list;
  }

  function renderMotionLibrary() {
    var grid = qs("#motionPresetGrid");
    if (!grid) return;
    var favorites = motionFavorites();
    var list = motionFilteredPresets();
    grid.innerHTML = list.map(function (preset) {
      var favorite = favorites.indexOf(preset.id) !== -1;
      var selected = preset.id === state.motionPresetId;
      return '<article class="motion-preset-card' + (favorite ? ' favorite' : '') + (selected ? ' selected' : '') + '" data-motion-id="' + escapeHTML(preset.id) + '" tabindex="0" title="Double-click to apply">' +
        '<div class="motion-card-preview">' + motionPreviewMarkup(preset) + '</div>' +
        '<button type="button" class="motion-fav-button" data-motion-favorite="' + escapeHTML(preset.id) + '" aria-label="Favorite">' + (favorite ? '♥' : '♡') + '</button>' +
        '<div class="motion-card-body"><div class="motion-card-name"><strong>' + escapeHTML(preset.name) + '</strong><small>' + escapeHTML(preset.badge || 'IN') + '</small></div>' +
        '<div class="motion-card-meta"><span>' + escapeHTML(preset.categoryLabel) + '</span><span>' + String(preset.duration).replace(/^0/, '') + 's</span></div></div>' +
      '</article>';
    }).join("");
    if (qs("#motionEmptyResults")) qs("#motionEmptyResults").hidden = list.length !== 0;
  }

  function selectMotionPreset(id, preserveTweaks) {
    var preset = findMotionPreset(id);
    updateMotionInspector(preset, preserveTweaks === true);
    renderMotionLibrary();
    setStatus("Selected motion · " + preset.name, "ok");
  }

  function setMotionCategory(category) {
    state.motionCategory = category || "all";
    qsa("[data-motion-category]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-motion-category") === state.motionCategory);
    });
    renderMotionLibrary();
  }

  function setMotionView(view) {
    state.motionView = view || "all";
    qsa("[data-motion-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-motion-view") === state.motionView);
    });
    renderMotionLibrary();
  }

  function initMotionLibrary() {
    renderMotionLibrary();
    qs("#saveMotionMix").addEventListener("click", openMixEditor);
    qs("#confirmMotionMix").addEventListener("click", saveMotionMix);
    qs("#cancelMotionMix").addEventListener("click", hideMixEditor);
    qs("#deleteMotionMix").addEventListener("click", deleteMotionMix);
    qs("#motionMixName").addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); saveMotionMix(); }
      if (event.key === "Escape") hideMixEditor();
    });
    qs("#shaxPicksButtons").addEventListener("click", function (event) {
      var target = event.target.closest ? event.target.closest("[data-smart-pick]") : null;
      if (!target) return;
      state.motionSearch = "";
      qs("#motionSearch").value = "";
      setMotionView("all");
      setMotionCategory("all");
      selectMotionPreset(target.getAttribute("data-smart-pick"), false);
    });
    updateMotionInspector(findMotionPreset(state.motionPresetId), false);
    qsa("[data-motion-category]").forEach(function (button) {
      button.addEventListener("click", function () { setMotionCategory(button.getAttribute("data-motion-category")); });
    });
    qsa("[data-motion-view]").forEach(function (button) {
      button.addEventListener("click", function () { setMotionView(button.getAttribute("data-motion-view")); });
    });
    if (qs("#motionSearch")) qs("#motionSearch").addEventListener("input", function () { state.motionSearch = this.value || ""; renderMotionLibrary(); });
    if (qs("#motionFavoriteLarge")) qs("#motionFavoriteLarge").addEventListener("click", function () { toggleMotionFavorite(state.motionPresetId); });
    if (qs("#motionPresetGrid")) {
      qs("#motionPresetGrid").addEventListener("click", function (event) {
        var fav = event.target.closest ? event.target.closest("[data-motion-favorite]") : null;
        if (fav) { event.stopPropagation(); toggleMotionFavorite(fav.getAttribute("data-motion-favorite")); return; }
        var card = event.target.closest ? event.target.closest("[data-motion-id]") : null;
        if (card) selectMotionPreset(card.getAttribute("data-motion-id"), false);
      });
      qs("#motionPresetGrid").addEventListener("dblclick", function (event) {
        var card = event.target.closest ? event.target.closest("[data-motion-id]") : null;
        if (!card) return;
        selectMotionPreset(card.getAttribute("data-motion-id"), false);
        generateMotion();
      });
      qs("#motionPresetGrid").addEventListener("keydown", function (event) {
        var card = event.target.closest ? event.target.closest("[data-motion-id]") : null;
        if (!card || (event.key !== "Enter" && event.keyCode !== 13)) return;
        selectMotionPreset(card.getAttribute("data-motion-id"), false);
      });
    }
  }

  function switchTab(tabId) {
    closeAllCustomSelects(null);
    qsa(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-tab") === tabId);
    });
    qsa(".panel-page").forEach(function (page) {
      page.classList.toggle("active", page.id === tabId);
    });

    var pageMeta = {
      animate: { kicker: "CREATE", title: "Animate", context: "Library" },
      sequence: { kicker: "CREATE", title: "Sequence", context: "Timing" },
      align: { kicker: "LAYOUT", title: "Align", context: "Geometry" },
      resize: { kicker: "LAYOUT", title: "Resize", context: "Canvas" },
      brand: { kicker: "SYSTEM", title: "Brand", context: "Identity" },
      vault: { kicker: "SYSTEM", title: "Vault", context: "Library" },
      organize: { kicker: "SYSTEM", title: "Organize", context: "Project" }
    };
    var meta = pageMeta[tabId] || pageMeta.animate;
    if (qs("#pageKicker")) qs("#pageKicker").textContent = meta.kicker;
    if (qs("#pageTitle")) qs("#pageTitle").textContent = meta.title;
    if (qs("#contextChip span")) qs("#contextChip span").textContent = meta.context;
    if (tabId === "sequence") refreshSelection();
    if (tabId === "resize") refreshCompInfo();
    if (tabId === "align") { refreshSelection(); setStatus("Alignment Studio ready · visual bounds are live", "ok"); }
    if (tabId === "organize") { scanProject(); setStatus("Project Organizer ready · scan before organizing", "ok"); }
    if (tabId === "vault") { refreshSelection(); reloadVault(); syncVaultSourceIndicator(); setStatus("Asset Vault ready · save complete animations with their resources", "ok"); }
    if (tabId === "brand") setStatus("Brand Kit ready · select layers to apply colors or type", "ok");
  }

  function layerBadge(type) {
    if (type === "Text") return "T";
    if (type === "Shape") return "◇";
    if (type === "Camera") return "C";
    if (type === "Light") return "L";
    if (type === "Null") return "N";
    if (type === "AV") return "▧";
    return "•";
  }

  function sameLayerSet(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (String(a[i].index) !== String(b[i].index)) return false;
    }
    return true;
  }

  function cloneLayers(layers) {
    return layers.map(function (layer) {
      return { index: layer.index, type: layer.type, name: layer.name };
    });
  }

  function renderSequenceList() {
    var count = state.selectedLayers.length;
    var countEl = qs("#sequenceLayerCount");
    var empty = qs("#sequenceEmpty");
    var list = qs("#sequenceLayerList");
    var isCustom = qs("#sequenceOrder").value === "custom";

    countEl.textContent = count;
    list.classList.toggle("custom-enabled", isCustom);

    if (!count) {
      list.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    list.hidden = false;

    var layers = state.customOrder.length ? state.customOrder : state.selectedLayers;
    list.innerHTML = layers.map(function (layer, position) {
      var safeName = escapeHTML(layer.name);
      var upDisabled = position === 0 ? " disabled" : "";
      var downDisabled = position === layers.length - 1 ? " disabled" : "";
      return '<div class="sequence-layer-row">' +
        '<div class="sequence-number">' + (position + 1) + '</div>' +
        '<div class="layer-type">' + layerBadge(layer.type) + '</div>' +
        '<div class="sequence-layer-name" title="' + safeName + '">' + safeName + '</div>' +
        '<div class="sequence-reorder">' +
          '<button data-move="up" data-pos="' + position + '"' + upDisabled + '>↑</button>' +
          '<button data-move="down" data-pos="' + position + '"' + downDisabled + '>↓</button>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function renderAlignmentSelection() {
    var countEl = qs("#alignLayerCount");
    var empty = qs("#alignEmpty");
    var list = qs("#alignLayerList");
    var keySelect = qs("#alignKeyLayer");
    if (!countEl || !empty || !list || !keySelect) return;

    var layers = state.selectedLayers || [];
    countEl.textContent = layers.length;

    if (!layers.length) {
      empty.hidden = false;
      list.hidden = true;
      list.innerHTML = "";
    } else {
      empty.hidden = true;
      list.hidden = false;
      list.innerHTML = layers.map(function (layer) {
        var safeName = escapeHTML(layer.name);
        return '<div class="align-layer-row">' +
          '<div class="layer-type">' + layerBadge(layer.type) + '</div>' +
          '<div class="layer-name" title="' + safeName + '">' + safeName + '</div>' +
          '<div class="layer-index">#' + layer.index + '</div>' +
        '</div>';
      }).join("");
    }

    var previous = String(keySelect.value || "");
    keySelect.innerHTML = layers.length ? layers.map(function (layer) {
      return '<option value="' + escapeHTML(layer.index) + '">' + escapeHTML(layer.name) + '</option>';
    }).join("") : '<option value="">Choose selected layer</option>';
    var found = false;
    for (var i = 0; i < keySelect.options.length; i++) {
      if (String(keySelect.options[i].value) === previous) { keySelect.selectedIndex = i; found = true; break; }
    }
    if (!found && keySelect.options.length) keySelect.selectedIndex = 0;
    if (keySelect._rkSelect) syncCustomSelect(keySelect);
    updateAlignToUI();
  }

  function updateAlignToUI() {
    var mode = qs("#alignTo") ? qs("#alignTo").value : "selection";
    var wrap = qs("#keyObjectWrap");
    if (wrap) wrap.hidden = mode !== "key";
  }

  function alignmentResult(raw, verb) {
    if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") {
      setStatus("Could not run Alignment Studio", "error");
      return;
    }
    if (raw === "NO_ACTIVE_COMP") { setStatus("Open a composition first", "error"); return; }
    if (raw === "NO_SELECTION") { setStatus("Select layers first", "error"); return; }
    if (raw === "NEED_TWO") { setStatus("Select at least 2 layers for this action", "error"); return; }
    if (raw === "NEED_THREE") { setStatus("Select at least 3 layers to distribute", "error"); return; }
    if (raw === "KEY_NOT_FOUND") { setStatus("Choose a valid Key Object", "error"); return; }
    if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) {
      setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Alignment error", "error");
      return;
    }
    var parts = raw.split("~~RK_FIELD~~");
    if (parts[0] === "OK") {
      var moved = Number(parts[1] || 0);
      var skipped = Number(parts[2] || 0);
      setStatus(verb + " · " + moved + " moved" + (skipped ? " · " + skipped + " skipped" : ""), "ok");
      pulseElement(qs("#alignTools"), "rk-align-success", 520);
      return;
    }
    setStatus(String(raw), "ok");
  }

  function runAlignAction(action) {
    if (!state.selectedLayers.length) { setStatus("Select layers first", "error"); return; }
    var mode = qs("#alignTo").value;
    if (mode === "selection" && state.selectedLayers.length < 2) { setStatus("Selection alignment needs at least 2 layers", "error"); return; }
    var keyIndex = mode === "key" ? Number(qs("#alignKeyLayer").value || 0) : 0;
    var preserve = qs("#alignPreserveMotion").checked;
    setStatus("Aligning visible bounds…");
    evalAE("roobKudhabe_alignSelected(" + aeString(action) + "," + aeString(mode) + "," + keyIndex + "," + aeString(String(preserve)) + ")", function (raw) {
      alignmentResult(raw, "Aligned");
    });
  }

  function runDistributeAction(action) {
    if (state.selectedLayers.length < 2) { setStatus("Select at least 2 layers", "error"); return; }
    var mode = qs("#alignTo").value;
    var keyIndex = mode === "key" ? Number(qs("#alignKeyLayer").value || 0) : 0;
    var preserve = qs("#alignPreserveMotion").checked;
    setStatus("Distributing visible bounds…");
    evalAE("roobKudhabe_distributeSelected(" + aeString(action) + "," + aeString(mode) + "," + keyIndex + "," + aeString(String(preserve)) + ")", function (raw) {
      alignmentResult(raw, "Distributed");
    });
  }

  function runSpacingAction(axis) {
    if (state.selectedLayers.length < 2) { setStatus("Select at least 2 layers", "error"); return; }
    var spacing = Number(qs("#alignSpacing").value);
    if (!isFinite(spacing)) { setStatus("Enter a valid spacing value", "error"); return; }
    var mode = qs("#alignTo").value;
    var keyIndex = mode === "key" ? Number(qs("#alignKeyLayer").value || 0) : 0;
    var preserve = qs("#alignPreserveMotion").checked;
    setStatus("Applying " + axis + " spacing…");
    evalAE("roobKudhabe_distributeSpacing(" + aeString(axis) + "," + spacing + "," + aeString(mode) + "," + keyIndex + "," + aeString(String(preserve)) + ")", function (raw) {
      alignmentResult(raw, "Spacing applied");
    });
  }

  function anchorResult(raw) {
    if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") {
      setStatus("Could not update Anchor Point", "error");
      return;
    }
    if (raw === "NO_ACTIVE_COMP") { setStatus("Open a composition first", "error"); return; }
    if (raw === "NO_SELECTION") { setStatus("Select layers first", "error"); return; }
    if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) {
      setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Anchor Point error", "error");
      return;
    }
    var parts = raw.split("~~RK_FIELD~~");
    if (parts[0] === "OK") {
      var changed = Number(parts[1] || 0);
      var skipped = Number(parts[2] || 0);
      setStatus("Anchor Point updated · " + changed + " layer" + (changed === 1 ? "" : "s") + (skipped ? " · " + skipped + " skipped" : ""), "ok");
      pulseElement(qs("#anchorTools"), "rk-anchor-success", 520);
      return;
    }
    setStatus(String(raw), "ok");
  }

  function runAnchorAction(action) {
    if (!state.selectedLayers.length) { setStatus("Select layers first", "error"); return; }
    var keepPosition = qs("#anchorKeepPosition").checked;
    var preserve = qs("#alignPreserveMotion").checked;
    setStatus("Moving Anchor Point to " + action.replace(/-/g, " ") + "…");
    evalAE("roobKudhabe_setAnchorPoint(" + aeString(action) + "," + aeString(String(keepPosition)) + "," + aeString(String(preserve)) + ")", function (raw) {
      anchorResult(raw);
    });
  }

  function renderSelection(payload) {
    var count = payload.layers.length;
    qs("#layerCount").textContent = count;
    var empty = qs("#selectionState");
    var list = qs("#layerList");

    if (!sameLayerSet(state.selectedLayers, payload.layers)) {
      state.selectedLayers = cloneLayers(payload.layers);
      state.customOrder = cloneLayers(payload.layers);
    }

    renderSequenceList();
    renderAlignmentSelection();
    syncVaultSourceIndicator(count);
    renderSmartPicks();

    if (!count) {
      list.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      setStatus(payload.message || "No layers selected", "ok");
      return;
    }

    empty.hidden = true;
    list.hidden = false;
    list.innerHTML = payload.layers.map(function (layer) {
      var safeName = escapeHTML(layer.name);
      return '<div class="layer-row">' +
        '<div class="layer-type">' + layerBadge(layer.type) + '</div>' +
        '<div class="layer-name" title="' + safeName + '">' + safeName + '</div>' +
        '<div class="layer-index">#' + layer.index + '</div>' +
      '</div>';
    }).join("");

    setStatus(count + (count === 1 ? " layer selected" : " layers selected"), "ok");
  }

  function parseSelection(raw) {
    if (!raw || raw === "EvalScript error.") return { layers: [], message: "After Effects bridge error" };
    if (raw === "NO_ACTIVE_COMP") return { layers: [], message: "Open a composition first" };
    if (raw === "NO_SELECTION") return { layers: [], message: "No layers selected" };

    var layers = raw.split("~~RK_LAYER~~").filter(Boolean).map(function (entry) {
      var parts = entry.split("~~RK_FIELD~~");
      return {
        index: parts[0] || "?",
        type: parts[1] || "Layer",
        name: parts.slice(2).join("~~RK_FIELD~~") || "Unnamed Layer"
      };
    });
    return { layers: layers };
  }

  function refreshSelection() {
    setStatus("Reading active composition…");
    evalAE("roobKudhabe_getSelectedLayers()", function (raw) {
      if (raw === "__NO_CEP__") {
        renderSelection({ layers: [], message: "Preview mode outside After Effects" });
        return;
      }
      renderSelection(parseSelection(raw));
    });
  }

  function setGenerating(isGenerating) {
    var button = qs("#generateMotion");
    button.disabled = isGenerating;
    button.classList.toggle("busy", isGenerating);
    button.innerHTML = isGenerating ? "APPLYING…" : "<span>▶</span> APPLY MOTION";
  }

  function generateMotion() {
    var duration = Number(qs("#duration").value);
    if (!isFinite(duration) || duration < 0.2) {
      setStatus("Duration must be at least 0.2 seconds", "error");
      return;
    }

    var activePreset = findMotionPreset(state.motionPresetId);
    var settings = {
      style: activePreset ? activePreset.recipe : "glide",
      energy: Number(qs("#energy").value),
      direction: state.direction,
      stagger: Number(qs("#stagger").value),
      duration: duration,
      transformMix: qs("#transformMix").checked,
      expressionPolish: qs("#expressionPolish").checked,
      motionBlur: qs("#motionBlur").checked
    };

    var script = "roobKudhabe_generateMotion(" +
      aeString(settings.style) + "," +
      settings.energy + "," +
      aeString(settings.direction) + "," +
      settings.stagger + "," +
      settings.duration + "," +
      aeString(String(settings.transformMix)) + "," +
      aeString(String(settings.expressionPolish)) + "," +
      aeString(String(settings.motionBlur)) + ")";

    setGenerating(true);
    setStatus("Applying " + (findMotionPreset(state.motionPresetId).name || "motion") + "…");

    evalAE(script, function (raw) {
      setGenerating(false);

      if (raw === "__NO_CEP__" || !raw || raw === "EvalScript error.") {
        setStatus("Could not run the motion engine", "error");
        return;
      }
      if (raw === "NO_ACTIVE_COMP") {
        setStatus("Open a composition first", "error");
        return;
      }
      if (raw === "NO_SELECTION") {
        setStatus("Select at least one layer", "error");
        return;
      }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) {
        setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Animation error", "error");
        return;
      }
      if (raw.indexOf("OK~~RK_FIELD~~") === 0) {
        var parts = raw.split("~~RK_FIELD~~");
        var animated = Number(parts[1] || 0);
        var skipped = Number(parts[2] || 0);
        var message = "UI motion added to " + animated + (animated === 1 ? " layer" : " layers");
        if (skipped > 0) message += " · " + skipped + " skipped";
        recordMotionRecent(state.motionPresetId);
        renderMotionLibrary();
        setStatus(message + " · " + findMotionPreset(state.motionPresetId).name + " · Undo supported", "ok");
        refreshSelection();
        return;
      }
      setStatus(String(raw), "error");
    });
  }

  function moveCustomLayer(position, direction) {
    var target = direction === "up" ? position - 1 : position + 1;
    if (position < 0 || target < 0 || position >= state.customOrder.length || target >= state.customOrder.length) return;
    var temp = state.customOrder[position];
    state.customOrder[position] = state.customOrder[target];
    state.customOrder[target] = temp;
    renderSequenceList();
  }

  function setSequenceBusy(isBusy) {
    var button = qs("#applySequence");
    button.disabled = isBusy;
    button.classList.toggle("busy", isBusy);
    button.innerHTML = isBusy ? "RETIMING…" : "<span>☷</span> APPLY SEQUENCE";
  }

  function applySequence() {
    if (!state.selectedLayers.length) {
      setStatus("Select animated layers first", "error");
      return;
    }

    var gap = Number(qs("#sequenceGap").value);
    var overlap = Number(qs("#sequenceOverlap").value);
    var natural = Number(qs("#sequenceNatural").value);
    if (!isFinite(gap) || gap < 0) {
      setStatus("Minimum Gap must be 0 or more", "error");
      return;
    }

    var customIndices = state.customOrder.map(function (layer) { return layer.index; }).join(",");
    var script = "roobKudhabe_applySequence(" +
      aeString(qs("#sequenceOrder").value) + "," +
      aeString(String(qs("#sequenceReverse").checked)) + "," +
      gap + "," + overlap + "," + natural + "," +
      aeString(customIndices) + ")";

    setSequenceBusy(true);
    setStatus("Sequencing animation timing…");

    evalAE(script, function (raw) {
      setSequenceBusy(false);
      if (raw === "__NO_CEP__" || !raw || raw === "EvalScript error.") {
        setStatus("Could not run the sequence engine", "error");
        return;
      }
      if (raw === "NO_ACTIVE_COMP") {
        setStatus("Open a composition first", "error");
        return;
      }
      if (raw === "NO_SELECTION") {
        setStatus("Select animated layers first", "error");
        return;
      }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) {
        setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Sequence error", "error");
        return;
      }
      if (raw.indexOf("OK~~RK_FIELD~~") === 0) {
        var parts = raw.split("~~RK_FIELD~~");
        var moved = Number(parts[1] || 0);
        var skipped = Number(parts[2] || 0);
        var message = "Sequence applied to " + moved + (moved === 1 ? " layer" : " layers");
        if (skipped > 0) message += " · " + skipped + " skipped";
        recordMotionRecent(state.motionPresetId);
        renderMotionLibrary();
        setStatus(message + " · " + findMotionPreset(state.motionPresetId).name + " · Undo supported", "ok");
        return;
      }
      setStatus(String(raw), "error");
    });
  }


  function ratioLabel(width, height) {
    width = Number(width);
    height = Number(height);
    if (!width || !height) return "—";
    var ratio = width / height;
    var known = [
      { label: "16:9", value: 16 / 9 },
      { label: "9:16", value: 9 / 16 },
      { label: "1:1", value: 1 },
      { label: "4:5", value: 4 / 5 },
      { label: "5:4", value: 5 / 4 }
    ];
    var best = known[0];
    var distance = Math.abs(ratio - best.value);
    for (var i = 1; i < known.length; i++) {
      var d = Math.abs(ratio - known[i].value);
      if (d < distance) { best = known[i]; distance = d; }
    }
    return distance < 0.015 ? best.label : ratio.toFixed(2) + ":1";
  }

  function parseCompInfo(raw) {
    if (!raw || raw === "EvalScript error.") return null;
    if (raw === "NO_ACTIVE_COMP") return { active: false };
    if (raw.indexOf("OK~~RK_FIELD~~") !== 0) return null;
    var parts = raw.split("~~RK_FIELD~~");
    return {
      active: true,
      name: parts[1] || "Composition",
      width: Number(parts[2] || 0),
      height: Number(parts[3] || 0),
      layerCount: Number(parts[4] || 0),
      selectedCount: Number(parts[5] || 0),
      source: parts[6] || "active"
    };
  }

  function renderCompInfo(info) {
    if (!info || !info.active) {
      qs("#currentCompName").textContent = "No composition selected";
      qs("#currentCompName").title = "";
      qs("#currentSize").textContent = "—";
      qs("#currentLayerTotal").textContent = "—";
      qs("#currentSelectedTotal").textContent = "—";
      qs("#currentRatio").textContent = "—";
      return;
    }
    qs("#currentCompName").textContent = info.name;
    qs("#currentCompName").title = info.name;
    qs("#currentSize").textContent = info.width + " × " + info.height;
    qs("#currentLayerTotal").textContent = info.layerCount;
    qs("#currentSelectedTotal").textContent = info.selectedCount;
    qs("#currentRatio").textContent = ratioLabel(info.width, info.height);
  }

  function refreshCompInfo() {
    setStatus("Reading composition canvas…");
    evalAE("roobKudhabe_getActiveCompInfo()", function (raw) {
      if (raw === "__NO_CEP__") {
        renderCompInfo(null);
        return;
      }
      var info = parseCompInfo(raw);
      renderCompInfo(info);
      if (info && info.active) {
        var sourceLabel = info.source === "selection" ? "project selection" : "active composition";
        setStatus("Loaded " + info.name + " · " + sourceLabel, "ok");
      }
      else setStatus("Open a composition first", "error");
    });
  }

  function selectFormatPreset(button) {
    qsa(".format-preset").forEach(function (item) { item.classList.remove("active"); });
    button.classList.add("active");
    qs("#resizeWidth").value = button.getAttribute("data-width");
    qs("#resizeHeight").value = button.getAttribute("data-height");
    state.resizeRatio = button.getAttribute("data-ratio") || "custom";
  }
  function clearFormatPreset() {
    qsa(".format-preset").forEach(function (item) { item.classList.remove("active"); });
    state.resizeRatio = "custom";
  }

  function updateResizeModeHelp() {
    var mode = qs("#resizeMode").value;
    var help = qs("#resizeModeHelp");
    var signal = qs(".reflow-signal");
    if (!help) return;
    if (mode === "deep") {
      help.textContent = "Deep Chain Fit follows the dominant nested precomp chain, fits the real design only once, then centers each parent canvas without scaling the design again.";
      if (signal) signal.classList.remove("legacy-mode");
    } else if (mode === "smartflow") {
      help.textContent = "Legacy Smart Reflow only works on the current composition level.";
      if (signal) signal.classList.add("legacy-mode");
    } else if (mode === "fitcenter") {
      help.textContent = "Fit + Center keeps the old layout relationship, then uniformly fits and centers it inside the new canvas.";
      if (signal) signal.classList.add("legacy-mode");
    } else if (mode === "center") {
      help.textContent = "Keep Center Distance shifts layers relative to the new canvas center without rebuilding the layout.";
      if (signal) signal.classList.add("legacy-mode");
    } else {
      help.textContent = "Scale Layout proportionally remaps the original positions into the new canvas.";
      if (signal) signal.classList.add("legacy-mode");
    }
  }

  function setResizeBusy(isBusy) {
    var button = qs("#applyResize");
    button.disabled = isBusy;
    button.classList.toggle("busy", isBusy);
    var deep = qs("#resizeMode").value === "deep";
    var smart = qs("#resizeMode").value === "smartflow";
    button.innerHTML = isBusy ? (deep ? "SCANNING NESTED COMPS…" : (smart ? "REFLOWING LAYOUT…" : "RECOMPOSING…")) : "<span>⌗</span> RECOMPOSE";
  }

  function applyResize() {
    var width = Math.round(Number(qs("#resizeWidth").value));
    var height = Math.round(Number(qs("#resizeHeight").value));
    if (!isFinite(width) || !isFinite(height) || width < 16 || height < 16 || width > 30000 || height > 30000) {
      setStatus("Enter a valid canvas size between 16 and 30000 px", "error");
      return;
    }

    var script = "roobKudhabe_recompose(" +
      width + "," + height + "," +
      aeString(qs("#resizeScope").value) + "," +
      aeString(qs("#resizeMode").value) + "," +
      aeString(String(qs("#resizePreserveMotion").checked)) + "," +
      aeString(String(qs("#resizeSafeArea").checked)) + "," +
      aeString(String(qs("#resizeDuplicate").checked)) + "," +
      aeString(String(qs("#resizeAdaptiveScale").checked)) + ")";

    setResizeBusy(true);
    setStatus(qs("#resizeMode").value === "deep" ? "Finding the design chain and fitting the real layout once…" : (qs("#resizeMode").value === "smartflow" ? "Rebuilding current-level layout…" : "Recomposing canvas + layer placement…"));
    evalAE(script, function (raw) {
      setResizeBusy(false);
      if (raw === "__NO_CEP__" || !raw || raw === "EvalScript error.") {
        setStatus("Could not run the recompose engine", "error");
        return;
      }
      if (raw === "NO_ACTIVE_COMP") {
        setStatus("Open a composition first", "error");
        return;
      }
      if (raw === "NO_SELECTION") {
        setStatus("Select layers or change Layers to All eligible layers", "error");
        return;
      }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) {
        setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Recompose error", "error");
        return;
      }
      if (raw.indexOf("OK~~RK_FIELD~~") === 0) {
        var parts = raw.split("~~RK_FIELD~~");
        var moved = Number(parts[1] || 0);
        var skipped = Number(parts[2] || 0);
        var duplicated = String(parts[3] || "false") === "true";
        var fitPercent = Number(parts[4] || 100);
        var compName = parts[5] || "Composition";
        var resolvedMode = parts[6] || qs("#resizeMode").value;
        var nestedCount = Number(parts[7] || 0);
        var deepest = Number(parts[8] || 0);
        var message = resolvedMode === "deep" ? "Deep Chain Fit adjusted " + moved + (moved === 1 ? " root layer" : " root layers") : (resolvedMode === "smartflow" ? "Smart Reflow changed Position + Scale on " + moved + (moved === 1 ? " layer" : " layers") : "Recomposed " + moved + (moved === 1 ? " layer" : " layers"));
        if (resolvedMode === "deep" && nestedCount > 0) message += " · " + nestedCount + " comps scanned · depth " + deepest;
        if (resolvedMode === "fitcenter") message += " · fit + centered at " + fitPercent.toFixed(1).replace(".0", "") + "%";
        if (skipped > 0) message += " · " + skipped + " protected/skipped";
        if (duplicated) message += " · copy created";
        message += " · " + compName;
        recordMotionRecent(state.motionPresetId);
        renderMotionLibrary();
        setStatus(message + " · " + findMotionPreset(state.motionPresetId).name + " · Undo supported", "ok");
        refreshCompInfo();
        refreshSelection();
        return;
      }
      setStatus(String(raw), "error");
    });
  }


  /* ---------- v1.2 custom select UI ---------- */
  function dispatchSelectChange(select) {
    var event;
    try { event = new Event("change", { bubbles: true }); }
    catch (e) { event = document.createEvent("HTMLEvents"); event.initEvent("change", true, false); }
    select.dispatchEvent(event);
  }

  function closeAllCustomSelects(except) {
    qsa(".rk-select.open").forEach(function (root) {
      if (root !== except) {
        root.classList.remove("open");
        var button = root.querySelector(".rk-select-trigger");
        if (button) button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function syncCustomSelect(select) {
    if (!select || !select._rkSelect) return;
    var ui = select._rkSelect;
    var selectedOption = select.options[select.selectedIndex] || select.options[0];
    ui.label.textContent = selectedOption ? selectedOption.textContent : "Select";
    ui.menu.innerHTML = "";
    Array.prototype.slice.call(select.options).forEach(function (option, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "rk-select-option" + (option.selected ? " selected" : "");
      button.textContent = option.textContent;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", option.selected ? "true" : "false");
      button.setAttribute("data-value", option.value);
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        select.selectedIndex = index;
        ui.label.textContent = option.textContent;
        ui.root.classList.remove("open");
        ui.trigger.setAttribute("aria-expanded", "false");
        dispatchSelectChange(select);
        syncCustomSelect(select);
      });
      ui.menu.appendChild(button);
    });
  }

  function enhanceSelect(select) {
    if (!select || select._rkSelect) return;
    var wrap = select.parentNode;
    if (!wrap || !wrap.classList.contains("select-wrap")) return;
    select.classList.add("native-select-hidden");
    wrap.classList.add("rk-enhanced");

    var root = document.createElement("div");
    root.className = "rk-select";
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "rk-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Choose " + (select.id || "option"));
    trigger.innerHTML = '<span class="rk-select-label"></span><span class="rk-select-chevron">⌄</span>';
    var menu = document.createElement("div");
    menu.className = "rk-select-menu";
    menu.setAttribute("role", "listbox");
    root.appendChild(trigger);
    root.appendChild(menu);
    wrap.appendChild(root);

    select._rkSelect = { root: root, trigger: trigger, label: trigger.querySelector(".rk-select-label"), menu: menu };
    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var opening = !root.classList.contains("open");
      closeAllCustomSelects(root);
      root.classList.toggle("open", opening);
      trigger.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    select.addEventListener("change", function () { syncCustomSelect(select); });
    syncCustomSelect(select);
  }

  function initCustomSelects() {
    qsa(".select-wrap > select").forEach(enhanceSelect);
    document.addEventListener("click", function () { closeAllCustomSelects(null); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" || event.keyCode === 27) closeAllCustomSelects(null);
    });
  }


  /* ---------- v1.5 Project Organizer ---------- */
  function organizerSetCount(id, value) {
    var el = qs(id);
    if (el) el.textContent = String(Number(value) || 0);
  }

  function renderProjectScan(raw) {
    if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") { setStatus("Could not scan this After Effects project", "error"); return; }
    if (raw === "NO_PROJECT") { setStatus("Open or create an After Effects project first", "error"); return; }
    if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) { setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Project scan error", "error"); return; }
    var parts = raw.split("~~RK_FIELD~~");
    if (parts[0] !== "OK") { setStatus(String(raw), "error"); return; }
    var name = parts[1] || "Untitled Project";
    if (qs("#organizerProjectName")) qs("#organizerProjectName").textContent = name;
    organizerSetCount("#organizerTotalCount", parts[2]);
    organizerSetCount("#orgMainCount", parts[3]);
    organizerSetCount("#orgPrecompCount", parts[4]);
    organizerSetCount("#orgImageCount", parts[5]);
    organizerSetCount("#orgVideoCount", parts[6]);
    organizerSetCount("#orgAudioCount", parts[7]);
    organizerSetCount("#orgDesignCount", parts[8]);
    organizerSetCount("#orgSolidCount", parts[9]);
    organizerSetCount("#orgDataCount", parts[10]);
    organizerSetCount("#orgOtherCount", parts[11]);
    setStatus("Project scanned · " + (Number(parts[2]) || 0) + " items detected", "ok");
    pulseElement(qs("#organizerProjectName"), "rk-pressed", 320);
  }

  function scanProject() {
    setStatus("Scanning Project panel…");
    evalAE("roobKudhabe_scanProject()", renderProjectScan);
  }

  function organizeProject() {
    var scope = qs("#organizeScope") ? qs("#organizeScope").value : "root";
    var split = qs("#organizeSplitComps") && qs("#organizeSplitComps").checked;
    setStatus(scope === "all" ? "Deep-organizing the full Project panel…" : "Organizing loose Project items…");
    evalAE("roobKudhabe_organizeProject(" + aeString(scope) + "," + aeString(String(!!split)) + ")", function (raw) {
      if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") { setStatus("Could not organize the Project panel", "error"); return; }
      if (raw === "NO_PROJECT") { setStatus("Open or create a project first", "error"); return; }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) { setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Organizer error", "error"); return; }
      var parts = raw.split("~~RK_FIELD~~");
      if (parts[0] === "OK") {
        setStatus("Project organized · " + (parts[1] || 0) + " items moved · " + (parts[2] || 0) + " folders ready", "ok");
        pulseElement(qs(".organizer-controls-card"), "rk-organize-success", 620);
        scanProject();
        return;
      }
      setStatus(String(raw), "error");
    });
  }

  function organizeActiveCompLayers() {
    var labels = qs("#organizeLayerLabels") && qs("#organizeLayerLabels").checked;
    var prefixes = qs("#organizeLayerPrefixes") && qs("#organizeLayerPrefixes").checked;
    if (!labels && !prefixes) { setStatus("Enable Labels by Type or Add Type Prefix first", "error"); return; }
    setStatus("Organizing active composition layers…");
    evalAE("roobKudhabe_organizeActiveCompLayers(" + aeString(String(!!labels)) + "," + aeString(String(!!prefixes)) + ")", function (raw) {
      if (raw === "NO_ACTIVE_COMP") { setStatus("Open a composition first", "error"); return; }
      if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") { setStatus("Could not organize active comp layers", "error"); return; }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) { setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Layer organizer error", "error"); return; }
      var parts = raw.split("~~RK_FIELD~~");
      if (parts[0] === "OK") {
        setStatus("Layers organized · " + (parts[1] || 0) + " labels · " + (parts[2] || 0) + " names updated", "ok");
        pulseElement(qs("#organizeLayers"), "rk-pressed", 440);
        return;
      }
      setStatus(String(raw), "error");
    });
  }


  /* ---------- v2.6 Asset Vault ---------- */
  function vaultEscape(value) {
    return escapeHTML(value == null ? "" : value);
  }

  function vaultFileUrl(path) {
    var value = String(path || "").replace(/\\/g, "/");
    if (!value) return "";
    if (/^[A-Za-z]:\//.test(value)) value = "/" + value;
    try { return encodeURI("file://" + value); } catch (e) { return "file://" + value; }
  }

  /* CEP can refuse file:// images even when the PNG exists. Read local preview
     frames through CEP FS and feed Chromium a data URL instead. */
  var vaultImageCache = {};
  function vaultImageSource(path) {
    var raw = String(path || "");
    if (!raw) return "";
    if (vaultImageCache[raw]) return vaultImageCache[raw];
    try {
      if (window.cep && window.cep.fs && window.cep.fs.readFile) {
        var encoding = (window.cep.encoding && window.cep.encoding.Base64) ? window.cep.encoding.Base64 : "Base64";
        var result = window.cep.fs.readFile(raw, encoding);
        if (result && Number(result.err) === 0 && result.data) {
          var dataUrl = "data:image/png;base64," + result.data;
          vaultImageCache[raw] = dataUrl;
          return dataUrl;
        }
      }
    } catch (e) {}
    return vaultFileUrl(raw);
  }

  function syncVaultSourceIndicator(count) {
    var label = qs("#vaultSourceLabel");
    var amount = qs("#vaultSelectionCount");
    if (!label || !amount) return;
    var n = typeof count === "number" ? count : state.selectedLayers.length;
    if (state.vaultSourceMode === "selection") {
      label.textContent = "Selected layers";
      amount.textContent = String(n);
      amount.title = n ? "These layers will be auto-precomposed into one reusable asset." : "Select the character or object layers to save.";
    } else {
      label.textContent = "Active composition";
      amount.textContent = "COMP";
      amount.title = "The active composition and all of its dependencies will be saved.";
    }
  }

  function setVaultSource(mode) {
    state.vaultSourceMode = mode === "selection" ? "selection" : "comp";
    qsa("[data-vault-source]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-vault-source") === state.vaultSourceMode);
    });
    syncVaultSourceIndicator();
    if (state.vaultSourceMode === "selection") {
      setStatus("Vault source · selected layers will be auto-precomposed", "ok");
    } else {
      setStatus("Vault source · active composition", "ok");
    }
  }

  function parseVaultList(raw) {
    if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") return { error: "Could not read Asset Vault" };
    if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) return { error: raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Asset Vault error" };
    if (raw === "EMPTY") return { presets: [] };
    if (raw.indexOf("OK~~RK_ITEM~~") !== 0) return { error: String(raw) };
    var body = raw.substring("OK~~RK_ITEM~~".length);
    var presets = body ? body.split("~~RK_ITEM~~").filter(Boolean).map(function (entry) {
      var parts = entry.split("~~RK_FIELD~~");
      return {
        id: parts[0] || "",
        name: parts[1] || "Untitled Asset",
        category: parts[2] || "Other",
        compName: parts[3] || "",
        duration: Number(parts[4] || 0),
        layers: Number(parts[5] || 0),
        resources: Number(parts[6] || 0),
        missing: Number(parts[7] || 0),
        previewPath: parts[8] || "",
        created: parts[9] || "",
        width: Number(parts[10] || 0),
        height: Number(parts[11] || 0),
        previewFrames: parts[12] ? parts[12].split("~~RK_FRAME~~").filter(Boolean) : []
      };
    }) : [];
    return { presets: presets };
  }

  function stopVaultThumb(img, restorePoster) {
    if (!img) return;
    if (img._shaxTimer) {
      window.clearInterval(img._shaxTimer);
      img._shaxTimer = null;
    }
    var thumb = img.parentNode;
    if (thumb && thumb.classList) thumb.classList.remove("is-playing");
    var badge = thumb ? thumb.querySelector(".vault-thumb-badge") : null;
    if (badge) badge.textContent = (img._shaxFrames && img._shaxFrames.length > 1) ? "▶ PLAY" : "PREVIEW";
    if (restorePoster && img._shaxPoster) img.src = img._shaxPoster;
  }

  function startVaultThumb(img) {
    if (!img || !img._shaxFrames || img._shaxFrames.length < 2) return;
    stopVaultThumb(img, false);
    var frames = img._shaxFrames;
    var index = 0;
    var thumb = img.parentNode;
    if (thumb && thumb.classList) thumb.classList.add("is-playing");
    var badge = thumb ? thumb.querySelector(".vault-thumb-badge") : null;
    if (badge) badge.textContent = "PLAYING";
    img.src = frames[0];
    img._shaxTimer = window.setInterval(function () {
      index = (index + 1) % frames.length;
      img.src = frames[index];
    }, 135);
  }

  function stopAllVaultThumbs(root) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.slice.call(root.querySelectorAll(".vault-motion-preview")).forEach(function (img) { stopVaultThumb(img, false); });
  }

  function wireVaultMotionPreviews() {
    qsa(".vault-motion-preview").forEach(function (img) {
      var id = img.getAttribute("data-vault-thumb-id") || "";
      var preset = null;
      for (var i = 0; i < state.vaultPresets.length; i++) {
        if (String(state.vaultPresets[i].id) === String(id)) { preset = state.vaultPresets[i]; break; }
      }
      if (!preset) return;
      var frames = (preset.previewFrames || []).map(vaultImageSource).filter(Boolean);
      img._shaxFrames = frames;
      img._shaxPoster = vaultImageSource(preset.previewPath) || (frames.length ? frames[0] : "");
      img._shaxLocked = false;
      for (var p = 0; p < frames.length; p++) {
        try { var preload = new Image(); preload.src = frames[p]; } catch (e) {}
      }
      var thumb = img.parentNode;
      if (!thumb) return;
      thumb.addEventListener("mouseenter", function () { if (!img._shaxLocked) startVaultThumb(img); });
      thumb.addEventListener("mouseleave", function () { if (!img._shaxLocked) stopVaultThumb(img, true); });
      thumb.addEventListener("click", function (event) {
        if (event.target && event.target.closest && event.target.closest("button")) return;
        if (!frames.length || frames.length < 2) return;
        img._shaxLocked = !img._shaxLocked;
        if (img._shaxLocked) startVaultThumb(img);
        else stopVaultThumb(img, true);
      });
    });
  }

  function renderVaultList() {
    var list = qs("#vaultList");
    if (!list) return;
    stopAllVaultThumbs(list);
    var search = String((qs("#vaultSearch") && qs("#vaultSearch").value) || "").toLowerCase();
    var presets = (state.vaultPresets || []).filter(function (preset) {
      if (!search) return true;
      return String(preset.name + " " + preset.category + " " + preset.compName).toLowerCase().indexOf(search) !== -1;
    });
    if (qs("#vaultPresetCount")) qs("#vaultPresetCount").textContent = String((state.vaultPresets || []).length);
    if (!presets.length) {
      list.innerHTML = '<div class="vault-empty"><div>◆</div><strong>' + ((state.vaultPresets || []).length ? 'No matching asset' : 'No saved assets yet') + '</strong><span>' + ((state.vaultPresets || []).length ? 'Try another search.' : 'Animate a character, object or composition, then save it as an Asset Pack.') + '</span></div>';
      return;
    }
    list.innerHTML = presets.map(function (preset) {
      var duration = isFinite(preset.duration) ? preset.duration.toFixed(2).replace(/\.00$/, "") : "0";
      var preview = vaultImageSource(preset.previewPath);
      var dimension = preset.width && preset.height ? (preset.width + "×" + preset.height) : "";
      var resourceText = preset.resources + (preset.resources === 1 ? " resource" : " resources");
      var missing = preset.missing ? '<span class="vault-missing">' + preset.missing + ' missing</span>' : "";
      var hasMotionPreview = preset.previewFrames && preset.previewFrames.length > 1;
      var img = preview ? '<img class="vault-motion-preview" data-vault-thumb-id="' + vaultEscape(preset.id) + '" src="' + vaultEscape(preview) + '" alt="' + vaultEscape(preset.name) + ' preview" onerror="this.style.display=\'none\';this.nextElementSibling.style.opacity=\'.42\'" />' : "";
      var badge = hasMotionPreview ? '<em class="vault-thumb-badge">▶ PLAY</em>' : '<em class="vault-thumb-badge">PREVIEW</em>';
      return '<article class="vault-item asset-vault-item" data-vault-id="' + vaultEscape(preset.id) + '">' +
        '<div class="vault-thumb">' + img + '<span>◆</span>' + badge + '</div>' +
        '<div class="vault-item-main"><strong class="vault-item-name" title="' + vaultEscape(preset.name) + '">' + vaultEscape(preset.name) + '</strong>' +
        '<div class="vault-item-meta"><span><b>' + vaultEscape(preset.category) + '</b></span><span>' + duration + 's</span><span>' + preset.layers + ' layers</span><span>' + resourceText + '</span><span>' + vaultEscape(dimension) + '</span>' + missing + '</div></div>' +
        '<div class="vault-item-actions"><button class="vault-preview" data-vault-preview="' + vaultEscape(preset.id) + '">PREVIEW</button><button class="vault-apply" data-vault-apply="' + vaultEscape(preset.id) + '">APPLY</button><button class="vault-delete" data-vault-delete="' + vaultEscape(preset.id) + '" title="Delete">×</button></div>' +
      '</article>';
    }).join("");
    wireVaultMotionPreviews();
  }

  function reloadVault() {
    evalAE("shax_listAssetPacks()", function (raw) {
      var parsed = parseVaultList(raw);
      if (parsed.error) { setStatus(parsed.error, "error"); return; }
      state.vaultPresets = parsed.presets || [];
      renderVaultList();
    });
  }

  function saveVaultMotion() {
    var name = String((qs("#vaultPresetName") && qs("#vaultPresetName").value) || "").replace(/^\s+|\s+$/g, "");
    if (!name) { setStatus("Give this asset a name first", "error"); return; }
    if (state.vaultSourceMode === "selection" && !state.selectedLayers.length) {
      setStatus("Select the character or object layers first", "error");
      return;
    }
    var category = qs("#vaultCategory").value || "Other";
    var packResources = !!qs("#vaultPackResources").checked;
    var button = qs("#vaultSaveMotion");
    button.disabled = true;
    button.innerHTML = "PACKING ASSET…";
    setStatus("Building reusable AE pack · collecting composition dependencies…");

    var script = "shax_saveAssetPack(" +
      aeString(name) + "," +
      aeString(category) + "," +
      aeString(state.vaultSourceMode) + "," +
      aeString(String(packResources)) + ")";

    evalAE(script, function (raw) {
      button.disabled = false;
      button.innerHTML = '<span>◇</span> SAVE ASSET PACK';
      if (raw === "NO_ACTIVE_COMP") { setStatus("Open the composition you want to save", "error"); return; }
      if (raw === "NO_SELECTION") { setStatus("Select the character or object layers first", "error"); return; }
      if (raw === "SAVE_CANCELLED") { setStatus("Vault save cancelled · project was not saved", ""); return; }
      if (raw === "PROJECT_NOT_SAVED") { setStatus("Save the current .aep project once, then save the Asset Pack", "error"); return; }
      if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") { setStatus("Could not build this Asset Pack", "error"); return; }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) { setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Could not build Asset Pack", "error"); return; }
      var parts = raw.split("~~RK_FIELD~~");
      if (parts[0] === "OK") {
        var resourceCount = Number(parts[2] || 0);
        var missingCount = Number(parts[3] || 0);
        setStatus("Asset saved · " + name + " · " + resourceCount + " resources" + (missingCount ? " · " + missingCount + " missing" : ""), missingCount ? "" : "ok");
        qs("#vaultPresetName").value = "";
        pulseElement(qs(".vault-capture-card"), "rk-organize-success", 560);
        reloadVault();
        refreshSelection();
        return;
      }
      setStatus(String(raw), "error");
    });
  }

  function setVaultItemPreviewState(item, img, open) {
    if (!item) return;
    var button = item.querySelector("[data-vault-preview]");
    if (!open) {
      item.classList.remove("is-previewing");
      if (img) { img._shaxLocked = false; stopVaultThumb(img, true); }
      if (button) button.textContent = "PREVIEW";
      return;
    }
    item.classList.add("is-previewing");
    if (img) {
      img._shaxLocked = true;
      if (img._shaxFrames && img._shaxFrames.length > 1) startVaultThumb(img);
      else if (img._shaxPoster) img.src = img._shaxPoster;
    }
    if (button) button.textContent = "STOP PREVIEW";
  }

  function closeOtherVaultPreviews(item) {
    qsa(".vault-item.is-previewing").forEach(function (other) {
      if (other === item) return;
      setVaultItemPreviewState(other, other.querySelector(".vault-motion-preview"), false);
    });
  }

  function previewVaultAsset(id) {
    var item = qs('.vault-item[data-vault-id="' + String(id).replace(/"/g, '\\"') + '"]');
    if (!item) { setStatus("Saved Asset Pack was not found", "error"); return; }
    var img = item.querySelector(".vault-motion-preview");
    var button = item.querySelector("[data-vault-preview]");

    if (item.classList.contains("is-previewing")) {
      setVaultItemPreviewState(item, img, false);
      setStatus("Inline preview stopped", "ok");
      return;
    }

    closeOtherVaultPreviews(item);

    if (img && img._shaxFrames && img._shaxFrames.length > 1) {
      setVaultItemPreviewState(item, img, true);
      setStatus("Playing preview inside Vault", "ok");
      pulseElement(item, "rk-vault-applied", 420);
      return;
    }

    /* Older Vault packs may only have one poster frame. Build motion frames lazily
       without opening the composition viewer, then play them in this card. */
    if (button) { button.disabled = true; button.textContent = "BUILDING…"; }
    setStatus("Building inline motion preview…");
    evalAE("shax_rebuildAssetPreview(" + aeString(id) + ")", function (raw) {
      if (button) button.disabled = false;
      if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") {
        if (button) button.textContent = "PREVIEW";
        setStatus("Could not build the inline preview", "error");
        return;
      }
      if (raw === "PACK_NOT_FOUND") {
        if (button) button.textContent = "PREVIEW";
        setStatus("Saved Asset Pack was not found", "error");
        reloadVault();
        return;
      }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) {
        if (button) button.textContent = "PREVIEW";
        setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Preview build error", "error");
        return;
      }
      var parts = raw.split("~~RK_FIELD~~");
      if (parts[0] !== "OK") {
        if (button) button.textContent = "PREVIEW";
        setStatus(String(raw), "error");
        return;
      }
      var poster = vaultImageSource(parts[1] || "");
      var frames = parts[2] ? parts[2].split("~~RK_FRAME~~").map(vaultImageSource).filter(Boolean) : [];
      if (img) {
        img._shaxFrames = frames;
        img._shaxPoster = poster || (frames.length ? frames[0] : img._shaxPoster);
        if (img._shaxPoster) img.src = img._shaxPoster;
        for (var i = 0; i < frames.length; i++) {
          try { var preload = new Image(); preload.src = frames[i]; } catch (e) {}
        }
      }
      setVaultItemPreviewState(item, img, true);
      setStatus(frames.length > 1 ? "Playing preview inside Vault" : "Showing saved preview frame", "ok");
      pulseElement(item, "rk-vault-applied", 420);
    });
  }

  function applyVaultMotion(id) {
    var insert = !!qs("#vaultOpenAfterApply").checked;
    setStatus(insert ? "Importing and inserting saved animation…" : "Importing saved animation…");
    evalAE("shax_applyAssetPack(" + aeString(id) + "," + aeString(String(insert)) + ")", function (raw) {
      if (raw === "PACK_NOT_FOUND") { setStatus("Saved Asset Pack was not found", "error"); reloadVault(); return; }
      if (!raw || raw === "EvalScript error." || raw === "__NO_CEP__") { setStatus("Could not apply this saved asset", "error"); return; }
      if (raw.indexOf("ERROR~~RK_FIELD~~") === 0) { setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Asset apply error", "error"); return; }
      var parts = raw.split("~~RK_FIELD~~");
      if (parts[0] === "OK") {
        var mode = parts[1] || "IMPORTED";
        var compName = parts[2] || "asset";
        setStatus((mode === "INSERTED" ? "Asset inserted at playhead" : "Asset imported") + " · " + compName, "ok");
        var item = qs('.vault-item[data-vault-id="' + String(id).replace(/"/g, '\\"') + '"]');
        pulseElement(item, "rk-vault-applied", 620);
        return;
      }
      setStatus(String(raw), "error");
    });
  }

  function clearVaultPreview() {
    qsa(".vault-item.is-previewing").forEach(function (item) {
      item.classList.remove("is-previewing");
      var img = item.querySelector(".vault-motion-preview");
      if (img) { img._shaxLocked = false; stopVaultThumb(img, true); }
      var button = item.querySelector("[data-vault-preview]");
      if (button) button.textContent = "PREVIEW";
    });
    qsa(".vault-motion-preview").forEach(function (img) {
      if (!img._shaxLocked) stopVaultThumb(img, true);
    });
    setStatus("All Vault previews stopped", "ok");
  }

  function deleteVaultMotion(id) {
    var preset = null;
    for (var i = 0; i < state.vaultPresets.length; i++) if (state.vaultPresets[i].id === id) { preset = state.vaultPresets[i]; break; }
    if (!preset) return;
    if (window.confirm && !window.confirm('Delete "' + preset.name + '" and its packed resources from Asset Vault?')) return;
    evalAE("shax_deleteAssetPack(" + aeString(id) + ")", function (raw) {
      if (raw === "OK") { setStatus("Deleted from Asset Vault · " + preset.name, "ok"); reloadVault(); return; }
      if (raw === "PACK_NOT_FOUND") { reloadVault(); return; }
      if (raw && raw.indexOf("ERROR~~RK_FIELD~~") === 0) { setStatus(raw.split("~~RK_FIELD~~").slice(1).join(" ") || "Delete failed", "error"); return; }
      setStatus("Could not delete this Asset Pack", "error");
    });
  }

  /* ---------- v1.2 Brand System ---------- */
  var BRAND_STORAGE_KEY = "shax.brandKits.v1";
  var LEGACY_BRAND_STORAGE_KEY = "roobkudhabe.brandKits.v1";

  function defaultBrandKit(name) {
    return {
      id: "rk_" + String(new Date().getTime()) + "_" + String(Math.floor(Math.random() * 10000)),
      name: name || "My Brand",
      logoPath: "",
      primary: "#5C8DFF",
      secondary: "#7C5CFF",
      accent: "#0FC8A8",
      font: "",
      motionStyle: "smooth",
      energy: 55,
      stagger: 25,
      duration: 0.9
    };
  }

  function normalizeHex(value, fallback) {
    var text = String(value || "").trim().toUpperCase();
    if (text.charAt(0) !== "#") text = "#" + text;
    if (/^#[0-9A-F]{6}$/.test(text)) return text;
    return fallback || "#5C8DFF";
  }

  function loadBrandKits() {
    var kits = [];
    try {
      var raw = window.localStorage ? window.localStorage.getItem(BRAND_STORAGE_KEY) : null;
      if (!raw && window.localStorage) {
        var legacyRaw = window.localStorage.getItem(LEGACY_BRAND_STORAGE_KEY);
        if (legacyRaw) { raw = legacyRaw; window.localStorage.setItem(BRAND_STORAGE_KEY, legacyRaw); }
      }
      if (raw) kits = JSON.parse(raw) || [];
    } catch (e) { kits = []; }
    if (!kits || !kits.length) {
      kits = [defaultBrandKit("SHAX Brand")];
      saveBrandKits(kits);
    }
    return kits;
  }

  function saveBrandKits(kits) {
    try { if (window.localStorage) window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(kits)); }
    catch (e) {}
  }

  function currentBrandKit(kits) {
    kits = kits || loadBrandKits();
    var id = state.activeBrandId;
    for (var i = 0; i < kits.length; i++) if (kits[i].id === id) return kits[i];
    state.activeBrandId = kits[0].id;
    return kits[0];
  }

  function fileNameFromPath(path) {
    var text = String(path || "");
    if (!text) return "No logo selected";
    var parts = text.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || text;
  }

  function updatePaletteGlow() {
    qsa(".palette-card").forEach(function (card) {
      var slot = card.getAttribute("data-slot");
      var input = qs("#brand" + slot.charAt(0).toUpperCase() + slot.slice(1));
      if (!input) return;
      var hex = normalizeHex(input.value, "#5C8DFF");
      card.style.setProperty("--palette-glow", hex + "33");
    });
  }

  function syncBrandColorPair(slot, fromColorPicker) {
    var cap = slot.charAt(0).toUpperCase() + slot.slice(1);
    var hexInput = qs("#brand" + cap);
    var colorInput = qs("#brand" + cap + "Color");
    if (!hexInput || !colorInput) return;
    var value = normalizeHex(fromColorPicker ? colorInput.value : hexInput.value, colorInput.value || "#5C8DFF");
    hexInput.value = value;
    colorInput.value = value;
    updatePaletteGlow();
  }

  function renderBrandKitSelect(kits) {
    var select = qs("#brandKitSelect");
    select.innerHTML = "";
    kits.forEach(function (kit) {
      var option = document.createElement("option");
      option.value = kit.id;
      option.textContent = kit.name || "Untitled Brand";
      option.selected = kit.id === state.activeBrandId;
      select.appendChild(option);
    });
    if (select._rkSelect) syncCustomSelect(select);
  }

  function populateBrandEditor(kit) {
    if (!kit) return;
    qs("#brandName").value = kit.name || "My Brand";
    qs("#brandPrimary").value = normalizeHex(kit.primary, "#5C8DFF");
    qs("#brandSecondary").value = normalizeHex(kit.secondary, "#7C5CFF");
    qs("#brandAccent").value = normalizeHex(kit.accent, "#0FC8A8");
    qs("#brandPrimaryColor").value = qs("#brandPrimary").value;
    qs("#brandSecondaryColor").value = qs("#brandSecondary").value;
    qs("#brandAccentColor").value = qs("#brandAccent").value;
    qs("#brandFont").value = kit.font || "";
    qs("#brandMotionStyle").value = kit.motionStyle || "smooth";
    qs("#brandEnergy").value = Number(kit.energy == null ? 55 : kit.energy);
    qs("#brandStagger").value = Number(kit.stagger == null ? 25 : kit.stagger);
    qs("#brandDuration").value = Number(kit.duration == null ? 0.9 : kit.duration);
    qs("#brandEnergyValue").textContent = qs("#brandEnergy").value + "%";
    qs("#brandStaggerValue").textContent = qs("#brandStagger").value + "%";
    qs("#logoFileName").textContent = fileNameFromPath(kit.logoPath);
    qs("#logoPathLabel").textContent = kit.logoPath ? kit.logoPath : "Choose PNG, AI, PSD or supported footage.";
    qs("#logoPreview").textContent = (kit.name || "R").charAt(0).toUpperCase();
    updatePaletteGlow();
    if (qs("#brandMotionStyle")._rkSelect) syncCustomSelect(qs("#brandMotionStyle"));
  }

  function brandFromEditor(existing) {
    existing = existing || defaultBrandKit();
    return {
      id: existing.id,
      name: String(qs("#brandName").value || "My Brand").trim() || "My Brand",
      logoPath: existing.logoPath || "",
      primary: normalizeHex(qs("#brandPrimary").value, "#5C8DFF"),
      secondary: normalizeHex(qs("#brandSecondary").value, "#7C5CFF"),
      accent: normalizeHex(qs("#brandAccent").value, "#0FC8A8"),
      font: String(qs("#brandFont").value || "").trim(),
      motionStyle: qs("#brandMotionStyle").value || "smooth",
      energy: Math.max(0, Math.min(100, Number(qs("#brandEnergy").value) || 0)),
      stagger: Math.max(0, Math.min(100, Number(qs("#brandStagger").value) || 0)),
      duration: Math.max(0.2, Math.min(5, Number(qs("#brandDuration").value) || 0.9))
    };
  }

  function updateCurrentBrand(mutator, persist) {
    var kits = loadBrandKits();
    var kit = currentBrandKit(kits);
    var index = kits.indexOf(kit);
    var next = brandFromEditor(kit);
    if (mutator) mutator(next);
    kits[index] = next;
    state.activeBrandId = next.id;
    if (persist !== false) saveBrandKits(kits);
    renderBrandKitSelect(kits);
    populateBrandEditor(next);
    return next;
  }

  function initBrandSystem() {
    var kits = loadBrandKits();
    if (!state.activeBrandId) state.activeBrandId = kits[0].id;
    renderBrandKitSelect(kits);
    populateBrandEditor(currentBrandKit(kits));
  }

  function saveActiveBrand() {
    var kit = updateCurrentBrand(null, true);
    setStatus("Saved brand kit · " + kit.name, "ok");
    pulseElement(qs("#saveBrandKit"), "rk-pressed", 420);
  }

  function newBrandKit() {
    var kits = loadBrandKits();
    var kit = defaultBrandKit("New Brand " + (kits.length + 1));
    kits.push(kit);
    saveBrandKits(kits);
    state.activeBrandId = kit.id;
    renderBrandKitSelect(kits);
    populateBrandEditor(kit);
    setStatus("New brand kit created", "ok");
  }

  function deleteBrandKit() {
    var kits = loadBrandKits();
    if (kits.length <= 1) {
      setStatus("Keep at least one brand kit", "error");
      return;
    }
    var next = [];
    for (var i = 0; i < kits.length; i++) if (kits[i].id !== state.activeBrandId) next.push(kits[i]);
    saveBrandKits(next);
    state.activeBrandId = next[0].id;
    renderBrandKitSelect(next);
    populateBrandEditor(next[0]);
    setStatus("Brand kit deleted", "ok");
  }

  function chooseBrandLogo() {
    setStatus("Choose a logo file…");
    evalAE("roobKudhabe_chooseLogo()", function (raw) {
      if (!raw || raw === "CANCEL" || raw === "EvalScript error.") {
        if (raw === "CANCEL") setStatus("Logo selection cancelled", "ok");
        else setStatus("Could not open logo picker", "error");
        return;
      }
      updateCurrentBrand(function (kit) { kit.logoPath = String(raw); }, true);
      setStatus("Logo linked · " + fileNameFromPath(raw), "ok");
    });
  }

  function placeBrandLogo() {
    var kit = updateCurrentBrand(null, true);
    if (!kit.logoPath) { setStatus("Choose a logo first", "error"); return; }
    var size = Math.max(4, Math.min(40, Number(qs("#logoSize").value) || 14));
    var script = "roobKudhabe_placeLogo(" + aeString(kit.logoPath) + "," + aeString(qs("#logoPlacement").value) + "," + size + ")";
    setStatus("Placing brand logo…");
    evalAE(script, function (raw) {
      if (raw === "NO_ACTIVE_COMP") setStatus("Open a composition first", "error");
      else if (!raw || raw === "EvalScript error." || raw.indexOf("ERROR~~RK_FIELD~~") === 0) setStatus(raw && raw.indexOf("ERROR~~RK_FIELD~~") === 0 ? raw.split("~~RK_FIELD~~").slice(1).join(" ") : "Could not place logo", "error");
      else setStatus("Logo placed · editable AE layer · Undo supported", "ok");
    });
  }

  function applyBrandColor(slot) {
    syncBrandColorPair(slot, false);
    var cap = slot.charAt(0).toUpperCase() + slot.slice(1);
    var hex = qs("#brand" + cap).value;
    setStatus("Applying " + slot + " color to selected layers…");
    evalAE("roobKudhabe_applyBrandColor(" + aeString(hex) + ")", function (raw) {
      if (raw === "NO_ACTIVE_COMP") setStatus("Open a composition first", "error");
      else if (raw === "NO_SELECTION") setStatus("Select text or shape layers first", "error");
      else if (raw && raw.indexOf("OK~~RK_FIELD~~") === 0) {
        var parts = raw.split("~~RK_FIELD~~");
        setStatus("Brand color applied to " + (parts[1] || 0) + " layer(s) · Undo supported", "ok");
      } else setStatus("No supported fill found in the selected layers", "error");
    });
  }

  function applyBrandFont() {
    var font = String(qs("#brandFont").value || "").trim();
    if (!font) { setStatus("Enter or capture a font first", "error"); return; }
    setStatus("Applying brand typography…");
    evalAE("roobKudhabe_applyBrandFont(" + aeString(font) + ")", function (raw) {
      if (raw === "NO_ACTIVE_COMP") setStatus("Open a composition first", "error");
      else if (raw === "NO_SELECTION") setStatus("Select text layers first", "error");
      else if (raw && raw.indexOf("OK~~RK_FIELD~~") === 0) setStatus("Brand font applied to " + (raw.split("~~RK_FIELD~~")[1] || 0) + " text layer(s) · Undo supported", "ok");
      else setStatus("Could not apply that font name", "error");
    });
  }

  function captureBrandSelection(fontOnly) {
    setStatus("Reading selected layer style…");
    evalAE("roobKudhabe_captureBrandFromSelection()", function (raw) {
      if (raw === "NO_ACTIVE_COMP") { setStatus("Open a composition first", "error"); return; }
      if (raw === "NO_SELECTION") { setStatus("Select a text or shape layer first", "error"); return; }
      if (!raw || raw === "EvalScript error." || raw.indexOf("OK~~RK_FIELD~~") !== 0) { setStatus("Could not read a reusable style from the selection", "error"); return; }
      var parts = raw.split("~~RK_FIELD~~");
      var font = parts[1] || "";
      var color = parts[2] || "";
      if (font) qs("#brandFont").value = font;
      if (!fontOnly && color) {
        qs("#brandPrimary").value = normalizeHex(color, qs("#brandPrimary").value);
        syncBrandColorPair("primary", false);
      }
      setStatus(fontOnly ? "Font captured from selection" : "Brand style captured from selection", "ok");
    });
  }

  function sendBrandMotionToAnimate() {
    var kit = updateCurrentBrand(null, false);
    var presetMap = { smooth:"smooth-rise", clean:"precision-in", snappy:"ui-snap", soft:"soft-float", cinematic:"cinematic-lift" };
    var presetId = presetMap[kit.motionStyle] || "smooth-rise";
    selectMotionPreset(presetId, false);
    qs("#energy").value = kit.energy;
    qs("#stagger").value = kit.stagger;
    qs("#duration").value = kit.duration;
    qs("#energyValue").textContent = kit.energy + "%";
    qs("#staggerValue").textContent = kit.stagger + "%";
    switchTab("animate");
    setStatus("Brand motion loaded into Animate · " + kit.name, "ok");
  }

  function pulseElement(element, className, duration) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(function () { element.classList.remove(className); }, duration || 420);
  }

  qsa(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () { switchTab(tab.getAttribute("data-tab")); });
  });

  qsa(".segment").forEach(function (button) {
    button.addEventListener("click", function () {
      qsa(".segment").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      state.direction = button.getAttribute("data-value");
      replayInspectorPreview();
    });
  });

  qs("#energy").addEventListener("input", function (event) {
    qs("#energyValue").textContent = event.target.value + "%";
    replayInspectorPreview();
  });

  qs("#duration").addEventListener("input", replayInspectorPreview);

  qs("#stagger").addEventListener("input", function (event) {
    qs("#staggerValue").textContent = event.target.value + "%";
  });

  qs("#sequenceOverlap").addEventListener("input", function (event) {
    qs("#sequenceOverlapValue").textContent = event.target.value + "%";
  });

  qs("#sequenceNatural").addEventListener("input", function (event) {
    qs("#sequenceNaturalValue").textContent = event.target.value + "%";
  });

  qs("#sequenceOrder").addEventListener("change", function () {
    renderSequenceList();
    if (this.value === "custom") setStatus("Use the arrows to set your custom layer order", "ok");
  });

  qs("#sequenceLayerList").addEventListener("click", function (event) {
    var button = event.target.closest ? event.target.closest("button[data-move]") : event.target;
    if (!button || !button.getAttribute("data-move") || button.disabled) return;
    moveCustomLayer(Number(button.getAttribute("data-pos")), button.getAttribute("data-move"));
  });

  qs("#refreshSelection").addEventListener("click", refreshSelection);
  qs("#sequenceRefresh").addEventListener("click", refreshSelection);
  qs("#generateMotion").addEventListener("click", generateMotion);
  qs("#applySequence").addEventListener("click", applySequence);
  qs("#resizeRefresh").addEventListener("click", refreshCompInfo);
  qs("#applyResize").addEventListener("click", applyResize);

  qsa(".format-preset").forEach(function (button) {
    button.addEventListener("click", function () { selectFormatPreset(button); });
  });
  qs("#resizeWidth").addEventListener("input", clearFormatPreset);
  qs("#resizeHeight").addEventListener("input", clearFormatPreset);
  qs("#resizeMode").addEventListener("change", updateResizeModeHelp);


  qs("#alignRefresh").addEventListener("click", refreshSelection);
  qs("#alignTo").addEventListener("change", function () {
    updateAlignToUI();
    setStatus(this.value === "composition" ? "Align to Composition · behaves like Illustrator artboard alignment" : (this.value === "key" ? "Key Object stays fixed" : "Align to Selection bounds"), "ok");
  });
  qsa("[data-align-action]").forEach(function (button) {
    button.addEventListener("click", function () { runAlignAction(button.getAttribute("data-align-action")); });
  });
  qsa("[data-anchor-action]").forEach(function (button) {
    button.addEventListener("click", function () { runAnchorAction(button.getAttribute("data-anchor-action")); });
  });
  qsa("[data-distribute-action]").forEach(function (button) {
    button.addEventListener("click", function () { runDistributeAction(button.getAttribute("data-distribute-action")); });
  });
  qsa("[data-spacing-axis]").forEach(function (button) {
    button.addEventListener("click", function () { runSpacingAction(button.getAttribute("data-spacing-axis")); });
  });

  qs("#brandKitSelect").addEventListener("change", function () {
    var kits = loadBrandKits();    state.activeBrandId = this.value;
    populateBrandEditor(currentBrandKit(kits));
    setStatus("Loaded brand kit · " + qs("#brandName").value, "ok");
  });
  qs("#newBrandKit").addEventListener("click", newBrandKit);
  qs("#deleteBrandKit").addEventListener("click", deleteBrandKit);
  qs("#saveBrandKit").addEventListener("click", saveActiveBrand);
  qs("#chooseLogo").addEventListener("click", chooseBrandLogo);
  qs("#placeLogo").addEventListener("click", placeBrandLogo);
  qs("#captureBrandStyle").addEventListener("click", function () { captureBrandSelection(false); });
  qs("#captureFont").addEventListener("click", function () { captureBrandSelection(true); });
  qs("#applyFont").addEventListener("click", applyBrandFont);
  qs("#sendBrandMotion").addEventListener("click", sendBrandMotionToAnimate);
  qsa("[data-brand-color]").forEach(function (button) {
    button.addEventListener("click", function () { applyBrandColor(button.getAttribute("data-brand-color")); });
  });
  ["primary", "secondary", "accent"].forEach(function (slot) {
    var cap = slot.charAt(0).toUpperCase() + slot.slice(1);
    qs("#brand" + cap + "Color").addEventListener("input", function () { syncBrandColorPair(slot, true); });
    qs("#brand" + cap).addEventListener("change", function () { syncBrandColorPair(slot, false); });
  });
  qs("#brandEnergy").addEventListener("input", function () { qs("#brandEnergyValue").textContent = this.value + "%"; });
  qs("#brandStagger").addEventListener("input", function () { qs("#brandStaggerValue").textContent = this.value + "%"; });

  qs("#scanProject").addEventListener("click", scanProject);
  qs("#organizeProject").addEventListener("click", organizeProject);
  qs("#organizeLayers").addEventListener("click", organizeActiveCompLayers);

  qs("#vaultRefreshSelection").addEventListener("click", refreshSelection);
  qsa("[data-vault-source]").forEach(function (button) {
    button.addEventListener("click", function () { setVaultSource(button.getAttribute("data-vault-source")); });
  });
  qs("#vaultSaveMotion").addEventListener("click", saveVaultMotion);
  qs("#vaultReload").addEventListener("click", reloadVault);
  qs("#vaultClearPreview").addEventListener("click", clearVaultPreview);
  qs("#vaultSearch").addEventListener("input", renderVaultList);
  qs("#vaultList").addEventListener("click", function (event) {
    var preview = event.target.closest ? event.target.closest("[data-vault-preview]") : null;
    var apply = event.target.closest ? event.target.closest("[data-vault-apply]") : null;
    var del = event.target.closest ? event.target.closest("[data-vault-delete]") : null;
    if (preview) { previewVaultAsset(preview.getAttribute("data-vault-preview")); return; }
    if (apply) { applyVaultMotion(apply.getAttribute("data-vault-apply")); return; }
    if (del) { deleteVaultMotion(del.getAttribute("data-vault-delete")); }
  });

  var SHAX_THEME_KEY = "shax.appearance.v2";

  function applyAppearance(theme, persist) {
    theme = theme === "light" ? "light" : "dark";
    document.body.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    qsa("[data-theme-value]").forEach(function (button) {
      var active = button.getAttribute("data-theme-value") === theme;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (persist !== false) {
      try { if (window.localStorage) window.localStorage.setItem(SHAX_THEME_KEY, theme); } catch (e) {}
    }
  }

  function initAppearance() {
    var saved = "dark";
    try {
      var stored = window.localStorage ? window.localStorage.getItem(SHAX_THEME_KEY) : null;
      if (stored === "light" || stored === "dark") saved = stored;
    } catch (e) {}
    applyAppearance(saved, false);
    qsa("[data-theme-value]").forEach(function (button) {
      button.addEventListener("click", function () {
        var next = button.getAttribute("data-theme-value");
        applyAppearance(next, true);
        setStatus(next === "light" ? "Light appearance enabled" : "Dark appearance enabled", "ok");
      });
    });
  }

  var helpPanel = qs("#shaxHelpPanel");
  function closeShaxHelp() { if (helpPanel) helpPanel.hidden = true; }
  qs("#settingsBtn").addEventListener("click", function () {
    helpPanel.hidden = !helpPanel.hidden;
    qs("#settingsBtn").setAttribute("aria-expanded", helpPanel.hidden ? "false" : "true");
  });
  qs("#shaxHelpClose").addEventListener("click", closeShaxHelp);
  document.addEventListener("keydown", function (event) {
    var active = document.activeElement;
    var typing = active && (/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable);
    if (event.key === "Escape") { closeShaxHelp(); hideMixEditor(); if (active && active.blur && typing) active.blur(); return; }
    if ((event.key === "/" || event.key === "f") && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      switchTab("animate");
      qs("#motionSearch").focus();
    }
  });
  document.addEventListener("click", function (event) {
    if (helpPanel && !helpPanel.hidden && !helpPanel.contains(event.target) && event.target !== qs("#settingsBtn")) closeShaxHelp();
  });
  qs("#aeConnectionLabel").textContent = window.__adobe_cep__ ? "AE" : "DEMO";

  updateResizeModeHelp();
  initAppearance();
  initBrandSystem();
  initCustomSelects();
  initMotionLibrary();
  // Preset and Vault previews are intentional motion surfaces; the chrome stays still.
  refreshSelection();
})();