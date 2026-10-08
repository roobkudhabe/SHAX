/* RoobKudhabe host bridge + v1.0 motion, sequence, deep recompose, and UI system for Adobe After Effects */

function roobKudhabe_layerType(layer) {
    try {
        if (layer instanceof TextLayer) return "Text";
        if (layer instanceof ShapeLayer) return "Shape";
        if (layer instanceof CameraLayer) return "Camera";
        if (layer instanceof LightLayer) return "Light";
        if (layer.nullLayer) return "Null";
        if (layer instanceof AVLayer) return "AV";
    } catch (e) {}
    return "Layer";
}

function roobKudhabe_clean(value) {
    var text = String(value);
    text = text.split("~~RK_LAYER~~").join(" ");
    text = text.split("~~RK_FIELD~~").join(" ");
    return text;
}

function roobKudhabe_resolveTargetComposition() {
    var project = app.project;
    if (!project) return null;

    try {
        var active = project.activeItem;
        if (active && active instanceof CompItem) {
            return { comp: active, source: "active" };
        }
    } catch (activeError) {}

    try {
        var selection = project.selection;
        if (selection && selection.length) {
            for (var i = 0; i < selection.length; i++) {
                if (selection[i] && selection[i] instanceof CompItem) {
                    return { comp: selection[i], source: "selection" };
                }
            }
        }
    } catch (selectionError) {}

    return null;
}

function roobKudhabe_getSelectedLayers() {
    var item = app.project ? app.project.activeItem : null;
    if (!(item && item instanceof CompItem)) return "NO_ACTIVE_COMP";

    var selected = item.selectedLayers;
    if (!selected || selected.length === 0) return "NO_SELECTION";

    var output = [];
    for (var i = 0; i < selected.length; i++) {
        var layer = selected[i];
        output.push(
            roobKudhabe_clean(layer.index) + "~~RK_FIELD~~" +
            roobKudhabe_clean(roobKudhabe_layerType(layer)) + "~~RK_FIELD~~" +
            roobKudhabe_clean(layer.name)
        );
    }
    return output.join("~~RK_LAYER~~");
}

function roobKudhabe_clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
}

function roobKudhabe_cloneValue(value) {
    if (value instanceof Array) {
        var copy = [];
        for (var i = 0; i < value.length; i++) copy.push(value[i]);
        return copy;
    }
    return value;
}

function roobKudhabe_scaleArray(value, factor) {
    var result = roobKudhabe_cloneValue(value);
    if (result instanceof Array) {
        for (var i = 0; i < result.length; i++) result[i] = result[i] * factor;
    }
    return result;
}

function roobKudhabe_keyIndexAtTime(prop, time) {
    try {
        if (!prop || prop.numKeys < 1) return -1;
        var index = prop.nearestKeyIndex(time);
        if (index >= 1 && Math.abs(prop.keyTime(index) - time) < 0.0001) return index;
    } catch (e) {}
    return -1;
}

function roobKudhabe_temporalDimensions(prop, time) {
    try {
        if (prop.isSpatial) return 1;
        var value = prop.valueAtTime(time, false);
        if (value instanceof Array) return value.length;
    } catch (e) {}
    return 1;
}

function roobKudhabe_applyEase(prop, time, inInfluence, outInfluence) {
    try {
        var index = roobKudhabe_keyIndexAtTime(prop, time);
        if (index < 1) return;

        var dimensions = roobKudhabe_temporalDimensions(prop, time);
        var easeIn = [];
        var easeOut = [];
        var inInf = roobKudhabe_clamp(inInfluence, 1, 100);
        var outInf = roobKudhabe_clamp(outInfluence, 1, 100);

        for (var i = 0; i < dimensions; i++) {
            easeIn.push(new KeyframeEase(0, inInf));
            easeOut.push(new KeyframeEase(0, outInf));
        }

        prop.setInterpolationTypeAtKey(index, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        prop.setTemporalEaseAtKey(index, easeIn, easeOut);
        if (prop.isSpatial) {
            try { prop.setSpatialAutoBezierAtKey(index, false); } catch (e1) {}
            try { prop.setSpatialContinuousAtKey(index, false); } catch (e2) {}
        }
    } catch (e) {}
}

function roobKudhabe_setKey(prop, time, value, inInfluence, outInfluence) {
    try {
        if (!prop || !prop.canVaryOverTime) return false;
        prop.setValueAtTime(time, value);
        roobKudhabe_applyEase(prop, time, inInfluence, outInfluence);
        return true;
    } catch (e) {
        return false;
    }
}

function roobKudhabe_styleConfig(style) {
    /* v2.8 recipes: Direction is only an orientation modifier for recipes that use position. */
    if (style === "smooth") style = "glide";
    if (style === "clean") style = "precision";
    if (style === "snappy") style = "snap";
    if (style === "soft") style = "float";
    if (style === "cinematic") style = "cinema";

    if (style === "silk") return { usePosition:true, move:84, movePortion:.95, fadePortion:.58, scaleText:.997, scaleShape:.988, scaleAV:1.008, rotateText:.10, rotateShape:.45, rotateAV:.12, outEase:66, inEase:96, settle:.018, decay:8.2, opacityStart:30 };
    if (style === "drop") return { usePosition:true, move:58, movePortion:.84, fadePortion:.48, scaleText:.992, scaleShape:.976, scaleAV:.992, rotateText:.16, rotateShape:.65, rotateAV:.18, outEase:74, inEase:94, settle:.022, decay:9.0, opacityStart:14 };
    if (style === "precision") return { usePosition:true, move:36, movePortion:.78, fadePortion:.42, scaleText:.996, scaleShape:.986, scaleAV:.996, rotateText:.08, rotateShape:.30, rotateAV:.10, outEase:82, inEase:94, settle:.018, decay:10.2, opacityStart:22 };
    if (style === "pop") return { usePosition:false, move:0, movePortion:.72, fadePortion:.38, scaleText:.925, scaleShape:.840, scaleAV:.900, rotateText:0, rotateShape:0, rotateAV:0, outEase:86, inEase:95, settle:.024, decay:10.8, opacityStart:4 };
    if (style === "microPop") return { usePosition:false, move:0, movePortion:.68, fadePortion:.34, scaleText:.965, scaleShape:.910, scaleAV:.945, rotateText:0, rotateShape:0, rotateAV:0, outEase:90, inEase:96, settle:.020, decay:11.4, opacityStart:8 };
    if (style === "precisionPop") return { usePosition:false, move:0, movePortion:.62, fadePortion:.30, scaleText:.982, scaleShape:.950, scaleAV:.972, rotateText:0, rotateShape:0, rotateAV:0, outEase:88, inEase:97, settle:.016, decay:12.0, opacityStart:16 };
    if (style === "focus") return { usePosition:false, move:0, movePortion:.82, fadePortion:.52, scaleText:1.035, scaleShape:1.075, scaleAV:1.065, rotateText:0, rotateShape:0, rotateAV:0, outEase:72, inEase:96, settle:.018, decay:8.6, opacityStart:20 };
    if (style === "zoomSoft") return { usePosition:false, move:0, movePortion:.94, fadePortion:.62, scaleText:1.018, scaleShape:1.050, scaleAV:1.078, rotateText:0, rotateShape:0, rotateAV:0, outEase:64, inEase:96, settle:.014, decay:7.6, opacityStart:34 };
    if (style === "depth") return { usePosition:true, fixedDirection:"up", move:18, movePortion:.92, fadePortion:.58, scaleText:1.018, scaleShape:1.050, scaleAV:1.065, rotateText:.08, rotateShape:.35, rotateAV:.10, outEase:68, inEase:95, settle:.016, decay:8.2, opacityStart:28 };
    if (style === "snap") return { usePosition:true, move:72, movePortion:.64, fadePortion:.30, scaleText:.987, scaleShape:.944, scaleAV:.972, rotateText:.35, rotateShape:1.45, rotateAV:.38, outEase:91, inEase:96, settle:.026, decay:11.2, opacityStart:0 };
    if (style === "panel") return { usePosition:true, move:108, movePortion:.80, fadePortion:.36, scaleText:.998, scaleShape:.987, scaleAV:.992, rotateText:.10, rotateShape:.42, rotateAV:.12, outEase:84, inEase:95, settle:.020, decay:10.0, opacityStart:10 };
    if (style === "float") return { usePosition:true, move:32, movePortion:.96, fadePortion:.64, scaleText:.997, scaleShape:.986, scaleAV:1.016, rotateText:.16, rotateShape:.58, rotateAV:.18, outEase:64, inEase:95, settle:.014, decay:7.2, opacityStart:34 };
    if (style === "drift") return { usePosition:true, move:58, movePortion:1.00, fadePortion:.66, scaleText:.998, scaleShape:.990, scaleAV:1.022, rotateText:.22, rotateShape:.82, rotateAV:.24, outEase:60, inEase:95, settle:.013, decay:7.0, opacityStart:38 };
    if (style === "tilt") return { usePosition:true, move:48, movePortion:.84, fadePortion:.46, scaleText:.990, scaleShape:.968, scaleAV:.985, rotateText:.75, rotateShape:3.10, rotateAV:1.15, outEase:82, inEase:95, settle:.022, decay:9.8, opacityStart:12 };
    if (style === "sweep") return { usePosition:true, move:132, movePortion:.68, fadePortion:.26, scaleText:.995, scaleShape:.970, scaleAV:.985, rotateText:.24, rotateShape:.90, rotateAV:.32, outEase:92, inEase:96, settle:.018, decay:12.0, opacityStart:0 };
    if (style === "impact") return { usePosition:false, move:0, movePortion:.60, fadePortion:.30, scaleText:.930, scaleShape:.865, scaleAV:.910, rotateText:.30, rotateShape:1.65, rotateAV:.44, outEase:92, inEase:97, settle:.024, decay:11.8, opacityStart:0 };
    if (style === "push") return { usePosition:false, move:0, movePortion:1.00, fadePortion:.68, scaleText:1.015, scaleShape:1.045, scaleAV:1.085, rotateText:0, rotateShape:0, rotateAV:0, outEase:60, inEase:96, settle:.012, decay:7.0, opacityStart:40 };
    if (style === "cinemaZoom") return { usePosition:false, move:0, movePortion:1.00, fadePortion:.72, scaleText:1.020, scaleShape:1.055, scaleAV:1.095, rotateText:0, rotateShape:.20, rotateAV:.10, outEase:58, inEase:96, settle:.010, decay:6.8, opacityStart:44 };
    if (style === "fade") return { usePosition:false, move:0, movePortion:.84, fadePortion:.86, scaleText:.998, scaleShape:.992, scaleAV:1.006, rotateText:0, rotateShape:0, rotateAV:0, outEase:72, inEase:94, settle:.010, decay:8.0, opacityStart:0 };
    if (style === "micro") return { usePosition:true, move:18, movePortion:.76, fadePortion:.48, scaleText:.998, scaleShape:.992, scaleAV:.997, rotateText:.04, rotateShape:.16, rotateAV:.05, outEase:78, inEase:94, settle:.012, decay:9.2, opacityStart:24 };
    if (style === "cinema") return { usePosition:true, move:34, movePortion:1.00, fadePortion:.72, scaleText:.998, scaleShape:.988, scaleAV:1.042, rotateText:.10, rotateShape:.40, rotateAV:.14, outEase:60, inEase:96, settle:.012, decay:7.4, opacityStart:40 };
    return { usePosition:true, move:58, movePortion:.86, fadePortion:.52, scaleText:.992, scaleShape:.972, scaleAV:1.014, rotateText:.24, rotateShape:.92, rotateAV:.28, outEase:80, inEase:94, settle:.020, decay:9.2, opacityStart:14 };
}

function roobKudhabe_getPositionValue(layer, time) {
    try {
        var transform = layer.property("ADBE Transform Group");
        if (!transform) return null;
        var position = transform.property("ADBE Position");
        if (!position) return null;
        if (position.dimensionsSeparated) {
            var x = position.getSeparationFollower(0).valueAtTime(time, false);
            var y = position.getSeparationFollower(1).valueAtTime(time, false);
            return [x, y];
        }
        return position.valueAtTime(time, false);
    } catch (e) {}
    return null;
}

function roobKudhabe_groupAutoDirection(selected, comp, time) {
    var totalX = 0;
    var totalY = 0;
    var count = 0;
    for (var i = 0; i < selected.length; i++) {
        var p = roobKudhabe_getPositionValue(selected[i], time);
        if (p instanceof Array && p.length >= 2) {
            totalX += p[0];
            totalY += p[1];
            count++;
        }
    }
    if (count < 1) return "up";
    var avgX = totalX / count;
    if (avgX < comp.width * 0.30) return "left";
    if (avgX > comp.width * 0.70) return "right";
    return "up";
}

function roobKudhabe_layerDistanceMultiplier(layer) {
    var type = roobKudhabe_layerType(layer);
    if (type === "Text") return 0.80;
    if (type === "AV") return 0.52;
    if (type === "Shape") return 0.72;
    if (type === "Null") return 0.56;
    return 0.66;
}

function roobKudhabe_startPosition(finalPosition, direction, distance) {
    var start = roobKudhabe_cloneValue(finalPosition);
    if (!(start instanceof Array) || start.length < 2) return start;
    if (direction === "left") start[0] -= distance;
    else if (direction === "right") start[0] += distance;
    else if (direction === "down") start[1] -= distance;
    else start[1] += distance;
    return start;
}

function roobKudhabe_animatePosition(transform, startTime, endTime, direction, distance, outEase, inEase) {
    var result = { changed: false, props: [] };
    var position = null;
    try { position = transform.property("ADBE Position"); } catch (e) {}
    if (!position) return result;

    try {
        if (position.dimensionsSeparated) {
            var xProp = position.getSeparationFollower(0);
            var yProp = position.getSeparationFollower(1);
            var xFinal = xProp.valueAtTime(startTime, false);
            var yFinal = yProp.valueAtTime(startTime, false);
            var xStart = xFinal;
            var yStart = yFinal;
            if (direction === "left") xStart -= distance;
            else if (direction === "right") xStart += distance;
            else if (direction === "down") yStart -= distance;
            else yStart += distance;

            var changed = false;
            changed = roobKudhabe_setKey(xProp, startTime, xStart, 18, outEase) || changed;
            changed = roobKudhabe_setKey(yProp, startTime, yStart, 18, outEase) || changed;
            changed = roobKudhabe_setKey(xProp, endTime, xFinal, inEase, 18) || changed;
            changed = roobKudhabe_setKey(yProp, endTime, yFinal, inEase, 18) || changed;
            result.changed = changed;
            result.props.push(xProp);
            result.props.push(yProp);
            return result;
        }

        var finalPosition = position.valueAtTime(startTime, false);
        var startPosition = roobKudhabe_startPosition(finalPosition, direction, distance);
        var didChange = false;
        didChange = roobKudhabe_setKey(position, startTime, startPosition, 18, outEase) || didChange;
        didChange = roobKudhabe_setKey(position, endTime, finalPosition, inEase, 18) || didChange;
        result.changed = didChange;
        result.props.push(position);
        return result;
    } catch (e2) {
        return result;
    }
}

function roobKudhabe_scaleFactorForLayer(layer, config, energyFactor) {
    var type = roobKudhabe_layerType(layer);
    var base = 1.0;
    if (type === "Text") base = config.scaleText;
    else if (type === "Shape") base = config.scaleShape;
    else if (type === "AV") base = config.scaleAV;
    else return 1.0;
    return 1 + ((base - 1) * energyFactor);
}

function roobKudhabe_animateScale(transform, layer, startTime, endTime, config, energyFactor) {
    var result = { changed: false, prop: null };
    var scale = null;
    try { scale = transform.property("ADBE Scale"); } catch (e) {}
    if (!scale) return result;

    try {
        var factor = roobKudhabe_scaleFactorForLayer(layer, config, energyFactor);
        if (Math.abs(factor - 1.0) < 0.0005) return result;
        var finalScale = scale.valueAtTime(startTime, false);
        var startScale = roobKudhabe_scaleArray(finalScale, factor);
        var changed = roobKudhabe_setKey(scale, startTime, startScale, 18, config.outEase);
        changed = roobKudhabe_setKey(scale, endTime, finalScale, config.inEase, 18) || changed;
        result.changed = changed;
        result.prop = scale;
        return result;
    } catch (e2) {
        return result;
    }
}

function roobKudhabe_rotationAmountForLayer(layer, config, energyFactor, direction) {
    var type = roobKudhabe_layerType(layer);
    var amount = 0;
    if (type === "Text") amount = config.rotateText;
    else if (type === "Shape") amount = config.rotateShape;
    else if (type === "AV") amount = config.rotateAV;
    else return 0;
    amount = amount * energyFactor;
    if (direction === "right") amount *= -1;
    if (direction === "up" && (layer.index % 2 === 0)) amount *= -1;
    return amount;
}

function roobKudhabe_rotationProperty(transform, layer) {
    var rotation = null;
    try {
        if (layer.threeDLayer) rotation = transform.property("ADBE Rotate Z");
        if (!rotation) rotation = transform.property("ADBE Rotation");
    } catch (e) {}
    return rotation;
}

function roobKudhabe_animateRotation(transform, layer, startTime, endTime, config, energyFactor, direction) {
    var result = { changed: false, prop: null };
    var rotation = roobKudhabe_rotationProperty(transform, layer);
    if (!rotation) return result;
    try {
        var amount = roobKudhabe_rotationAmountForLayer(layer, config, energyFactor, direction);
        if (Math.abs(amount) < 0.02) return result;
        var finalRotation = rotation.valueAtTime(startTime, false);
        var startRotation = finalRotation + amount;
        var changed = roobKudhabe_setKey(rotation, startTime, startRotation, 18, config.outEase);
        changed = roobKudhabe_setKey(rotation, endTime, finalRotation, config.inEase, 18) || changed;
        result.changed = changed;
        result.prop = rotation;
        return result;
    } catch (e) {
        return result;
    }
}

function roobKudhabe_animateOpacity(transform, startTime, fadeEndTime, startOpacity, inEase) {
    var result = { changed: false, prop: null };
    var opacity = null;
    try { opacity = transform.property("ADBE Opacity"); } catch (e) {}
    if (!opacity) return result;

    try {
        var finalOpacity = opacity.valueAtTime(startTime, false);
        var begin = Math.min(finalOpacity, Math.max(0, startOpacity));
        var changed = roobKudhabe_setKey(opacity, startTime, begin, 18, 78);
        changed = roobKudhabe_setKey(opacity, fadeEndTime, finalOpacity, inEase, 18) || changed;
        result.changed = changed;
        result.prop = opacity;
        return result;
    } catch (e2) {
        return result;
    }
}

function roobKudhabe_expressionIsSafe(prop) {
    try {
        if (!prop || !prop.canSetExpression) return false;
        var existing = String(prop.expression || "");
        if (existing === "") return true;
        if (existing.indexOf("// SHAX UI Settle") === 0) return true;
    } catch (e) {}
    return false;
}

function roobKudhabe_applyUISettleExpression(prop, strength, decay) {
    if (!roobKudhabe_expressionIsSafe(prop)) return false;
    try {
        strength = roobKudhabe_clamp(Number(strength), 0.005, 0.08);
        decay = roobKudhabe_clamp(Number(decay), 5.0, 14.0);
        var expression =
            "// SHAX UI Settle v1\n" +
            "var rkStrength = " + strength.toFixed(4) + ";\n" +
            "var rkDecay = " + decay.toFixed(3) + ";\n" +
            "if (numKeys < 2) {\n" +
            "  value;\n" +
            "} else {\n" +
            "  var rkN = numKeys;\n" +
            "  var rkT = time - key(rkN).time;\n" +
            "  if (rkT > 0 && rkT < 0.75) {\n" +
            "    var rkSample = Math.max(0.001, thisComp.frameDuration / 4);\n" +
            "    var rkV = velocityAtTime(key(rkN).time - rkSample);\n" +
            "    value + rkV * rkStrength * rkT * Math.exp(-rkDecay * rkT);\n" +
            "  } else {\n" +
            "    value;\n" +
            "  }\n" +
            "}";
        prop.expression = expression;
        prop.expressionEnabled = true;
        return true;
    } catch (e) {
        return false;
    }
}

function roobKudhabe_enableMotionBlur(layer, comp, enabled) {
    if (!enabled) return;
    try { layer.motionBlur = true; } catch (e1) {}
    try { comp.motionBlur = true; } catch (e2) {}
}

function roobKudhabe_generateMotion(style, energy, direction, stagger, duration, transformMix, expressionPolish, motionBlur) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";

    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) return "NO_SELECTION";

    duration = Number(duration);
    energy = Number(energy);
    stagger = Number(stagger);
    transformMix = String(transformMix) === "true";
    expressionPolish = String(expressionPolish) === "true";
    motionBlur = String(motionBlur) === "true";

    if (!isFinite(duration) || duration < 0.2) return "ERROR~~RK_FIELD~~Invalid duration";
    if (!isFinite(energy)) energy = 55;
    if (!isFinite(stagger)) stagger = 25;

    energy = roobKudhabe_clamp(energy, 0, 100);
    stagger = roobKudhabe_clamp(stagger, 0, 100);

    var config = roobKudhabe_styleConfig(style);
    var energyFactor = 0.50 + ((energy / 100) * 0.72);
    var maxDelay = Math.min(0.16, duration * 0.22);
    var layerDelay = maxDelay * (stagger / 100);
    var baseTime = comp.time;
    var resolvedDirection = direction === "auto" ? roobKudhabe_groupAutoDirection(selected, comp, baseTime) : direction;
    if (config.fixedDirection) resolvedDirection = config.fixedDirection;
    var animated = 0;
    var skipped = 0;

    app.beginUndoGroup("SHAX - UI Motion");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!layer || layer.locked) {
                skipped++;
                continue;
            }

            var layerType = roobKudhabe_layerType(layer);
            if (layerType === "Camera" || layerType === "Light") {
                skipped++;
                continue;
            }

            var startTime = baseTime + (i * layerDelay);
            if (startTime < layer.inPoint) startTime = layer.inPoint;

            var fullEndTime = startTime + duration;
            if (layer.outPoint > layer.inPoint && fullEndTime > layer.outPoint) fullEndTime = layer.outPoint - 0.001;
            if (fullEndTime <= startTime + 0.01) {
                skipped++;
                continue;
            }

            var transform = null;
            try { transform = layer.property("ADBE Transform Group"); } catch (transformError) {}
            if (!transform) {
                skipped++;
                continue;
            }

            var actualDuration = fullEndTime - startTime;
            var motionEndTime = startTime + (actualDuration * config.movePortion);
            var fadeEndTime = startTime + (actualDuration * config.fadePortion);
            var distance = config.move * roobKudhabe_layerDistanceMultiplier(layer) * energyFactor;
            var changed = false;
            var polishProps = [];

            if (config.usePosition !== false && distance > 0.001) {
                var positionResult = roobKudhabe_animatePosition(transform, startTime, motionEndTime, resolvedDirection, distance, config.outEase, config.inEase);
                if (positionResult.changed) changed = true;
                for (var pp = 0; pp < positionResult.props.length; pp++) polishProps.push(positionResult.props[pp]);
            }

            if (transformMix) {
                var scaleResult = roobKudhabe_animateScale(transform, layer, startTime, motionEndTime, config, energyFactor);
                if (scaleResult.changed) changed = true;
                if (scaleResult.prop) polishProps.push(scaleResult.prop);

                var rotationResult = roobKudhabe_animateRotation(transform, layer, startTime, motionEndTime, config, energyFactor, resolvedDirection);
                if (rotationResult.changed) changed = true;
                if (rotationResult.prop) polishProps.push(rotationResult.prop);
            }

            var opacityStart = config.opacityStart;
            if (layerType === "AV") opacityStart = Math.max(opacityStart, 28);
            var opacityResult = roobKudhabe_animateOpacity(transform, startTime, fadeEndTime, opacityStart, config.inEase);
            if (opacityResult.changed) changed = true;

            if (expressionPolish) {
                for (var ep = 0; ep < polishProps.length; ep++) {
                    roobKudhabe_applyUISettleExpression(polishProps[ep], config.settle, config.decay);
                }
            }

            if (changed) {
                roobKudhabe_enableMotionBlur(layer, comp, motionBlur);
                animated++;
            } else {
                skipped++;
            }
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();

    return "OK~~RK_FIELD~~" + animated + "~~RK_FIELD~~" + skipped;
}

/* -------------------------------------------------------------------------
   RoobKudhabe Step 3 - Sequence Engine
   Retimes the first Position / Scale / Rotation / Opacity animation block at or after
   the playhead. Internal keyframe spacing and easing are preserved.
   ------------------------------------------------------------------------- */

function roobKudhabe_sequenceProperties(layer) {
    var props = [];
    try {
        var transform = layer.property("ADBE Transform Group");
        if (!transform) return props;

        var position = transform.property("ADBE Position");
        if (position) {
            if (position.dimensionsSeparated) {
                try { props.push(position.getSeparationFollower(0)); } catch (e1) {}
                try { props.push(position.getSeparationFollower(1)); } catch (e2) {}
                try { if (layer.threeDLayer) props.push(position.getSeparationFollower(2)); } catch (e3) {}
            } else {
                props.push(position);
            }
        }

        var scale = transform.property("ADBE Scale");
        var rotation = null;
        try { rotation = layer.threeDLayer ? transform.property("ADBE Rotate Z") : transform.property("ADBE Rotation"); } catch (e4) {}
        var opacity = transform.property("ADBE Opacity");
        if (scale) props.push(scale);
        if (rotation) props.push(rotation);
        if (opacity) props.push(opacity);
    } catch (e) {}
    return props;
}

function roobKudhabe_numberSort(a, b) {
    return a - b;
}

function roobKudhabe_pushUniqueTime(times, value) {
    var tolerance = 0.0001;
    for (var i = 0; i < times.length; i++) {
        if (Math.abs(times[i] - value) < tolerance) return;
    }
    times.push(value);
}

function roobKudhabe_findMotionBlock(layer, baseTime) {
    var props = roobKudhabe_sequenceProperties(layer);
    if (!props || props.length === 0) return null;

    var times = [];
    var searchStart = baseTime - 0.035;
    var searchEnd = baseTime + 8.0;

    for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop || prop.numKeys < 1) continue;
        for (var k = 1; k <= prop.numKeys; k++) {
            var kt = prop.keyTime(k);
            if (kt >= searchStart && kt <= searchEnd) {
                roobKudhabe_pushUniqueTime(times, kt);
            }
        }
    }

    if (times.length === 0) return null;
    times.sort(roobKudhabe_numberSort);

    var start = times[0];
    var end = start;
    var previous = start;
    var maxClusterGap = 3.0;

    for (var i = 1; i < times.length; i++) {
        var current = times[i];
        if ((current - previous) > maxClusterGap) break;
        end = current;
        previous = current;
    }

    if (end <= start) {
        end = start + 0.001;
    }

    return {
        start: start,
        end: end,
        span: Math.max(0.001, end - start),
        props: props
    };
}

function roobKudhabe_captureEaseArray(eases) {
    var out = [];
    if (!eases) return out;
    for (var i = 0; i < eases.length; i++) {
        try {
            out.push(new KeyframeEase(eases[i].speed, eases[i].influence));
        } catch (e) {}
    }
    return out;
}

function roobKudhabe_captureKey(prop, index) {
    var key = {
        time: prop.keyTime(index),
        value: roobKudhabe_cloneValue(prop.keyValue(index)),
        inInterpolation: null,
        outInterpolation: null,
        inEase: [],
        outEase: [],
        temporalAutoBezier: false,
        temporalContinuous: false,
        spatial: false,
        inSpatialTangent: null,
        outSpatialTangent: null,
        spatialAutoBezier: false,
        spatialContinuous: false,
        roving: false
    };

    try { key.inInterpolation = prop.keyInInterpolationType(index); } catch (e1) {}
    try { key.outInterpolation = prop.keyOutInterpolationType(index); } catch (e2) {}
    try { key.inEase = roobKudhabe_captureEaseArray(prop.keyInTemporalEase(index)); } catch (e3) {}
    try { key.outEase = roobKudhabe_captureEaseArray(prop.keyOutTemporalEase(index)); } catch (e4) {}
    try { key.temporalAutoBezier = prop.keyTemporalAutoBezier(index); } catch (e5) {}
    try { key.temporalContinuous = prop.keyTemporalContinuous(index); } catch (e6) {}

    try {
        key.spatial = prop.isSpatial === true;
        if (key.spatial) {
            key.inSpatialTangent = roobKudhabe_cloneValue(prop.keyInSpatialTangent(index));
            key.outSpatialTangent = roobKudhabe_cloneValue(prop.keyOutSpatialTangent(index));
            key.spatialAutoBezier = prop.keySpatialAutoBezier(index);
            key.spatialContinuous = prop.keySpatialContinuous(index);
            try { key.roving = prop.keyRoving(index); } catch (e7) {}
        }
    } catch (e8) {}

    return key;
}

function roobKudhabe_restoreKey(prop, key, newTime) {
    try {
        prop.setValueAtTime(newTime, key.value);
        var index = roobKudhabe_keyIndexAtTime(prop, newTime);
        if (index < 1) return false;

        if (key.inInterpolation !== null && key.outInterpolation !== null) {
            try { prop.setInterpolationTypeAtKey(index, key.inInterpolation, key.outInterpolation); } catch (e1) {}
        }
        if (key.inEase.length > 0 && key.outEase.length > 0) {
            try { prop.setTemporalEaseAtKey(index, key.inEase, key.outEase); } catch (e2) {}
        }
        try { prop.setTemporalAutoBezierAtKey(index, key.temporalAutoBezier); } catch (e3) {}
        try { prop.setTemporalContinuousAtKey(index, key.temporalContinuous); } catch (e4) {}

        if (key.spatial) {
            if (key.inSpatialTangent !== null && key.outSpatialTangent !== null) {
                try { prop.setSpatialTangentsAtKey(index, key.inSpatialTangent, key.outSpatialTangent); } catch (e5) {}
            }
            try { prop.setSpatialAutoBezierAtKey(index, key.spatialAutoBezier); } catch (e6) {}
            try { prop.setSpatialContinuousAtKey(index, key.spatialContinuous); } catch (e7) {}
            try { prop.setRovingAtKey(index, key.roving); } catch (e8) {}
        }
        return true;
    } catch (e) {
        return false;
    }
}

function roobKudhabe_movePropertyKeys(prop, blockStart, blockEnd, delta) {
    if (!prop || prop.numKeys < 1 || Math.abs(delta) < 0.00001) return 0;

    var tolerance = 0.0005;
    var captured = [];
    var removeIndexes = [];

    for (var k = 1; k <= prop.numKeys; k++) {
        var kt = prop.keyTime(k);
        if (kt >= (blockStart - tolerance) && kt <= (blockEnd + tolerance)) {
            captured.push(roobKudhabe_captureKey(prop, k));
            removeIndexes.push(k);
        }
    }

    if (captured.length === 0) return 0;

    for (var r = removeIndexes.length - 1; r >= 0; r--) {
        try { prop.removeKey(removeIndexes[r]); } catch (e1) {}
    }

    var restored = 0;
    for (var i = 0; i < captured.length; i++) {
        if (roobKudhabe_restoreKey(prop, captured[i], captured[i].time + delta)) restored++;
    }
    return restored;
}

function roobKudhabe_moveMotionBlock(layer, block, desiredStart) {
    var delta = desiredStart - block.start;
    if (Math.abs(delta) < 0.00001) return true;

    var minDelta = layer.inPoint - block.start;
    var maxDelta = (layer.outPoint - 0.001) - block.end;
    if (delta < minDelta) delta = minDelta;
    if (delta > maxDelta) delta = maxDelta;

    var movedKeys = 0;
    for (var p = 0; p < block.props.length; p++) {
        movedKeys += roobKudhabe_movePropertyKeys(block.props[p], block.start, block.end, delta);
    }
    return movedKeys > 0;
}

function roobKudhabe_sequencePoint(layer, time) {
    var p = roobKudhabe_getPositionValue(layer, time);
    if (p instanceof Array && p.length >= 2) {
        return { x: Number(p[0]), y: Number(p[1]) };
    }
    return { x: 0, y: Number(layer.index) };
}

function roobKudhabe_copySelectedLayers(selected) {
    var layers = [];
    for (var i = 0; i < selected.length; i++) layers.push(selected[i]);
    return layers;
}

function roobKudhabe_findSelectedByIndex(selected, indexValue) {
    for (var i = 0; i < selected.length; i++) {
        if (selected[i].index === indexValue) return selected[i];
    }
    return null;
}

function roobKudhabe_customSequenceOrder(selected, customIndices) {
    var result = [];
    var used = {};
    var parts = String(customIndices || "").split(",");

    for (var i = 0; i < parts.length; i++) {
        var idx = parseInt(parts[i], 10);
        if (!isFinite(idx)) continue;
        var layer = roobKudhabe_findSelectedByIndex(selected, idx);
        if (layer) {
            result.push(layer);
            used[String(idx)] = true;
        }
    }

    for (var j = 0; j < selected.length; j++) {
        if (!used[String(selected[j].index)]) result.push(selected[j]);
    }
    return result;
}

function roobKudhabe_resolveSequenceOrder(selected, mode, comp, time, customIndices) {
    var layers;
    if (mode === "custom") {
        layers = roobKudhabe_customSequenceOrder(selected, customIndices);
        return layers;
    }

    layers = roobKudhabe_copySelectedLayers(selected);

    if (mode === "stack") {
        layers.sort(function (a, b) { return a.index - b.index; });
        return layers;
    }

    if (mode === "top" || mode === "bottom") {
        layers.sort(function (a, b) {
            var pa = roobKudhabe_sequencePoint(a, time);
            var pb = roobKudhabe_sequencePoint(b, time);
            if (Math.abs(pa.y - pb.y) < 0.5) return a.index - b.index;
            return mode === "bottom" ? (pb.y - pa.y) : (pa.y - pb.y);
        });
        return layers;
    }

    /* Smart Layout: reading order. Resolve rows by Y, then left-to-right by X. */
    var rowTolerance = Math.max(18, comp.height * 0.055);
    layers.sort(function (a, b) {
        var pa = roobKudhabe_sequencePoint(a, time);
        var pb = roobKudhabe_sequencePoint(b, time);
        var dy = pa.y - pb.y;
        if (Math.abs(dy) > rowTolerance) return dy;
        var dx = pa.x - pb.x;
        if (Math.abs(dx) > 0.5) return dx;
        return a.index - b.index;
    });
    return layers;
}

function roobKudhabe_reverseArray(items) {
    var out = [];
    for (var i = items.length - 1; i >= 0; i--) out.push(items[i]);
    return out;
}

function roobKudhabe_sequenceNoise(seed) {
    var value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    value = value - Math.floor(value);
    return (value * 2.0) - 1.0;
}

function roobKudhabe_applySequence(orderMode, reverseOrder, minimumGap, overlap, naturalOffset, customIndices) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";

    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) return "NO_SELECTION";

    reverseOrder = String(reverseOrder) === "true";
    minimumGap = Number(minimumGap);
    overlap = Number(overlap);
    naturalOffset = Number(naturalOffset);

    if (!isFinite(minimumGap) || minimumGap < 0) minimumGap = 0.04;
    if (!isFinite(overlap)) overlap = 72;
    if (!isFinite(naturalOffset)) naturalOffset = 0;

    minimumGap = roobKudhabe_clamp(minimumGap, 0, 2.0);
    overlap = roobKudhabe_clamp(overlap, 0, 95);
    naturalOffset = roobKudhabe_clamp(naturalOffset, 0, 20);

    var baseTime = comp.time;
    var ordered = roobKudhabe_resolveSequenceOrder(selected, orderMode, comp, baseTime, customIndices);
    if (reverseOrder) ordered = roobKudhabe_reverseArray(ordered);

    var blocks = [];
    var validLayers = [];
    var skipped = 0;

    for (var i = 0; i < ordered.length; i++) {
        var layer = ordered[i];
        if (!layer || layer.locked) {
            skipped++;
            continue;
        }
        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light") {
            skipped++;
            continue;
        }
        var block = roobKudhabe_findMotionBlock(layer, baseTime);
        if (!block) {
            skipped++;
            continue;
        }
        validLayers.push(layer);
        blocks.push(block);
    }

    if (validLayers.length === 0) {
        return "ERROR~~RK_FIELD~~No transform animation found at or after the playhead";
    }

    var moved = 0;
    var previousStart = baseTime;
    var previousSpan = blocks[0].span;

    app.beginUndoGroup("SHAX - Apply Sequence");
    try {
        for (var n = 0; n < validLayers.length; n++) {
            var desiredStart;
            if (n === 0) {
                desiredStart = baseTime;
            } else {
                var overlapFactor = 1.0 - (overlap / 100.0);
                var step = (previousSpan * overlapFactor) + minimumGap;
                var noise = roobKudhabe_sequenceNoise(validLayers[n].index + (n * 17));
                var jitter = step * (naturalOffset / 100.0) * noise;
                desiredStart = previousStart + Math.max(0.001, step + jitter);
            }

            if (roobKudhabe_moveMotionBlock(validLayers[n], blocks[n], desiredStart)) moved++;
            else if (Math.abs(desiredStart - blocks[n].start) < 0.00001) moved++;
            else skipped++;

            previousStart = desiredStart;
            previousSpan = blocks[n].span;
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();

    return "OK~~RK_FIELD~~" + moved + "~~RK_FIELD~~" + skipped;
}


/* RoobKudhabe v0.9 - Responsive Smart Reflow + legacy resize modes */
function roobKudhabe_getActiveCompInfo() {
    var resolved = roobKudhabe_resolveTargetComposition();
    if (!resolved || !resolved.comp) return "NO_ACTIVE_COMP";
    var comp = resolved.comp;
    var selectedCount = 0;
    try { selectedCount = comp.selectedLayers ? comp.selectedLayers.length : 0; } catch (e) {}
    return "OK~~RK_FIELD~~" + roobKudhabe_clean(comp.name) +
        "~~RK_FIELD~~" + comp.width +
        "~~RK_FIELD~~" + comp.height +
        "~~RK_FIELD~~" + comp.numLayers +
        "~~RK_FIELD~~" + selectedCount +
        "~~RK_FIELD~~" + resolved.source;
}

function roobKudhabe_resizeClamp(value, minValue, maxValue) {
    if (value < minValue) return minValue;
    if (value > maxValue) return maxValue;
    return value;
}

function roobKudhabe_mapCanvasPoint(point, oldW, oldH, newW, newH, mode, safeArea) {
    var x = Number(point[0]);
    var y = Number(point[1]);
    var z = point.length > 2 ? Number(point[2]) : null;
    var nx, ny;

    if (mode === "center") {
        nx = x + ((newW - oldW) / 2.0);
        ny = y + ((newH - oldH) / 2.0);
    } else if (mode === "proportional") {
        var factor = Math.min(newW / oldW, newH / oldH);
        nx = (newW / 2.0) + ((x - (oldW / 2.0)) * factor);
        ny = (newH / 2.0) + ((y - (oldH / 2.0)) * factor);
    } else {
        nx = oldW > 0 ? (x / oldW) * newW : x;
        ny = oldH > 0 ? (y / oldH) * newH : y;
    }

    if (safeArea) {
        var marginX = newW * 0.06;
        var marginY = newH * 0.06;
        nx = roobKudhabe_resizeClamp(nx, marginX, newW - marginX);
        ny = roobKudhabe_resizeClamp(ny, marginY, newH - marginY);
    }

    if (z !== null && isFinite(z)) return [nx, ny, z];
    return [nx, ny];
}

function roobKudhabe_addPositionDelta(value, dx, dy) {
    if (!(value instanceof Array)) return value;
    var out = roobKudhabe_cloneValue(value);
    if (out.length > 0) out[0] = Number(out[0]) + dx;
    if (out.length > 1) out[1] = Number(out[1]) + dy;
    return out;
}

function roobKudhabe_shiftScalarProperty(prop, delta) {
    if (!prop || Math.abs(delta) < 0.00001) return true;
    try {
        if (prop.numKeys > 0) {
            for (var i = 1; i <= prop.numKeys; i++) prop.setValueAtKey(i, Number(prop.keyValue(i)) + delta);
        } else {
            prop.setValue(Number(prop.value) + delta);
        }
        return true;
    } catch (e) {
        return false;
    }
}

function roobKudhabe_shiftLayerPosition(layer, dx, dy) {
    if (Math.abs(dx) < 0.00001 && Math.abs(dy) < 0.00001) return true;
    var transform = null;
    var position = null;
    try {
        transform = layer.property("ADBE Transform Group");
        position = transform ? transform.property("ADBE Position") : null;
    } catch (e) {}
    if (!position) return false;

    try {
        if (position.dimensionsSeparated) {
            var xProp = position.getSeparationFollower(0);
            var yProp = position.getSeparationFollower(1);
            var okX = roobKudhabe_shiftScalarProperty(xProp, dx);            var okY = roobKudhabe_shiftScalarProperty(yProp, dy);
            return okX || okY;
        }
        if (position.numKeys > 0) {
            for (var i = 1; i <= position.numKeys; i++) {
                position.setValueAtKey(i, roobKudhabe_addPositionDelta(position.keyValue(i), dx, dy));
            }
        } else {
            position.setValue(roobKudhabe_addPositionDelta(position.value, dx, dy));
        }
        return true;
    } catch (e2) { return false; }
}

function roobKudhabe_remapScalarProperty(prop, oldSize, newSize, oldCenter, newCenter, mode, safeArea) {
    if (!prop) return false;
    function mapValue(v) {
        var nv;
        if (mode === "center") nv = Number(v) + (newCenter - oldCenter);
        else if (mode === "proportional") {
            var factor = newSize / oldSize;
            nv = newCenter + ((Number(v) - oldCenter) * factor);
        } else nv = oldSize > 0 ? (Number(v) / oldSize) * newSize : Number(v);
        if (safeArea) {
            var margin = newSize * 0.06;
            nv = roobKudhabe_resizeClamp(nv, margin, newSize - margin);
        }
        return nv;
    }
    try {
        if (prop.numKeys > 0) {
            for (var i = 1; i <= prop.numKeys; i++) prop.setValueAtKey(i, mapValue(prop.keyValue(i)));
        } else prop.setValue(mapValue(prop.value));
        return true;
    } catch (e) { return false; }
}

function roobKudhabe_recomposePosition(layer, oldW, oldH, newW, newH, mode, preserveMotion, safeArea, referenceTime) {
    var transform = null;
    var position = null;
    try {
        transform = layer.property("ADBE Transform Group");
        position = transform ? transform.property("ADBE Position") : null;
    } catch (e) {}
    if (!position) return false;

    try {
        if (position.dimensionsSeparated) {
            var xProp = position.getSeparationFollower(0);
            var yProp = position.getSeparationFollower(1);
            var oldX = Number(xProp.valueAtTime(referenceTime, false));
            var oldY = Number(yProp.valueAtTime(referenceTime, false));
            var mapped = roobKudhabe_mapCanvasPoint([oldX, oldY], oldW, oldH, newW, newH, mode, safeArea);
            if (preserveMotion) {
                var okX = roobKudhabe_shiftScalarProperty(xProp, mapped[0] - oldX);
                var okY = roobKudhabe_shiftScalarProperty(yProp, mapped[1] - oldY);
                return okX || okY;
            }
            var rx = roobKudhabe_remapScalarProperty(xProp, oldW, newW, oldW / 2.0, newW / 2.0, mode, safeArea);
            var ry = roobKudhabe_remapScalarProperty(yProp, oldH, newH, oldH / 2.0, newH / 2.0, mode, safeArea);
            return rx || ry;
        }

        var reference = position.valueAtTime(referenceTime, false);
        if (!(reference instanceof Array) || reference.length < 2) return false;
        var target = roobKudhabe_mapCanvasPoint(reference, oldW, oldH, newW, newH, mode, safeArea);

        if (preserveMotion) {
            var dx = target[0] - Number(reference[0]);
            var dy = target[1] - Number(reference[1]);
            return roobKudhabe_shiftLayerPosition(layer, dx, dy);
        }

        if (position.numKeys > 0) {
            for (var k = 1; k <= position.numKeys; k++) {
                var kv = position.keyValue(k);
                position.setValueAtKey(k, roobKudhabe_mapCanvasPoint(kv, oldW, oldH, newW, newH, mode, safeArea));
            }
        } else {
            position.setValue(roobKudhabe_mapCanvasPoint(position.value, oldW, oldH, newW, newH, mode, safeArea));
        }
        return true;
    } catch (e2) { return false; }
}

function roobKudhabe_adaptLayerScale(layer, factor) {
    if (!isFinite(factor) || Math.abs(factor - 1.0) < 0.0001) return true;
    var scale = null;
    try {
        var transform = layer.property("ADBE Transform Group");
        scale = transform ? transform.property("ADBE Scale") : null;
    } catch (e) {}
    if (!scale) return false;

    function multiply(value) {
        if (!(value instanceof Array)) return value;
        var out = roobKudhabe_cloneValue(value);
        for (var i = 0; i < out.length; i++) out[i] = Number(out[i]) * factor;
        return out;
    }

    try {
        if (scale.numKeys > 0) {
            for (var k = 1; k <= scale.numKeys; k++) scale.setValueAtKey(k, multiply(scale.keyValue(k)));
        } else scale.setValue(multiply(scale.value));
        return true;
    } catch (e2) { return false; }
}

function roobKudhabe_selectedIndexMap(comp) {
    var map = {};
    try {
        var selected = comp.selectedLayers;
        for (var i = 0; i < selected.length; i++) map[String(selected[i].index)] = true;
    } catch (e) {}
    return map;
}

function roobKudhabe_positionAtTime(layer, referenceTime) {
    try {
        var transform = layer.property("ADBE Transform Group");
        var position = transform ? transform.property("ADBE Position") : null;
        if (!position) return null;
        if (position.dimensionsSeparated) {
            var x = Number(position.getSeparationFollower(0).valueAtTime(referenceTime, false));
            var y = Number(position.getSeparationFollower(1).valueAtTime(referenceTime, false));
            var z = null;
            try { z = Number(position.getSeparationFollower(2).valueAtTime(referenceTime, false)); } catch (zError) {}
            if (z !== null && isFinite(z)) return [x, y, z];
            return [x, y];
        }
        var value = position.valueAtTime(referenceTime, false);
        return value instanceof Array ? roobKudhabe_cloneValue(value) : null;
    } catch (e) { return null; }
}

function roobKudhabe_layerVisualBounds(layer, referenceTime) {
    try {
        if (!layer || !layer.enabled) return null;
        if (layer.parent !== null) return null;
        if (layer.threeDLayer) return null;

        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light" || type === "Null") return null;

        var transform = layer.property("ADBE Transform Group");
        if (!transform) return null;
        var position = roobKudhabe_positionAtTime(layer, referenceTime);
        if (!position || position.length < 2) return null;

        var anchorProp = transform.property("ADBE Anchor Point");
        var scaleProp = transform.property("ADBE Scale");
        var rotationProp = transform.property("ADBE Rotate Z");
        var anchor = anchorProp ? anchorProp.valueAtTime(referenceTime, false) : [0, 0];
        var scale = scaleProp ? scaleProp.valueAtTime(referenceTime, false) : [100, 100];
        var rotation = rotationProp ? Number(rotationProp.valueAtTime(referenceTime, false)) : 0;

        var rect = null;
        try { rect = layer.sourceRectAtTime(referenceTime, false); } catch (rectError) {}

        var left = 0;
        var top = 0;
        var width = 0;
        var height = 0;
        if (rect && isFinite(rect.width) && isFinite(rect.height) && rect.width > 0 && rect.height > 0) {
            left = Number(rect.left);
            top = Number(rect.top);
            width = Number(rect.width);
            height = Number(rect.height);
        } else {
            try { width = Number(layer.width); } catch (widthError) { width = 0; }
            try { height = Number(layer.height); } catch (heightError) { height = 0; }
            if (!(width > 0 && height > 0)) return null;
        }

        var ax = anchor instanceof Array && anchor.length > 0 ? Number(anchor[0]) : 0;
        var ay = anchor instanceof Array && anchor.length > 1 ? Number(anchor[1]) : 0;
        var sx = scale instanceof Array && scale.length > 0 ? Number(scale[0]) / 100.0 : 1.0;
        var sy = scale instanceof Array && scale.length > 1 ? Number(scale[1]) / 100.0 : sx;
        var rad = rotation * Math.PI / 180.0;
        var cosR = Math.cos(rad);
        var sinR = Math.sin(rad);
        var px = Number(position[0]);
        var py = Number(position[1]);

        var corners = [
            [left, top],
            [left + width, top],
            [left + width, top + height],
            [left, top + height]
        ];
        var minX = 999999999;
        var minY = 999999999;
        var maxX = -999999999;
        var maxY = -999999999;

        for (var c = 0; c < corners.length; c++) {
            var lx = (corners[c][0] - ax) * sx;
            var ly = (corners[c][1] - ay) * sy;
            var rx = (lx * cosR) - (ly * sinR) + px;
            var ry = (lx * sinR) + (ly * cosR) + py;
            if (rx < minX) minX = rx;
            if (rx > maxX) maxX = rx;
            if (ry < minY) minY = ry;
            if (ry > maxY) maxY = ry;
        }

        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    } catch (e) { return null; }
}

function roobKudhabe_boundsWidth(bounds) { return Math.max(1.0, Number(bounds.maxX) - Number(bounds.minX)); }
function roobKudhabe_boundsHeight(bounds) { return Math.max(1.0, Number(bounds.maxY) - Number(bounds.minY)); }
function roobKudhabe_boundsCenterX(bounds) { return (Number(bounds.minX) + Number(bounds.maxX)) / 2.0; }
function roobKudhabe_boundsCenterY(bounds) { return (Number(bounds.minY) + Number(bounds.maxY)) / 2.0; }

function roobKudhabe_collectReflowItems(comp, scope, selectedMap, referenceTime) {
    var result = [];
    var skipped = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!layer) { skipped++; continue; }
        if (scope === "selected" && !selectedMap[String(i)]) continue;
        var type = roobKudhabe_layerType(layer);
        if (!layer.enabled || type === "Camera" || type === "Light" || type === "Null" || layer.parent !== null || layer.threeDLayer) {
            skipped++;
            continue;
        }
        var bounds = roobKudhabe_layerVisualBounds(layer, referenceTime);
        if (!bounds) { skipped++; continue; }
        result.push({
            layer: layer,
            index: layer.index,
            type: type,
            bounds: bounds,
            width: roobKudhabe_boundsWidth(bounds),
            height: roobKudhabe_boundsHeight(bounds),
            cx: roobKudhabe_boundsCenterX(bounds),
            cy: roobKudhabe_boundsCenterY(bounds),
            factor: 1.0,
            targetWidth: roobKudhabe_boundsWidth(bounds),
            targetHeight: roobKudhabe_boundsHeight(bounds),
            targetCx: 0,
            targetCy: 0,
            background: false
        });
    }
    return { items: result, skipped: skipped };
}

function roobKudhabe_layoutBounds(items) {
    if (!items || items.length === 0) return null;
    var minX = 999999999;
    var minY = 999999999;
    var maxX = -999999999;
    var maxY = -999999999;
    for (var i = 0; i < items.length; i++) {
        var b = items[i].bounds;
        if (b.minX < minX) minX = b.minX;
        if (b.minY < minY) minY = b.minY;
        if (b.maxX > maxX) maxX = b.maxX;
        if (b.maxY > maxY) maxY = b.maxY;
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}

function roobKudhabe_markBackgroundItems(items, oldW, oldH) {
    var canvasArea = Math.max(1.0, oldW * oldH);
    var marked = 0;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var areaRatio = (item.width * item.height) / canvasArea;
        var broad = item.width >= oldW * 0.78 && item.height >= oldH * 0.56;
        var huge = areaRatio >= 0.50;
        var typeOkay = item.type === "AV" || item.type === "Shape";
        item.background = typeOkay && (broad || huge);
        if (item.background) marked++;
    }
    /* Never classify every visible item as a background. Keep the smaller half as layout content. */
    if (marked >= items.length && items.length > 1) {
        var smallest = 0;
        var smallestArea = 999999999999;
        for (var j = 0; j < items.length; j++) {
            var area = items[j].width * items[j].height;
            if (area < smallestArea) { smallestArea = area; smallest = j; }
        }
        items[smallest].background = false;
    }
}

function roobKudhabe_reflowItemFactor(item, safeW, safeH, adaptiveScale) {
    var widthRatio = 0.90;
    var heightRatio = 0.42;
    if (item.type === "Text") { widthRatio = 0.92; heightRatio = 0.30; }
    else if (item.type === "AV") { widthRatio = 0.90; heightRatio = 0.52; }
    else if (item.type === "Shape") { widthRatio = 0.82; heightRatio = 0.44; }

    var fitW = (safeW * widthRatio) / Math.max(1.0, item.width);
    var fitH = (safeH * heightRatio) / Math.max(1.0, item.height);
    var factor = Math.min(fitW, fitH);

    if (factor > 1.0) {
        factor = adaptiveScale ? Math.min(factor, item.type === "Text" ? 1.12 : 1.08) : 1.0;
    }
    return roobKudhabe_clamp(factor, 0.22, 1.18);
}

function roobKudhabe_sortReadingOrder(items, sourceRowTolerance) {
    items.sort(function (a, b) {
        var dy = a.cy - b.cy;
        if (Math.abs(dy) > sourceRowTolerance) return dy;
        var dx = a.cx - b.cx;
        if (Math.abs(dx) > 0.5) return dx;
        return a.index - b.index;
    });
}

function roobKudhabe_buildResponsiveRows(items, safeW, gapX, sourceRowTolerance, targetPortrait) {
    var rows = [];
    var current = null;
    var previous = null;
    var rowCapacity = safeW * (targetPortrait ? 0.92 : 0.97);
    var maxItemsPerRow = targetPortrait ? 2 : 4;

    function startRow() {
        current = { items: [], width: 0, height: 0 };
        rows.push(current);
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!current) startRow();
        var sourceBreak = previous && Math.abs(item.cy - previous.cy) > sourceRowTolerance;
        var nextWidth = current.items.length === 0 ? item.targetWidth : current.width + gapX + item.targetWidth;
        var wrap = current.items.length > 0 && (nextWidth > rowCapacity || current.items.length >= maxItemsPerRow);
        if (sourceBreak || wrap) startRow();

        if (current.items.length > 0) current.width += gapX;
        current.items.push(item);
        current.width += item.targetWidth;
        if (item.targetHeight > current.height) current.height = item.targetHeight;
        previous = item;
    }
    return rows;
}

function roobKudhabe_rowsHeight(rows, gapY) {
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
        total += rows[i].height;
        if (i < rows.length - 1) total += gapY;
    }
    return total;
}

function roobKudhabe_layoutRows(rows, targetW, targetH, safeW, safeH, gapX, gapY) {
    var totalHeight = roobKudhabe_rowsHeight(rows, gapY);
    var y = (targetH - totalHeight) / 2.0;
    var leftSafe = (targetW - safeW) / 2.0;

    for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var rowLeft = leftSafe + ((safeW - row.width) / 2.0);
        var x = rowLeft;
        for (var i = 0; i < row.items.length; i++) {
            var item = row.items[i];
            item.targetCx = x + (item.targetWidth / 2.0);
            item.targetCy = y + (row.height / 2.0);
            x += item.targetWidth + gapX;
        }
        y += row.height + gapY;
    }
    return totalHeight;
}

function roobKudhabe_applyReflowItem(item, referenceTime) {
    var layer = item.layer;
    var wasLocked = false;
    try { wasLocked = layer.locked; } catch (e0) {}
    try { if (wasLocked) layer.locked = false; } catch (e1) {}

    var scaleChanged = roobKudhabe_adaptLayerScale(layer, item.factor);
    var afterBounds = roobKudhabe_layerVisualBounds(layer, referenceTime);
    var positionChanged = false;
    if (afterBounds) {
        var dx = item.targetCx - roobKudhabe_boundsCenterX(afterBounds);
        var dy = item.targetCy - roobKudhabe_boundsCenterY(afterBounds);
        positionChanged = roobKudhabe_shiftLayerPosition(layer, dx, dy);
    }

    try { if (wasLocked) layer.locked = true; } catch (e2) {}
    return scaleChanged || positionChanged;
}

function roobKudhabe_applyBackgroundItem(item, targetW, targetH, referenceTime, safeArea) {
    var layer = item.layer;
    var wasLocked = false;
    try { wasLocked = layer.locked; } catch (e0) {}
    try { if (wasLocked) layer.locked = false; } catch (e1) {}

    var coverW = targetW / Math.max(1.0, item.width);
    var coverH = targetH / Math.max(1.0, item.height);
    var factor = Math.max(coverW, coverH);
    factor = roobKudhabe_clamp(factor, 0.45, 3.0);
    roobKudhabe_adaptLayerScale(layer, factor);
    var bounds = roobKudhabe_layerVisualBounds(layer, referenceTime);
    var changed = true;
    if (bounds) {
        changed = roobKudhabe_shiftLayerPosition(
            layer,
            (targetW / 2.0) - roobKudhabe_boundsCenterX(bounds),
            (targetH / 2.0) - roobKudhabe_boundsCenterY(bounds)
        );
    }
    try { if (wasLocked) layer.locked = true; } catch (e2) {}
    return changed;
}

function roobKudhabe_smartReflow(comp, oldW, oldH, targetW, targetH, scope, selectedMap, referenceTime, safeArea, adaptiveScale) {
    var collected = roobKudhabe_collectReflowItems(comp, scope, selectedMap, referenceTime);
    var items = collected.items;
    var skipped = collected.skipped;
    if (items.length === 0) return { moved: 0, skipped: skipped, factor: 1.0, error: "No visible 2D content available to reflow" };

    roobKudhabe_markBackgroundItems(items, oldW, oldH);

    var foreground = [];
    var backgrounds = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].background) backgrounds.push(items[i]);
        else foreground.push(items[i]);
    }

    var marginRatio = safeArea ? 0.075 : 0.035;
    var safeW = Math.max(60.0, targetW * (1.0 - marginRatio * 2.0));
    var safeH = Math.max(60.0, targetH * (1.0 - marginRatio * 2.0));
    var gapX = Math.max(12.0, targetW * 0.024);
    var gapY = Math.max(14.0, targetH * 0.020);
    var targetPortrait = targetH > targetW;
    var sourceBounds = roobKudhabe_layoutBounds(foreground.length ? foreground : items);
    var sourceHeight = sourceBounds ? Math.max(1.0, sourceBounds.maxY - sourceBounds.minY) : oldH;
    var sourceRowTolerance = Math.max(20.0, sourceHeight * 0.055);
    var moved = 0;

    for (var b = 0; b < backgrounds.length; b++) {
        if (roobKudhabe_applyBackgroundItem(backgrounds[b], targetW, targetH, referenceTime, safeArea)) moved++;
        else skipped++;
    }

    if (foreground.length > 0) {
        roobKudhabe_sortReadingOrder(foreground, sourceRowTolerance);
        for (var f = 0; f < foreground.length; f++) {
            var factor = roobKudhabe_reflowItemFactor(foreground[f], safeW, safeH, adaptiveScale);
            foreground[f].factor = factor;
            foreground[f].targetWidth = foreground[f].width * factor;
            foreground[f].targetHeight = foreground[f].height * factor;
        }

        var rows = roobKudhabe_buildResponsiveRows(foreground, safeW, gapX, sourceRowTolerance, targetPortrait);
        var totalHeight = roobKudhabe_rowsHeight(rows, gapY);
        if (totalHeight > safeH) {
            var squeeze = roobKudhabe_clamp(safeH / totalHeight, 0.42, 1.0);
            for (var s = 0; s < foreground.length; s++) {
                foreground[s].factor *= squeeze;
                foreground[s].targetWidth *= squeeze;
                foreground[s].targetHeight *= squeeze;
            }
            gapX *= squeeze;
            gapY *= squeeze;
            rows = roobKudhabe_buildResponsiveRows(foreground, safeW, gapX, sourceRowTolerance, targetPortrait);
        }

        roobKudhabe_layoutRows(rows, targetW, targetH, safeW, safeH, gapX, gapY);
        for (var a = 0; a < foreground.length; a++) {
            if (roobKudhabe_applyReflowItem(foreground[a], referenceTime)) moved++;
            else skipped++;
        }
    }

    return { moved: moved, skipped: skipped, factor: 1.0, error: "" };
}

function roobKudhabe_transformScalarAroundCenter(prop, oldCenter, newCenter, factor) {
    if (!prop) return false;
    function mapValue(value) { return newCenter + ((Number(value) - oldCenter) * factor); }
    try {
        if (prop.numKeys > 0) {
            for (var i = 1; i <= prop.numKeys; i++) prop.setValueAtKey(i, mapValue(prop.keyValue(i)));
        } else prop.setValue(mapValue(prop.value));
        return true;
    } catch (e) { return false; }
}

function roobKudhabe_transformPositionAroundCenter(layer, oldCenterX, oldCenterY, newCenterX, newCenterY, factor) {
    var transform = null;
    var position = null;
    try {
        transform = layer.property("ADBE Transform Group");
        position = transform ? transform.property("ADBE Position") : null;
    } catch (e) {}
    if (!position) return false;

    try {
        if (position.dimensionsSeparated) {
            var xProp = position.getSeparationFollower(0);
            var yProp = position.getSeparationFollower(1);
            var okX = roobKudhabe_transformScalarAroundCenter(xProp, oldCenterX, newCenterX, factor);
            var okY = roobKudhabe_transformScalarAroundCenter(yProp, oldCenterY, newCenterY, factor);
            return okX || okY;
        }

        function mapPosition(value) {
            if (!(value instanceof Array) || value.length < 2) return value;
            var out = roobKudhabe_cloneValue(value);
            out[0] = newCenterX + ((Number(value[0]) - oldCenterX) * factor);
            out[1] = newCenterY + ((Number(value[1]) - oldCenterY) * factor);
            return out;
        }

        if (position.numKeys > 0) {
            for (var i = 1; i <= position.numKeys; i++) position.setValueAtKey(i, mapPosition(position.keyValue(i)));
        } else position.setValue(mapPosition(position.value));
        return true;
    } catch (e2) { return false; }
}

function roobKudhabe_fitCenterContent(comp, targetW, targetH, scope, selectedMap, referenceTime, safeArea, allowEnlarge) {
    var collected = roobKudhabe_collectReflowItems(comp, scope, selectedMap, referenceTime);
    var layers = collected.items;
    var skipped = collected.skipped;
    if (layers.length === 0) return { moved: 0, skipped: skipped, factor: 1.0, error: "No visible 2D content available to center" };

    var bounds = roobKudhabe_layoutBounds(layers);
    var contentW = Math.max(1.0, bounds.maxX - bounds.minX);
    var contentH = Math.max(1.0, bounds.maxY - bounds.minY);
    var centerX = (bounds.minX + bounds.maxX) / 2.0;
    var centerY = (bounds.minY + bounds.maxY) / 2.0;
    var marginRatio = safeArea ? 0.075 : 0.0;
    var safeW = Math.max(1.0, targetW * (1.0 - (marginRatio * 2.0)));
    var safeH = Math.max(1.0, targetH * (1.0 - (marginRatio * 2.0)));
    var factor = Math.min(safeW / contentW, safeH / contentH);

    if (!allowEnlarge && factor > 1.0) factor = 1.0;
    if (allowEnlarge && factor > 1.25) factor = 1.25;
    factor = roobKudhabe_clamp(factor, 0.05, 1.25);

    var targetCenterX = targetW / 2.0;
    var targetCenterY = targetH / 2.0;
    var moved = 0;

    for (var j = 0; j < layers.length; j++) {
        var targetLayer = layers[j].layer;
        var wasLocked = false;
        try { wasLocked = targetLayer.locked; } catch (lockReadError) {}
        try { if (wasLocked) targetLayer.locked = false; } catch (unlockError) {}

        var positionChanged = roobKudhabe_transformPositionAroundCenter(targetLayer, centerX, centerY, targetCenterX, targetCenterY, factor);
        var scaleChanged = roobKudhabe_adaptLayerScale(targetLayer, factor);
        if (positionChanged || scaleChanged) moved++;
        else skipped++;

        try { if (wasLocked) targetLayer.locked = true; } catch (relockError) {}
    }

    return { moved: moved, skipped: skipped, factor: factor, error: "" };
}

function roobKudhabe_resizeLabel(width, height) {
    var ratio = width / height;
    if (Math.abs(ratio - (9 / 16)) < 0.01) return "9x16";
    if (Math.abs(ratio - 1) < 0.01) return "1x1";
    if (Math.abs(ratio - (4 / 5)) < 0.01) return "4x5";
    if (Math.abs(ratio - (16 / 9)) < 0.01) return "16x9";
    return width + "x" + height;
}

function roobKudhabe_recompose(targetW, targetH, scope, mode, preserveMotion, safeArea, duplicateComp, adaptiveScale) {
    var resolved = roobKudhabe_resolveTargetComposition();
    if (!resolved || !resolved.comp) return "NO_ACTIVE_COMP";
    var sourceComp = resolved.comp;

    targetW = Math.round(Number(targetW));
    targetH = Math.round(Number(targetH));
    if (!isFinite(targetW) || !isFinite(targetH) || targetW < 16 || targetH < 16 || targetW > 30000 || targetH > 30000) {
        return "ERROR~~RK_FIELD~~Invalid canvas size";
    }

    preserveMotion = String(preserveMotion) === "true";
    safeArea = String(safeArea) === "true";
    duplicateComp = String(duplicateComp) === "true";
    adaptiveScale = String(adaptiveScale) === "true";
    scope = String(scope || "all");
    mode = String(mode || "smartflow");
    if (mode === "smart") mode = "smartflow";

    var oldW = sourceComp.width;
    var oldH = sourceComp.height;
    if (oldW === targetW && oldH === targetH && mode !== "fitcenter" && mode !== "smartflow") return "ERROR~~RK_FIELD~~Composition already uses that canvas size";

    var selectedMap = roobKudhabe_selectedIndexMap(sourceComp);
    if (scope === "selected") {
        var hasSelection = false;
        for (var key in selectedMap) { if (selectedMap.hasOwnProperty(key)) { hasSelection = true; break; } }
        if (!hasSelection) return "NO_SELECTION";
    }

    var comp = sourceComp;
    var duplicated = false;
    var moved = 0;
    var skipped = 0;
    var referenceTime = sourceComp.time;
    var fitFactor = 1.0;

    app.beginUndoGroup("SHAX - Responsive Recompose");
    try {
        if (duplicateComp) {
            comp = sourceComp.duplicate();
            comp.name = sourceComp.name + " [" + roobKudhabe_resizeLabel(targetW, targetH) + "]";
            duplicated = true;
        }

        if (mode === "smartflow") {
            var flowResult = roobKudhabe_smartReflow(comp, oldW, oldH, targetW, targetH, scope, selectedMap, referenceTime, safeArea, adaptiveScale);
            if (flowResult.error) throw new Error(flowResult.error);
            moved = flowResult.moved;
            skipped = flowResult.skipped;
            fitFactor = flowResult.factor;
            comp.width = targetW;
            comp.height = targetH;
        } else {
            comp.width = targetW;
            comp.height = targetH;
            if (mode === "fitcenter") {
                var fitResult = roobKudhabe_fitCenterContent(comp, targetW, targetH, scope, selectedMap, referenceTime, safeArea, adaptiveScale);
                if (fitResult.error) throw new Error(fitResult.error);
                moved = fitResult.moved;
                skipped = fitResult.skipped;
                fitFactor = fitResult.factor;
            } else {
                var areaFactor = Math.sqrt((targetW * targetH) / (oldW * oldH));
                areaFactor = roobKudhabe_clamp(areaFactor, 0.65, 1.35);
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (!layer) { skipped++; continue; }
                    if (scope === "selected" && !selectedMap[String(i)]) continue;
                    if (layer.parent !== null) { skipped++; continue; }
                    var type = roobKudhabe_layerType(layer);
                    if (type === "Camera" || type === "Light") { skipped++; continue; }

                    var wasLocked = false;
                    try { wasLocked = layer.locked; } catch (lockReadError) {}
                    try { if (wasLocked) layer.locked = false; } catch (unlockError) {}
                    var changed = roobKudhabe_recomposePosition(layer, oldW, oldH, targetW, targetH, mode, preserveMotion, safeArea, referenceTime);
                    if (adaptiveScale) roobKudhabe_adaptLayerScale(layer, areaFactor);
                    try { if (wasLocked) layer.locked = true; } catch (relockError) {}
                    if (changed) moved++;
                    else skipped++;
                }
            }
        }

        if (duplicated) {
            try { comp.openInViewer(); } catch (viewerError) {}
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();

    return "OK~~RK_FIELD~~" + moved + "~~RK_FIELD~~" + skipped + "~~RK_FIELD~~" + duplicated + "~~RK_FIELD~~" + Math.round(fitFactor * 1000) / 10 + "~~RK_FIELD~~" + roobKudhabe_clean(comp.name) + "~~RK_FIELD~~" + mode;
}


/* ================================================================
   RoobKudhabe v1.0 - Deep Recompose Engine
   Nested composition aware. Deepest full-frame comps are recomposed
   first, then parent comps are centered and fitted around them.
   ================================================================ */

function roobKudhabe_v10_compKey(comp) {
    try { return "id_" + comp.id; } catch (e) {}
    try { return "name_" + comp.name + "_" + comp.width + "x" + comp.height; } catch (e2) {}
    return "unknown";
}

function roobKudhabe_v10_isPrecompLayer(layer) {
    try {
        return layer && (layer instanceof AVLayer) && layer.source && (layer.source instanceof CompItem);
    } catch (e) { return false; }
}

function roobKudhabe_v10_duplicateNestedTree(comp, cache, visiting, depth, maxDepth, stats, label) {
    if (!comp || depth > maxDepth) return;
    if (depth > stats.deepest) stats.deepest = depth;

    var compKey = roobKudhabe_v10_compKey(comp);
    if (visiting[compKey]) return;
    visiting[compKey] = true;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!roobKudhabe_v10_isPrecompLayer(layer)) continue;

        var src = null;
        try { src = layer.source; } catch (sourceError) {}
        if (!src) continue;

        var key = roobKudhabe_v10_compKey(src);
        var copy = cache[key];
        if (!copy) {
            try {
                copy = src.duplicate();
                copy.name = src.name + " [RK " + label + "]";
                cache[key] = copy;
                stats.nestedCopies++;
                roobKudhabe_v10_duplicateNestedTree(copy, cache, visiting, depth + 1, maxDepth, stats, label);
            } catch (duplicateError) {
                stats.skipped++;
                copy = null;
            }
        }

        if (copy) {
            try { layer.replaceSource(copy, true); } catch (replaceError) {
                try { layer.replaceSource(copy, false); } catch (replaceError2) { stats.skipped++; }
            }
        }
    }

    visiting[compKey] = false;
}

function roobKudhabe_v10_layerBounds(layer, referenceTime) {
    try {
        if (!layer || !layer.enabled || layer.threeDLayer) return null;
        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light" || type === "Null") return null;

        var rect = null;
        try { rect = layer.sourceRectAtTime(referenceTime, false); } catch (rectError) {}

        var left = 0, top = 0, width = 0, height = 0;
        if (rect && isFinite(rect.width) && isFinite(rect.height) && rect.width > 0 && rect.height > 0) {
            left = Number(rect.left);
            top = Number(rect.top);
            width = Number(rect.width);
            height = Number(rect.height);
        } else {
            try { width = Number(layer.width); } catch (wError) { width = 0; }
            try { height = Number(layer.height); } catch (hError) { height = 0; }
            if (!(width > 0 && height > 0)) return null;
        }

        var points = [
            [left, top],
            [left + width, top],
            [left + width, top + height],
            [left, top + height]
        ];
        var minX = 999999999, minY = 999999999, maxX = -999999999, maxY = -999999999;
        var converted = 0;

        for (var p = 0; p < points.length; p++) {
            var cp = null;
            try { cp = layer.sourcePointToComp(points[p]); } catch (pointError) {}
            if (cp instanceof Array && cp.length >= 2 && isFinite(cp[0]) && isFinite(cp[1])) {
                converted++;
                if (cp[0] < minX) minX = cp[0];
                if (cp[0] > maxX) maxX = cp[0];
                if (cp[1] < minY) minY = cp[1];
                if (cp[1] > maxY) maxY = cp[1];
            }
        }

        if (converted === 4) return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    } catch (e) {}

    /* Fallback for hosts/layer types where sourcePointToComp is unavailable. */
    return roobKudhabe_layerVisualBounds(layer, referenceTime);
}

function roobKudhabe_v10_isDescendantOf(layer, root) {
    if (!layer || !root || layer === root) return false;
    var parent = null;
    try { parent = layer.parent; } catch (e) { return false; }
    var guard = 0;
    while (parent && guard < 64) {
        if (parent === root) return true;
        try { parent = parent.parent; } catch (e2) { parent = null; }
        guard++;
    }
    return false;
}

function roobKudhabe_v10_unionBounds(a, b) {
    if (!a) return b;
    if (!b) return a;
    return {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY)
    };
}

function roobKudhabe_v10_rootGroupBounds(comp, root, referenceTime) {
    var bounds = null;
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!layer || !layer.enabled || layer.threeDLayer) continue;
        if (layer === root || roobKudhabe_v10_isDescendantOf(layer, root)) {
            bounds = roobKudhabe_v10_unionBounds(bounds, roobKudhabe_v10_layerBounds(layer, referenceTime));
        }
    }
    return bounds;
}

function roobKudhabe_v10_nameLooksBackground(layer) {
    var name = "";
    try { name = String(layer.name || "").toLowerCase(); } catch (e) {}
    return /(^|[\s_\-])(bg|background|backdrop|solid|plate)([\s_\-]|$)/.test(name);
}

function roobKudhabe_v10_isSolidLayer(layer) {
    try {
        return layer instanceof AVLayer && layer.source && layer.source.mainSource && (layer.source.mainSource instanceof SolidSource);
    } catch (e) { return false; }
}

function roobKudhabe_v10_collectRootItems(comp, referenceTime, scope, selectedMap) {
    var items = [];
    var skipped = 0;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!layer) { skipped++; continue; }
        var type = roobKudhabe_layerType(layer);
        if (!layer.enabled || layer.threeDLayer || type === "Camera" || type === "Light" || type === "Null") {
            skipped++;
            continue;
        }

        var parent = null;
        try { parent = layer.parent; } catch (parentError) {}
        if (parent !== null) continue;

        if (scope === "selected" && selectedMap && !selectedMap[String(layer.index)]) continue;

        var bounds = roobKudhabe_v10_rootGroupBounds(comp, layer, referenceTime);
        if (!bounds) { skipped++; continue; }
        var width = roobKudhabe_boundsWidth(bounds);
        var height = roobKudhabe_boundsHeight(bounds);
        var coverage = (width * height) / Math.max(1.0, comp.width * comp.height);
        var nearCanvas = width >= comp.width * 0.80 && height >= comp.height * 0.72;
        var explicitBackground = roobKudhabe_v10_nameLooksBackground(layer) || roobKudhabe_v10_isSolidLayer(layer);

        items.push({
            layer: layer,
            index: layer.index,
            bounds: bounds,
            width: width,
            height: height,
            cx: roobKudhabe_boundsCenterX(bounds),
            cy: roobKudhabe_boundsCenterY(bounds),
            background: explicitBackground && (nearCanvas || coverage >= 0.52)
        });
    }

    return { items: items, skipped: skipped };
}

function roobKudhabe_v10_boundsOfItems(items) {
    var bounds = null;
    for (var i = 0; i < items.length; i++) bounds = roobKudhabe_v10_unionBounds(bounds, items[i].bounds);
    return bounds;
}

function roobKudhabe_v10_scaleAndMapRoot(item, sourceCenterX, sourceCenterY, targetCenterX, targetCenterY, factor) {
    var layer = item.layer;
    var wasLocked = false;
    try { wasLocked = layer.locked; } catch (e0) {}
    try { if (wasLocked) layer.locked = false; } catch (e1) {}

    var positionChanged = roobKudhabe_transformPositionAroundCenter(layer, sourceCenterX, sourceCenterY, targetCenterX, targetCenterY, factor);
    var scaleChanged = roobKudhabe_adaptLayerScale(layer, factor);

    try { if (wasLocked) layer.locked = true; } catch (e2) {}
    return positionChanged || scaleChanged;
}

function roobKudhabe_v10_coverBackground(item, targetW, targetH, referenceTime) {
    var layer = item.layer;
    var factor = Math.max(targetW / Math.max(1.0, item.width), targetH / Math.max(1.0, item.height));
    factor = roobKudhabe_clamp(factor, 0.05, 8.0);
    var wasLocked = false;
    try { wasLocked = layer.locked; } catch (e0) {}
    try { if (wasLocked) layer.locked = false; } catch (e1) {}

    var scaled = roobKudhabe_adaptLayerScale(layer, factor);
    var bounds = roobKudhabe_v10_rootGroupBounds(layer.containingComp, layer, referenceTime);
    var moved = false;
    if (bounds) {
        moved = roobKudhabe_shiftLayerPosition(
            layer,
            (targetW / 2.0) - roobKudhabe_boundsCenterX(bounds),
            (targetH / 2.0) - roobKudhabe_boundsCenterY(bounds)
        );
    }

    try { if (wasLocked) layer.locked = true; } catch (e2) {}
    return scaled || moved;
}

function roobKudhabe_v10_fitDirectLayout(comp, targetW, targetH, referenceTime, safeArea, adaptiveScale, scope, selectedMap) {
    var collected = roobKudhabe_v10_collectRootItems(comp, referenceTime, scope, selectedMap);
    var items = collected.items;
    var skipped = collected.skipped;
    if (items.length === 0) return { moved: 0, skipped: skipped, factor: 1.0, error: "No visible 2D root content found" };

    var foreground = [];
    var backgrounds = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].background) backgrounds.push(items[i]);
        else foreground.push(items[i]);
    }

    /* Never let background detection consume the entire scene. */
    if (foreground.length === 0 && backgrounds.length > 0) {
        var smallest = 0;
        var smallestArea = 999999999999;
        for (var s = 0; s < backgrounds.length; s++) {
            var area = backgrounds[s].width * backgrounds[s].height;
            if (area < smallestArea) { smallestArea = area; smallest = s; }
        }
        foreground.push(backgrounds[smallest]);
        backgrounds.splice(smallest, 1);
    }

    var margin = safeArea ? 0.075 : 0.025;
    var safeW = Math.max(1.0, targetW * (1.0 - margin * 2.0));
    var safeH = Math.max(1.0, targetH * (1.0 - margin * 2.0));
    var moved = 0;

    for (var b = 0; b < backgrounds.length; b++) {
        if (roobKudhabe_v10_coverBackground(backgrounds[b], targetW, targetH, referenceTime)) moved++;
        else skipped++;
    }

    if (foreground.length > 0) {
        var bounds = roobKudhabe_v10_boundsOfItems(foreground);
        if (!bounds) return { moved: moved, skipped: skipped, factor: 1.0, error: "Could not measure visible content" };

        var contentW = Math.max(1.0, roobKudhabe_boundsWidth(bounds));
        var contentH = Math.max(1.0, roobKudhabe_boundsHeight(bounds));
        var factor = Math.min(safeW / contentW, safeH / contentH);
        if (!adaptiveScale && factor > 1.0) factor = 1.0;
        if (adaptiveScale && factor > 1.18) factor = 1.18;
        factor = roobKudhabe_clamp(factor, 0.04, 1.18);

        var sourceCenterX = roobKudhabe_boundsCenterX(bounds);
        var sourceCenterY = roobKudhabe_boundsCenterY(bounds);
        var targetCenterX = targetW / 2.0;
        var targetCenterY = targetH / 2.0;

        for (var f = 0; f < foreground.length; f++) {
            if (roobKudhabe_v10_scaleAndMapRoot(foreground[f], sourceCenterX, sourceCenterY, targetCenterX, targetCenterY, factor)) moved++;
            else skipped++;
        }

        return { moved: moved, skipped: skipped, factor: factor, error: "" };
    }

    return { moved: moved, skipped: skipped, factor: 1.0, error: "" };
}

function roobKudhabe_v10_shouldFollowPrecomp(parentComp, layer, referenceTime) {
    if (!roobKudhabe_v10_isPrecompLayer(layer)) return false;
    var child = null;
    try { child = layer.source; } catch (e) {}
    if (!child || child.width < 16 || child.height < 16) return false;

    var parentRatio = parentComp.width / Math.max(1.0, parentComp.height);
    var childRatio = child.width / Math.max(1.0, child.height);
    var ratioDelta = Math.abs(childRatio - parentRatio) / Math.max(0.0001, parentRatio);
    if (ratioDelta > 0.12) return false;

    var bounds = roobKudhabe_v10_layerBounds(layer, referenceTime);
    if (!bounds) return false;
    var widthCoverage = roobKudhabe_boundsWidth(bounds) / Math.max(1.0, parentComp.width);
    var heightCoverage = roobKudhabe_boundsHeight(bounds) / Math.max(1.0, parentComp.height);
    var areaCoverage = widthCoverage * heightCoverage;

    return (widthCoverage >= 0.62 && heightCoverage >= 0.52) || areaCoverage >= 0.36;
}

function roobKudhabe_v10_remapPrecompAnchor(layer, oldW, oldH, newW, newH) {
    if (!layer || oldW <= 0 || oldH <= 0) return;
    var transform = null;
    var anchor = null;    try {
        transform = layer.property("ADBE Transform Group");
        anchor = transform ? transform.property("ADBE Anchor Point") : null;
    } catch (e) {}
    if (!anchor) return;

    function mapAnchor(value) {
        if (!(value instanceof Array) || value.length < 2) return value;
        var out = roobKudhabe_cloneValue(value);
        out[0] = Number(value[0]) * (newW / oldW);
        out[1] = Number(value[1]) * (newH / oldH);
        return out;
    }

    try {
        if (anchor.numKeys > 0) {
            for (var i = 1; i <= anchor.numKeys; i++) anchor.setValueAtKey(i, mapAnchor(anchor.keyValue(i)));
        } else anchor.setValue(mapAnchor(anchor.value));
    } catch (e2) {}
}

function roobKudhabe_v10_deepRecomposeComp(comp, targetW, targetH, referenceTime, safeArea, adaptiveScale, stats, visited, depth, maxDepth, scope, selectedMap) {
    if (!comp || depth > maxDepth) return;
    var key = roobKudhabe_v10_compKey(comp);
    if (visited[key]) return;
    visited[key] = true;
    stats.compsScanned++;
    if (depth > stats.deepest) stats.deepest = depth;

    var oldW = comp.width;
    var oldH = comp.height;
    var childRefs = [];

    /* Deepest-first: resize only nested precomps that behave like full-frame canvases. */
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!roobKudhabe_v10_shouldFollowPrecomp(comp, layer, referenceTime)) continue;
        var child = null;
        try { child = layer.source; } catch (e0) {}
        if (!child) continue;

        var childOldW = child.width;
        var childOldH = child.height;
        var childTargetW = Math.max(16, Math.round(childOldW * (targetW / Math.max(1.0, oldW))));
        var childTargetH = Math.max(16, Math.round(childOldH * (targetH / Math.max(1.0, oldH))));
        childRefs.push({ layer: layer, oldW: childOldW, oldH: childOldH, newW: childTargetW, newH: childTargetH });

        roobKudhabe_v10_deepRecomposeComp(child, childTargetW, childTargetH, child.time, safeArea, adaptiveScale, stats, visited, depth + 1, maxDepth, "all", null);
    }

    /* Remap precomp anchors after child source dimensions have changed. */
    for (var a = 0; a < childRefs.length; a++) {
        roobKudhabe_v10_remapPrecompAnchor(childRefs[a].layer, childRefs[a].oldW, childRefs[a].oldH, childRefs[a].newW, childRefs[a].newH);
    }

    var fit = roobKudhabe_v10_fitDirectLayout(comp, targetW, targetH, referenceTime, safeArea, adaptiveScale, scope, selectedMap);
    if (fit.error) {
        stats.skipped += fit.skipped;
    } else {
        stats.moved += fit.moved;
        stats.skipped += fit.skipped;
        if (depth === 0) stats.rootFactor = fit.factor;
    }

    try {
        comp.width = targetW;
        comp.height = targetH;
    } catch (sizeError) {
        stats.skipped++;
    }
}

/* v1.0 overrides the earlier recompose entry point. */
function roobKudhabe_recompose(targetW, targetH, scope, mode, preserveMotion, safeArea, duplicateComp, adaptiveScale) {
    var resolved = roobKudhabe_resolveTargetComposition();
    if (!resolved || !resolved.comp) return "NO_ACTIVE_COMP";
    var sourceComp = resolved.comp;

    targetW = Math.round(Number(targetW));
    targetH = Math.round(Number(targetH));
    if (!isFinite(targetW) || !isFinite(targetH) || targetW < 16 || targetH < 16 || targetW > 30000 || targetH > 30000) {
        return "ERROR~~RK_FIELD~~Invalid canvas size";
    }

    preserveMotion = String(preserveMotion) === "true";
    safeArea = String(safeArea) === "true";
    duplicateComp = String(duplicateComp) === "true";
    adaptiveScale = String(adaptiveScale) === "true";
    scope = String(scope || "all");
    mode = String(mode || "deep");

    var oldW = sourceComp.width;
    var oldH = sourceComp.height;
    var selectedMap = roobKudhabe_selectedIndexMap(sourceComp);
    if (scope === "selected") {
        var hasSelection = false;
        for (var key in selectedMap) {
            if (selectedMap.hasOwnProperty(key)) { hasSelection = true; break; }
        }
        if (!hasSelection) return "NO_SELECTION";
    }

    var comp = sourceComp;
    var duplicated = false;
    var moved = 0;
    var skipped = 0;
    var fitFactor = 1.0;
    var nestedCount = 0;
    var deepest = 0;

    app.beginUndoGroup("SHAX - Deep Recompose");
    try {
        if (duplicateComp) {
            comp = sourceComp.duplicate();
            comp.name = sourceComp.name + " [" + roobKudhabe_resizeLabel(targetW, targetH) + "]";
            duplicated = true;
        }

        if (mode === "deep" || mode === "smartflow") {
            var stats = {
                moved: 0,
                skipped: 0,
                nestedCopies: 0,
                compsScanned: 0,
                deepest: 0,
                rootFactor: 1.0
            };

            if (duplicateComp) {
                var cache = {};
                var visiting = {};
                roobKudhabe_v10_duplicateNestedTree(comp, cache, visiting, 1, 12, stats, roobKudhabe_resizeLabel(targetW, targetH));
            }

            var visited = {};
            roobKudhabe_v10_deepRecomposeComp(
                comp,
                targetW,
                targetH,
                sourceComp.time,
                safeArea,
                adaptiveScale,
                stats,
                visited,
                0,
                12,
                scope,
                selectedMap
            );

            moved = stats.moved;
            skipped = stats.skipped;
            fitFactor = stats.rootFactor;
            nestedCount = stats.compsScanned;
            deepest = stats.deepest;
        } else {
            comp.width = targetW;
            comp.height = targetH;
            if (mode === "fitcenter") {
                var fitResult = roobKudhabe_fitCenterContent(comp, targetW, targetH, scope, selectedMap, sourceComp.time, safeArea, adaptiveScale);
                if (fitResult.error) throw new Error(fitResult.error);
                moved = fitResult.moved;
                skipped = fitResult.skipped;
                fitFactor = fitResult.factor;
            } else {
                var areaFactor = Math.sqrt((targetW * targetH) / (oldW * oldH));
                areaFactor = roobKudhabe_clamp(areaFactor, 0.65, 1.35);
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (!layer) { skipped++; continue; }
                    if (scope === "selected" && !selectedMap[String(i)]) continue;
                    if (layer.parent !== null) { skipped++; continue; }
                    var type = roobKudhabe_layerType(layer);
                    if (type === "Camera" || type === "Light") { skipped++; continue; }

                    var wasLocked = false;
                    try { wasLocked = layer.locked; } catch (lockReadError) {}
                    try { if (wasLocked) layer.locked = false; } catch (unlockError) {}
                    var changed = roobKudhabe_recomposePosition(layer, oldW, oldH, targetW, targetH, mode, preserveMotion, safeArea, sourceComp.time);
                    if (adaptiveScale) roobKudhabe_adaptLayerScale(layer, areaFactor);
                    try { if (wasLocked) layer.locked = true; } catch (relockError) {}
                    if (changed) moved++;
                    else skipped++;
                }
            }
        }

        if (duplicated) {
            try { comp.openInViewer(); } catch (viewerError) {}
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();

    return "OK~~RK_FIELD~~" + moved +
        "~~RK_FIELD~~" + skipped +
        "~~RK_FIELD~~" + duplicated +
        "~~RK_FIELD~~" + (Math.round(fitFactor * 1000) / 10) +
        "~~RK_FIELD~~" + roobKudhabe_clean(comp.name) +
        "~~RK_FIELD~~" + mode +
        "~~RK_FIELD~~" + nestedCount +
        "~~RK_FIELD~~" + deepest;
}

/* ================================================================
   RoobKudhabe v1.1 - Deep Chain Recompose
   Fixes v1.0 double-scaling across nested compositions.
   The real design is fitted once at the deepest dominant canvas,
   while ancestor precomps are resized and centered without re-fitting.
   ================================================================ */

function roobKudhabe_v11_hasVideo(layer) {
    try {
        if (layer instanceof AVLayer && layer.hasVideo === false) return false;
    } catch (e) {}
    return true;
}

function roobKudhabe_v11_layerNameBoost(layer) {
    var name = "";
    try { name = String(layer.name || "").toLowerCase(); } catch (e) {}
    if (/(^|[\s_\-])(all|main|master|content|scene|layout|design|container)([\s_\-]|$)/.test(name)) return 0.35;
    return 0.0;
}

function roobKudhabe_v11_findDominantPrecomp(comp, referenceTime) {
    if (!comp) return null;
    var best = null;
    var bestScore = -9999;
    var visualRoots = 0;
    var precompRoots = 0;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!layer || !layer.enabled || layer.threeDLayer) continue;
        if (!roobKudhabe_v11_hasVideo(layer)) continue;
        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light" || type === "Null") continue;
        var parent = null;
        try { parent = layer.parent; } catch (e0) {}
        if (parent !== null) continue;

        visualRoots++;
        if (!roobKudhabe_v10_isPrecompLayer(layer)) continue;
        precompRoots++;

        var src = null;
        try { src = layer.source; } catch (e1) {}
        if (!src) continue;
        var bounds = roobKudhabe_v10_layerBounds(layer, referenceTime);
        if (!bounds) continue;

        var wCoverage = roobKudhabe_boundsWidth(bounds) / Math.max(1.0, comp.width);
        var hCoverage = roobKudhabe_boundsHeight(bounds) / Math.max(1.0, comp.height);
        var areaCoverage = wCoverage * hCoverage;
        var parentRatio = comp.width / Math.max(1.0, comp.height);
        var childRatio = src.width / Math.max(1.0, src.height);
        var ratioDelta = Math.abs(childRatio - parentRatio) / Math.max(0.0001, parentRatio);

        var score = areaCoverage + (Math.min(wCoverage, hCoverage) * 0.55) - (ratioDelta * 0.40) + roobKudhabe_v11_layerNameBoost(layer);
        if (score > bestScore) {
            bestScore = score;
            best = {
                layer: layer,
                source: src,
                bounds: bounds,
                widthCoverage: wCoverage,
                heightCoverage: hCoverage,
                areaCoverage: areaCoverage,
                ratioDelta: ratioDelta,
                score: score
            };
        }
    }

    if (!best) return null;

    /* One visual precomp at this level is almost certainly the canvas chain. */
    if (visualRoots === 1 && precompRoots === 1) return best;

    /* Otherwise demand meaningful canvas coverage. */
    if (best.areaCoverage >= 0.28) return best;
    if (best.widthCoverage >= 0.58 && best.heightCoverage >= 0.42) return best;
    if (best.score >= 0.92) return best;
    return null;
}

function roobKudhabe_v11_buildChain(rootComp, maxDepth) {
    var chain = [];
    var current = rootComp;
    var visited = {};
    var depth = 0;

    while (current && depth < maxDepth) {
        var key = roobKudhabe_v10_compKey(current);
        if (visited[key]) break;
        visited[key] = true;

        var time = 0;
        try { time = Number(current.time); } catch (e0) { time = 0; }
        if (!isFinite(time)) time = 0;

        var dominant = roobKudhabe_v11_findDominantPrecomp(current, time);
        if (!dominant || !dominant.source) break;

        chain.push({
            comp: current,
            layer: dominant.layer,
            child: dominant.source,
            oldW: current.width,
            oldH: current.height,
            childOldW: dominant.source.width,
            childOldH: dominant.source.height,
            referenceTime: time
        });

        current = dominant.source;
        depth++;
    }

    return { chain: chain, leaf: current, depth: chain.length };
}

function roobKudhabe_v11_captureExtras(comp, chainLayer, referenceTime) {
    var extras = [];
    if (!comp) return extras;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (!layer || layer === chainLayer || !layer.enabled || layer.threeDLayer) continue;
        if (!roobKudhabe_v11_hasVideo(layer)) continue;
        if (roobKudhabe_v10_isDescendantOf(layer, chainLayer)) continue;
        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light" || type === "Null") continue;
        var parent = null;
        try { parent = layer.parent; } catch (e0) {}
        if (parent !== null) continue;

        var bounds = roobKudhabe_v10_rootGroupBounds(comp, layer, referenceTime);
        if (!bounds) continue;
        var width = roobKudhabe_boundsWidth(bounds);
        var height = roobKudhabe_boundsHeight(bounds);
        var coverage = (width * height) / Math.max(1.0, comp.width * comp.height);
        var nearCanvas = width >= comp.width * 0.82 && height >= comp.height * 0.72;
        var background = (roobKudhabe_v10_nameLooksBackground(layer) || roobKudhabe_v10_isSolidLayer(layer)) && (nearCanvas || coverage >= 0.54);
        var position = roobKudhabe_positionAtTime(layer, referenceTime);

        extras.push({
            layer: layer,
            bounds: bounds,
            width: width,
            height: height,
            background: background,
            position: position
        });
    }
    return extras;
}

function roobKudhabe_v11_applyExtras(extras, oldW, oldH, targetW, targetH, safeArea, referenceTime) {
    var moved = 0;
    var skipped = 0;
    var margin = safeArea ? 0.07 : 0.02;
    var safeW = targetW * (1 - margin * 2);
    var safeH = targetH * (1 - margin * 2);
    var minX = targetW * margin;
    var maxX = targetW * (1 - margin);
    var minY = targetH * margin;
    var maxY = targetH * (1 - margin);

    for (var i = 0; i < extras.length; i++) {
        var item = extras[i];
        if (item.background) {
            if (roobKudhabe_v10_coverBackground(item, targetW, targetH, referenceTime)) moved++;
            else skipped++;
            continue;
        }

        if (!(item.position instanceof Array) || item.position.length < 2) {
            skipped++;
            continue;
        }

        var nx = oldW > 0 ? (Number(item.position[0]) / oldW) * targetW : Number(item.position[0]);
        var ny = oldH > 0 ? (Number(item.position[1]) / oldH) * targetH : Number(item.position[1]);
        nx = roobKudhabe_clamp(nx, minX, maxX);
        ny = roobKudhabe_clamp(ny, minY, maxY);

        var changed = roobKudhabe_shiftLayerPosition(item.layer, nx - Number(item.position[0]), ny - Number(item.position[1]));

        /* Only shrink an ancestor overlay if it physically cannot fit. Never enlarge it. */
        var scaleFactor = Math.min(1.0, safeW / Math.max(1.0, item.width), safeH / Math.max(1.0, item.height));
        if (scaleFactor < 0.999) changed = roobKudhabe_adaptLayerScale(item.layer, scaleFactor) || changed;

        if (changed) moved++;
        else skipped++;
    }

    return { moved: moved, skipped: skipped };
}

function roobKudhabe_v11_centerChainLayer(layer, targetW, targetH, referenceTime) {
    if (!layer) return false;
    var bounds = roobKudhabe_v10_layerBounds(layer, referenceTime);
    if (!bounds) return false;
    var dx = (targetW / 2.0) - roobKudhabe_boundsCenterX(bounds);
    var dy = (targetH / 2.0) - roobKudhabe_boundsCenterY(bounds);
    return roobKudhabe_shiftLayerPosition(layer, dx, dy);
}

function roobKudhabe_v11_fitLeafOnce(comp, targetW, targetH, safeArea, adaptiveScale, scope, selectedMap, referenceTime) {
    /* Important: this is the ONLY fit/scale pass in the dominant nested chain. */
    return roobKudhabe_v10_fitDirectLayout(comp, targetW, targetH, referenceTime, safeArea, adaptiveScale, scope, selectedMap);
}

/* v1.1 override: no nested double-scaling. */
function roobKudhabe_recompose(targetW, targetH, scope, mode, preserveMotion, safeArea, duplicateComp, adaptiveScale) {
    var resolved = roobKudhabe_resolveTargetComposition();
    if (!resolved || !resolved.comp) return "NO_ACTIVE_COMP";
    var sourceComp = resolved.comp;

    targetW = Math.round(Number(targetW));
    targetH = Math.round(Number(targetH));
    if (!isFinite(targetW) || !isFinite(targetH) || targetW < 16 || targetH < 16 || targetW > 30000 || targetH > 30000) {
        return "ERROR~~RK_FIELD~~Invalid canvas size";
    }

    preserveMotion = String(preserveMotion) === "true";
    safeArea = String(safeArea) === "true";
    duplicateComp = String(duplicateComp) === "true";
    adaptiveScale = String(adaptiveScale) === "true";
    scope = String(scope || "all");
    mode = String(mode || "deep");

    var selectedMap = roobKudhabe_selectedIndexMap(sourceComp);
    if (scope === "selected") {
        var hasSelection = false;
        for (var selectedKey in selectedMap) {
            if (selectedMap.hasOwnProperty(selectedKey)) { hasSelection = true; break; }
        }
        if (!hasSelection) return "NO_SELECTION";
    }

    /* Keep the legacy modes available exactly as before. */
    if (mode !== "deep") {
        var compLegacy = sourceComp;
        var duplicatedLegacy = false;
        var oldWLegacy = sourceComp.width;
        var oldHLegacy = sourceComp.height;
        var movedLegacy = 0;
        var skippedLegacy = 0;
        var factorLegacy = 1.0;

        app.beginUndoGroup("SHAX - Recompose");
        try {
            if (duplicateComp) {
                compLegacy = sourceComp.duplicate();
                compLegacy.name = sourceComp.name + " [" + roobKudhabe_resizeLabel(targetW, targetH) + "]";
                duplicatedLegacy = true;
            }

            if (mode === "smartflow") {
                var legacyFlow = roobKudhabe_smartReflow(compLegacy, oldWLegacy, oldHLegacy, targetW, targetH, scope, selectedMap, sourceComp.time, safeArea, adaptiveScale);
                if (legacyFlow.error) throw new Error(legacyFlow.error);
                movedLegacy = legacyFlow.moved;
                skippedLegacy = legacyFlow.skipped;
                factorLegacy = legacyFlow.factor;
                compLegacy.width = targetW;
                compLegacy.height = targetH;
            } else if (mode === "fitcenter") {
                var legacyFit = roobKudhabe_fitCenterContent(compLegacy, targetW, targetH, scope, selectedMap, sourceComp.time, safeArea, adaptiveScale);
                if (legacyFit.error) throw new Error(legacyFit.error);
                movedLegacy = legacyFit.moved;
                skippedLegacy = legacyFit.skipped;
                factorLegacy = legacyFit.factor;
                compLegacy.width = targetW;
                compLegacy.height = targetH;
            } else {
                compLegacy.width = targetW;
                compLegacy.height = targetH;
                var areaFactor = Math.sqrt((targetW * targetH) / Math.max(1.0, oldWLegacy * oldHLegacy));
                areaFactor = roobKudhabe_clamp(areaFactor, 0.65, 1.35);
                for (var l = 1; l <= compLegacy.numLayers; l++) {
                    var legacyLayer = compLegacy.layer(l);
                    if (!legacyLayer) { skippedLegacy++; continue; }
                    if (scope === "selected" && !selectedMap[String(l)]) continue;
                    if (legacyLayer.parent !== null) { skippedLegacy++; continue; }
                    var legacyType = roobKudhabe_layerType(legacyLayer);
                    if (legacyType === "Camera" || legacyType === "Light") { skippedLegacy++; continue; }
                    var changedLegacy = roobKudhabe_recomposePosition(legacyLayer, oldWLegacy, oldHLegacy, targetW, targetH, mode, preserveMotion, safeArea, sourceComp.time);
                    if (adaptiveScale) roobKudhabe_adaptLayerScale(legacyLayer, areaFactor);
                    if (changedLegacy) movedLegacy++; else skippedLegacy++;
                }
            }

            if (duplicatedLegacy) {
                try { compLegacy.openInViewer(); } catch (legacyViewerError) {}
            }
        } catch (legacyError) {
            app.endUndoGroup();
            return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(legacyError.toString());
        }
        app.endUndoGroup();

        return "OK~~RK_FIELD~~" + movedLegacy +
            "~~RK_FIELD~~" + skippedLegacy +
            "~~RK_FIELD~~" + duplicatedLegacy +
            "~~RK_FIELD~~" + (Math.round(factorLegacy * 1000) / 10) +
            "~~RK_FIELD~~" + roobKudhabe_clean(compLegacy.name) +
            "~~RK_FIELD~~" + mode +
            "~~RK_FIELD~~0~~RK_FIELD~~0";
    }

    var comp = sourceComp;
    var duplicated = false;
    var moved = 0;
    var skipped = 0;
    var fitFactor = 1.0;
    var nestedCount = 0;
    var deepest = 0;

    app.beginUndoGroup("SHAX - Deep Chain Recompose");
    try {
        if (duplicateComp) {
            comp = sourceComp.duplicate();
            comp.name = sourceComp.name + " [" + roobKudhabe_resizeLabel(targetW, targetH) + "]";
            duplicated = true;

            var copyStats = { nestedCopies: 0, skipped: 0, deepest: 0 };
            roobKudhabe_v10_duplicateNestedTree(comp, {}, {}, 1, 12, copyStats, roobKudhabe_resizeLabel(targetW, targetH));
            skipped += copyStats.skipped;
        }

        var structure = roobKudhabe_v11_buildChain(comp, 12);
        var chain = structure.chain;
        var leaf = structure.leaf || comp;
        nestedCount = chain.length + 1;
        deepest = chain.length;

        var leafTime = 0;
        try { leafTime = Number(leaf.time); } catch (leafTimeError) { leafTime = 0; }
        if (!isFinite(leafTime)) leafTime = 0;

        /* Fit actual design content ONCE. This is the v1.1 double-scale fix. */
        var leafSelected = (leaf === comp) ? selectedMap : null;
        var leafScope = (leaf === comp) ? scope : "all";
        var leafFit = roobKudhabe_v11_fitLeafOnce(leaf, targetW, targetH, safeArea, adaptiveScale, leafScope, leafSelected, leafTime);
        if (leafFit.error) throw new Error(leafFit.error);
        moved += leafFit.moved;
        skipped += leafFit.skipped;
        fitFactor = leafFit.factor;
        leaf.width = targetW;
        leaf.height = targetH;

        /* Walk upward. No fitting or scaling of the dominant precomp again. */
        for (var c = chain.length - 1; c >= 0; c--) {
            var node = chain[c];
            var parentComp = node.comp;
            var chainLayer = node.layer;
            var extras = roobKudhabe_v11_captureExtras(parentComp, chainLayer, node.referenceTime);

            /* Source size changed, so remap the precomp layer anchor to the new source canvas. */
            roobKudhabe_v10_remapPrecompAnchor(chainLayer, node.childOldW, node.childOldH, targetW, targetH);

            parentComp.width = targetW;
            parentComp.height = targetH;

            if (roobKudhabe_v11_centerChainLayer(chainLayer, targetW, targetH, node.referenceTime)) moved++;
            else skipped++;

            var extraResult = roobKudhabe_v11_applyExtras(extras, node.oldW, node.oldH, targetW, targetH, safeArea, node.referenceTime);
            moved += extraResult.moved;
            skipped += extraResult.skipped;
        }

        /* If there was no dominant chain, leaf === root and the single fit already resized it. */
        if (chain.length === 0) {
            comp.width = targetW;
            comp.height = targetH;
        }

        if (duplicated) {
            try { comp.openInViewer(); } catch (viewerError) {}
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();

    return "OK~~RK_FIELD~~" + moved +
        "~~RK_FIELD~~" + skipped +
        "~~RK_FIELD~~" + duplicated +
        "~~RK_FIELD~~" + (Math.round(fitFactor * 1000) / 10) +
        "~~RK_FIELD~~" + roobKudhabe_clean(comp.name) +
        "~~RK_FIELD~~deep" +
        "~~RK_FIELD~~" + nestedCount +
        "~~RK_FIELD~~" + deepest;
}


/* ===== RoobKudhabe v1.2 Brand System host helpers ===== */
function roobKudhabe_brandClamp01(value) {
    value = Number(value);
    if (!isFinite(value)) value = 0;
    return Math.max(0, Math.min(1, value));
}

function roobKudhabe_brandHexToRgb(hex) {
    var text = String(hex || "").replace("#", "");
    if (text.length !== 6) return null;
    var r = parseInt(text.substring(0, 2), 16);
    var g = parseInt(text.substring(2, 4), 16);
    var b = parseInt(text.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r / 255, g / 255, b / 255];
}

function roobKudhabe_brandRgbToHex(rgb) {
    if (!(rgb instanceof Array) || rgb.length < 3) return "";
    function part(v) {
        var n = Math.round(roobKudhabe_brandClamp01(v) * 255);
        var s = n.toString(16).toUpperCase();
        return s.length < 2 ? "0" + s : s;
    }
    return "#" + part(rgb[0]) + part(rgb[1]) + part(rgb[2]);
}

function roobKudhabe_brandFindShapeColor(group) {
    if (!group) return null;
    try {
        if (group.matchName === "ADBE Vector Fill Color" || group.matchName === "ADBE Vector Stroke Color") {
            return group.value;
        }
    } catch (e0) {}
    var total = 0;
    try { total = group.numProperties || 0; } catch (e1) { total = 0; }
    for (var i = 1; i <= total; i++) {
        var child = null;
        try { child = group.property(i); } catch (e2) { child = null; }
        if (!child) continue;
        var found = roobKudhabe_brandFindShapeColor(child);
        if (found) return found;
    }
    return null;
}

function roobKudhabe_brandSetShapeColors(group, rgb) {
    if (!group) return 0;
    var changed = 0;
    try {
        if (group.matchName === "ADBE Vector Fill Color" || group.matchName === "ADBE Vector Stroke Color") {
            group.setValue(rgb);
            return 1;
        }
    } catch (e0) {}
    var total = 0;
    try { total = group.numProperties || 0; } catch (e1) { total = 0; }
    for (var i = 1; i <= total; i++) {
        var child = null;
        try { child = group.property(i); } catch (e2) { child = null; }
        if (!child) continue;
        changed += roobKudhabe_brandSetShapeColors(child, rgb);
    }
    return changed;
}

function roobKudhabe_captureBrandFromSelection() {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) return "NO_SELECTION";

    var font = "";
    var color = "";
    for (var i = 0; i < selected.length; i++) {
        var layer = selected[i];
        try {
            if (layer instanceof TextLayer) {
                var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
                if (textProp) {
                    var doc = textProp.value;
                    if (!font && doc.font) font = String(doc.font);
                    if (!color && doc.applyFill && doc.fillColor) color = roobKudhabe_brandRgbToHex(doc.fillColor);
                }
            } else if (layer instanceof ShapeLayer && !color) {
                var root = layer.property("ADBE Root Vectors Group");
                var rgb = roobKudhabe_brandFindShapeColor(root);
                if (rgb) color = roobKudhabe_brandRgbToHex(rgb);
            }
        } catch (e) {}
        if (font && color) break;
    }
    if (!font && !color) return "NO_STYLE";
    return "OK~~RK_FIELD~~" + roobKudhabe_clean(font) + "~~RK_FIELD~~" + roobKudhabe_clean(color);
}

function roobKudhabe_applyBrandColor(hex) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) return "NO_SELECTION";
    var rgb = roobKudhabe_brandHexToRgb(hex);
    if (!rgb) return "ERROR~~RK_FIELD~~Invalid HEX color";

    var layersChanged = 0;
    var propertiesChanged = 0;
    app.beginUndoGroup("SHAX - Apply Brand Color");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var layerChanged = 0;
            try {
                if (layer instanceof TextLayer) {
                    var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
                    if (textProp) {
                        var doc = textProp.value;
                        doc.applyFill = true;
                        doc.fillColor = rgb;
                        textProp.setValue(doc);
                        layerChanged = 1;
                        propertiesChanged++;
                    }
                } else if (layer instanceof ShapeLayer) {
                    var root = layer.property("ADBE Root Vectors Group");
                    var shapeCount = roobKudhabe_brandSetShapeColors(root, rgb);
                    if (shapeCount > 0) {
                        layerChanged = 1;
                        propertiesChanged += shapeCount;
                    }
                }
            } catch (layerError) {}
            if (layerChanged) layersChanged++;
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + layersChanged + "~~RK_FIELD~~" + propertiesChanged;
}

function roobKudhabe_applyBrandFont(fontName) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) return "NO_SELECTION";
    fontName = String(fontName || "");
    if (!fontName) return "ERROR~~RK_FIELD~~Empty font";

    var changed = 0;
    var failed = 0;
    app.beginUndoGroup("SHAX - Apply Brand Font");
    for (var i = 0; i < selected.length; i++) {
        var layer = selected[i];
        try {
            if (!(layer instanceof TextLayer)) continue;
            var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
            if (!textProp) continue;
            var doc = textProp.value;
            doc.font = fontName;
            textProp.setValue(doc);
            changed++;
        } catch (e) { failed++; }
    }
    app.endUndoGroup();
    if (changed < 1 && failed > 0) return "ERROR~~RK_FIELD~~Font unavailable or invalid";
    return "OK~~RK_FIELD~~" + changed + "~~RK_FIELD~~" + failed;
}

function roobKudhabe_chooseLogo() {
    try {
        var file = File.openDialog("Choose brand logo", "Images:*.png;*.jpg;*.jpeg;*.psd;*.ai;*.eps;*.tif;*.tiff;*.svg,All files:*.*", false);
        if (!file) return "CANCEL";
        return roobKudhabe_clean(file.fsName);
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
}

function roobKudhabe_brandFootageForFile(file) {
    var project = app.project;
    if (!project || !file) return null;
    try {
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (item && item instanceof FootageItem && item.file && item.file.fsName === file.fsName) return item;
        }
    } catch (e) {}
    return null;
}

function roobKudhabe_placeLogo(path, placement, widthPercent) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var file = new File(String(path || ""));
    if (!file.exists) return "ERROR~~RK_FIELD~~Logo file not found";
    widthPercent = Number(widthPercent);
    if (!isFinite(widthPercent)) widthPercent = 14;
    widthPercent = Math.max(4, Math.min(40, widthPercent));

    app.beginUndoGroup("SHAX - Place Brand Logo");
    try {
        var footage = roobKudhabe_brandFootageForFile(file);
        if (!footage) {
            var options = new ImportOptions(file);
            footage = app.project.importFile(options);
        }
        var layer = comp.layers.add(footage);
        layer.name = "Brand Logo · " + footage.name;
        var transform = layer.property("ADBE Transform Group");
        var scale = transform.property("ADBE Scale");
        var position = transform.property("ADBE Position");
        var targetWidth = comp.width * (widthPercent / 100.0);
        var sourceWidth = Math.max(1, Number(footage.width || 1));
        var scalePct = (targetWidth / sourceWidth) * 100.0;
        var scaleValue = scale.value;
        if (scaleValue instanceof Array) {
            for (var s = 0; s < scaleValue.length; s++) scaleValue[s] = scalePct;
            scale.setValue(scaleValue);
        }
        var margin = Math.max(20, Math.min(comp.width, comp.height) * 0.055);
        var displayedW = sourceWidth * (scalePct / 100.0);
        var displayedH = Math.max(1, Number(footage.height || 1)) * (scalePct / 100.0);
        var x = comp.width / 2;
        var y = comp.height / 2;
        placement = String(placement || "top-right");
        if (placement === "top-left") { x = margin + displayedW / 2; y = margin + displayedH / 2; }
        else if (placement === "top-right") { x = comp.width - margin - displayedW / 2; y = margin + displayedH / 2; }
        else if (placement === "bottom-left") { x = margin + displayedW / 2; y = comp.height - margin - displayedH / 2; }
        else if (placement === "bottom-right") { x = comp.width - margin - displayedW / 2; y = comp.height - margin - displayedH / 2; }
        var posValue = position.value;
        if (posValue instanceof Array) {
            posValue[0] = x; posValue[1] = y;
            position.setValue(posValue);
        }
        try { layer.motionBlur = true; } catch (blurError) {}
        try { layer.selected = true; } catch (selectError) {}
        app.endUndoGroup();
        return "OK~~RK_FIELD~~" + roobKudhabe_clean(layer.name);
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
}

/* ===== RoobKudhabe v1.3: Illustrator-style Alignment Studio ===== */
function roobKudhabe_v13_identityMatrix() {
    return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}

function roobKudhabe_v13_mulMatrix(m1, m2) {
    return {
        a: m1.a * m2.a + m1.c * m2.b,
        b: m1.b * m2.a + m1.d * m2.b,
        c: m1.a * m2.c + m1.c * m2.d,
        d: m1.b * m2.c + m1.d * m2.d,
        tx: m1.a * m2.tx + m1.c * m2.ty + m1.tx,
        ty: m1.b * m2.tx + m1.d * m2.ty + m1.ty
    };
}

function roobKudhabe_v13_transformPoint(m, x, y) {
    return [m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty];
}

function roobKudhabe_v13_positionAt(layer, time) {
    try {
        var transform = layer.property("ADBE Transform Group");
        var position = transform ? transform.property("ADBE Position") : null;
        if (!position) return [0, 0];
        if (position.dimensionsSeparated) {
            return [
                Number(position.getSeparationFollower(0).valueAtTime(time, false)),
                Number(position.getSeparationFollower(1).valueAtTime(time, false))
            ];
        }
        var v = position.valueAtTime(time, false);
        return [Number(v[0]), Number(v[1])];
    } catch (e) { return [0, 0]; }
}

function roobKudhabe_v13_localMatrix(layer, time) {
    var transform = null;
    try { transform = layer.property("ADBE Transform Group"); } catch (e0) {}
    if (!transform) return roobKudhabe_v13_identityMatrix();

    var anchor = [0, 0];
    var scale = [100, 100];
    var rotation = 0;
    var position = roobKudhabe_v13_positionAt(layer, time);
    try {
        var a = transform.property("ADBE Anchor Point");
        if (a) anchor = a.valueAtTime(time, false);
    } catch (e1) {}
    try {
        var s = transform.property("ADBE Scale");
        if (s) scale = s.valueAtTime(time, false);
    } catch (e2) {}
    try {
        var r = transform.property("ADBE Rotate Z");
        if (!r) r = transform.property("ADBE Rotation");
        if (r) rotation = Number(r.valueAtTime(time, false));
    } catch (e3) {}

    var sx = Number(scale[0]) / 100.0;
    var sy = Number(scale.length > 1 ? scale[1] : scale[0]) / 100.0;
    var ax = Number(anchor[0] || 0);
    var ay = Number(anchor[1] || 0);
    var px = Number(position[0] || 0);
    var py = Number(position[1] || 0);
    var rad = rotation * Math.PI / 180.0;
    var cosR = Math.cos(rad);
    var sinR = Math.sin(rad);
    var aa = cosR * sx;
    var bb = sinR * sx;
    var cc = -sinR * sy;
    var dd = cosR * sy;
    return {
        a: aa,
        b: bb,
        c: cc,
        d: dd,
        tx: px - aa * ax - cc * ay,
        ty: py - bb * ax - dd * ay
    };
}

function roobKudhabe_v13_worldMatrix(layer, time) {
    var chain = [];
    var cursor = layer;
    var guard = 0;
    while (cursor && guard < 64) {
        chain.push(cursor);
        try { cursor = cursor.parent; } catch (e) { cursor = null; }
        guard++;
    }
    var m = roobKudhabe_v13_identityMatrix();
    for (var i = chain.length - 1; i >= 0; i--) {
        m = roobKudhabe_v13_mulMatrix(m, roobKudhabe_v13_localMatrix(chain[i], time));
    }
    return m;
}

function roobKudhabe_v13_parentWorldMatrix(layer, time) {
    try {
        if (layer.parent) return roobKudhabe_v13_worldMatrix(layer.parent, time);
    } catch (e) {}
    return roobKudhabe_v13_identityMatrix();
}

function roobKudhabe_v13_sourceRect(layer, time) {
    var rect = null;
    try { rect = layer.sourceRectAtTime(time, false); } catch (e0) {}
    if (rect && isFinite(Number(rect.width)) && isFinite(Number(rect.height)) && Number(rect.width) >= 0 && Number(rect.height) >= 0) {
        if (Number(rect.width) > 0 || Number(rect.height) > 0) {
            return { left: Number(rect.left), top: Number(rect.top), width: Number(rect.width), height: Number(rect.height) };
        }
    }
    var w = 0;
    var h = 0;
    try { w = Number(layer.width); } catch (e1) {}
    try { h = Number(layer.height); } catch (e2) {}
    if (isFinite(w) && isFinite(h) && w > 0 && h > 0) return { left: 0, top: 0, width: w, height: h };
    return { left: 0, top: 0, width: 0, height: 0 };
}

function roobKudhabe_v13_visualBounds(layer, time) {
    try {
        if (!layer || layer.threeDLayer) return null;
        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light") return null;
        var rect = roobKudhabe_v13_sourceRect(layer, time);
        var m = roobKudhabe_v13_worldMatrix(layer, time);
        var corners;
        if (rect.width <= 0 && rect.height <= 0) {
            corners = [[0, 0]];
        } else {
            corners = [
                [rect.left, rect.top],
                [rect.left + rect.width, rect.top],
                [rect.left + rect.width, rect.top + rect.height],
                [rect.left, rect.top + rect.height]
            ];
        }
        var minX = 999999999;
        var minY = 999999999;
        var maxX = -999999999;
        var maxY = -999999999;
        for (var i = 0; i < corners.length; i++) {
            var p = roobKudhabe_v13_transformPoint(m, corners[i][0], corners[i][1]);
            if (p[0] < minX) minX = p[0];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] < minY) minY = p[1];
            if (p[1] > maxY) maxY = p[1];
        }
        return {
            minX: minX,            minY: minY,
            maxX: maxX,
            maxY: maxY,
            width: Math.max(0, maxX - minX),
            height: Math.max(0, maxY - minY),
            centerX: (minX + maxX) / 2.0,
            centerY: (minY + maxY) / 2.0
        };
    } catch (e) { return null; }
}

function roobKudhabe_v13_collectSelected(comp, time) {
    var result = { items: [], skipped: 0 };
    var selected = comp.selectedLayers;
    if (!selected || !selected.length) return result;
    for (var i = 0; i < selected.length; i++) {
        var layer = selected[i];
        var bounds = roobKudhabe_v13_visualBounds(layer, time);
        if (!bounds) { result.skipped++; continue; }
        var depth = 0;
        var cursor = null;
        try { cursor = layer.parent; } catch (e0) {}
        while (cursor && depth < 64) {
            depth++;
            try { cursor = cursor.parent; } catch (e1) { cursor = null; }
        }
        result.items.push({ layer: layer, index: layer.index, bounds: bounds, depth: depth });
    }
    return result;
}

function roobKudhabe_v13_union(items) {
    if (!items || !items.length) return null;
    var b = { minX: items[0].bounds.minX, minY: items[0].bounds.minY, maxX: items[0].bounds.maxX, maxY: items[0].bounds.maxY };
    for (var i = 1; i < items.length; i++) {
        var x = items[i].bounds;
        if (x.minX < b.minX) b.minX = x.minX;
        if (x.minY < b.minY) b.minY = x.minY;
        if (x.maxX > b.maxX) b.maxX = x.maxX;
        if (x.maxY > b.maxY) b.maxY = x.maxY;
    }
    b.width = b.maxX - b.minX;
    b.height = b.maxY - b.minY;
    b.centerX = (b.minX + b.maxX) / 2.0;
    b.centerY = (b.minY + b.maxY) / 2.0;
    return b;
}

function roobKudhabe_v13_findItem(items, indexValue) {
    var wanted = Number(indexValue);
    for (var i = 0; i < items.length; i++) if (Number(items[i].index) === wanted) return items[i];
    return null;
}

function roobKudhabe_v13_shiftScalar(prop, delta, preserveMotion, time) {
    if (!prop || !isFinite(delta) || Math.abs(delta) < 0.00001) return true;
    try {
        if (preserveMotion && prop.numKeys > 0) {
            for (var k = 1; k <= prop.numKeys; k++) prop.setValueAtKey(k, Number(prop.keyValue(k)) + delta);
        } else if (prop.numKeys > 0) {
            prop.setValueAtTime(time, Number(prop.valueAtTime(time, false)) + delta);
        } else {
            prop.setValue(Number(prop.value) + delta);
        }
        return true;
    } catch (e) { return false; }
}

function roobKudhabe_v13_shiftArrayProperty(prop, dx, dy, preserveMotion, time) {
    if (!prop) return false;
    try {
        if (preserveMotion && prop.numKeys > 0) {
            for (var k = 1; k <= prop.numKeys; k++) {
                var v = roobKudhabe_cloneValue(prop.keyValue(k));
                v[0] += dx;
                v[1] += dy;
                prop.setValueAtKey(k, v);
            }
        } else if (prop.numKeys > 0) {
            var at = roobKudhabe_cloneValue(prop.valueAtTime(time, false));
            at[0] += dx;
            at[1] += dy;
            prop.setValueAtTime(time, at);
        } else {
            var value = roobKudhabe_cloneValue(prop.value);
            value[0] += dx;
            value[1] += dy;
            prop.setValue(value);
        }
        return true;
    } catch (e) { return false; }
}

function roobKudhabe_v13_compVectorToParent(layer, dx, dy, time) {
    var m = roobKudhabe_v13_parentWorldMatrix(layer, time);
    var det = m.a * m.d - m.b * m.c;
    if (!isFinite(det) || Math.abs(det) < 0.0000001) return [dx, dy];
    return [
        (m.d * dx - m.c * dy) / det,
        (-m.b * dx + m.a * dy) / det
    ];
}

function roobKudhabe_v13_shiftLayer(layer, dxComp, dyComp, preserveMotion, time) {
    if (!layer || (!isFinite(dxComp) && !isFinite(dyComp))) return false;
    dxComp = isFinite(dxComp) ? Number(dxComp) : 0;
    dyComp = isFinite(dyComp) ? Number(dyComp) : 0;
    if (Math.abs(dxComp) < 0.00001 && Math.abs(dyComp) < 0.00001) return true;
    var local = roobKudhabe_v13_compVectorToParent(layer, dxComp, dyComp, time);
    try {
        var transform = layer.property("ADBE Transform Group");
        var position = transform ? transform.property("ADBE Position") : null;
        if (!position) return false;
        if (position.dimensionsSeparated) {
            var okX = roobKudhabe_v13_shiftScalar(position.getSeparationFollower(0), local[0], preserveMotion, time);
            var okY = roobKudhabe_v13_shiftScalar(position.getSeparationFollower(1), local[1], preserveMotion, time);
            return okX && okY;
        }
        return roobKudhabe_v13_shiftArrayProperty(position, local[0], local[1], preserveMotion, time);
    } catch (e) { return false; }
}

function roobKudhabe_v13_nearestSelectedAncestorDelta(layer, deltaMap) {
    var cursor = null;
    try { cursor = layer.parent; } catch (e0) {}
    var guard = 0;
    while (cursor && guard < 64) {
        var key = String(cursor.index);
        if (deltaMap[key]) return deltaMap[key];
        try { cursor = cursor.parent; } catch (e1) { cursor = null; }
        guard++;
    }
    return [0, 0];
}

function roobKudhabe_v13_applyDeltas(items, deltaMap, preserveMotion, time) {
    var sorted = items.slice(0);
    sorted.sort(function (a, b) { return a.depth - b.depth; });
    var moved = 0;
    var skipped = 0;
    for (var i = 0; i < sorted.length; i++) {
        var item = sorted[i];
        var desired = deltaMap[String(item.index)] || [0, 0];
        var inherited = roobKudhabe_v13_nearestSelectedAncestorDelta(item.layer, deltaMap);
        var dx = desired[0] - inherited[0];
        var dy = desired[1] - inherited[1];
        if (Math.abs(dx) < 0.00001 && Math.abs(dy) < 0.00001) continue;
        if (roobKudhabe_v13_shiftLayer(item.layer, dx, dy, preserveMotion, time)) moved++;
        else skipped++;
    }
    return { moved: moved, skipped: skipped };
}

function roobKudhabe_v13_alignmentTarget(action, bounds) {
    if (action === "left") return bounds.minX;
    if (action === "hcenter") return bounds.centerX;
    if (action === "right") return bounds.maxX;
    if (action === "top") return bounds.minY;
    if (action === "vcenter") return bounds.centerY;
    if (action === "bottom") return bounds.maxY;
    return 0;
}

function roobKudhabe_alignSelected(action, alignTo, keyIndex, preserveMotion) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var selected = comp.selectedLayers;
    if (!selected || !selected.length) return "NO_SELECTION";
    preserveMotion = String(preserveMotion) === "true";
    var time = comp.time;
    var collected = roobKudhabe_v13_collectSelected(comp, time);
    var items = collected.items;
    if (!items.length) return "ERROR~~RK_FIELD~~No alignable 2D layers in selection";
    if (alignTo === "selection" && items.length < 2) return "NEED_TWO";

    var reference = null;
    var keyItem = null;
    if (alignTo === "composition") {
        reference = { minX: 0, minY: 0, maxX: comp.width, maxY: comp.height, centerX: comp.width / 2.0, centerY: comp.height / 2.0 };
    } else if (alignTo === "key") {
        keyItem = roobKudhabe_v13_findItem(items, keyIndex);
        if (!keyItem) return "KEY_NOT_FOUND";
        reference = keyItem.bounds;
    } else {
        reference = roobKudhabe_v13_union(items);
    }

    var refValue = roobKudhabe_v13_alignmentTarget(action, reference);
    var deltaMap = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (keyItem && item.index === keyItem.index) { deltaMap[String(item.index)] = [0, 0]; continue; }
        var value = roobKudhabe_v13_alignmentTarget(action, item.bounds);
        if (action === "left" || action === "hcenter" || action === "right") deltaMap[String(item.index)] = [refValue - value, 0];
        else deltaMap[String(item.index)] = [0, refValue - value];
    }

    app.beginUndoGroup("SHAX - Align");
    var result;
    try { result = roobKudhabe_v13_applyDeltas(items, deltaMap, preserveMotion, time); }
    catch (e) { app.endUndoGroup(); return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString()); }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + result.moved + "~~RK_FIELD~~" + (result.skipped + collected.skipped);
}

function roobKudhabe_v13_refValue(item, action) {
    var b = item.bounds;
    if (action === "h-left") return b.minX;
    if (action === "h-center") return b.centerX;
    if (action === "h-right") return b.maxX;
    if (action === "v-top") return b.minY;
    if (action === "v-center") return b.centerY;
    if (action === "v-bottom") return b.maxY;
    return 0;
}

function roobKudhabe_v13_distributionRange(items, action, comp) {
    var first = items[0];
    var last = items[items.length - 1];
    if (action === "h-left") return [0, comp.width - last.bounds.width];
    if (action === "h-center") return [first.bounds.width / 2.0, comp.width - last.bounds.width / 2.0];
    if (action === "h-right") return [first.bounds.width, comp.width];
    if (action === "v-top") return [0, comp.height - last.bounds.height];
    if (action === "v-center") return [first.bounds.height / 2.0, comp.height - last.bounds.height / 2.0];
    if (action === "v-bottom") return [first.bounds.height, comp.height];
    return [roobKudhabe_v13_refValue(first, action), roobKudhabe_v13_refValue(last, action)];
}

function roobKudhabe_distributeSelected(action, alignTo, keyIndex, preserveMotion) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    if (!comp.selectedLayers || comp.selectedLayers.length < 2) return "NEED_TWO";
    preserveMotion = String(preserveMotion) === "true";
    var time = comp.time;
    var collected = roobKudhabe_v13_collectSelected(comp, time);
    var items = collected.items;
    if (items.length < 2) return "NEED_TWO";
    items.sort(function (a, b) { return roobKudhabe_v13_refValue(a, action) - roobKudhabe_v13_refValue(b, action); });

    var keyItem = null;
    if (alignTo === "key") {
        keyItem = roobKudhabe_v13_findItem(items, keyIndex);
        if (!keyItem) return "KEY_NOT_FOUND";
    }

    var targets = {};
    var n = items.length;
    if (alignTo === "composition") {
        var range = roobKudhabe_v13_distributionRange(items, action, comp);
        var step = n > 1 ? (range[1] - range[0]) / (n - 1) : 0;
        for (var i = 0; i < n; i++) targets[String(items[i].index)] = range[0] + step * i;
    } else if (alignTo === "key") {
        var keyPos = -1;
        for (var k = 0; k < n; k++) if (items[k].index === keyItem.index) { keyPos = k; break; }
        var keyRef = roobKudhabe_v13_refValue(keyItem, action);
        targets[String(keyItem.index)] = keyRef;
        if (keyPos > 0) {
            var leftStart = roobKudhabe_v13_refValue(items[0], action);
            var leftStep = (keyRef - leftStart) / keyPos;
            for (var l = 0; l < keyPos; l++) targets[String(items[l].index)] = leftStart + leftStep * l;
        }
        if (keyPos < n - 1) {
            var rightEnd = roobKudhabe_v13_refValue(items[n - 1], action);
            var rightCount = n - 1 - keyPos;
            var rightStep = (rightEnd - keyRef) / rightCount;
            for (var r = keyPos + 1; r < n; r++) targets[String(items[r].index)] = keyRef + rightStep * (r - keyPos);
        }
    } else {
        var start = roobKudhabe_v13_refValue(items[0], action);
        var end = roobKudhabe_v13_refValue(items[n - 1], action);
        var selectionStep = n > 1 ? (end - start) / (n - 1) : 0;
        for (var s = 0; s < n; s++) targets[String(items[s].index)] = start + selectionStep * s;
    }

    var horizontal = action.indexOf("h-") === 0;
    var deltaMap = {};
    for (var j = 0; j < n; j++) {
        var item = items[j];
        if (keyItem && item.index === keyItem.index) { deltaMap[String(item.index)] = [0, 0]; continue; }
        var delta = Number(targets[String(item.index)]) - roobKudhabe_v13_refValue(item, action);
        deltaMap[String(item.index)] = horizontal ? [delta, 0] : [0, delta];
    }

    app.beginUndoGroup("SHAX - Distribute");
    var result;
    try { result = roobKudhabe_v13_applyDeltas(items, deltaMap, preserveMotion, time); }
    catch (e) { app.endUndoGroup(); return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString()); }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + result.moved + "~~RK_FIELD~~" + (result.skipped + collected.skipped);
}

function roobKudhabe_distributeSpacing(axis, spacing, alignTo, keyIndex, preserveMotion) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    if (!comp.selectedLayers || comp.selectedLayers.length < 2) return "NEED_TWO";
    spacing = Number(spacing);
    if (!isFinite(spacing)) return "ERROR~~RK_FIELD~~Invalid spacing";
    preserveMotion = String(preserveMotion) === "true";
    var horizontal = axis === "horizontal";
    var time = comp.time;
    var collected = roobKudhabe_v13_collectSelected(comp, time);
    var items = collected.items;
    if (items.length < 2) return "NEED_TWO";
    items.sort(function (a, b) { return horizontal ? a.bounds.minX - b.bounds.minX : a.bounds.minY - b.bounds.minY; });

    var keyItem = null;
    if (alignTo === "key") {
        keyItem = roobKudhabe_v13_findItem(items, keyIndex);
        if (!keyItem) return "KEY_NOT_FOUND";
    }

    var targetStart = {};
    var n = items.length;
    if (alignTo === "key") {
        var kp = -1;
        for (var k = 0; k < n; k++) if (items[k].index === keyItem.index) { kp = k; break; }
        targetStart[String(keyItem.index)] = horizontal ? keyItem.bounds.minX : keyItem.bounds.minY;
        var cursorRight = horizontal ? keyItem.bounds.maxX : keyItem.bounds.maxY;
        for (var r = kp + 1; r < n; r++) {
            cursorRight += spacing;
            targetStart[String(items[r].index)] = cursorRight;
            cursorRight += horizontal ? items[r].bounds.width : items[r].bounds.height;
        }
        var cursorLeft = horizontal ? keyItem.bounds.minX : keyItem.bounds.minY;
        for (var l = kp - 1; l >= 0; l--) {
            cursorLeft -= spacing + (horizontal ? items[l].bounds.width : items[l].bounds.height);
            targetStart[String(items[l].index)] = cursorLeft;
        }
    } else {
        var start;
        if (alignTo === "composition") {
            var total = 0;
            for (var t = 0; t < n; t++) total += horizontal ? items[t].bounds.width : items[t].bounds.height;
            total += spacing * (n - 1);
            start = ((horizontal ? comp.width : comp.height) - total) / 2.0;
        } else {
            start = horizontal ? items[0].bounds.minX : items[0].bounds.minY;
        }
        var cursor = start;
        for (var i = 0; i < n; i++) {
            targetStart[String(items[i].index)] = cursor;
            cursor += (horizontal ? items[i].bounds.width : items[i].bounds.height) + spacing;
        }
    }

    var deltaMap = {};
    for (var j = 0; j < n; j++) {
        var item = items[j];
        if (keyItem && item.index === keyItem.index) { deltaMap[String(item.index)] = [0, 0]; continue; }
        var currentStart = horizontal ? item.bounds.minX : item.bounds.minY;
        var delta = Number(targetStart[String(item.index)]) - currentStart;
        deltaMap[String(item.index)] = horizontal ? [delta, 0] : [0, delta];
    }

    app.beginUndoGroup("SHAX - Distribute Spacing");
    var result;
    try { result = roobKudhabe_v13_applyDeltas(items, deltaMap, preserveMotion, time); }
    catch (e) { app.endUndoGroup(); return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString()); }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + result.moved + "~~RK_FIELD~~" + (result.skipped + collected.skipped);
}


/* ===== RoobKudhabe v1.4: Anchor Point Studio ===== */
function roobKudhabe_v14_anchorTarget(rect, action) {
    var left = Number(rect.left || 0);
    var top = Number(rect.top || 0);
    var right = left + Number(rect.width || 0);
    var bottom = top + Number(rect.height || 0);
    var centerX = (left + right) / 2.0;
    var centerY = (top + bottom) / 2.0;
    if (action === "top-left") return [left, top];
    if (action === "top-center") return [centerX, top];
    if (action === "top-right") return [right, top];
    if (action === "middle-left") return [left, centerY];
    if (action === "center") return [centerX, centerY];
    if (action === "middle-right") return [right, centerY];
    if (action === "bottom-left") return [left, bottom];
    if (action === "bottom-center") return [centerX, bottom];
    if (action === "bottom-right") return [right, bottom];
    return [centerX, centerY];
}

function roobKudhabe_v14_propertyHasExpression(prop) {
    try { return !!(prop && prop.expressionEnabled); } catch (e) { return false; }
}

function roobKudhabe_v14_canShiftPosition(layer) {
    try {
        var transform = layer.property("ADBE Transform Group");
        var position = transform ? transform.property("ADBE Position") : null;
        if (!position) return false;
        if (position.dimensionsSeparated) {
            var x = position.getSeparationFollower(0);
            var y = position.getSeparationFollower(1);
            return !roobKudhabe_v14_propertyHasExpression(x) && !roobKudhabe_v14_propertyHasExpression(y);
        }
        return !roobKudhabe_v14_propertyHasExpression(position);
    } catch (e) { return false; }
}

function roobKudhabe_v14_shiftAnchorProperty(prop, dx, dy, preserveMotion, time) {
    if (!prop || roobKudhabe_v14_propertyHasExpression(prop)) return false;
    try {
        if (preserveMotion && prop.numKeys > 0) {
            for (var k = 1; k <= prop.numKeys; k++) {
                var keyValue = roobKudhabe_cloneValue(prop.keyValue(k));
                keyValue[0] += dx;
                keyValue[1] += dy;
                prop.setValueAtKey(k, keyValue);
            }
        } else if (prop.numKeys > 0) {
            var at = roobKudhabe_cloneValue(prop.valueAtTime(time, false));
            at[0] += dx;
            at[1] += dy;
            prop.setValueAtTime(time, at);
        } else {
            var value = roobKudhabe_cloneValue(prop.value);
            value[0] += dx;
            value[1] += dy;
            prop.setValue(value);
        }
        return true;
    } catch (e) { return false; }
}

function roobKudhabe_v14_shiftPositionParentSpace(layer, dx, dy, preserveMotion, time) {
    try {
        var transform = layer.property("ADBE Transform Group");
        var position = transform ? transform.property("ADBE Position") : null;
        if (!position) return false;
        if (position.dimensionsSeparated) {
            var x = position.getSeparationFollower(0);
            var y = position.getSeparationFollower(1);
            if (roobKudhabe_v14_propertyHasExpression(x) || roobKudhabe_v14_propertyHasExpression(y)) return false;
            return roobKudhabe_v13_shiftScalar(x, dx, preserveMotion, time) && roobKudhabe_v13_shiftScalar(y, dy, preserveMotion, time);
        }
        if (roobKudhabe_v14_propertyHasExpression(position)) return false;
        return roobKudhabe_v13_shiftArrayProperty(position, dx, dy, preserveMotion, time);
    } catch (e) { return false; }
}

function roobKudhabe_setAnchorPoint(action, keepPosition, preserveMotion) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var selected = comp.selectedLayers;
    if (!selected || !selected.length) return "NO_SELECTION";
    keepPosition = String(keepPosition) === "true";
    preserveMotion = String(preserveMotion) === "true";
    var time = comp.time;
    var changed = 0;
    var skipped = 0;

    app.beginUndoGroup("SHAX - Anchor Point");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            try {
                if (!layer || layer.threeDLayer) { skipped++; continue; }
                var type = roobKudhabe_layerType(layer);
                if (type === "Camera" || type === "Light") { skipped++; continue; }
                var transform = layer.property("ADBE Transform Group");
                var anchor = transform ? transform.property("ADBE Anchor Point") : null;
                if (!anchor || roobKudhabe_v14_propertyHasExpression(anchor)) { skipped++; continue; }
                if (keepPosition && !roobKudhabe_v14_canShiftPosition(layer)) { skipped++; continue; }

                var rect = roobKudhabe_v13_sourceRect(layer, time);
                var target = roobKudhabe_v14_anchorTarget(rect, action);
                var current = anchor.valueAtTime(time, false);
                var dx = Number(target[0]) - Number(current[0] || 0);
                var dy = Number(target[1]) - Number(current[1] || 0);
                if (!isFinite(dx) || !isFinite(dy)) { skipped++; continue; }
                if (Math.abs(dx) < 0.00001 && Math.abs(dy) < 0.00001) { changed++; continue; }

                /* Anchor delta is in layer space. Convert it to the layer's parent space
                   using the layer's own scale and rotation so the visual transform stays identical. */
                var localMatrix = roobKudhabe_v13_localMatrix(layer, time);
                var posDx = localMatrix.a * dx + localMatrix.c * dy;
                var posDy = localMatrix.b * dx + localMatrix.d * dy;

                if (!roobKudhabe_v14_shiftAnchorProperty(anchor, dx, dy, preserveMotion, time)) { skipped++; continue; }
                if (keepPosition) {
                    if (!roobKudhabe_v14_shiftPositionParentSpace(layer, posDx, posDy, preserveMotion, time)) {
                        /* Roll back the anchor change if Position could not be compensated. */
                        roobKudhabe_v14_shiftAnchorProperty(anchor, -dx, -dy, preserveMotion, time);
                        skipped++;
                        continue;
                    }
                }
                changed++;
            } catch (layerError) { skipped++; }
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + changed + "~~RK_FIELD~~" + skipped;
}

/* ===== RoobKudhabe v1.5: Project Organizer ===== */
function roobKudhabe_v15_projectName(project) {
    try {
        if (project && project.file) return roobKudhabe_clean(project.file.name);
    } catch (e) {}
    return "Untitled Project";
}

function roobKudhabe_v15_extension(item) {
    var name = "";
    try {
        if (item && item.file) name = String(item.file.name || "");
    } catch (e1) {}
    if (!name) {
        try { name = String(item.name || ""); } catch (e2) { name = ""; }
    }
    var index = name.lastIndexOf(".");
    if (index < 0 || index >= name.length - 1) return "";
    return name.substring(index + 1).toLowerCase();
}

function roobKudhabe_v15_isDesignExt(ext) {
    return ext === "ai" || ext === "psd" || ext === "psb" || ext === "eps" || ext === "svg";
}

function roobKudhabe_v15_isDataExt(ext) {
    return ext === "json" || ext === "csv" || ext === "tsv" || ext === "mgjson" || ext === "txt";
}

function roobKudhabe_v15_usedCompMap(project) {
    var used = {};
    if (!project) return used;
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (!(item && item instanceof CompItem)) continue;
        for (var j = 1; j <= item.numLayers; j++) {
            try {
                var layer = item.layer(j);
                var source = layer ? layer.source : null;
                if (source && source instanceof CompItem) used[String(source.id)] = true;
            } catch (layerError) {}
        }
    }
    return used;
}

function roobKudhabe_v15_itemCategory(item, usedCompMap) {
    try {
        if (item instanceof CompItem) return usedCompMap && usedCompMap[String(item.id)] ? "precomp" : "main";
        if (!(item instanceof FootageItem)) return "other";

        var source = null;
        try { source = item.mainSource; } catch (sourceError) {}
        try { if (source && source instanceof SolidSource) return "solid"; } catch (solidError) {}

        var ext = roobKudhabe_v15_extension(item);
        if (roobKudhabe_v15_isDesignExt(ext)) return "design";
        if (roobKudhabe_v15_isDataExt(ext)) return "data";

        var hasVideo = false;
        var hasAudio = false;
        var isStill = false;
        try { hasVideo = item.hasVideo === true; } catch (videoError) {}
        try { hasAudio = item.hasAudio === true; } catch (audioError) {}
        try { isStill = source && source.isStill === true; } catch (stillError) {}

        if (hasAudio && !hasVideo) return "audio";
        if (isStill) return "image";
        if (hasVideo) return "video";
        if (hasAudio) return "audio";
    } catch (e) {}
    return "other";
}

function roobKudhabe_scanProject() {
    var project = app.project;
    if (!project) return "NO_PROJECT";
    try {
        var used = roobKudhabe_v15_usedCompMap(project);
        var counts = { main:0, precomp:0, image:0, video:0, audio:0, design:0, solid:0, data:0, other:0 };
        var total = 0;
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (!item || item instanceof FolderItem) continue;
            total++;
            var category = roobKudhabe_v15_itemCategory(item, used);
            if (counts[category] == null) category = "other";
            counts[category]++;
        }
        return "OK~~RK_FIELD~~" + roobKudhabe_v15_projectName(project) +
            "~~RK_FIELD~~" + total +
            "~~RK_FIELD~~" + counts.main +
            "~~RK_FIELD~~" + counts.precomp +
            "~~RK_FIELD~~" + counts.image +
            "~~RK_FIELD~~" + counts.video +
            "~~RK_FIELD~~" + counts.audio +
            "~~RK_FIELD~~" + counts.design +
            "~~RK_FIELD~~" + counts.solid +
            "~~RK_FIELD~~" + counts.data +
            "~~RK_FIELD~~" + counts.other;
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
}

function roobKudhabe_v15_sameFolder(a, b) {
    if (!a || !b) return false;
    try { return Number(a.id) === Number(b.id); } catch (e) {}
    return a === b;
}

function roobKudhabe_v15_findFolder(project, name, parent) {
    if (!project) return null;
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (!(item && item instanceof FolderItem)) continue;
        if (String(item.name) !== String(name)) continue;
        try {
            if (roobKudhabe_v15_sameFolder(item.parentFolder, parent)) return item;
        } catch (e) {}
    }
    return null;
}

function roobKudhabe_v15_ensureFolder(project, name, parent, counter) {
    var folder = roobKudhabe_v15_findFolder(project, name, parent);
    if (folder) return folder;
    folder = project.items.addFolder(name);
    try { folder.parentFolder = parent; } catch (e) {}
    if (counter) counter.count++;
    return folder;
}

function roobKudhabe_v15_isRootItem(item, project) {
    try { return roobKudhabe_v15_sameFolder(item.parentFolder, project.rootFolder); }
    catch (e) { return false; }
}

function roobKudhabe_organizeProject(scope, splitComps) {
    var project = app.project;
    if (!project) return "NO_PROJECT";
    scope = String(scope || "root");
    splitComps = String(splitComps) === "true";
    var moved = 0;
    var skipped = 0;
    var readyFolders = 0;
    var counter = { count:0 };

    app.beginUndoGroup("SHAX - Organize Project");
    try {
        var root = project.rootFolder;
        var comps = roobKudhabe_v15_ensureFolder(project, "01_COMPS", root, counter); readyFolders++;
        var main = comps;
        var pre = comps;
        if (splitComps) {
            main = roobKudhabe_v15_ensureFolder(project, "MAIN", comps, counter); readyFolders++;
            pre = roobKudhabe_v15_ensureFolder(project, "PRECOMPS", comps, counter); readyFolders++;
        }
        var media = roobKudhabe_v15_ensureFolder(project, "02_MEDIA", root, counter); readyFolders++;
        var images = roobKudhabe_v15_ensureFolder(project, "IMAGES", media, counter); readyFolders++;
        var video = roobKudhabe_v15_ensureFolder(project, "VIDEO", media, counter); readyFolders++;
        var audio = roobKudhabe_v15_ensureFolder(project, "AUDIO", media, counter); readyFolders++;
        var design = roobKudhabe_v15_ensureFolder(project, "03_DESIGN", root, counter); readyFolders++;
        var solids = roobKudhabe_v15_ensureFolder(project, "04_SOLIDS", root, counter); readyFolders++;
        var data = roobKudhabe_v15_ensureFolder(project, "05_DATA", root, counter); readyFolders++;
        var other = roobKudhabe_v15_ensureFolder(project, "99_OTHER", root, counter); readyFolders++;

        var folders = { main:main, precomp:pre, image:images, video:video, audio:audio, design:design, solid:solids, data:data, other:other };
        var used = roobKudhabe_v15_usedCompMap(project);

        /* Snapshot items first because changing parent folders updates the Project panel collection. */
        var items = [];
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (!item || item instanceof FolderItem) continue;
            if (scope !== "all" && !roobKudhabe_v15_isRootItem(item, project)) continue;
            items.push(item);
        }

        for (var j = 0; j < items.length; j++) {
            var current = items[j];
            try {
                var category = roobKudhabe_v15_itemCategory(current, used);
                var destination = folders[category] || other;
                if (!destination) { skipped++; continue; }
                if (roobKudhabe_v15_sameFolder(current.parentFolder, destination)) continue;
                current.parentFolder = destination;
                moved++;
            } catch (moveError) { skipped++; }
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + moved + "~~RK_FIELD~~" + readyFolders + "~~RK_FIELD~~" + skipped + "~~RK_FIELD~~" + counter.count;
}

function roobKudhabe_v15_layerCategory(layer) {
    try {
        if (layer instanceof TextLayer) return "text";
        if (layer instanceof ShapeLayer) return "shape";
        if (layer instanceof CameraLayer) return "camera";
        if (layer instanceof LightLayer) return "light";
        if (layer.nullLayer) return "null";
        if (layer.adjustmentLayer) return "adjustment";
        if (layer instanceof AVLayer) {
            var source = null;
            try { source = layer.source; } catch (sourceError) {}
            if (source && source instanceof CompItem) return "precomp";
            if (source && source instanceof FootageItem) {
                try { if (source.mainSource && source.mainSource instanceof SolidSource) return "solid"; } catch (solidError) {}
                var ext = roobKudhabe_v15_extension(source);
                if (roobKudhabe_v15_isDesignExt(ext)) return "design";
                if (roobKudhabe_v15_isDataExt(ext)) return "data";
                var hv = false, ha = false, still = false;
                try { hv = source.hasVideo === true; } catch (e1) {}
                try { ha = source.hasAudio === true; } catch (e2) {}
                try { still = source.mainSource && source.mainSource.isStill === true; } catch (e3) {}
                if (ha && !hv) return "audio";
                if (still) return "image";
                if (hv) return "video";
                if (ha) return "audio";
            }
            return "av";
        }
    } catch (e) {}
    return "layer";
}

function roobKudhabe_v15_layerLabel(category) {
    if (category === "text") return 9;
    if (category === "shape") return 10;
    if (category === "precomp") return 11;
    if (category === "image" || category === "design") return 12;
    if (category === "video") return 13;
    if (category === "audio") return 14;
    if (category === "solid") return 15;
    if (category === "null" || category === "adjustment") return 5;
    if (category === "camera" || category === "light") return 6;
    if (category === "data") return 7;
    return 1;
}

function roobKudhabe_v15_layerPrefix(category) {
    if (category === "text") return "TXT";
    if (category === "shape") return "SHP";
    if (category === "precomp") return "PRE";
    if (category === "image") return "IMG";
    if (category === "design") return "DES";
    if (category === "video") return "VID";
    if (category === "audio") return "AUD";
    if (category === "solid") return "SOL";
    if (category === "null") return "NULL";
    if (category === "adjustment") return "ADJ";
    if (category === "camera") return "CAM";
    if (category === "light") return "LGT";
    if (category === "data") return "DATA";
    return "LYR";
}

function roobKudhabe_organizeActiveCompLayers(applyLabels, addPrefixes) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    applyLabels = String(applyLabels) === "true";
    addPrefixes = String(addPrefixes) === "true";
    var labeled = 0;
    var renamed = 0;
    var skipped = 0;

    app.beginUndoGroup("SHAX - Organize Layers");
    try {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!layer) { skipped++; continue; }
            var category = roobKudhabe_v15_layerCategory(layer);
            if (applyLabels) {
                try { layer.label = roobKudhabe_v15_layerLabel(category); labeled++; } catch (labelError) { skipped++; }
            }
            if (addPrefixes) {
                try {
                    var prefix = roobKudhabe_v15_layerPrefix(category);
                    var base = String(layer.name || "Layer");
                    base = base.replace(/^\[(TXT|SHP|PRE|IMG|DES|VID|AUD|SOL|NULL|ADJ|CAM|LGT|DATA|LYR)\]\s*/i, "");
                    var next = "[" + prefix + "] " + base;
                    if (String(layer.name) !== next) { layer.name = next; renamed++; }
                } catch (nameError) { skipped++; }
            }
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + labeled + "~~RK_FIELD~~" + renamed + "~~RK_FIELD~~" + skipped;
}

/* ===== RoobKudhabe v1.6: Motion Vault ===== */
function roobKudhabe_v16_vaultRoot() {
    var root = new Folder(Folder.userData.fsName + "/SHAX");
    if (!root.exists) root.create();
    var vault = new Folder(root.fsName + "/MotionVault");
    if (!vault.exists) vault.create();

    // One-time compatibility migration from the former RoobKudhabe name.
    try {
        var legacyVault = new Folder(Folder.userData.fsName + "/RoobKudhabe/MotionVault");
        if (legacyVault.exists) {
            var oldFiles = legacyVault.getFiles("*.rkmotion");
            for (var i = 0; i < oldFiles.length; i++) {
                if (!(oldFiles[i] instanceof File)) continue;
                var target = new File(vault.fsName + "/" + oldFiles[i].name);
                if (!target.exists) oldFiles[i].copy(target.fsName);
            }
        }
    } catch (migrationError) {}
    return vault;
}

function roobKudhabe_v16_fieldClean(value) {
    var text = String(value == null ? "" : value);
    text = text.split("~~RK_FIELD~~").join(" ");
    text = text.split("~~RK_ITEM~~").join(" ");
    text = text.split("\r").join(" ");
    text = text.split("\n").join(" ");
    return text;
}

function roobKudhabe_v16_jsonEscape(text) {
    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/\"/g, "\\\"")
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");
}

function roobKudhabe_v16_jsonStringify(value) {
    if (value === null || value === undefined) return "null";
    var type = typeof value;
    if (type === "number") return isFinite(value) ? String(value) : "0";
    if (type === "boolean") return value ? "true" : "false";
    if (type === "string") return "\"" + roobKudhabe_v16_jsonEscape(value) + "\"";
    if (value instanceof Array) {
        var arr = [];
        for (var i = 0; i < value.length; i++) arr.push(roobKudhabe_v16_jsonStringify(value[i]));
        return "[" + arr.join(",") + "]";
    }
    if (type === "object") {
        var fields = [];
        for (var key in value) {
            if (!value.hasOwnProperty || value.hasOwnProperty(key)) {
                var child = value[key];
                if (typeof child === "function" || child === undefined) continue;
                fields.push("\"" + roobKudhabe_v16_jsonEscape(key) + "\":" + roobKudhabe_v16_jsonStringify(child));
            }
        }
        return "{" + fields.join(",") + "}";
    }
    return "null";
}

function roobKudhabe_v16_jsonParse(text) {
    try {
        if (typeof JSON !== "undefined" && JSON.parse) return JSON.parse(text);
    } catch (e) {}
    return eval("(" + text + ")");
}

function roobKudhabe_v16_safeId(value) {
    return String(value || "motion")
        .replace(/[^A-Za-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .substring(0, 36) || "motion";
}

function roobKudhabe_v16_writePreset(data) {
    var vault = roobKudhabe_v16_vaultRoot();
    var file = new File(vault.fsName + "/" + data.id + ".rkmotion");
    file.encoding = "UTF-8";
    if (!file.open("w")) throw new Error("Could not open Motion Vault file for writing");
    file.write(roobKudhabe_v16_jsonStringify(data));
    file.close();
    return file;
}

function roobKudhabe_v16_readPreset(id) {
    id = String(id || "");
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
    var file = new File(roobKudhabe_v16_vaultRoot().fsName + "/" + id + ".rkmotion");
    if (!file.exists) return null;
    file.encoding = "UTF-8";
    if (!file.open("r")) return null;
    var text = file.read();
    file.close();
    if (!text) return null;
    try { return roobKudhabe_v16_jsonParse(text); } catch (e) { return null; }
}

function roobKudhabe_v16_interpName(value) {
    try {
        if (value === KeyframeInterpolationType.HOLD) return "HOLD";
        if (value === KeyframeInterpolationType.LINEAR) return "LINEAR";
        if (value === KeyframeInterpolationType.BEZIER) return "BEZIER";
    } catch (e) {}
    return "BEZIER";
}

function roobKudhabe_v16_interpValue(name) {
    name = String(name || "BEZIER");
    if (name === "HOLD") return KeyframeInterpolationType.HOLD;
    if (name === "LINEAR") return KeyframeInterpolationType.LINEAR;
    return KeyframeInterpolationType.BEZIER;
}

function roobKudhabe_v16_cloneValue(value) {
    if (value instanceof Array) {
        var out = [];
        for (var i = 0; i < value.length; i++) out.push(Number(value[i]));
        return out;
    }
    if (typeof value === "number") return Number(value);
    return value;
}

function roobKudhabe_v16_eachNumber(a, b, fn) {
    if (a instanceof Array) {
        var out = [];
        for (var i = 0; i < a.length; i++) {
            var bv = b instanceof Array ? Number(b[Math.min(i, b.length - 1)]) : Number(b);
            out.push(fn(Number(a[i]), bv, i));
        }
        return out;
    }
    return fn(Number(a), b instanceof Array ? Number(b[0]) : Number(b), 0);
}

function roobKudhabe_v16_normalizeValue(value, reference, mode) {
    if (mode === "ratio") {
        return roobKudhabe_v16_eachNumber(value, reference, function (v, r) { return Math.abs(r) < 0.000001 ? v : v / r; });
    }
    return roobKudhabe_v16_eachNumber(value, reference, function (v, r) { return v - r; });
}

function roobKudhabe_v16_denormalizeValue(relativeValue, base, mode) {
    if (mode === "ratio") {
        return roobKudhabe_v16_eachNumber(relativeValue, base, function (v, b) { return b * v; });
    }
    return roobKudhabe_v16_eachNumber(relativeValue, base, function (v, b) { return b + v; });
}

function roobKudhabe_v16_adaptValue(value, current) {
    if (current instanceof Array) {
        var out = [];
        var input = value instanceof Array ? value : [value];
        for (var i = 0; i < current.length; i++) out.push(i < input.length ? Number(input[i]) : Number(current[i]));
        return out;
    }
    if (value instanceof Array) return Number(value[0]);
    return Number(value);
}

function roobKudhabe_v16_easeToData(eases) {
    var out = [];
    if (!eases) return out;
    for (var i = 0; i < eases.length; i++) {
        out.push({ speed:Number(eases[i].speed || 0), influence:Number(eases[i].influence || 33.333) });
    }
    return out;
}

function roobKudhabe_v16_dataToEase(data, dimensions) {
    var out = [];
    data = data || [];
    dimensions = Math.max(1, Number(dimensions || 1));
    for (var i = 0; i < dimensions; i++) {
        var source = data[Math.min(i, data.length - 1)] || { speed:0, influence:33.333 };
        var influence = Math.max(0.1, Math.min(100, Number(source.influence || 33.333)));
        out.push(new KeyframeEase(Number(source.speed || 0), influence));
    }
    return out;
}

function roobKudhabe_v16_propertyDimensions(prop) {
    try {
        var v = prop.value;
        return v instanceof Array ? v.length : 1;
    } catch (e) { return 1; }
}

function roobKudhabe_v16_propertyMode(prop, reference) {
    var match = String(prop.matchName || "");
    if (match === "ADBE Scale") {
        if (reference instanceof Array) {
            for (var i = 0; i < reference.length; i++) if (Math.abs(Number(reference[i])) < 0.000001) return "delta";
        } else if (Math.abs(Number(reference)) < 0.000001) return "delta";
        return "ratio";
    }
    return "delta";
}
function roobKudhabe_v16_captureProperty(prop, globalStart, anchorMode, includeExpressions) {
    if (!prop || prop.numKeys < 1) return null;
    var refIndex = anchorMode === "start" ? 1 : prop.numKeys;
    var reference = roobKudhabe_v16_cloneValue(prop.keyValue(refIndex));
    var mode = roobKudhabe_v16_propertyMode(prop, reference);
    var data = {
        matchName:String(prop.matchName || ""),
        name:String(prop.name || "Property"),
        mode:mode,
        keys:[],
        expression:""
    };
    if (includeExpressions) {
        try { if (prop.canSetExpression && prop.expression) data.expression = String(prop.expression); } catch (expressionError) {}
    }
    for (var k = 1; k <= prop.numKeys; k++) {
        var key = {
            t:Number(prop.keyTime(k) - globalStart),
            v:roobKudhabe_v16_normalizeValue(roobKudhabe_v16_cloneValue(prop.keyValue(k)), reference, mode),
            inEase:[], outEase:[], inInterp:"BEZIER", outInterp:"BEZIER",
            temporalAutoBezier:false, temporalContinuous:false, roving:false,
            spatial:false, spatialAutoBezier:false, spatialContinuous:false,
            inSpatial:null, outSpatial:null
        };
        try { key.inEase = roobKudhabe_v16_easeToData(prop.keyInTemporalEase(k)); } catch (e1) {}
        try { key.outEase = roobKudhabe_v16_easeToData(prop.keyOutTemporalEase(k)); } catch (e2) {}
        try { key.inInterp = roobKudhabe_v16_interpName(prop.keyInInterpolationType(k)); } catch (e3) {}
        try { key.outInterp = roobKudhabe_v16_interpName(prop.keyOutInterpolationType(k)); } catch (e4) {}
        try { key.temporalAutoBezier = prop.keyTemporalAutoBezier(k) === true; } catch (e5) {}
        try { key.temporalContinuous = prop.keyTemporalContinuous(k) === true; } catch (e6) {}
        try { key.roving = prop.keyRoving(k) === true; } catch (e7) {}
        try {
            if (prop.isSpatial) {
                key.spatial = true;
                key.spatialAutoBezier = prop.keySpatialAutoBezier(k) === true;
                key.spatialContinuous = prop.keySpatialContinuous(k) === true;
                key.inSpatial = roobKudhabe_v16_cloneValue(prop.keyInSpatialTangent(k));
                key.outSpatial = roobKudhabe_v16_cloneValue(prop.keyOutSpatialTangent(k));
            }
        } catch (e8) {}
        data.keys.push(key);
    }
    return data;
}

function roobKudhabe_v16_animatedTransformProperties(layer) {
    var out = [];
    try {
        var transform = layer.property("ADBE Transform Group");
        if (!transform) return out;
        for (var i = 1; i <= transform.numProperties; i++) {
            var prop = transform.property(i);
            if (!prop) continue;
            try {
                if (prop.propertyType === PropertyType.PROPERTY && prop.numKeys > 0) out.push(prop);
            } catch (e) {}
        }
    } catch (err) {}
    return out;
}

function roobKudhabe_saveMotionPreset(name, category, anchorMode, includeExpressions, includeMotionBlur) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var layers = comp.selectedLayers;
    if (!layers || !layers.length) return "NO_SELECTION";
    name = roobKudhabe_v16_fieldClean(name || "Untitled Motion");
    category = roobKudhabe_v16_fieldClean(category || "General");
    anchorMode = String(anchorMode) === "start" ? "start" : "end";
    includeExpressions = String(includeExpressions) === "true";
    includeMotionBlur = String(includeMotionBlur) === "true";

    try {
        var earliest = 999999999;
        var latest = -999999999;
        var propertyCount = 0;
        var animatedLayerCount = 0;
        var propertyMap = [];

        for (var i = 0; i < layers.length; i++) {
            var props = roobKudhabe_v16_animatedTransformProperties(layers[i]);
            propertyMap.push(props);
            if (props.length) animatedLayerCount++;
            for (var p = 0; p < props.length; p++) {
                propertyCount++;
                try { earliest = Math.min(earliest, props[p].keyTime(1)); } catch (e1) {}
                try { latest = Math.max(latest, props[p].keyTime(props[p].numKeys)); } catch (e2) {}
            }
        }
        if (!propertyCount || earliest === 999999999) return "NO_ANIMATION";

        var presetLayers = [];
        for (var l = 0; l < layers.length; l++) {
            var sourceLayer = layers[l];
            var layerData = { type:roobKudhabe_layerType(sourceLayer), name:String(sourceLayer.name || "Layer"), motionBlur:false, properties:[] };
            if (includeMotionBlur) {
                try { layerData.motionBlur = sourceLayer.motionBlur === true; } catch (blurError) {}
            }
            var sourceProps = propertyMap[l];
            for (var q = 0; q < sourceProps.length; q++) {
                var propData = roobKudhabe_v16_captureProperty(sourceProps[q], earliest, anchorMode, includeExpressions);
                if (propData) layerData.properties.push(propData);
            }
            presetLayers.push(layerData);
        }

        var now = new Date();
        var id = String(now.getTime()) + "_" + roobKudhabe_v16_safeId(name);
        var data = {
            format:"SHAXMotion",
            version:1,
            id:id,
            name:name,
            category:category,
            created:now.toString(),
            anchorMode:anchorMode,
            duration:Math.max(0, Number(latest - earliest)),
            layerCount:presetLayers.length,
            animatedLayerCount:animatedLayerCount,
            propertyCount:propertyCount,
            includeExpressions:includeExpressions,
            includeMotionBlur:includeMotionBlur,
            layers:presetLayers
        };
        roobKudhabe_v16_writePreset(data);
        return "OK~~RK_FIELD~~" + id + "~~RK_FIELD~~" + propertyCount + "~~RK_FIELD~~" + presetLayers.length + "~~RK_FIELD~~" + data.duration;
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
}

function roobKudhabe_listMotionPresets() {
    try {
        var files = roobKudhabe_v16_vaultRoot().getFiles("*.rkmotion");
        if (!files || !files.length) return "EMPTY";
        var items = [];
        for (var i = 0; i < files.length; i++) {
            if (!(files[i] instanceof File)) continue;
            var file = files[i];
            file.encoding = "UTF-8";
            if (!file.open("r")) continue;
            var text = file.read();
            file.close();
            if (!text) continue;
            try {
                var data = roobKudhabe_v16_jsonParse(text);
                if (!data || (data.format !== "SHAXMotion" && data.format !== "RoobKudhabeMotion")) continue;
                items.push({
                    id:String(data.id || file.name.replace(/\.rkmotion$/i, "")),
                    name:String(data.name || "Untitled Motion"),
                    category:String(data.category || "General"),
                    layerCount:Number(data.layerCount || (data.layers ? data.layers.length : 0)),
                    propertyCount:Number(data.propertyCount || 0),
                    duration:Number(data.duration || 0),
                    created:String(data.created || "")
                });
            } catch (parseError) {}
        }
        if (!items.length) return "EMPTY";
        items.sort(function (a, b) { return String(a.created) < String(b.created) ? 1 : -1; });
        var output = [];
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            output.push(
                roobKudhabe_v16_fieldClean(item.id) + "~~RK_FIELD~~" +
                roobKudhabe_v16_fieldClean(item.name) + "~~RK_FIELD~~" +
                roobKudhabe_v16_fieldClean(item.category) + "~~RK_FIELD~~" +
                item.layerCount + "~~RK_FIELD~~" + item.propertyCount + "~~RK_FIELD~~" +
                item.duration + "~~RK_FIELD~~" + roobKudhabe_v16_fieldClean(item.created)
            );
        }
        return "OK~~RK_ITEM~~" + output.join("~~RK_ITEM~~");
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
}

function roobKudhabe_v16_transformProperty(layer, matchName) {
    try {
        var transform = layer.property("ADBE Transform Group");
        if (!transform) return null;
        var direct = transform.property(matchName);
        if (direct) return direct;
        for (var i = 1; i <= transform.numProperties; i++) {
            var p = transform.property(i);
            if (p && String(p.matchName || "") === String(matchName)) return p;
        }
    } catch (e) {}
    return null;
}

function roobKudhabe_v16_removeAllKeys(prop) {
    try { while (prop.numKeys > 0) prop.removeKey(prop.numKeys); } catch (e) {}
}

function roobKudhabe_v16_applyKeyStyle(prop, keyIndex, keyData) {
    try { prop.setInterpolationTypeAtKey(keyIndex, roobKudhabe_v16_interpValue(keyData.inInterp), roobKudhabe_v16_interpValue(keyData.outInterp)); } catch (e1) {}
    try {
        var dims = roobKudhabe_v16_propertyDimensions(prop);
        prop.setTemporalEaseAtKey(keyIndex, roobKudhabe_v16_dataToEase(keyData.inEase, dims), roobKudhabe_v16_dataToEase(keyData.outEase, dims));
    } catch (e2) {}
    try { prop.setTemporalAutoBezierAtKey(keyIndex, keyData.temporalAutoBezier === true); } catch (e3) {}
    try { prop.setTemporalContinuousAtKey(keyIndex, keyData.temporalContinuous === true); } catch (e4) {}
    try { if (keyIndex !== 1 && keyIndex !== prop.numKeys) prop.setRovingAtKey(keyIndex, keyData.roving === true); } catch (e5) {}
    if (keyData.spatial) {
        try {
            if (keyData.inSpatial != null && keyData.outSpatial != null) prop.setSpatialTangentsAtKey(keyIndex, keyData.inSpatial, keyData.outSpatial);
        } catch (e6) {}
        try { prop.setSpatialAutoBezierAtKey(keyIndex, keyData.spatialAutoBezier === true); } catch (e7) {}
        try { prop.setSpatialContinuousAtKey(keyIndex, keyData.spatialContinuous === true); } catch (e8) {}
    }
}

function roobKudhabe_v16_applyProperty(prop, propertyData, startTime, replaceKeys) {
    if (!prop || !propertyData || !propertyData.keys || !propertyData.keys.length) return 0;
    var base;
    try { base = roobKudhabe_v16_cloneValue(prop.valueAtTime(startTime, false)); }
    catch (e) { try { base = roobKudhabe_v16_cloneValue(prop.value); } catch (e2) { return 0; } }
    if (replaceKeys) roobKudhabe_v16_removeAllKeys(prop);
    var applied = 0;
    var times = [];
    for (var i = 0; i < propertyData.keys.length; i++) {
        var kd = propertyData.keys[i];
        var t = Number(startTime + Number(kd.t || 0));
        var raw = roobKudhabe_v16_denormalizeValue(kd.v, base, propertyData.mode || "delta");
        var value = roobKudhabe_v16_adaptValue(raw, base);
        if (String(propertyData.matchName) === "ADBE Opacity") {
            if (value instanceof Array) {
                for (var op = 0; op < value.length; op++) value[op] = Math.max(0, Math.min(100, value[op]));
            } else value = Math.max(0, Math.min(100, value));
        }
        try { prop.setValueAtTime(t, value); applied++; times.push(t); } catch (setError) {}
    }
    for (var k = 0; k < times.length; k++) {
        try {
            var index = prop.nearestKeyIndex(times[k]);
            if (Math.abs(prop.keyTime(index) - times[k]) < 0.0001) roobKudhabe_v16_applyKeyStyle(prop, index, propertyData.keys[k]);
        } catch (styleError) {}
    }
    if (propertyData.expression) {
        try { if (prop.canSetExpression) prop.expression = String(propertyData.expression); } catch (expressionError) {}
    }
    return applied;
}

function roobKudhabe_applyMotionPreset(id, replaceKeys) {
    var comp = app.project ? app.project.activeItem : null;
    if (!(comp && comp instanceof CompItem)) return "NO_ACTIVE_COMP";
    var targets = comp.selectedLayers;
    if (!targets || !targets.length) return "NO_SELECTION";
    replaceKeys = String(replaceKeys) === "true";
    var preset = roobKudhabe_v16_readPreset(id);
    if (!preset) return "PRESET_NOT_FOUND";
    if (!preset.layers || !preset.layers.length) return "ERROR~~RK_FIELD~~Motion preset contains no layer data";

    var appliedLayers = 0;
    var appliedKeys = 0;
    var skippedProps = 0;
    app.beginUndoGroup("SHAX - Apply Motion Vault");
    try {
        var oneToMany = preset.layers.length === 1;
        var count = oneToMany ? targets.length : Math.min(targets.length, preset.layers.length);
        for (var i = 0; i < count; i++) {
            var target = targets[i];
            var template = preset.layers[oneToMany ? 0 : i];
            if (!target || !template) continue;
            var layerApplied = 0;
            for (var p = 0; p < template.properties.length; p++) {
                var propertyData = template.properties[p];
                var prop = roobKudhabe_v16_transformProperty(target, propertyData.matchName);
                if (!prop) { skippedProps++; continue; }
                var keys = roobKudhabe_v16_applyProperty(prop, propertyData, comp.time, replaceKeys);
                layerApplied += keys;
                appliedKeys += keys;
            }
            if (preset.includeMotionBlur) {
                try { target.motionBlur = template.motionBlur === true; if (template.motionBlur) comp.motionBlur = true; } catch (blurError) {}
            }
            if (layerApplied > 0) appliedLayers++;
        }
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
    app.endUndoGroup();
    return "OK~~RK_FIELD~~" + appliedLayers + "~~RK_FIELD~~" + appliedKeys + "~~RK_FIELD~~" + skippedProps;
}

function roobKudhabe_deleteMotionPreset(id) {
    id = String(id || "");
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return "PRESET_NOT_FOUND";
    try {
        var file = new File(roobKudhabe_v16_vaultRoot().fsName + "/" + id + ".rkmotion");
        if (!file.exists) return "PRESET_NOT_FOUND";
        return file.remove() ? "OK" : "ERROR~~RK_FIELD~~Could not delete Motion Vault file";
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + roobKudhabe_clean(e.toString());
    }
}

/* ===== SHAX v2.6: Asset Vault ===== */
var SHAX_ASSET_PREVIEW_ROOT_ID = 0;
var SHAX_ASSET_PREVIEW_COMP_ID = 0;
var SHAX_ASSET_PREVIEW_RETURN_COMP_ID = 0;
var SHAX_ASSET_PREVIEW_PACK_ID = "";

function shax_assetVaultRoot() {
    var root = new Folder(Folder.userData.fsName + "/SHAX");
    if (!root.exists) root.create();
    var vault = new Folder(root.fsName + "/AssetVault");
    if (!vault.exists) vault.create();
    return vault;
}

function shax_assetSafeName(value) {
    return String(value || "Asset")
        .replace(/[\\\/:*?\"<>|]+/g, "-")
        .replace(/^\s+|\s+$/g, "")
        .replace(/\s+/g, " ")
        .substring(0, 72) || "Asset";
}

function shax_assetSafeId(value) {
    return String(value || "asset")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 40) || "asset";
}

function shax_assetField(value) {
    return String(value == null ? "" : value)
        .replace(/~~RK_FIELD~~/g, " ")
        .replace(/~~RK_ITEM~~/g, " ")
        .replace(/[\r\n]+/g, " ");
}

function shax_assetPad(value, size) {
    var text = String(value);
    while (text.length < size) text = "0" + text;
    return text;
}

function shax_assetWriteJson(file, data) {
    file.encoding = "UTF-8";
    if (!file.open("w")) throw new Error("Could not write Asset Vault metadata");
    file.write(roobKudhabe_v16_jsonStringify(data));
    file.close();
}

function shax_assetReadJson(file) {
    if (!(file instanceof File) || !file.exists) return null;
    file.encoding = "UTF-8";
    if (!file.open("r")) return null;
    var text = file.read();
    file.close();
    if (!text) return null;
    try { return roobKudhabe_v16_jsonParse(text); } catch (e) { return null; }
}

function shax_assetPackFolder(id) {
    return new Folder(shax_assetVaultRoot().fsName + "/" + String(id || ""));
}

function shax_assetMetaById(id) {
    if (!/^[A-Za-z0-9_-]+$/.test(String(id || ""))) return null;
    var folder = shax_assetPackFolder(id);
    if (!folder.exists) return null;
    var file = new File(folder.fsName + "/asset.shaxasset");
    var data = shax_assetReadJson(file);
    if (!data || data.format !== "SHAXAssetPack") return null;
    data._folder = folder;
    return data;
}

function shax_assetExt(name) {
    var m = String(name || "").match(/\.([^.]+)$/);
    return m ? String(m[1]).toLowerCase() : "";
}

function shax_assetIsSequenceCandidate(item, file) {
    try {
        var ext = shax_assetExt(file.name);
        var imageExt = /^(png|jpg|jpeg|tif|tiff|exr|dpx|bmp|tga|gif)$/i.test(ext);
        var numbered = /^(.*?)(\d+)(\.[^.]+)$/.test(String(file.name || ""));
        return imageExt && numbered && item.mainSource && item.mainSource.isStill === false;
    } catch (e) { return false; }
}

function shax_assetRegexEscape(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shax_assetCopySequence(item, sourceFile, targetFolder) {
    var name = String(sourceFile.name || "");
    var match = name.match(/^(.*?)(\d+)(\.[^.]+)$/);
    if (!match) return { copied:0, relinked:false };
    var prefix = match[1];
    var suffix = match[3];
    var rx = new RegExp("^" + shax_assetRegexEscape(prefix) + "\\d+" + shax_assetRegexEscape(suffix) + "$", "i");
    var files = sourceFile.parent.getFiles();
    var copied = 0;
    var copiedSource = null;
    for (var i = 0; i < files.length; i++) {
        if (!(files[i] instanceof File)) continue;
        if (!rx.test(String(files[i].name || ""))) continue;
        var out = new File(targetFolder.fsName + "/" + files[i].name);
        try {
            if (files[i].copy(out.fsName)) {
                copied++;
                if (String(files[i].name) === name) copiedSource = out;
            }
        } catch (copyError) {}
    }
    if (!copiedSource) copiedSource = new File(targetFolder.fsName + "/" + name);
    var relinked = false;
    if (copiedSource.exists) {
        try { item.replaceWithSequence(copiedSource, false); relinked = true; } catch (relinkError) {}
    }
    return { copied:copied, relinked:relinked };
}

function shax_assetCopyResources(resourcesFolder) {
    var result = { copied:0, missing:0, relinked:0 };
    if (!resourcesFolder.exists) resourcesFolder.create();
    var snapshot = [];
    for (var i = 1; i <= app.project.numItems; i++) snapshot.push(app.project.item(i));
    for (var n = 0; n < snapshot.length; n++) {
        var item = snapshot[n];
        if (!(item && item instanceof FootageItem)) continue;
        var sourceFile = null;
        try { sourceFile = item.file; } catch (e0) { sourceFile = null; }
        if (!sourceFile) continue;
        try { if (item.footageMissing || !sourceFile.exists) { result.missing++; continue; } } catch (e1) { if (!sourceFile.exists) { result.missing++; continue; } }

        var unit = new Folder(resourcesFolder.fsName + "/" + shax_assetPad(n + 1, 3) + "_" + shax_assetSafeId(item.name));
        if (!unit.exists) unit.create();

        if (shax_assetIsSequenceCandidate(item, sourceFile)) {
            var sequenceResult = shax_assetCopySequence(item, sourceFile, unit);
            result.copied += sequenceResult.copied;
            if (sequenceResult.relinked) result.relinked++;
            else result.missing++;
            continue;
        }

        var target = new File(unit.fsName + "/" + sourceFile.name);
        try {
            if (sourceFile.copy(target.fsName)) {
                result.copied++;
                try { item.replace(target); result.relinked++; } catch (replaceError) {}
            } else {
                result.missing++;
            }
        } catch (copyError2) {
            result.missing++;
        }
    }
    return result;
}

function shax_assetPreviewClampBounds(bounds, comp) {
    if (!bounds) return null;
    var minX = Math.max(0, Math.min(Number(comp.width || 0), Number(bounds.minX || 0)));
    var minY = Math.max(0, Math.min(Number(comp.height || 0), Number(bounds.minY || 0)));
    var maxX = Math.max(0, Math.min(Number(comp.width || 0), Number(bounds.maxX || 0)));
    var maxY = Math.max(0, Math.min(Number(comp.height || 0), Number(bounds.maxY || 0)));
    if (!(maxX > minX && maxY > minY)) return null;
    return { minX:minX, minY:minY, maxX:maxX, maxY:maxY };
}

function shax_assetPreviewLayerVisible(layer, time) {
    try {
        if (!layer || !layer.enabled || layer.threeDLayer) return false;
        var type = roobKudhabe_layerType(layer);
        if (type === "Camera" || type === "Light" || type === "Null") return false;
        if (Number(time) < Number(layer.inPoint) || Number(time) > Number(layer.outPoint)) return false;
        var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
        if (opacity && Number(opacity.valueAtTime(time, false)) <= 0.5) return false;
        return true;
    } catch (e) { return false; }
}

function shax_assetPreviewLooksBackground(layer, bounds, comp) {
    try {
        if (roobKudhabe_v10_nameLooksBackground(layer)) return true;
        var bw = Math.max(0, Number(bounds.maxX) - Number(bounds.minX));
        var bh = Math.max(0, Number(bounds.maxY) - Number(bounds.minY));
        var wr = Number(comp.width || 1) > 0 ? bw / Number(comp.width || 1) : 0;
        var hr = Number(comp.height || 1) > 0 ? bh / Number(comp.height || 1) : 0;
        if (wr > 0.90 && hr > 0.90) return true;
        if (roobKudhabe_v10_isSolidLayer(layer) && wr > 0.72 && hr > 0.72) return true;
    } catch (e) {}
    return false;
}

function shax_assetPreviewFocusBounds(comp, sampleTimes) {
    var foreground = null;
    var everything = null;
    try {
        for (var t = 0; t < sampleTimes.length; t++) {
            var time = Number(sampleTimes[t] || 0);
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (!shax_assetPreviewLayerVisible(layer, time)) continue;
                var bounds = null;
                try { bounds = roobKudhabe_v10_layerBounds(layer, time); } catch (e0) {}
                bounds = shax_assetPreviewClampBounds(bounds, comp);
                if (!bounds) continue;
                everything = roobKudhabe_v10_unionBounds(everything, bounds);
                if (!shax_assetPreviewLooksBackground(layer, bounds, comp)) {
                    foreground = roobKudhabe_v10_unionBounds(foreground, bounds);
                }
            }
        }
    } catch (e) {}
    var chosen = foreground || everything;
    if (!chosen) return { minX:0, minY:0, maxX:Number(comp.width || 1), maxY:Number(comp.height || 1) };

    /* Add breathing room while keeping the preview focused on the actual subject. */
    var w = Math.max(1, chosen.maxX - chosen.minX);
    var h = Math.max(1, chosen.maxY - chosen.minY);
    var padX = Math.max(12, w * 0.16);
    var padY = Math.max(12, h * 0.16);
    chosen = {
        minX: Math.max(0, chosen.minX - padX),
        minY: Math.max(0, chosen.minY - padY),
        maxX: Math.min(Number(comp.width || 1), chosen.maxX + padX),
        maxY: Math.min(Number(comp.height || 1), chosen.maxY + padY)
    };
    return chosen;
}

function shax_assetMakePreviewComp(sourceComp, focusBounds) {
    var previewComp = null;
    try {
        var pw = 640;
        var ph = 360;
        var duration = Math.max(Number(sourceComp.frameDuration || 1/25), Number(sourceComp.duration || 1));
        var fps = Math.max(1, Number(sourceComp.frameRate || 25));
        previewComp = app.project.items.addComp("__SHAX_VAULT_PREVIEW__", pw, ph, 1.0, duration, fps);
        var layer = previewComp.layers.add(sourceComp);
        var bw = Math.max(1, Number(focusBounds.maxX) - Number(focusBounds.minX));
        var bh = Math.max(1, Number(focusBounds.maxY) - Number(focusBounds.minY));
        var usableW = pw * 0.82;
        var usableH = ph * 0.78;
        var scaleFactor = Math.min(usableW / bw, usableH / bh);
        if (!isFinite(scaleFactor) || scaleFactor <= 0) scaleFactor = 1;
        scaleFactor = Math.max(0.08, Math.min(7.5, scaleFactor));
        var cx = (Number(focusBounds.minX) + Number(focusBounds.maxX)) / 2;
        var cy = (Number(focusBounds.minY) + Number(focusBounds.maxY)) / 2;
        var transform = layer.property("ADBE Transform Group");
        try { transform.property("ADBE Scale").setValue([scaleFactor * 100, scaleFactor * 100]); } catch (e1) {}
        try {
            var px = pw / 2 - (cx - Number(sourceComp.width || 0) / 2) * scaleFactor;
            var py = ph / 2 - (cy - Number(sourceComp.height || 0) / 2) * scaleFactor;
            transform.property("ADBE Position").setValue([px, py]);
        } catch (e2) {}
        try { previewComp.bgColor = [0.075, 0.082, 0.095]; } catch (e3) {}
        return previewComp;
    } catch (e) {
        try { if (previewComp) previewComp.remove(); } catch (removeError) {}
        return null;
    }
}

function shax_assetRenderPreviewSequence(comp, packFolder, preferredTime) {
    var result = { poster:"", frames:[], count:0 };
    var previewComp = null;
    var renderComp = comp;
    try {
        var previewFolder = new Folder(packFolder.fsName + "/Preview");
        if (!previewFolder.exists) previewFolder.create();

        var oldBpc = app.project.bitsPerChannel;
        try { app.project.bitsPerChannel = 8; } catch (e0) {}

        var frameDuration = Number(comp.frameDuration || (1 / Math.max(1, Number(comp.frameRate || 25))));
        var duration = Math.max(frameDuration, Number(comp.duration || frameDuration));
        var sampleTimes = [];
        var sampleCount = 7;
        for (var st = 0; st < sampleCount; st++) {
            var sr = sampleCount <= 1 ? 0 : st / (sampleCount - 1);
            sampleTimes.push(Math.max(0, Math.min(duration - frameDuration, duration * sr)));
        }
        var focusBounds = shax_assetPreviewFocusBounds(comp, sampleTimes);
        previewComp = shax_assetMakePreviewComp(comp, focusBounds);
        if (previewComp) renderComp = previewComp;

        var start = 0;
        var span = Math.max(frameDuration, duration - frameDuration);
        try {
            if (Number(comp.workAreaDuration || 0) > frameDuration) {
                start = Math.max(0, Number(comp.workAreaStart || 0));
                span = Math.max(frameDuration, Math.min(Number(comp.workAreaDuration || 0), duration - start) - frameDuration);
            }
        } catch (workAreaError) {}

        var count = 16;
        if (duration < 1.0) count = 12;
        if (duration < 0.45) count = 8;
        var bestFile = null;
        var bestSize = -1;
        for (var i = 0; i < count; i++) {
            var ratio = count <= 1 ? 0 : (i / (count - 1));
            var time = Math.max(0, Math.min(duration - frameDuration, start + span * ratio));
            var frameFile = new File(previewFolder.fsName + "/preview_" + shax_assetPad(i, 2) + ".png");
            try { renderComp.saveFrameToPng(time, frameFile); } catch (frameError) {}
            if (frameFile.exists) {
                result.frames.push("Preview/" + frameFile.name);
                result.count++;
                var size = 0;
                try { size = Number(frameFile.length || 0); } catch (sizeError) {}
                if (size > bestSize) { bestSize = size; bestFile = frameFile; }
            }
        }

        if (!bestFile && preferredTime != null) {
            var fallback = new File(previewFolder.fsName + "/preview_00.png");
            try { renderComp.saveFrameToPng(Math.max(0, Math.min(Number(preferredTime || 0), duration - frameDuration)), fallback); } catch (fallbackError) {}
            if (fallback.exists) {
                result.frames = ["Preview/" + fallback.name];
                result.count = 1;
                bestFile = fallback;
            }
        }

        var posterFile = new File(packFolder.fsName + "/preview.png");
        if (bestFile && bestFile.exists) {
            try {
                if (posterFile.exists) posterFile.remove();
                bestFile.copy(posterFile.fsName);
            } catch (copyPosterError) {}
            if (posterFile.exists) result.poster = "preview.png";
        }

        try { if (previewComp) previewComp.remove(); } catch (removePreviewError) {}
        previewComp = null;
        try { app.project.bitsPerChannel = oldBpc; } catch (e4) {}
    } catch (e) {
        try { if (previewComp) previewComp.remove(); } catch (removeError2) {}
    }
    return result;
}

function shax_saveAssetPack(name, category, sourceMode, packResources) {
    var activeComp = app.project ? app.project.activeItem : null;
    if (!(activeComp && activeComp instanceof CompItem)) return "NO_ACTIVE_COMP";

    if (!app.project.file) {
        var saved = false;
        try { saved = app.project.saveWithDialog(); } catch (saveDialogError) {
            return "ERROR~~RK_FIELD~~" + shax_assetField("Could not open Save Project dialog. " + saveDialogError.toString());
        }
        if (!saved || !app.project.file) return "SAVE_CANCELLED";
    }

    sourceMode = String(sourceMode) === "selection" ? "selection" : "comp";
    packResources = String(packResources) === "true";
    if (sourceMode === "selection" && (!activeComp.selectedLayers || !activeComp.selectedLayers.length)) return "NO_SELECTION";

    name = shax_assetSafeName(name || activeComp.name || "Asset");
    category = shax_assetSafeName(category || "Other");
    var originalFile = new File(app.project.file.fsName);
    var now = new Date();
    var id = String(now.getTime()) + "_" + shax_assetSafeId(name);
    var packFolder = shax_assetPackFolder(id);
    if (!packFolder.exists && !packFolder.create()) return "ERROR~~RK_FIELD~~Could not create Asset Vault folder";
    var resourcesFolder = new Folder(packFolder.fsName + "/Resources");
    var projectFile = new File(packFolder.fsName + "/asset.aep");
    var metaFile = new File(packFolder.fsName + "/asset.shaxasset");
    var result = "";
    var resourceResult = { copied:0, missing:0, relinked:0 };

    try {
        app.project.save();
        var assetComp = activeComp;
        var previewTime = Math.max(0, Math.min(activeComp.time, Math.max(0, activeComp.duration - activeComp.frameDuration)));

        if (sourceMode === "selection") {
            var selected = activeComp.selectedLayers;
            var indices = [];
            for (var i = 0; i < selected.length; i++) indices.push(Number(selected[i].index));
            indices.sort(function (a, b) { return a - b; });
            try {
                assetComp = activeComp.layers.precompose(indices, name, true);
            } catch (precomposeError) {
                throw new Error("Could not precompose the selected layers. " + precomposeError.toString());
            }
            if (!(assetComp && assetComp instanceof CompItem)) throw new Error("Could not create the reusable asset composition");
            try { assetComp.name = name; } catch (renameError) {}
            previewTime = Math.max(0, Math.min(previewTime, Math.max(0, assetComp.duration - assetComp.frameDuration)));
        }

        var previewResult = shax_assetRenderPreviewSequence(assetComp, packFolder, previewTime);

        try { app.project.reduceProject([assetComp]); }
        catch (reduceError) { throw new Error("Could not reduce the project to the saved asset. " + reduceError.toString()); }

        if (packResources) resourceResult = shax_assetCopyResources(resourcesFolder);

        app.project.save(projectFile);

        var meta = {
            format:"SHAXAssetPack",
            version:1,
            id:id,
            name:name,
            category:category,
            created:now.toString(),
            sourceMode:sourceMode,
            compName:String(assetComp.name || name),
            duration:Number(assetComp.duration || 0),
            frameRate:Number(assetComp.frameRate || 0),
            width:Number(assetComp.width || 0),
            height:Number(assetComp.height || 0),
            layerCount:Number(assetComp.numLayers || 0),
            resources:Number(resourceResult.copied || 0),
            missing:Number(resourceResult.missing || 0),
            projectFile:"asset.aep",
            previewFile:(previewResult && previewResult.poster) ? previewResult.poster : "preview.png",
            previewFrames:(previewResult && previewResult.frames) ? previewResult.frames : [],
            previewFrameCount:(previewResult && previewResult.count) ? previewResult.count : 0
        };
        shax_assetWriteJson(metaFile, meta);
        result = "OK~~RK_FIELD~~" + shax_assetField(id) + "~~RK_FIELD~~" + meta.resources + "~~RK_FIELD~~" + meta.missing + "~~RK_FIELD~~" + meta.layerCount;
    } catch (e) {
        result = "ERROR~~RK_FIELD~~" + shax_assetField(e.toString());
    }

    try { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); } catch (closeError) {}
    try { app.open(originalFile); }
    catch (openError) {
        return "ERROR~~RK_FIELD~~Asset pack was created, but SHAX could not reopen the original project: " + shax_assetField(openError.toString());
    }
    return result;
}

function shax_listAssetPacks() {
    try {
        var folders = shax_assetVaultRoot().getFiles();
        var items = [];
        for (var i = 0; i < folders.length; i++) {
            if (!(folders[i] instanceof Folder)) continue;
            var metaFile = new File(folders[i].fsName + "/asset.shaxasset");
            var data = shax_assetReadJson(metaFile);
            if (!data || data.format !== "SHAXAssetPack") continue;
            var preview = new File(folders[i].fsName + "/" + String(data.previewFile || "preview.png"));
            var previewFrames = [];
            if (data.previewFrames && data.previewFrames.length) {
                for (var pf = 0; pf < data.previewFrames.length; pf++) {
                    var frameFile = new File(folders[i].fsName + "/" + String(data.previewFrames[pf] || ""));
                    if (frameFile.exists) previewFrames.push(frameFile.fsName);
                }
            }
            items.push({
                id:String(data.id || folders[i].name),
                name:String(data.name || "Untitled Asset"),
                category:String(data.category || "Other"),
                compName:String(data.compName || ""),
                duration:Number(data.duration || 0),
                layerCount:Number(data.layerCount || 0),
                resources:Number(data.resources || 0),
                missing:Number(data.missing || 0),
                previewPath:preview.exists ? preview.fsName : "",
                previewFrames:previewFrames,
                created:String(data.created || ""),
                width:Number(data.width || 0),
                height:Number(data.height || 0)
            });
        }
        if (!items.length) return "EMPTY";
        items.sort(function (a, b) { return String(a.created) < String(b.created) ? 1 : -1; });
        var out = [];
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            out.push(
                shax_assetField(item.id) + "~~RK_FIELD~~" +
                shax_assetField(item.name) + "~~RK_FIELD~~" +
                shax_assetField(item.category) + "~~RK_FIELD~~" +
                shax_assetField(item.compName) + "~~RK_FIELD~~" +
                item.duration + "~~RK_FIELD~~" + item.layerCount + "~~RK_FIELD~~" +
                item.resources + "~~RK_FIELD~~" + item.missing + "~~RK_FIELD~~" +
                shax_assetField(item.previewPath) + "~~RK_FIELD~~" + shax_assetField(item.created) + "~~RK_FIELD~~" +
                item.width + "~~RK_FIELD~~" + item.height + "~~RK_FIELD~~" +
                shax_assetField((item.previewFrames || []).join("~~RK_FRAME~~"))
            );
        }
        return "OK~~RK_ITEM~~" + out.join("~~RK_ITEM~~");
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + shax_assetField(e.toString());
    }
}

function shax_assetFindItemById(id) {
    id = Number(id || 0);
    if (!id) return null;
    for (var i = 1; i <= app.project.numItems; i++) {
        try { if (Number(app.project.item(i).id) === id) return app.project.item(i); } catch (e) {}
    }
    return null;
}

function shax_assetRemoveProjectFolder(folder) {
    if (!(folder && folder instanceof FolderItem)) return;
    var guard = 0;
    while (guard < 10000) {
        guard++;
        var child = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            try { if (app.project.item(i).parentFolder === folder) { child = app.project.item(i); break; } } catch (e) {}
        }
        if (!child) break;
        try {
            if (child instanceof FolderItem) shax_assetRemoveProjectFolder(child);
            else child.remove();
        } catch (removeChildError) { break; }
    }
    try { folder.remove(); } catch (removeFolderError) {}
}

function shax_assetClearPreviewInternal(openReturnComp) {
    var root = shax_assetFindItemById(SHAX_ASSET_PREVIEW_ROOT_ID);
    var returnComp = shax_assetFindItemById(SHAX_ASSET_PREVIEW_RETURN_COMP_ID);
    if (root && root instanceof FolderItem) shax_assetRemoveProjectFolder(root);
    if (openReturnComp && returnComp && returnComp instanceof CompItem) {
        try { returnComp.openInViewer(); } catch (e) {}
    }
    SHAX_ASSET_PREVIEW_ROOT_ID = 0;
    SHAX_ASSET_PREVIEW_COMP_ID = 0;
    SHAX_ASSET_PREVIEW_RETURN_COMP_ID = 0;
    SHAX_ASSET_PREVIEW_PACK_ID = "";
}

function shax_rebuildAssetPreview(id) {
    var data = shax_assetMetaById(id);
    if (!data) return "PACK_NOT_FOUND";
    var imported = null;
    try {
        imported = shax_assetImportPack(data, true, null);
        if (!(imported && imported.comp && imported.comp instanceof CompItem)) throw new Error("Saved asset composition was not found");

        var previewResult = shax_assetRenderPreviewSequence(imported.comp, data._folder, 0);
        data.previewFile = (previewResult && previewResult.poster) ? previewResult.poster : String(data.previewFile || "preview.png");
        data.previewFrames = (previewResult && previewResult.frames) ? previewResult.frames : [];
        data.previewFrameCount = (previewResult && previewResult.count) ? previewResult.count : 0;
        shax_assetWriteJson(new File(data._folder.fsName + "/asset.shaxasset"), data);

        var posterFile = new File(data._folder.fsName + "/" + String(data.previewFile || "preview.png"));
        var framePaths = [];
        for (var i = 0; i < data.previewFrames.length; i++) {
            var frameFile = new File(data._folder.fsName + "/" + String(data.previewFrames[i] || ""));
            if (frameFile.exists) framePaths.push(frameFile.fsName);
        }

        if (imported.root && imported.root instanceof FolderItem) shax_assetRemoveProjectFolder(imported.root);
        imported = null;

        return "OK~~RK_FIELD~~" + shax_assetField(posterFile.exists ? posterFile.fsName : "") +
            "~~RK_FIELD~~" + shax_assetField(framePaths.join("~~RK_FRAME~~"));
    } catch (e) {
        try { if (imported && imported.root && imported.root instanceof FolderItem) shax_assetRemoveProjectFolder(imported.root); } catch (cleanupError) {}
        return "ERROR~~RK_FIELD~~" + shax_assetField(e.toString());
    }
}

function shax_assetImportPack(data, previewMode, targetComp) {
    var projectFile = new File(data._folder.fsName + "/" + String(data.projectFile || "asset.aep"));
    if (!projectFile.exists) throw new Error("Packed AE project is missing");

    var before = {};
    for (var i = 1; i <= app.project.numItems; i++) {
        try { before[String(app.project.item(i).id)] = true; } catch (e0) {}
    }

    var io = new ImportOptions(projectFile);
    try { if (io.canImportAs(ImportAsType.PROJECT)) io.importAs = ImportAsType.PROJECT; } catch (e1) {}
    app.project.importFile(io);

    var newItems = [];
    for (var j = 1; j <= app.project.numItems; j++) {
        var it = app.project.item(j);
        var known = false;
        try { known = before[String(it.id)] === true; } catch (e2) {}
        if (!known) newItems.push(it);
    }
    if (!newItems.length) throw new Error("After Effects did not import the saved asset project");

    var root = null;
    var assetComp = null;
    for (var n = 0; n < newItems.length; n++) {
        var item = newItems[n];
        try {
            if (!root && item instanceof FolderItem && item.parentFolder === app.project.rootFolder) root = item;
            if (!assetComp && item instanceof CompItem && String(item.name) === String(data.compName)) assetComp = item;
        } catch (e3) {}
    }
    if (!assetComp) {
        for (var c = 0; c < newItems.length; c++) if (newItems[c] instanceof CompItem) { assetComp = newItems[c]; break; }
    }
    if (!assetComp) throw new Error("Saved asset composition was not found after import");

    if (!root) {
        root = app.project.items.addFolder((previewMode ? "[SHAX PREVIEW] " : "SHAX • ") + String(data.name || "Asset"));
        for (var m = 0; m < newItems.length; m++) {
            try { if (newItems[m] !== root && newItems[m].parentFolder === app.project.rootFolder) newItems[m].parentFolder = root; } catch (e4) {}
        }
    }
    try { root.name = (previewMode ? "[SHAX PREVIEW] " : "SHAX • ") + String(data.name || assetComp.name); } catch (e5) {}

    return { root:root, comp:assetComp, items:newItems.length, target:targetComp };
}

function shax_previewAssetPack(id) {
    var data = shax_assetMetaById(id);
    if (!data) return "PACK_NOT_FOUND";
    try {
        shax_assetClearPreviewInternal(false);
        var target = app.project && app.project.activeItem instanceof CompItem ? app.project.activeItem : null;
        var imported = shax_assetImportPack(data, true, target);
        SHAX_ASSET_PREVIEW_ROOT_ID = imported.root ? Number(imported.root.id) : 0;
        SHAX_ASSET_PREVIEW_COMP_ID = imported.comp ? Number(imported.comp.id) : 0;
        SHAX_ASSET_PREVIEW_RETURN_COMP_ID = target ? Number(target.id) : 0;
        SHAX_ASSET_PREVIEW_PACK_ID = String(id);
        try { imported.comp.openInViewer(); } catch (viewerError) {}
        return "OK~~RK_FIELD~~" + shax_assetField(imported.comp.name) + "~~RK_FIELD~~" + imported.items;
    } catch (e) {
        shax_assetClearPreviewInternal(true);
        return "ERROR~~RK_FIELD~~" + shax_assetField(e.toString());
    }
}

function shax_applyAssetPack(id, insertIntoComp) {
    var data = shax_assetMetaById(id);
    if (!data) return "PACK_NOT_FOUND";
    insertIntoComp = String(insertIntoComp) === "true";
    app.beginUndoGroup("SHAX - Apply Asset Vault");
    try {
        var target = null;
        var root = null;
        var assetComp = null;
        var importedCount = 0;

        if (String(SHAX_ASSET_PREVIEW_PACK_ID) === String(id)) {
            root = shax_assetFindItemById(SHAX_ASSET_PREVIEW_ROOT_ID);
            assetComp = shax_assetFindItemById(SHAX_ASSET_PREVIEW_COMP_ID);
            target = shax_assetFindItemById(SHAX_ASSET_PREVIEW_RETURN_COMP_ID);
            if (!(target && target instanceof CompItem)) target = null;
            if (!(root && root instanceof FolderItem && assetComp && assetComp instanceof CompItem)) {
                shax_assetClearPreviewInternal(false);
                root = null; assetComp = null;
            }
        }

        if (!assetComp) {
            target = app.project && app.project.activeItem instanceof CompItem ? app.project.activeItem : null;
            var imported = shax_assetImportPack(data, false, target);
            root = imported.root;
            assetComp = imported.comp;
            importedCount = imported.items;
        } else {
            try { root.name = "SHAX • " + String(data.name || assetComp.name); } catch (renameError) {}
        }

        SHAX_ASSET_PREVIEW_ROOT_ID = 0;
        SHAX_ASSET_PREVIEW_COMP_ID = 0;
        SHAX_ASSET_PREVIEW_RETURN_COMP_ID = 0;
        SHAX_ASSET_PREVIEW_PACK_ID = "";

        if (insertIntoComp && target && target instanceof CompItem && target !== assetComp) {
            var layer = target.layers.add(assetComp);
            try { layer.startTime = target.time; } catch (timeError) {}
            try { layer.name = String(data.name || assetComp.name); } catch (nameError) {}
            try {
                for (var s = 1; s <= target.numLayers; s++) target.layer(s).selected = false;
                layer.selected = true;
            } catch (selectError) {}
            try { target.openInViewer(); } catch (viewerError2) {}
            app.endUndoGroup();
            return "OK~~RK_FIELD~~INSERTED~~RK_FIELD~~" + shax_assetField(assetComp.name) + "~~RK_FIELD~~" + importedCount;
        }

        try { assetComp.openInViewer(); } catch (viewerError3) {}
        app.endUndoGroup();
        return "OK~~RK_FIELD~~IMPORTED~~RK_FIELD~~" + shax_assetField(assetComp.name) + "~~RK_FIELD~~" + importedCount;
    } catch (e) {
        app.endUndoGroup();
        return "ERROR~~RK_FIELD~~" + shax_assetField(e.toString());
    }
}

function shax_clearAssetPreview() {
    try {
        if (!SHAX_ASSET_PREVIEW_ROOT_ID) return "NONE";
        shax_assetClearPreviewInternal(true);
        return "OK";
    } catch (e) {
        return "ERROR~~RK_FIELD~~" + shax_assetField(e.toString());
    }