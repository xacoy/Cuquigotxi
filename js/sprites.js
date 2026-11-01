'use strict';
/* Dibujo vectorial moderno (gradientes, formas suaves) de todas las criaturas, objetos e iconos. */

const SPECIES = {
  puchi:     { name: 'Puchi',      stage: 'baby',  body: '#b5f5da', body2: '#4fcfa6', belly: '#f0fff9', rx: 30, ry: 27, ears: 'sprout', cheek: '#ff9fb8' },
  bunbun:    { name: 'Bunbun',     stage: 'child', body: '#ffd9bd', body2: '#ff9d7a', belly: '#fff4ea', rx: 38, ry: 35, ears: 'bunny',  cheek: '#ff7f9f', accent: '#ff9bb5' },
  kitto:     { name: 'Kitto',      stage: 'child', body: '#e4d6ff', body2: '#a98bf7', belly: '#f8f3ff', rx: 38, ry: 35, ears: 'cat',    cheek: '#ff8fb4', accent: '#8d68e0' },
  lumi:      { name: 'Lumi',       stage: 'teen',  body: '#fff1a6', body2: '#ffc93c', belly: '#fffbe0', rx: 43, ry: 40, ears: 'star',   cheek: '#ff9a8a', accent: '#ffb300' },
  nimbo:     { name: 'Nimbo',      stage: 'teen',  body: '#d5ecff', body2: '#7bbcf5', belly: '#f4faff', rx: 44, ry: 38, ears: 'cloud',  cheek: '#ff9fb8', accent: '#bfe0ff' },
  pinchi:    { name: 'Pinchi',     stage: 'teen',  body: '#ffb0a3', body2: '#ee5a52', belly: '#ffe3dd', rx: 43, ry: 39, ears: 'spikes', cheek: '#ff6a7a', accent: '#c93a3a', angry: true },
  estrellin: { name: 'Estrellín',  stage: 'adult', body: '#ffeb99', body2: '#ffb52e', belly: '#fffbe3', rx: 50, ry: 46, ears: 'crownstar', cheek: '#ff8f7a', accent: '#ff9a00', sparkle: true },
  nubi:      { name: 'Nubi',       stage: 'adult', body: '#e3f2ff', body2: '#87c3fa', belly: '#ffffff', rx: 54, ry: 44, ears: 'cloud',  cheek: '#ff9fb8', accent: '#cde8ff' },
  grunon:    { name: 'Gruñón',     stage: 'adult', body: '#c9a5ff', body2: '#6a3fc2', belly: '#e8d9ff', rx: 52, ry: 45, ears: 'horns',  cheek: '#ff5f8d', accent: '#3d1f85', angry: true },
  cosmico:   { name: 'Cósmico',    stage: 'adult', body: '#a8f0ff', body2: '#b07cff', belly: '#f2fdff', rx: 52, ry: 47, ears: 'halo',   cheek: '#ff8fd0', accent: '#ffd966', sparkle: true, rainbow: true },
};

const STAGE_NAMES = { egg: 'Huevo', baby: 'Bebé', child: 'Niño', teen: 'Joven', adult: 'Adulto', senior: 'Senior', dead: 'Fallecido' };

function blobPath(c, rx, ry, f) {
  c.beginPath();
  c.moveTo(0, -ry);
  c.bezierCurveTo(rx * f, -ry, rx, -ry * f, rx, 0);
  c.bezierCurveTo(rx, ry * f, rx * f, ry, 0, ry);
  c.bezierCurveTo(-rx * f, ry, -rx, ry * f, -rx, 0);
  c.bezierCurveTo(-rx, -ry * f, -rx * f, -ry, 0, -ry);
  c.closePath();
}
function ell(c, x, y, rx, ry, fill, rot) {
  c.beginPath(); c.ellipse(x, y, Math.max(rx, .1), Math.max(ry, .1), rot || 0, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill();
}
function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * .9);
  c.bezierCurveTo(x - s * 1.6, y - s * .1, x - s * .9, y - s * 1.2, x, y - s * .45);
  c.bezierCurveTo(x + s * .9, y - s * 1.2, x + s * 1.6, y - s * .1, x, y + s * .9);
  c.closePath();
}
function drawHeart(c, x, y, s, fill, stroke) {
  heartPath(c, x, y, s); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
}
function starPath(c, x, y, r, pts) {
  pts = pts || 5;
  c.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r * .5 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
function drawStar(c, x, y, r, fill, rot) {
  c.save(); c.translate(x, y); c.rotate(rot || 0);
  starPath(c, 0, 0, r); c.fillStyle = fill; c.lineJoin = 'round';
  c.strokeStyle = fill; c.lineWidth = r * .25; c.stroke(); c.fill();
  c.restore();
}
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

/* ---------- Criatura ---------- */
function drawPet(c, sp, o) {
  const t = o.t, sc = o.scale || 1;
  const rx = sp.rx * sc, ry = sp.ry * sc;
  const breathe = Math.sin(t * 2.4) * .03;
  const hop = o.hop ? Math.abs(Math.sin(t * 9)) * 12 : 0;
  const sx = 1 + breathe + (o.squash || 0), sy = 1 - breathe - (o.squash || 0);
  const mood = o.mood || 'neutral';
  const dir = o.dir || 0;

  c.save();
  c.translate(o.x, o.y);
  // sombra
  ell(c, 0, 0, rx * .85 * (1 - hop / 60), 7, 'rgba(30,20,60,.22)');
  c.translate(0, -hop);

  c.save();
  c.translate(0, -ry * sy - 6);
  c.scale(sx, sy);

  // Piezas traseras
  const wob = Math.sin(t * 3) * .06;
  if (sp.ears === 'bunny') {
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * rx * .5, -ry * .8); c.rotate(s * .22 + wob * s - (mood === 'sad' ? s * .45 : 0));
      ell(c, 0, -ry * .5, rx * .2, ry * .62, sp.body2);
      ell(c, 0, -ry * .48, rx * .11, ry * .45, sp.accent);
      c.restore();
    }
  } else if (sp.ears === 'cat') {
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * rx * .62, -ry * .72); c.rotate(s * .35 + wob * s);
      c.beginPath(); c.moveTo(-rx * .22, 0); c.quadraticCurveTo(0, -ry * .95, rx * .24, -ry * .05); c.closePath();
      c.fillStyle = sp.body2; c.fill();
      c.beginPath(); c.moveTo(-rx * .1, -ry * .04); c.quadraticCurveTo(0, -ry * .55, rx * .12, -ry * .06); c.closePath();
      c.fillStyle = sp.accent; c.globalAlpha = .55; c.fill(); c.globalAlpha = 1;
      c.restore();
    }
    // cola
    c.save(); c.translate(rx * .95, ry * .3); c.rotate(Math.sin(t * 4) * .2);
    ell(c, rx * .18, -ry * .2, rx * .13, ry * .45, sp.body2, .5); c.restore();
  } else if (sp.ears === 'sprout') {
    c.save(); c.translate(0, -ry * .95); c.rotate(wob);
    c.beginPath(); c.moveTo(0, ry * .1); c.quadraticCurveTo(-4, -ry * .35, 0, -ry * .5); c.strokeStyle = '#2fa57f'; c.lineWidth = 3; c.stroke();
    ell(c, -rx * .22, -ry * .55, rx * .26, ry * .13, '#6be0b0', -.5);
    ell(c, rx * .22, -ry * .55, rx * .26, ry * .13, '#4fcfa6', .5);
    c.restore();
  } else if (sp.ears === 'star' || sp.ears === 'crownstar') {
    c.beginPath(); c.moveTo(0, -ry * .9); c.quadraticCurveTo(rx * .2, -ry * 1.2, 0, -ry * 1.35);
    c.strokeStyle = sp.accent; c.lineWidth = 3; c.stroke();
    const big = sp.ears === 'crownstar';
    drawStar(c, 0, -ry * (big ? 1.5 : 1.45), rx * (big ? .3 : .24), '#fff27a', t * .8 + wob);
    if (big) {
      drawStar(c, -rx * .6, -ry * 1.15, rx * .12, '#ffe08a', -t); drawStar(c, rx * .6, -ry * 1.2, rx * .12, '#ffe08a', t);
    }
  } else if (sp.ears === 'cloud') {
    ell(c, -rx * .45, -ry * .78, rx * .3, ry * .3, sp.accent);
    ell(c, 0, -ry * .95, rx * .38, ry * .36, sp.accent);
    ell(c, rx * .45, -ry * .78, rx * .3, ry * .3, sp.accent);
  } else if (sp.ears === 'spikes') {
    for (let i = -2; i <= 2; i++) {
      c.save(); c.rotate(i * .38);
      c.beginPath(); c.moveTo(-rx * .14, -ry * .85); c.lineTo(0, -ry * 1.28 - Math.abs(i) * -3); c.lineTo(rx * .14, -ry * .85); c.closePath();
      c.fillStyle = sp.accent; c.fill(); c.restore();
    }
  } else if (sp.ears === 'horns') {
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * rx * .5, -ry * .8); c.rotate(s * .4);
      c.beginPath(); c.moveTo(-rx * .13, 0); c.quadraticCurveTo(-rx * .05 * s, -ry * .5, s * rx * .12, -ry * .75); c.quadraticCurveTo(rx * .25, -ry * .3, rx * .13, 0); c.closePath();
      c.fillStyle = '#ffe9a6'; c.fill(); c.strokeStyle = '#d9a73a'; c.lineWidth = 1.5; c.stroke(); c.restore();
    }
    c.save(); c.translate(-rx * .98, ry * .5); c.rotate(.4);
    ell(c, 0, 0, rx * .1, ry * .3, sp.body2, .6); c.restore();
  } else if (sp.ears === 'halo') {
    c.beginPath(); c.ellipse(0, -ry * 1.28 + Math.sin(t * 2) * 3, rx * .38, ry * .12, 0, 0, Math.PI * 2);
    c.strokeStyle = sp.accent; c.lineWidth = 5; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.stroke();
  }

  if (sp.drawBack) sp.drawBack(c, rx, ry, t, wob);

  // Brazos y pies (detrás del cuerpo)
  const wave = mood === 'happy' ? Math.sin(t * 10) * .5 : 0;
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * rx * .96, ry * .15); c.rotate(s * (.6 + (s === 1 ? wave : -wave * .6)) - (mood === 'sad' ? s * .4 : 0));
    ell(c, 0, ry * .12, rx * .13, ry * .3, sp.body2); c.restore();
    ell(c, s * rx * .42, ry * .97, rx * .22, ry * .12, sp.body2);
  }

  // Cuerpo
  const f = sp.ears === 'cloud' ? .62 : .6;
  blobPath(c, rx, ry, f);
  let g;
  if (sp.rainbow) {
    g = c.createLinearGradient(-rx, -ry, rx, ry);
    const h = (t * 30) % 360;
    g.addColorStop(0, `hsl(${h},90%,80%)`); g.addColorStop(.5, `hsl(${(h + 70) % 360},90%,78%)`); g.addColorStop(1, `hsl(${(h + 140) % 360},85%,70%)`);
  } else {
    g = c.createRadialGradient(-rx * .35, -ry * .5, rx * .1, 0, 0, rx * 1.25);
    g.addColorStop(0, sp.body); g.addColorStop(1, sp.body2);
  }
  c.fillStyle = g; c.fill();
  c.strokeStyle = o.outline ? 'rgba(20,10,40,.9)' : 'rgba(40,20,70,.14)'; c.lineWidth = o.outline ? 3.2 : 2; c.stroke();

  // Tinte enfermo / senior
  if (o.sick) { c.save(); blobPath(c, rx, ry, f); c.clip(); c.fillStyle = 'rgba(120,200,90,.38)'; c.fillRect(-rx, -ry, rx * 2, ry * 2); c.restore(); }
  if (o.senior) { c.save(); blobPath(c, rx, ry, f); c.clip(); c.fillStyle = 'rgba(200,200,215,.4)'; c.fillRect(-rx, -ry, rx * 2, ry * 2); c.restore(); }

  // Barriga + brillo
  ell(c, 0, ry * .42, rx * .58, ry * .5, sp.belly || '#fff'); c.globalAlpha = 1;
  c.save(); c.globalAlpha = .55; ell(c, -rx * .45, -ry * .55, rx * .2, ry * .1, '#fff', -.6); ell(c, -rx * .22, -ry * .72, rx * .06, ry * .04, '#fff', -.6); c.restore();
  if (sp.sparkle) {
    for (let i = 0; i < 3; i++) {
      const a = t * 1.5 + i * 2.1, k = (Math.sin(a * 2) + 1) / 2;
      c.globalAlpha = k; drawStar(c, Math.cos(a) * rx * .85, Math.sin(a) * ry * .85, 4 + k * 3, '#fff', a);
    }
    c.globalAlpha = 1;
  }

  // Cara
  const ex = rx * .36, ey = -ry * .08, er = Math.max(rx * .14, 4.5);
  const look = dir * er * .35;
  const eyeOpen = !(o.sleeping || o.blink);
  const cheekA = mood === 'sick' ? .2 : .65;
  c.globalAlpha = cheekA;
  ell(c, -rx * .6, ry * .16, rx * .15, ry * .09, sp.cheek); ell(c, rx * .6, ry * .16, rx * .15, ry * .09, sp.cheek);
  c.globalAlpha = 1;

  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const cx = s * ex;
    if (o.sleeping) {
      c.beginPath(); c.arc(cx, ey, er * .9, .15 * Math.PI, .85 * Math.PI); c.strokeStyle = '#2b2440'; c.lineWidth = 2.6; c.stroke();
    } else if (mood === 'happy' && !o.blink) {
      c.beginPath(); c.arc(cx, ey + er * .5, er * .95, 1.15 * Math.PI, 1.85 * Math.PI); c.strokeStyle = '#2b2440'; c.lineWidth = 3; c.stroke();
    } else if (!eyeOpen) {
      c.beginPath(); c.moveTo(cx - er, ey); c.lineTo(cx + er, ey); c.strokeStyle = '#2b2440'; c.lineWidth = 2.6; c.stroke();
    } else if (mood === 'dead') {
      c.strokeStyle = '#2b2440'; c.lineWidth = 2.6; c.beginPath();
      c.moveTo(cx - er * .8, ey - er * .8); c.lineTo(cx + er * .8, ey + er * .8); c.moveTo(cx + er * .8, ey - er * .8); c.lineTo(cx - er * .8, ey + er * .8); c.stroke();
    } else {
      ell(c, cx, ey, er * 1.12, er * 1.2, '#fff');
      c.strokeStyle = 'rgba(40,20,70,.25)'; c.lineWidth = 1; c.stroke();
      if (mood === 'sick') {
        c.beginPath(); for (let a = 0; a < 12; a += .3) { const r = a * er * .06; c.lineTo(cx + Math.cos(a + t * 5) * r, ey + Math.sin(a + t * 5) * r); }
        c.strokeStyle = '#2b2440'; c.lineWidth = 1.8; c.stroke();
      } else {
        ell(c, cx + look, ey + er * .1, er * .72, er * .82, '#2b2440');
        ell(c, cx + look - er * .25, ey - er * .25, er * .26, er * .26, '#fff');
        ell(c, cx + look + er * .2, ey + er * .35, er * .12, er * .12, 'rgba(255,255,255,.7)');
      }
      // lagrimas
      if (mood === 'sad') ell(c, cx + s * er * .5, ey + er * 1.5 + ((t * 20) % 14), er * .22, er * .34, 'rgba(120,190,255,.85)');
    }
    // cejas
    const brow = (sp.angry && mood !== 'happy' && !o.sleeping) ? 1 : (mood === 'sad' ? -1 : 0);
    if (brow && !o.sleeping) {
      c.beginPath();
      const inner = brow > 0 ? er * 1.15 : er * 2.0, outer = brow > 0 ? er * 1.9 : er * 1.4;
      c.moveTo(cx - s * er * 1.1, ey - inner); c.lineTo(cx + s * er * 1.1, ey - outer);
      c.strokeStyle = '#2b2440'; c.lineWidth = 2.6; c.stroke();
    }
  }
  // Boca
  const my = ry * .26;
  c.strokeStyle = '#2b2440'; c.fillStyle = '#7a2a4a'; c.lineWidth = 2.6;
  if (o.eating) {
    const m = (Math.sin(t * 14) + 1) / 2;
    ell(c, 0, my, rx * .14, ry * (.05 + m * .1), '#7a2a4a');
  } else if (o.sleeping) {
    ell(c, 0, my, rx * .06, ry * .05 + Math.sin(t * 2.4) * 2 + 2, '#7a2a4a');
  } else if (mood === 'happy') {
    c.beginPath(); c.moveTo(-rx * .2, my - 3); c.quadraticCurveTo(0, my + ry * .35, rx * .2, my - 3); c.closePath(); c.fill(); c.stroke();
    ell(c, 0, my + ry * .11, rx * .09, ry * .05, '#ff8ca8');
  } else if (mood === 'sad' || mood === 'sick' || mood === 'hungry') {
    if (mood === 'hungry') { ell(c, 0, my + 2, rx * .1, ry * .1, '#7a2a4a'); }
    else { c.beginPath(); c.moveTo(-rx * .16, my + 5); c.quadraticCurveTo(0, my - 6, rx * .16, my + 5); c.stroke(); }
  } else if (mood === 'dead') {
    c.beginPath(); c.moveTo(-rx * .14, my + 2); c.lineTo(rx * .14, my + 2); c.stroke();
  } else {
    c.beginPath(); c.moveTo(-rx * .14, my - 1); c.quadraticCurveTo(0, my + 7, rx * .14, my - 1); c.stroke();
  }

  if (sp.drawFront) sp.drawFront(c, rx, ry, t, mood);
  if (o.acc) {
    const geo = { rx, ry, ex, ey, er, my, t };
    for (const slot of ['neck', 'face', 'head']) if (o.acc[slot]) drawAccessory(c, o.acc[slot], geo);
  }

  // Accesorios senior
  if (o.senior) {
    if (!(o.acc && o.acc.face)) {
    c.strokeStyle = '#7b6a4a'; c.lineWidth = 2;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * ex, ey, er * 1.55, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(-ex + er * 1.5, ey); c.lineTo(ex - er * 1.5, ey); c.stroke();
    }
    c.beginPath(); c.moveTo(-rx * .2, my - 5); c.quadraticCurveTo(0, my - 14, rx * .2, my - 5); c.strokeStyle = '#f2f2f2'; c.lineWidth = 5; c.stroke();
  }
  c.restore();

  // Bastón
  if (o.senior) {
    c.save(); c.translate(rx * 1.05, -6); c.strokeStyle = '#8b5a2b'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -ry * 1.1); c.arc(-8, -ry * 1.1, 8, 0, -Math.PI, true); c.stroke(); c.restore();
  }
  c.restore();
}

function drawGhost(c, x, y, t) {
  c.save(); c.translate(x, y - 56 + Math.sin(t * 2) * 6);
  c.globalAlpha = .88;
  const g = c.createLinearGradient(0, -34, 0, 40); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd8ff');
  c.beginPath(); c.moveTo(-32, 30); c.lineTo(-32, -4); c.bezierCurveTo(-32, -42, 32, -42, 32, -4); c.lineTo(32, 30);
  for (let i = 0; i < 4; i++) c.quadraticCurveTo(32 - i * 16 - 8, 44 + (i % 2 ? -2 : 8), 32 - (i + 1) * 16, 30);
  c.closePath(); c.fillStyle = g; c.fill();
  c.globalAlpha = 1; c.strokeStyle = '#2b2440'; c.lineWidth = 2.6; c.lineCap = 'round';
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 12 - 5, -12); c.lineTo(s * 12 + 5, -2); c.moveTo(s * 12 + 5, -12); c.lineTo(s * 12 - 5, -2); c.stroke();
  }
  ell(c, 0, 12, 4, 6, '#7a2a4a');
  c.restore();
}

function drawTomb(c, x, y) {
  c.save(); c.translate(x, y);
  ell(c, 0, 0, 34, 6, 'rgba(0,0,0,.2)');
  rrect(c, -26, -62, 52, 62, 22); const g = c.createLinearGradient(0, -62, 0, 0); g.addColorStop(0, '#d8dbe6'); g.addColorStop(1, '#9ea3b8');
  c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(40,20,70,.3)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#6d7290'; c.fillRect(-3, -50, 6, 24); c.fillRect(-11, -43, 22, 6);
  c.restore();
}

function drawEgg(c, x, y, t, progress, wobbleBoost) {
  c.save(); c.translate(x, y);
  ell(c, 0, 0, 38, 7, 'rgba(30,20,60,.22)');
  const w = Math.sin(t * (6 + progress * 14)) * (.04 + progress * .12 + (wobbleBoost || 0));
  c.rotate(w); c.translate(0, -2);
  c.beginPath(); c.moveTo(0, -84);
  c.bezierCurveTo(40, -84, 52, -26, 46, -10); c.bezierCurveTo(42, 8, 20, 6, 0, 6);
  c.bezierCurveTo(-20, 6, -42, 8, -46, -10); c.bezierCurveTo(-52, -26, -40, -84, 0, -84); c.closePath();
  const g = c.createRadialGradient(-16, -56, 6, 0, -34, 62); g.addColorStop(0, '#fff7fb'); g.addColorStop(.6, '#ffd0e4'); g.addColorStop(1, '#f59ac2');
  c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(120,40,100,.25)'; c.lineWidth = 2; c.stroke();
  c.save(); c.clip();
  const spots = [[-18, -50, 9, '#9be8d0'], [14, -62, 7, '#c9b4ff'], [18, -28, 11, '#9be8d0'], [-22, -22, 7, '#ffe08a'], [2, -40, 5, '#c9b4ff']];
  for (const [sx, sy, sr, col] of spots) ell(c, sx, sy, sr, sr, col);
  c.restore();
  ell(c, -18, -62, 8, 4, 'rgba(255,255,255,.75)', -.8);
  if (progress > .4) {
    c.strokeStyle = '#8c3a6a'; c.lineWidth = 2; c.beginPath();
    c.moveTo(-28, -44); c.lineTo(-18, -38); c.lineTo(-8, -48); c.lineTo(2, -38); c.lineTo(12, -48); c.lineTo(22, -40); c.lineTo(30, -46); c.stroke();
  }
  if (progress > .75) {
    c.beginPath(); c.moveTo(-8, -48); c.lineTo(-12, -62); c.moveTo(12, -48); c.lineTo(16, -60); c.stroke();
  }
  c.restore();
}

function drawPoop(c, x, y, t) {
  c.save(); c.translate(x, y);
  ell(c, 0, 0, 22, 4, 'rgba(0,0,0,.15)');
  const sq = Math.sin(t * 3 + x) * .03;
  c.scale(1 + sq, 1 - sq);
  const g = c.createLinearGradient(0, -34, 0, 0); g.addColorStop(0, '#b97a4a'); g.addColorStop(1, '#7b4a2a');
  c.fillStyle = g;
  for (const [w, yy, h] of [[20, -8, 10], [15, -18, 9], [9, -27, 8]]) { rrect(c, -w, yy - h / 2 - 2, w * 2, h + 4, h * .55); c.fill(); }
  ell(c, -4, -16, 2.6, 3, '#fff'); ell(c, 5, -16, 2.6, 3, '#fff'); ell(c, -4, -15.5, 1.3, 1.6, '#2b2440'); ell(c, 5, -15.5, 1.3, 1.6, '#2b2440');
  c.strokeStyle = '#2b2440'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, -11.5, 3, .2, Math.PI - .2); c.stroke();
  c.globalAlpha = .6; c.strokeStyle = '#8fbf5a'; c.lineWidth = 1.8;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, -34); c.bezierCurveTo(s * 15, -40 - Math.sin(t * 4) * 2, s * 6, -44, s * 11, -50); c.stroke(); }
  c.restore();
}

/* ---------- Comida ---------- */
function drawFood(c, kind, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kind === 'meal') { // onigiri moderno
    c.beginPath(); c.moveTo(0, -16); c.quadraticCurveTo(18, 2, 15, 12); c.quadraticCurveTo(0, 17, -15, 12); c.quadraticCurveTo(-18, 2, 0, -16); c.fillStyle = '#fff'; c.fill();
    c.strokeStyle = 'rgba(40,20,70,.3)'; c.lineWidth = 1.5; c.stroke();
    rrect(c, -9, 3, 18, 12, 3); c.fillStyle = '#2f3b3a'; c.fill();
    ell(c, 0, -2, 2.4, 2.4, '#2b2440');
  } else { // piruleta
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, 18); c.stroke();
    ell(c, 0, -5, 13, 13, '#ff6fa5'); c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.beginPath();
    for (let a = 0; a < 16; a += .2) c.lineTo(Math.cos(a) * a * .7, -5 + Math.sin(a) * a * .7); c.stroke();
  }
  c.restore();
}

/* ---------- Iconos del menú (centrados en 0,0, ~22px) ---------- */
const ICONS = {
  feed(c) {
    ell(c, 0, 3, 9, 9, '#ff5a5f'); ell(c, -3, 0, 2.5, 3.5, 'rgba(255,255,255,.45)', .5);
    c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -5); c.lineTo(1, -9); c.stroke();
    ell(c, 5, -8, 5, 2.6, '#4fcf7a', -.5);
  },
  light(c, on) {
    ell(c, 0, -2, 8, 8, on ? '#ffe45e' : '#9aa0b5');
    if (on) { c.strokeStyle = '#ffd13a'; c.lineWidth = 2; c.lineCap = 'round'; for (let a = 0; a < 6; a++) { const an = -Math.PI + a * Math.PI / 5; c.beginPath(); c.moveTo(Math.cos(an) * 11, -2 + Math.sin(an) * 11); c.lineTo(Math.cos(an) * 14, -2 + Math.sin(an) * 14); c.stroke(); } }
    rrect(c, -4, 6, 8, 5, 2); c.fillStyle = '#6b6f85'; c.fill();
  },
  play(c) {
    rrect(c, -12, -7, 24, 15, 7); c.fillStyle = '#6a7cff'; c.fill();
    c.fillStyle = '#fff'; c.fillRect(-8, -1, 7, 2.4); c.fillRect(-5.8, -3.4, 2.4, 7);
    ell(c, 5, -1, 2, 2, '#ffd23a'); ell(c, 9, 2, 2, 2, '#ff6f91');
  },
  med(c) {
    c.save(); c.rotate(-.7);
    rrect(c, -12, -5, 24, 10, 5); c.fillStyle = '#fff'; c.fill();
    c.save(); rrect(c, -12, -5, 24, 10, 5); c.clip(); c.fillStyle = '#ff5a7a'; c.fillRect(0, -6, 14, 12); c.restore();
    rrect(c, -12, -5, 24, 10, 5); c.strokeStyle = 'rgba(40,20,70,.4)'; c.lineWidth = 1.5; c.stroke();
    c.restore();
  },
  clean(c) {
    ell(c, -3, 3, 8, 8, 'rgba(120,200,255,.9)'); ell(c, 7, -5, 5, 5, 'rgba(160,220,255,.9)'); ell(c, 3, 9, 3, 3, 'rgba(180,230,255,.9)');
    ell(c, -6, 0, 2, 3, 'rgba(255,255,255,.8)', .4);
    drawStar(c, 8, 6, 3, '#ffe45e');
  },
  disc(c) {
    rrect(c, -11, -9, 22, 15, 6); c.fillStyle = '#ff9a3c'; c.fill();
    c.beginPath(); c.moveTo(-4, 5); c.lineTo(-7, 11); c.lineTo(3, 5); c.fill();
    c.fillStyle = '#fff'; rrect(c, -1.5, -6, 3, 7, 1.5); c.fill(); ell(c, 0, 3, 1.8, 1.8, '#fff');
  },
  stats(c) {
    rrect(c, -10, -1, 6, 10, 2); c.fillStyle = '#4fcfa6'; c.fill();
    rrect(c, -3, -8, 6, 17, 2); c.fillStyle = '#6a7cff'; c.fill();
    rrect(c, 4, 3, 6, 6, 2); c.fillStyle = '#ff6f91'; c.fill();
  },
  settings(c) {
    c.fillStyle = '#7d7aa0';
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); rrect(c, -2.4, -11.5, 4.8, 6, 1.5); c.fill(); c.restore(); }
    ell(c, 0, 0, 8.5, 8.5, '#7d7aa0'); ell(c, 0, 0, 3.6, 3.6, '#fff');
  },
};
