'use strict';
/* Escenarios (fondos), clima y filtros de pantalla (moderno / color retro / clásico verde). */
const Scene = (() => {
  const W = 320, H = 360, GROUND = 292;
  const lerp = (a, b, k) => a + (b - a) * k;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  const SKY = [[0, '#12153d', '#2c2a6b'], [5.5, '#2c2a6b', '#8a5aa8'], [7, '#ff9d8a', '#ffd9a8'], [9, '#6ec3ff', '#d6f1ff'],
    [17, '#78bdf5', '#ffe6c9'], [19, '#ff8a72', '#8b5aa8'], [20.5, '#3a2f78', '#8a5aa8'], [22, '#1a1c4a', '#2f2d70'], [24, '#12153d', '#2c2a6b']];
  const stars = Array.from({ length: 34 }, (_, i) => ({ x: (i * 97) % W, y: 56 + ((i * 53) % 150), p: i * 1.3 }));
  const clouds = [{ x: 30, y: 95, s: 1, v: 5 }, { x: 200, y: 130, s: .7, v: 3 }, { x: 120, y: 80, s: .85, v: 4 }];
  const drops = Array.from({ length: 70 }, (_, i) => ({ x: (i * 53) % W, y: (i * 37) % H, v: 260 + (i % 7) * 25, d: 0 }));
  const flakes = Array.from({ length: 60 }, (_, i) => ({ x: (i * 71) % W, y: (i * 43) % H, v: 30 + (i % 5) * 10, p: i }));
  let weatherOverride = null, flash = 0, wCache = { at: 0, w: 'sunny' };

  function ell(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); }
  function hourNow(cfg) { if (!cfg.nights) return 12; const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  function dayFactor(h) { return h < 5.5 || h > 21.5 ? 0 : h < 7.5 ? (h - 5.5) / 2 : h > 19.5 ? (21.5 - h) / 2 : 1; }

  function weather(cfg) {
    if (weatherOverride) return weatherOverride;
    if (!cfg.weather) return 'sunny';
    const now = Date.now();
    if (now - wCache.at < 30000) return wCache.w;
    let x = Math.floor(now / 7200000) * 2654435761 >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13;
    const r = (x % 1000) / 1000;
    wCache = { at: now, w: r < .55 ? 'sunny' : r < .75 ? 'cloudy' : r < .9 ? 'rain' : r < .96 ? 'snow' : 'storm' };
    return wCache.w;
  }

  function tree(c, x, base, s, col, trunk) {
    c.fillStyle = trunk; c.fillRect(x - 3 * s, base - 22 * s, 6 * s, 22 * s);
    ell(c, x, base - 34 * s, 17 * s, 18 * s, col); ell(c, x - 10 * s, base - 26 * s, 11 * s, 11 * s, col); ell(c, x + 10 * s, base - 26 * s, 11 * s, 11 * s, col);
  }

  function drawSun(c, day) {
    if (day > .35) {
      const gl = c.createRadialGradient(262, 98, 4, 262, 98, 42); gl.addColorStop(0, 'rgba(255,240,150,.9)'); gl.addColorStop(1, 'rgba(255,240,150,0)');
      c.fillStyle = gl; c.fillRect(210, 50, 100, 100); ell(c, 262, 98, 17, 17, '#ffe97a');
    } else {
      c.save(); c.beginPath(); c.arc(262, 98, 17, 0, 7); c.fillStyle = '#fff6d6'; c.fill();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(270, 93, 15, 0, 7); c.fill(); c.restore();
    }
  }
  function drawClouds(c, day, extra) {
    for (const cl of clouds) {
      c.globalAlpha = (.35 + .5 * day) * (extra ? 1 : 1); const x = cl.x, y = cl.y, s = cl.s * (extra ? 1.25 : 1);
      const col = extra ? '#c9d2e0' : '#fff';
      ell(c, x, y, 26 * s, 11 * s, col); ell(c, x - 16 * s, y + 3 * s, 16 * s, 8 * s, col); ell(c, x + 16 * s, y + 3 * s, 18 * s, 9 * s, col); ell(c, x - 3 * s, y - 7 * s, 14 * s, 9 * s, col);
    }
    c.globalAlpha = 1;
  }
  function hills(c, c1, c2, c3, dk) {
    c.fillStyle = mix(c1[0], c1[1], dk * .8);
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 232); for (let x = 0; x <= W; x += 8) c.lineTo(x, 232 - Math.sin(x / 52 + 1) * 20 - Math.sin(x / 23) * 4); c.lineTo(W, H); c.fill();
    c.fillStyle = mix(c2[0], c2[1], dk * .85);
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 262); for (let x = 0; x <= W; x += 8) c.lineTo(x, 262 - Math.sin(x / 40 + 3) * 14); c.lineTo(W, H); c.fill();
    const gg = c.createLinearGradient(0, GROUND - 10, 0, H); gg.addColorStop(0, mix(c3[0], c3[1], dk * .85)); gg.addColorStop(1, mix(c3[2], c3[3], dk * .85));
    c.fillStyle = gg; c.fillRect(0, GROUND - 6, W, H - GROUND + 6);
  }

  /* Dibuja cielo + fondo. o = { t, bg, cfg } */
  function draw(c, o) {
    const cfg = o.cfg, bg = o.bg || 'meadow', h = hourNow(cfg), day = dayFactor(h), dk = 1 - day * .85, t = o.t;
    let i = 0; while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
    const a = SKY[i], b = SKY[i + 1], k = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
    const wx = weather(cfg), gray = wx === 'cloudy' || wx === 'rain' || wx === 'storm' ? (wx === 'storm' ? .55 : .35) : 0;
    let top = mix(a[1], b[1], k), bot = mix(a[2], b[2], k);
    if (bg === 'space') { top = '#0a0820'; bot = '#2b1659'; }
    else if (bg === 'candy') { top = mix('#ffb3d9', '#2f2a66', dk * .8); bot = mix('#fff0d6', '#6a4a96', dk * .8); }
    else if (bg === 'forest') { top = mix('#8fd8b0', '#10223a', dk * .8); bot = mix('#dff7d0', '#2a4a50', dk * .8); }
    const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (bg === 'space' || day < .6) for (const s of stars) { c.globalAlpha = (bg === 'space' ? 1 : 1 - day) * (.5 + .5 * Math.sin(t * 2 + s.p)); ell(c, s.x, s.y, 1.6, 1.6, '#fff'); }
    c.globalAlpha = 1;
    if (bg !== 'space') { drawSun(c, day); drawClouds(c, day, gray > 0); }

    switch (bg) {
      case 'beach': {
        const sea = c.createLinearGradient(0, 210, 0, 262); sea.addColorStop(0, mix('#4fc3f0', '#1c3a6a', dk * .8)); sea.addColorStop(1, mix('#9fe6ff', '#2c5a8a', dk * .8));
        c.fillStyle = sea; c.fillRect(0, 210, W, 56);
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (let r = 0; r < 3; r++) { c.beginPath(); for (let x = 0; x <= W; x += 6) c.lineTo(x, 224 + r * 14 + Math.sin(x / 14 + t * 2 + r) * 2); c.stroke(); }
        const sand = c.createLinearGradient(0, 258, 0, H); sand.addColorStop(0, mix('#ffe9b0', '#4a4a6a', dk * .8)); sand.addColorStop(1, mix('#f1cd80', '#35354f', dk * .8));
        c.fillStyle = sand; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 262); for (let x = 0; x <= W; x += 8) c.lineTo(x, 262 + Math.sin(x / 30) * 3); c.lineTo(W, H); c.fill();
        c.strokeStyle = mix('#8b5a2b', '#2a1d14', dk * .6); c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(38, 270); c.quadraticCurveTo(48, 215, 40, 175); c.stroke();
        for (const [dx, dy] of [[-32, 14], [-14, -6], [18, 0], [34, 20], [4, 22]]) { c.save(); c.translate(40, 175); c.rotate(Math.atan2(dy, dx)); ell(c, Math.hypot(dx, dy) * .5, 0, Math.hypot(dx, dy) * .55, 6, mix('#3fb86a', '#164a3a', dk * .7)); c.restore(); }
        for (let n = 0; n < 8; n++) ell(c, (n * 83 + 20) % W, GROUND + 8 + (n * 17) % 40, 3, 2, ['#fff', '#ffb3c8', '#ffd98a'][n % 3]);
        break;
      }
      case 'space': {
        ell(c, 70, 130, 26, 26, '#c9a0ff'); c.save(); c.translate(70, 130); c.rotate(-.4); c.strokeStyle = 'rgba(255,230,160,.8)'; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 42, 10, 0, 0, 7); c.stroke(); c.restore();
        ell(c, 260, 110, 10, 10, '#ff9a6a'); ell(c, 256, 106, 3, 3, 'rgba(255,255,255,.4)');
        const gr = c.createLinearGradient(0, GROUND - 14, 0, H); gr.addColorStop(0, '#8a86a6'); gr.addColorStop(1, '#4a4668'); c.fillStyle = gr;
        c.beginPath(); c.moveTo(0, H); c.lineTo(0, 270); for (let x = 0; x <= W; x += 8) c.lineTo(x, 270 + Math.sin(x / 45) * 8); c.lineTo(W, H); c.fill();
        for (const [cx, cy, r] of [[50, 320, 14], [150, 340, 10], [250, 318, 16], [290, 345, 8]]) { ell(c, cx, cy, r, r * .4, 'rgba(40,30,70,.35)'); }
        break;
      }
      case 'candy': {
        hills(c, ['#ffc2e0', '#5a3a7a'], ['#c7f0d8', '#3a5a6a'], ['#fff2dc', '#4a3a5a', '#ffe0ef', '#3a2a4a'], dk);
        for (const x of [40, 270]) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 262); c.lineTo(x, 214); c.stroke(); ell(c, x, 200, 16, 16, '#ff6fa5'); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < 14; a += .3) c.lineTo(x + Math.cos(a) * a * 1.1, 200 + Math.sin(a) * a * 1.1); c.stroke(); }
        for (let n = 0; n < 16; n++) { c.fillStyle = ['#ff6fa5', '#6bd6ff', '#ffd23a', '#9be8d0'][n % 4]; c.save(); c.translate((n * 67 + 11) % W, GROUND + 8 + (n * 19) % 44); c.rotate(n); c.fillRect(-3, -1, 6, 2.4); c.restore(); }
        break;
      }
      case 'forest': {
        for (let x = 10; x < W + 30; x += 46) tree(c, x, 262 - (x % 3) * 4, .95, mix('#4fae6a', '#14322e', dk * .85), mix('#7a5a3a', '#2a1d18', dk * .7));
        const gg = c.createLinearGradient(0, GROUND - 14, 0, H); gg.addColorStop(0, mix('#7bc86a', '#1e3a36', dk * .85)); gg.addColorStop(1, mix('#4a9a52', '#142a2c', dk * .85));
        c.fillStyle = gg; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 276); for (let x = 0; x <= W; x += 8) c.lineTo(x, 276 + Math.sin(x / 38 + 1) * 5); c.lineTo(W, H); c.fill();
        for (const [x, y] of [[70, 320], [180, 335], [250, 312]]) { ell(c, x, y, 5, 4, '#ff6a6a'); ell(c, x, y + 4, 2, 4, '#fff'); }
        break;
      }
      case 'city': {
        const cols = ['#7a86b8', '#6a76a8', '#8a96c8', '#5f6a9a'];
        for (let n = 0; n < 9; n++) {
          const bx = n * 38 - 6, bh = 70 + ((n * 47) % 90), bw = 34;
          c.fillStyle = mix(cols[n % 4], '#1a1c3a', dk * .7); c.fillRect(bx, GROUND - 22 - bh, bw, bh + 22);
          for (let wy = GROUND - 14 - bh; wy < GROUND - 30; wy += 14) for (let wx2 = bx + 5; wx2 < bx + bw - 6; wx2 += 11) {
            c.fillStyle = dk > .4 && ((wx2 + wy) % 3 !== 0) ? 'rgba(255,230,120,.9)' : 'rgba(255,255,255,.2)'; c.fillRect(wx2, wy, 6, 8);
          }
        }
        c.fillStyle = mix('#8a8aa6', '#25263a', dk * .8); c.fillRect(0, GROUND - 22, W, H);
        c.fillStyle = mix('#a6a6c0', '#33344a', dk * .8); c.fillRect(0, GROUND - 22, W, 6);
        c.fillStyle = 'rgba(255,255,255,.7)'; for (let x = 6; x < W; x += 50) c.fillRect(x, 330, 26, 4);
        break;
      }
      default: {
        hills(c, ['#a6e8a0', '#2b4a6b'], ['#7bd98f', '#1f3a58'], ['#8be39a', '#254a5e', '#5fc27c', '#1a3348'], dk);
        for (let n = 0; n < 12; n++) ell(c, (n * 61 + 17) % W, GROUND + 8 + (n * 23) % 42, 2.6, 2.6, ['#fff', '#ffd1e4', '#fff3a6'][n % 3]);
      }
    }
    if (gray) { c.fillStyle = `rgba(70,85,120,${gray * .45})`; c.fillRect(0, 0, W, H); }
  }

  /* Lluvia / nieve / rayos (encima de todo el mundo) */
  function drawWeather(c, t, dt, cfg, bg) {
    if (bg === 'space') return;
    const wx = weather(cfg);
    if (wx === 'rain' || wx === 'storm') {
      c.strokeStyle = 'rgba(190,220,255,.75)'; c.lineWidth = 1.6; c.beginPath();
      for (const d of drops) { d.y += d.v * dt; d.x -= 40 * dt; if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 40); } c.moveTo(d.x, d.y); c.lineTo(d.x - 3, d.y + 10); }
      c.stroke();
      if (wx === 'storm') { if (Math.random() < dt * .25) flash = 1; }
    } else if (wx === 'snow') {
      c.fillStyle = 'rgba(255,255,255,.95)';
      for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(t + f.p) * 12 * dt; if (f.y > H) { f.y = -6; f.x = Math.random() * W; } c.beginPath(); c.arc(f.x, f.y, 2 + (f.p % 3) * .5, 0, 7); c.fill(); }
    }
    if (flash > 0) { c.fillStyle = `rgba(255,255,255,${flash * .7})`; c.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 4); }
  }
  function update(dt) { for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > W + 50) cl.x = -50; } }

  /* ---------- Filtros de pantalla ---------- */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const GB = [[11, 42, 11], [47, 107, 47], [135, 177, 58], [201, 224, 138]];
  function quantize(img, w, theme, dither, dim) {
    const d = img.data, n = d.length;
    for (let i = 0; i < n; i += 4) {
      const p = i >> 2, x = p % w, y = (p / w) | 0, dv = dither ? (BAYER[(y & 3) * 4 + (x & 3)] - 7.5) : 0;
      if (theme === 'classic') {
        let l = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; l = (l * (dim ? .74 : 1) - 150) * 1.45 + 150 + dv * 3;
        const k = GB[l < 55 ? 0 : l < 117 ? 1 : l < 180 ? 2 : 3];
        d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2];
      } else {
        const q = v => { const r = Math.round((v + dv * 1.6) / 51) * 51; return r < 0 ? 0 : r > 255 ? 255 : r; };
        d[i] = q(d[i]); d[i + 1] = q(d[i + 1]); d[i + 2] = q(d[i + 2]);
      }
      d[i + 3] = 255;
    }
  }

  function makeRenderer(cv, dpr) {
    const main = cv.getContext('2d');
    const lo = document.createElement('canvas'); lo.width = W; lo.height = H; const lc = lo.getContext('2d', { willReadFrequently: true });
    const PW = 107, PH = 120;
    const px = document.createElement('canvas'); px.width = PW; px.height = PH; const pc = px.getContext('2d', { willReadFrequently: true });
    const tile = Math.max(1, Math.round(3 * dpr));
    const gc = document.createElement('canvas'); gc.width = gc.height = tile; const gx = gc.getContext('2d');
    gx.fillStyle = 'rgba(0,0,0,.08)'; gx.fillRect(tile - Math.max(1, Math.round(dpr * .7)), 0, Math.max(1, Math.round(dpr * .7)), tile); gx.fillRect(0, tile - Math.max(1, Math.round(dpr * .7)), tile, Math.max(1, Math.round(dpr * .7)));
    const pat = main.createPattern(gc, 'repeat');
    return {
      /* drawWorld(ctx), drawUI(ctx) reciben el contexto lógico 320x360 */
      render(theme, drawWorld, drawUI) {
        if (theme === 'modern') {
          main.setTransform(dpr, 0, 0, dpr, 0, 0); main.imageSmoothingEnabled = true;
          drawWorld(main); drawUI(main); return;
        }
        lc.setTransform(1, 0, 0, 1, 0, 0); lc.imageSmoothingEnabled = true; lc.clearRect(0, 0, W, H);
        drawWorld(lc);
        pc.imageSmoothingEnabled = true; pc.drawImage(lo, 0, 0, W, H, 0, 0, PW, PH);
        const wi = pc.getImageData(0, 0, PW, PH); quantize(wi, PW, theme, true, true); pc.putImageData(wi, 0, 0);
        lc.imageSmoothingEnabled = false; lc.drawImage(px, 0, 0, PW, PH, 0, 0, W, H);
        drawUI(lc);
        const ui = lc.getImageData(0, 0, W, H); quantize(ui, W, theme, false); lc.putImageData(ui, 0, 0);
        main.setTransform(1, 0, 0, 1, 0, 0); main.imageSmoothingEnabled = false;
        main.drawImage(lo, 0, 0, W, H, 0, 0, cv.width, cv.height);
        main.fillStyle = pat; main.fillRect(0, 0, cv.width, cv.height);
      },
    };
  }

  return { W, H, GROUND, draw, drawWeather, update, weather, makeRenderer, setWeather(w) { weatherOverride = w; }, mix };
})();
