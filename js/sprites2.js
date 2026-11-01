'use strict';
/* Dibujos adicionales: nuevas criaturas, accesorios, comida, juguetes, iconos y cartas. */

/* ---------- Nuevas criaturas adultas (según estadísticas) ---------- */
Object.assign(SPECIES, {
  fortachon: {
    name: 'Fortachón', stage: 'adult', body: '#ffc79a', body2: '#f0762a', belly: '#fff0df', rx: 54, ry: 46, cheek: '#ff7a6a', accent: '#d63b2f',
    drawFront(c, rx, ry, t) {
      c.save(); c.beginPath(); c.moveTo(-rx * .93, -ry * .34); c.quadraticCurveTo(0, -ry * .62, rx * .93, -ry * .34);
      c.strokeStyle = '#e03a30'; c.lineWidth = 8; c.lineCap = 'round'; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-rx * .6, -ry * .5); c.quadraticCurveTo(0, -ry * .68, rx * .5, -ry * .5); c.stroke();
      c.beginPath(); c.moveTo(rx * .9, -ry * .34); c.lineTo(rx * 1.22, -ry * .1 + Math.sin(t * 5) * 3); c.moveTo(rx * .9, -ry * .34); c.lineTo(rx * 1.16, -ry * .5 + Math.sin(t * 5 + 1) * 3);
      c.strokeStyle = '#e03a30'; c.lineWidth = 5; c.stroke(); c.restore();
    },
  },
  sabio: {
    name: 'Sabio', stage: 'adult', body: '#c3f1ff', body2: '#3fa7d6', belly: '#effcff', rx: 50, ry: 47, cheek: '#ff9fb8', accent: '#ffe45e',
    drawBack(c, rx, ry, t) {
      c.beginPath(); c.moveTo(0, -ry * .9); c.lineTo(0, -ry * 1.3); c.strokeStyle = '#2b2440'; c.lineWidth = 2.5; c.stroke();
      const g = c.createRadialGradient(0, -ry * 1.45, 1, 0, -ry * 1.45, rx * .22); g.addColorStop(0, '#fffbd0'); g.addColorStop(1, '#ffd23a');
      c.beginPath(); c.arc(0, -ry * 1.45, rx * .17 + Math.sin(t * 3) * 1, 0, 7); c.fillStyle = g; c.fill();
      c.globalAlpha = .25; c.beginPath(); c.arc(0, -ry * 1.45, rx * .3, 0, 7); c.fillStyle = '#ffe45e'; c.fill(); c.globalAlpha = 1;
    },
    drawFront(c, rx, ry) {
      const ex = rx * .36, ey = -ry * .08, er = Math.max(rx * .14, 4.5);
      c.strokeStyle = '#2b2440'; c.lineWidth = 2.4;
      for (const s of [-1, 1]) { c.beginPath(); c.arc(s * ex, ey, er * 1.7, 0, 7); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); c.stroke(); }
      c.beginPath(); c.moveTo(-ex + er * 1.7, ey); c.lineTo(ex - er * 1.7, ey); c.stroke();
    },
  },
  diva: {
    name: 'Diva', stage: 'adult', body: '#ffd0ea', body2: '#ee6fb7', belly: '#fff0f8', rx: 49, ry: 45, cheek: '#ff6aa8', accent: '#ff3d8f', sparkle: true,
    drawFront(c, rx, ry, t) {
      c.save(); c.translate(rx * .5, -ry * .9); c.rotate(.35 + Math.sin(t * 2) * .03);
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * rx * .5, -ry * .4, s * rx * .42, ry * .12); c.quadraticCurveTo(s * rx * .1, ry * .02, 0, 0); c.fillStyle = '#ff3d8f'; c.fill(); c.strokeStyle = 'rgba(120,20,70,.35)'; c.lineWidth = 1.5; c.stroke(); }
      ell(c, 0, 0, rx * .1, rx * .1, '#ff7fba'); c.restore();
      const ex = rx * .36, ey = -ry * .08, er = Math.max(rx * .14, 4.5);
      c.strokeStyle = '#2b2440'; c.lineWidth = 2.2; c.lineCap = 'round';
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * ex + s * er * .9, ey - er * .5 + i * 3); c.lineTo(s * ex + s * er * (1.7 + i * .1), ey - er * (1.1 - i * .25)); c.stroke(); }
    },
  },
});
const SPECIES_LABEL = { fortachon: 'Fuerza alta', sabio: 'Mente alta', diva: 'Encanto alto' };

/* ---------- Accesorios ---------- */
function drawAccessory(c, id, g) {
  const { rx, ry, ex, ey, er, my } = g;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  switch (id) {
    case 'lazo':
      c.translate(rx * .48, -ry * .88); c.rotate(.35);
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * rx * .4, -ry * .35, s * rx * .38, ry * .1); c.quadraticCurveTo(s * rx * .1, 0, 0, 0); c.fillStyle = '#ff5c8a'; c.fill(); c.strokeStyle = 'rgba(120,20,60,.4)'; c.lineWidth = 1.4; c.stroke(); }
      ell(c, 0, 0, rx * .08, rx * .08, '#ff9bbd'); break;
    case 'corona': {
      c.translate(0, -ry * .96); const w = rx * .38, h = ry * .4;
      c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h * .7); c.lineTo(-w * .5, -h * .3); c.lineTo(0, -h); c.lineTo(w * .5, -h * .3); c.lineTo(w, -h * .7); c.lineTo(w, 0); c.closePath();
      const gr = c.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(1, '#f0a81a'); c.fillStyle = gr; c.fill(); c.strokeStyle = '#b87810'; c.lineWidth = 1.6; c.stroke();
      ell(c, 0, -h * .35, 3, 3, '#ff5c8a'); break;
    }
    case 'copa':
      c.translate(0, -ry * .94);
      ell(c, 0, 0, rx * .52, ry * .1, '#25223a'); rrect(c, -rx * .3, -ry * .62, rx * .6, ry * .62, 4); c.fillStyle = '#2f2b4a'; c.fill();
      c.fillStyle = '#ff5c8a'; c.fillRect(-rx * .3, -ry * .2, rx * .6, ry * .1); break;
    case 'gorro':
      c.translate(rx * .12, -ry * .94); c.rotate(.14);
      c.beginPath(); c.moveTo(-rx * .3, 0); c.lineTo(0, -ry * .85); c.lineTo(rx * .3, 0); c.closePath(); c.fillStyle = '#ffd23a'; c.fill();
      c.save(); c.clip(); c.fillStyle = '#ff5c8a'; for (let i = 0; i < 3; i++) c.fillRect(-rx, -ry * (.15 + i * .25), rx * 2, ry * .09); c.restore();
      ell(c, 0, -ry * .86, rx * .09, rx * .09, '#6bd6ff'); break;
    case 'gorra':
      c.translate(0, -ry * .78);
      c.beginPath(); c.arc(0, 0, rx * .55, Math.PI, 0); c.closePath(); c.fillStyle = '#4a7cff'; c.fill();
      c.beginPath(); c.ellipse(rx * .5, 0, rx * .5, ry * .08, 0, 0, Math.PI); c.fillStyle = '#2f55d4'; c.fill();
      ell(c, 0, -rx * .55, 3, 3, '#fff'); break;
    case 'gafas':
      for (const s of [-1, 1]) { rrect(c, s * ex - er * 1.5, ey - er * 1.1, er * 3, er * 2.1, er * .8); c.fillStyle = '#1d1a2b'; c.fill(); ell(c, s * ex - er * .5, ey - er * .4, er * .4, er * .2, 'rgba(255,255,255,.5)', -.5); }
      c.strokeStyle = '#1d1a2b'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-ex + er * 1.5, ey - er * .3); c.lineTo(ex - er * 1.5, ey - er * .3); c.stroke(); break;
    case 'corazones':
      for (const s of [-1, 1]) { heartPath(c, s * ex, ey - er * .05, er * 1.15); c.fillStyle = 'rgba(255,60,120,.88)'; c.fill(); c.strokeStyle = '#a3174f'; c.lineWidth = 1.6; c.stroke(); ell(c, s * ex - er * .5, ey - er * .6, er * .3, er * .18, 'rgba(255,255,255,.7)', -.5); }
      c.strokeStyle = '#a3174f'; c.lineWidth = 2; c.beginPath(); c.moveTo(-ex + er * 1.2, ey - er * .3); c.lineTo(ex - er * 1.2, ey - er * .3); c.stroke(); break;
    case 'bigote':
      c.translate(0, my - 7); c.fillStyle = '#4a3020';
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(s * rx * .12, -ry * .1, s * rx * .3, -ry * .1, s * rx * .32, ry * .06); c.bezierCurveTo(s * rx * .22, ry * .0, s * rx * .1, ry * .1, 0, ry * .05); c.fill(); } break;
    case 'bufanda':
      c.translate(0, ry * .7);
      c.beginPath(); c.moveTo(-rx * .78, -ry * .08); c.quadraticCurveTo(0, ry * .3, rx * .78, -ry * .08); c.lineWidth = ry * .26; c.strokeStyle = '#e8483e'; c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(-rx * .7, ry * .02); c.quadraticCurveTo(0, ry * .36, rx * .7, ry * .02); c.stroke(); c.setLineDash([]);
      rrect(c, rx * .3, ry * .05, rx * .22, ry * .5, 5); c.fillStyle = '#e8483e'; c.fill(); break;
    case 'pajarita':
      c.translate(0, ry * .7);
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(s * rx * .3, -ry * .17); c.lineTo(s * rx * .3, ry * .17); c.closePath(); c.fillStyle = '#d6303e'; c.fill(); c.strokeStyle = 'rgba(80,0,20,.35)'; c.lineWidth = 1.2; c.stroke(); }
      ell(c, 0, 0, rx * .07, rx * .07, '#a3172a'); break;
    case 'medalla':
      c.translate(0, ry * .62);
      c.beginPath(); c.moveTo(-rx * .5, -ry * .14); c.quadraticCurveTo(0, ry * .3, rx * .5, -ry * .14); c.strokeStyle = '#b87810'; c.lineWidth = 2.4; c.stroke();
      ell(c, 0, ry * .2, rx * .13, rx * .13, '#ffd23a'); c.strokeStyle = '#b87810'; c.lineWidth = 1.6; c.stroke(); drawStar(c, 0, ry * .2, rx * .08, '#fff2a0'); break;
  }
  c.restore();
}
const ACC_ICON_OFF = { head: [0, 20, 22], face: [0, 2, 24], neck: [0, -12, 24] };
function drawAccIcon(c, id, s) {
  const slot = ACCESSORIES[id].slot, o = ACC_ICON_OFF[slot], r = o[2] * (s || 1);
  c.save(); c.translate(o[0], o[1] * (s || 1));
  drawAccessory(c, id, { rx: r, ry: r, ex: r * .36, ey: -r * .08, er: r * .14, my: r * .26 });
  c.restore();
}

/* ---------- Comida ---------- */
function drawFoodItem(c, id, x, y, s) {
  if (id === 'meal' || id === 'snack') return drawFood(c, id, x, y, s);
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  const line = 'rgba(40,20,70,.35)';
  switch (id) {
    case 'manzana': ell(c, 0, 3, 12, 11, '#ff4d55'); ell(c, -4, 0, 3, 4.5, 'rgba(255,255,255,.45)', .4);
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, -7); c.lineTo(2, -13); c.stroke(); ell(c, 6, -11, 6, 3, '#4fcf7a', -.5); break;
    case 'sopa': c.beginPath(); c.moveTo(-14, -2); c.lineTo(14, -2); c.quadraticCurveTo(12, 14, 0, 14); c.quadraticCurveTo(-12, 14, -14, -2); c.fillStyle = '#ff9a5c'; c.fill(); c.strokeStyle = line; c.lineWidth = 1.4; c.stroke();
      ell(c, 0, -2, 14, 4, '#ffd98a'); ell(c, -4, -2, 3, 1.6, '#ff7a5c'); ell(c, 5, -3, 2.6, 1.4, '#6bd68a');
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; for (const dx of [-5, 4]) { c.beginPath(); c.moveTo(dx, -8); c.quadraticCurveTo(dx + 4, -13, dx, -17); c.stroke(); } break;
    case 'burger': ell(c, 0, -7, 14, 7, '#e8a24a'); ell(c, -5, -9, 1.2, 1, '#fff2c0'); ell(c, 3, -10, 1.2, 1, '#fff2c0'); rrect(c, -14, -3, 28, 5, 2.5); c.fillStyle = '#5ac35a'; c.fill();
      rrect(c, -13, 1, 26, 6, 3); c.fillStyle = '#7a4326'; c.fill(); ell(c, 0, 12, 14, 5, '#e8a24a'); break;
    case 'helado': c.beginPath(); c.moveTo(-8, 0); c.lineTo(0, 17); c.lineTo(8, 0); c.closePath(); c.fillStyle = '#e8b36a'; c.fill();
      c.strokeStyle = 'rgba(150,90,30,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-4, 2); c.lineTo(3, 12); c.moveTo(4, 2); c.lineTo(-3, 12); c.stroke();
      ell(c, 0, -3, 10, 9, '#ff9fc4'); ell(c, 0, -11, 7, 6, '#9be8d0'); ell(c, 5, -13, 1.8, 1.8, '#ff5c8a'); break;
    case 'tarta': c.beginPath(); c.moveTo(-15, 12); c.lineTo(-15, -2); c.lineTo(15, -8); c.lineTo(15, 12); c.closePath(); c.fillStyle = '#fff1dc'; c.fill(); c.strokeStyle = line; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); c.moveTo(-15, -2); c.lineTo(15, -8); c.lineTo(15, -3); c.quadraticCurveTo(8, 2, 3, -2); c.quadraticCurveTo(-6, 4, -15, 3); c.closePath(); c.fillStyle = '#ff7fb0'; c.fill();
      ell(c, 0, -9, 4, 4, '#ff3d5c'); c.strokeStyle = '#4fcf7a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -12); c.lineTo(3, -16); c.stroke(); break;
    case 'vitamina': rrect(c, -9, -6, 18, 20, 5); c.fillStyle = '#ffd23a'; c.fill(); c.strokeStyle = line; c.lineWidth = 1.4; c.stroke(); rrect(c, -7, -12, 14, 7, 3); c.fillStyle = '#fff'; c.fill(); c.stroke();
      c.fillStyle = '#ff7a3c'; c.fillRect(-2, 1, 4, 10); c.fillRect(-5, 4, 10, 4); break;
    case 'jarabe': c.beginPath(); c.moveTo(-4, -14); c.lineTo(4, -14); c.lineTo(4, -6); c.quadraticCurveTo(13, -2, 12, 8); c.quadraticCurveTo(10, 15, 0, 15); c.quadraticCurveTo(-10, 15, -12, 8); c.quadraticCurveTo(-13, -2, -4, -6); c.closePath();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); c.strokeStyle = line; c.lineWidth = 1.4; c.stroke(); c.save(); c.clip(); c.fillStyle = '#b07cff'; c.fillRect(-14, 0, 28, 18); c.restore();
      rrect(c, -5, -17, 10, 5, 2); c.fillStyle = '#ff5c8a'; c.fill(); drawStar(c, 0, 6, 3.5, '#fff'); break;
  }
  c.restore();
}

/* ---------- Juguetes ---------- */
function drawToy(c, id, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  switch (id) {
    case 'pelota': ell(c, 0, 0, 13, 13, '#ff5c8a');
      c.save(); c.beginPath(); c.arc(0, 0, 13, 0, 7); c.clip(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(-15, 0, 16, -1, 1); c.stroke(); c.beginPath(); c.arc(15, 0, 16, Math.PI - 1, Math.PI + 1); c.stroke(); c.restore();
      ell(c, -4, -5, 3, 2, 'rgba(255,255,255,.6)', -.5); break;
    case 'peluche': ell(c, 0, 4, 11, 12, '#c9955a'); for (const sx of [-1, 1]) { ell(c, sx * 8, -10, 5, 5, '#c9955a'); ell(c, sx * 8, -10, 2.4, 2.4, '#f4cfa0'); }
      ell(c, 0, -4, 10, 9, '#d8a870'); ell(c, 0, -1, 4.5, 3.5, '#f4cfa0'); ell(c, -4, -6, 1.5, 1.8, '#2b2440'); ell(c, 4, -6, 1.5, 1.8, '#2b2440'); ell(c, 0, -2.5, 1.6, 1.2, '#2b2440'); break;
    case 'cometa': c.save(); c.rotate(Math.sin((t || 0) * 2) * .12);
      c.beginPath(); c.moveTo(0, -17); c.lineTo(13, 0); c.lineTo(0, 11); c.lineTo(-13, 0); c.closePath(); c.fillStyle = '#6bd6ff'; c.fill();
      c.beginPath(); c.moveTo(0, -17); c.lineTo(13, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#ffd23a'; c.fill();
      c.beginPath(); c.moveTo(0, -17); c.lineTo(-13, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#ff7fb0'; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 11); c.quadraticCurveTo(-8, 16, 0, 20); c.quadraticCurveTo(8, 24, 0, 28); c.stroke(); c.restore(); break;
    case 'guitarra': c.save(); c.rotate(-.7);
      ell(c, 0, 8, 9, 9, '#d9823a'); ell(c, 0, -2, 7, 7, '#d9823a'); ell(c, 0, 4, 3, 3, '#3a2616'); rrect(c, -2, -18, 4, 16, 1.5); c.fillStyle = '#6b4a2a'; c.fill(); rrect(c, -3.5, -22, 7, 6, 2); c.fillStyle = '#3a2616'; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -16); c.lineTo(0, 15); c.stroke(); c.restore(); break;
  }
  c.restore();
}

/* ---------- Moneda y nuevos iconos de menú ---------- */
function drawCoin(c, x, y, r) {
  c.save(); c.translate(x, y);
  const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#fff6a8'); g.addColorStop(1, '#f2a91d');
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = g; c.fill(); c.strokeStyle = '#b87810'; c.lineWidth = Math.max(1, r * .16); c.stroke();
  c.fillStyle = '#b87810'; c.font = `900 ${r * 1.25}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('C', 0, r * .06);
  c.restore();
}
Object.assign(ICONS, {
  care(c) { drawHeart(c, 0, -1, 9, '#ff5c8a'); ell(c, -3, -5, 2.4, 1.6, 'rgba(255,255,255,.6)', -.6); c.strokeStyle = '#ffb347'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-11, 9); c.quadraticCurveTo(0, 14, 11, 9); c.stroke(); },
  train(c) {
    c.strokeStyle = '#6b6f85'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke();
    for (const s of [-1, 1]) { rrect(c, s * 8 - 3, -8, 6, 16, 2); c.fillStyle = '#ff7a3c'; c.fill(); rrect(c, s * 12.5 - 2, -5, 4, 10, 2); c.fillStyle = '#d65a1c'; c.fill(); }
  },
  shop(c) { rrect(c, -10, -4, 20, 15, 4); c.fillStyle = '#ff9bbd'; c.fill(); c.strokeStyle = '#d6407a'; c.lineWidth = 2; c.beginPath(); c.arc(0, -4, 6, Math.PI, 0); c.stroke(); drawCoin(c, 0, 4, 5); },
  bag(c) { rrect(c, -9, -6, 18, 17, 6); c.fillStyle = '#4fb6a0'; c.fill(); rrect(c, -6, 1, 12, 7, 3); c.fillStyle = '#2f8f7c'; c.fill(); c.strokeStyle = '#2f8f7c'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, -6, 5, Math.PI, 0); c.stroke(); ell(c, 0, 4, 1.8, 1.8, '#fff'); },
  work(c) { rrect(c, -11, -5, 22, 15, 3); c.fillStyle = '#8b5a2b'; c.fill(); c.strokeStyle = '#8b5a2b'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-4, -5); c.lineTo(-4, -9); c.lineTo(4, -9); c.lineTo(4, -5); c.stroke(); c.fillStyle = '#ffd23a'; c.fillRect(-2, 1, 4, 3); },
  town(c) { c.fillStyle = '#ff7a8a'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-5, -9); c.lineTo(2, 0); c.fill(); c.fillStyle = '#ffe3b3'; c.fillRect(-10, 0, 14, 10); c.fillStyle = '#6a7cff'; c.beginPath(); c.moveTo(0, 2); c.lineTo(7, -8); c.lineTo(14, 2); c.fill(); c.fillStyle = '#fff0c8'; c.fillRect(2, 2, 11, 8); c.fillStyle = '#8b5a2b'; c.fillRect(-7, 4, 4, 6); },
  album(c) { rrect(c, -9, -10, 18, 20, 3); c.fillStyle = '#b07cff'; c.fill(); rrect(c, -9, -10, 4, 20, 2); c.fillStyle = '#7f4fd6'; c.fill(); drawStar(c, 2, -1, 5.5, '#ffe45e'); },
  trophy(c) { c.fillStyle = '#ffc93c'; c.beginPath(); c.moveTo(-8, -9); c.lineTo(8, -9); c.quadraticCurveTo(8, 3, 0, 4); c.quadraticCurveTo(-8, 3, -8, -9); c.fill(); c.strokeStyle = '#ffc93c'; c.lineWidth = 2; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 9, -5, 3.5, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : -Math.PI / 2, s < 0); c.stroke(); } c.fillRect(-1.5, 4, 3, 4); rrect(c, -6, 7, 12, 4, 1.5); c.fillStyle = '#b87810'; c.fill(); },
  camera(c) { rrect(c, -11, -6, 22, 16, 4); c.fillStyle = '#6b6f85'; c.fill(); rrect(c, -5, -9, 8, 4, 1.5); c.fillStyle = '#6b6f85'; c.fill(); ell(c, 0, 2, 6, 6, '#fff'); ell(c, 0, 2, 3.6, 3.6, '#4a7cff'); ell(c, 8, -3, 1.6, 1.6, '#ff5c8a'); },
});
Object.assign(ICONS, { disc: ICONS.care });

/* ---------- Cartas y manos (minijuegos) ---------- */
function drawCard(c, x, y, w, h, value, faceUp, col) {
  c.save(); c.translate(x, y);
  rrect(c, -w / 2, -h / 2, w, h, 9);
  if (faceUp) {
    c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#d6407a'; c.lineWidth = 3; c.stroke();
    const names = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }, label = names[value] || String(value);
    c.fillStyle = col || '#d6407a'; c.font = `900 ${h * .42}px "Nunito",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, 2);
    heartPath(c, -w / 2 + 11, -h / 2 + 12, 5); c.fill(); heartPath(c, w / 2 - 11, h / 2 - 12, 5); c.fill();
  } else {
    const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#8d68e0'); g.addColorStop(1, '#ff7fb0');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    drawStar(c, 0, 0, Math.min(w, h) * .22, '#fff7a8');
  }
  c.restore();
}
function drawHand(c, kind, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = '#ffd6b0'; c.strokeStyle = '#c98f68'; c.lineWidth = 2;
  if (kind === 'piedra') { rrect(c, -13, -11, 26, 24, 10); c.fill(); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 7, -11); c.lineTo(i * 7, -2); c.stroke(); } }
  else if (kind === 'papel') { rrect(c, -12, -2, 24, 18, 8); c.fill(); c.stroke(); for (let i = -2; i <= 1; i++) { rrect(c, i * 6 + 0, -20 + Math.abs(i + .5) * 2, 5.5, 22, 3); c.fill(); c.stroke(); } }
  else { rrect(c, -10, 2, 20, 16, 7); c.fill(); c.stroke(); for (const sx of [-1, 1]) { c.save(); c.translate(sx * 4, 2); c.rotate(sx * .28); rrect(c, -2.8, -21, 5.6, 22, 3); c.fill(); c.stroke(); c.restore(); } }
  c.restore();
}
