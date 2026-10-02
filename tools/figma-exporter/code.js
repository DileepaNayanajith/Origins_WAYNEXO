// WAYNEXO Exporter — read-only. Serialises every screen frame (node tree, styles,
// text, icons as SVG, images, PNG previews) into one JSON file. It never edits the file.
figma.showUI(__html__, { width: 360, height: 220 });

const VECTORISH = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'POLYGON', 'ELLIPSE', 'RECTANGLE']);
const images = {};      // imageHash -> base64
const fonts = new Set();
let count = 0;

function b64(bytes) { return figma.base64Encode(bytes); }

function paint(p) {
  const o = { type: p.type, visible: p.visible !== false, opacity: p.opacity, blendMode: p.blendMode };
  if (p.type === 'SOLID') o.color = p.color;
  if (p.type && p.type.startsWith('GRADIENT')) { o.gradientStops = p.gradientStops; o.gradientTransform = p.gradientTransform; }
  if (p.type === 'IMAGE') { o.imageHash = p.imageHash; o.scaleMode = p.scaleMode; o.imageTransform = p.imageTransform; o.scalingFactor = p.scalingFactor; }
  return o;
}
const paints = (arr) => (arr === figma.mixed || !arr) ? arr === figma.mixed ? 'MIXED' : [] : arr.map(paint);

function onlyVectors(n) {
  if (!('children' in n)) return VECTORISH.has(n.type) && !hasImage(n);
  if (n.children.length === 0) return false;
  return n.children.every(onlyVectors);
}
function hasImage(n) {
  return 'fills' in n && Array.isArray(n.fills) && n.fills.some((f) => f.type === 'IMAGE');
}
function isIcon(n) {
  // icon-like: a small group/frame/instance made only of vector shapes, or a lone vector
  if (VECTORISH.has(n.type) && n.type !== 'RECTANGLE' && n.type !== 'ELLIPSE') return true;
  if (['GROUP', 'FRAME', 'INSTANCE', 'COMPONENT'].includes(n.type) && 'children' in n && onlyVectors(n)
      && n.width <= 96 && n.height <= 96 && !('layoutMode' in n && n.layoutMode !== 'NONE')) return true;
  return false;
}

async function ser(n, depth) {
  count++;
  const o = {
    id: n.id, name: n.name, type: n.type, visible: n.visible,
    x: n.x, y: n.y, w: n.width, h: n.height,
  };
  if ('absoluteBoundingBox' in n && n.absoluteBoundingBox) o.abs = n.absoluteBoundingBox;
  if ('rotation' in n && n.rotation) o.rotation = n.rotation;
  if ('opacity' in n && n.opacity !== 1) o.opacity = n.opacity;
  if ('blendMode' in n && n.blendMode !== 'PASS_THROUGH' && n.blendMode !== 'NORMAL') o.blendMode = n.blendMode;
  if ('isMask' in n && n.isMask) o.isMask = true;
  if ('fills' in n) o.fills = paints(n.fills);
  if ('strokes' in n) {
    o.strokes = paints(n.strokes);
    if (o.strokes.length) {
      o.strokeWeight = n.strokeWeight === figma.mixed ? 'MIXED' : n.strokeWeight;
      o.strokeAlign = n.strokeAlign;
      if ('strokeTopWeight' in n) o.strokeSides = [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight];
      if ('dashPattern' in n && n.dashPattern.length) o.dashPattern = n.dashPattern;
    }
  }
  if ('cornerRadius' in n) {
    if (n.cornerRadius === figma.mixed) o.radii = [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius];
    else if (n.cornerRadius) o.radius = n.cornerRadius;
  }
  if ('effects' in n && n.effects.length) o.effects = n.effects.filter((e) => e.visible !== false);
  if ('clipsContent' in n) o.clips = n.clipsContent;
  if ('constraints' in n) o.constraints = n.constraints;
  if ('layoutMode' in n) {
    o.layout = n.layoutMode;
    if (n.layoutMode !== 'NONE') {
      Object.assign(o, {
        wrap: n.layoutWrap, gap: n.itemSpacing, cgap: n.counterAxisSpacing,
        pt: n.paddingTop, pr: n.paddingRight, pb: n.paddingBottom, pl: n.paddingLeft,
        main: n.primaryAxisAlignItems, cross: n.counterAxisAlignItems,
        mainSizing: n.primaryAxisSizingMode, crossSizing: n.counterAxisSizingMode,
        reverseZ: n.itemReverseZIndex, strokesInLayout: n.strokesIncludedInLayout,
      });
    }
  }
  if ('layoutSizingHorizontal' in n) { o.sizeH = n.layoutSizingHorizontal; o.sizeV = n.layoutSizingVertical; }
  if ('layoutGrow' in n) o.grow = n.layoutGrow;
  if ('layoutAlign' in n) o.align = n.layoutAlign;
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') o.absolute = true;
  if ('minWidth' in n && n.minWidth != null) o.minW = n.minWidth;
  if ('maxWidth' in n && n.maxWidth != null) o.maxW = n.maxWidth;

  if (n.type === 'TEXT') {
    o.text = n.characters;
    o.textAlign = n.textAlignHorizontal; o.textAlignV = n.textAlignVertical;
    o.autoResize = n.textAutoResize; o.truncate = n.textTruncation;
    o.segments = n.getStyledTextSegments(['fontName', 'fontSize', 'fontWeight', 'fills', 'lineHeight',
      'letterSpacing', 'textCase', 'textDecoration']).map((s) => {
      fonts.add(s.fontName.family + ' ' + s.fontName.style);
      return { s: s.start, e: s.end, text: s.characters, font: s.fontName, size: s.fontSize, weight: s.fontWeight,
        fills: s.fills.map(paint), lh: s.lineHeight, ls: s.letterSpacing, tcase: s.textCase, deco: s.textDecoration };
    });
  }

  if ('fills' in n && Array.isArray(n.fills)) {
    for (const f of n.fills) {
      if (f.type === 'IMAGE' && f.imageHash && !images[f.imageHash]) {
        const img = figma.getImageByHash(f.imageHash);
        if (img) { try { images[f.imageHash] = b64(await img.getBytesAsync()); } catch (e) { /* skip */ } }
      }
    }
  }

  if (depth > 0 && n.visible && isIcon(n)) {
    try { o.svg = await n.exportAsync({ format: 'SVG_STRING', svgOutlineText: true }); } catch (e) { o.svgError = String(e); }
    return o;
  }
  if ('children' in n) {
    o.children = [];
    for (const c of n.children) o.children.push(await ser(c, depth + 1));
  }
  return o;
}

async function run() {
  await figma.loadAllPagesAsync();
  const page = figma.currentPage;
  const frames = [];
  for (const c of page.children) {
    if (c.type === 'FRAME') frames.push({ section: null, node: c });
    if (c.type === 'SECTION') for (const f of c.children) if (f.type === 'FRAME') frames.push({ section: c.name, node: f });
  }
  const out = { file: figma.root.name, exportedAt: new Date().toISOString(), frames: [], images, fonts: [] };
  let i = 0;
  for (const { section, node } of frames) {
    i++;
    figma.ui.postMessage({ type: 'progress', text: `Exporting ${i}/${frames.length}: ${node.name}` });
    const tree = await ser(node, 0);
    let png = null;
    try { png = b64(await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } })); } catch (e) { /* ignore */ }
    out.frames.push({ section, id: node.id, name: node.name, w: node.width, h: node.height, png, tree });
  }
  out.fonts = Array.from(fonts);
  out.nodeCount = count;
  figma.ui.postMessage({ type: 'done', json: JSON.stringify(out), frames: frames.length, nodes: count });
}

figma.ui.onmessage = (m) => { if (m.type === 'close') figma.closePlugin(); };
run().catch((e) => figma.ui.postMessage({ type: 'error', text: String(e && e.stack || e) }));
