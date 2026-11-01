'use strict';
/* Interfaz: render del canvas, menús, minijuegos, entrada por teclado y mando táctil. */
(() => {
  const W = 320, H = 360, GROUND = 292;
  const cv = document.getElementById('screen');
  const c = cv.getContext('2d');
  const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  cv.width = W * dpr; cv.height = H * dpr;
  c.scale(dpr, dpr);

  const MENU = [
    { id: 'feed', label: 'Comer' }, { id: 'light', label: 'Luz' }, { id: 'play', label: 'Jugar' }, { id: 'med', label: 'Medicina' },
    { id: 'clean', label: 'Limpiar' }, { id: 'disc', label: 'Regañar' }, { id: 'stats', label: 'Estado' }, { id: 'settings', label: 'Ajustes' },
  ];
  const SPEEDS = [1, 4, 16, 60];
  const CALL_TEXT = { hungry: '¡Tiene hambre!', sad: '¡Está triste!', sick: '¡Se siente mal!', sleep: 'Quiere dormir: apaga la luz', fake: '¡Quiere atención!' };

  const ui = {
    mode: 'main', cursor: 0, t: 0, toast: '', toastT: 0, parts: [], anim: null, flash: 0, list: null, game: null,
    pet: { x: 160, tx: 160, dir: 0, wait: 1, blink: 0, nextBlink: 2, moving: false },
    held: {}, spawnT: 0, callBeep: 0, wobble: 0,
    clouds: [{ x: 30, y: 95, s: 1, v: 5 }, { x: 200, y: 130, s: .7, v: 3 }, { x: 120, y: 80, s: .85, v: 4 }],
    stars: Array.from({ length: 34 }, (_, i) => ({ x: (i * 97) % W, y: 56 + ((i * 53) % 150), p: i * 1.3 })),
  };

  /* ---------- utilidades ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  function text(str, x, y, size, color, align, weight) {
    c.font = `${weight || 800} ${size}px "Nunito","Trebuchet MS",system-ui,sans-serif`;
    c.fillStyle = color || '#2b2440'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(str, x, y);
  }
  function say(msg, secs) { ui.toast = msg; ui.toastT = secs || 2.4; }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* noop */ } }
  const P = () => Game.pet;
  const SP = () => SPECIES[P().species] || SPECIES.puchi;

  /* ---------- partículas ---------- */
  function spawn(type, x, y, n) {
    for (let i = 0; i < (n || 1); i++) {
      const life = type === 'zzz' ? 2.2 : 1.2 + Math.random() * .6;
      ui.parts.push({ type, x: x + (Math.random() - .5) * 16, y, vx: (Math.random() - .5) * (type === 'zzz' ? 8 : 50),
        vy: type === 'drop' ? 40 : -(24 + Math.random() * 30), life, max: life, r: 4 + Math.random() * 4, rot: Math.random() * 6 });
    }
  }
  function drawParts() {
    for (const p of ui.parts) {
      const a = Math.max(0, Math.min(1, p.life / p.max * 1.4));
      c.save(); c.globalAlpha = a;
      if (p.type === 'heart') drawHeart(c, p.x, p.y, p.r * .9 + 2, '#ff5c8a');
      else if (p.type === 'star') drawStar(c, p.x, p.y, p.r + 1, '#ffe45e', p.rot + ui.t * 3);
      else if (p.type === 'drop') { ell(c, p.x, p.y, 2.6, 4, 'rgba(120,190,255,.95)'); }
      else if (p.type === 'bubble') { c.beginPath(); c.arc(p.x, p.y, p.r + 2, 0, 7); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2; c.stroke(); c.fillStyle = 'rgba(160,220,255,.35)'; c.fill(); }
      else if (p.type === 'zzz') { text('Z', p.x, p.y, 12 + (1 - p.life / p.max) * 12, '#fff', 'center', 900); }
      else if (p.type === 'note') text('♪', p.x, p.y, 16, '#ff7fb0', 'center', 900);
      c.restore();
    }
  }
  function updateParts(dt) {
    for (const p of ui.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    ui.parts = ui.parts.filter(p => p.life > 0);
  }

  /* ---------- escena ---------- */
  const SKY = [[0, '#12153d', '#2c2a6b'], [5.5, '#2c2a6b', '#8a5aa8'], [7, '#ff9d8a', '#ffd9a8'], [9, '#6ec3ff', '#d6f1ff'],
    [17, '#78bdf5', '#ffe6c9'], [19, '#ff8a72', '#8b5aa8'], [20.5, '#3a2f78', '#8a5aa8'], [22, '#1a1c4a', '#2f2d70'], [24, '#12153d', '#2c2a6b']];
  function sceneHour() { if (!Game.cfg.nights) return 12; const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  function drawScene() {
    const h = sceneHour();
    let i = 0; while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
    const a = SKY[i], b = SKY[i + 1], k = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, mix(a[1], b[1], k)); g.addColorStop(1, mix(a[2], b[2], k));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const day = h < 5.5 || h > 21.5 ? 0 : h < 7.5 ? (h - 5.5) / 2 : h > 19.5 ? (21.5 - h) / 2 : 1;
    // estrellas
    if (day < .6) for (const s of ui.stars) { c.globalAlpha = (1 - day) * (.5 + .5 * Math.sin(ui.t * 2 + s.p)); drawStar(c, s.x, s.y, 2, '#fff'); }
    c.globalAlpha = 1;
    // sol / luna
    if (day > .35) {
      const gl = c.createRadialGradient(262, 98, 4, 262, 98, 42); gl.addColorStop(0, 'rgba(255,240,150,.9)'); gl.addColorStop(1, 'rgba(255,240,150,0)');
      c.fillStyle = gl; c.fillRect(210, 50, 100, 100); ell(c, 262, 98, 17, 17, '#ffe97a');
    } else {
      c.save(); c.beginPath(); c.arc(262, 98, 17, 0, 7); c.fillStyle = '#fff6d6'; c.fill();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(270, 93, 15, 0, 7); c.fill(); c.restore();
    }
    // nubes
    for (const cl of ui.clouds) {
      c.globalAlpha = .35 + .5 * day; const x = cl.x, y = cl.y, s = cl.s;
      ell(c, x, y, 26 * s, 11 * s, '#fff'); ell(c, x - 16 * s, y + 3 * s, 16 * s, 8 * s, '#fff'); ell(c, x + 16 * s, y + 3 * s, 18 * s, 9 * s, '#fff'); ell(c, x - 3 * s, y - 7 * s, 14 * s, 9 * s, '#fff');
    }
    c.globalAlpha = 1;
    // colinas
    const dk = 1 - day * .85;
    c.fillStyle = mix('#a6e8a0', '#2b4a6b', dk * .8);
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 232); for (let x = 0; x <= W; x += 8) c.lineTo(x, 232 - Math.sin(x / 52 + 1) * 20 - Math.sin(x / 23) * 4); c.lineTo(W, H); c.fill();
    c.fillStyle = mix('#7bd98f', '#1f3a58', dk * .85);
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 262); for (let x = 0; x <= W; x += 8) c.lineTo(x, 262 - Math.sin(x / 40 + 3) * 14); c.lineTo(W, H); c.fill();
    const gg = c.createLinearGradient(0, GROUND - 10, 0, H); gg.addColorStop(0, mix('#8be39a', '#254a5e', dk * .85)); gg.addColorStop(1, mix('#5fc27c', '#1a3348', dk * .85));
    c.fillStyle = gg; c.fillRect(0, GROUND - 6, W, H - GROUND + 6);
    for (let n = 0; n < 12; n++) {
      const fx = (n * 61 + 17) % W, fy = GROUND + 8 + (n * 23) % 42;
      ell(c, fx, fy, 2.6, 2.6, ['#fff', '#ffd1e4', '#fff3a6'][n % 3]);
    }
  }

  /* ---------- barra superior ---------- */
  function drawBar() {
    const p = P();
    const x0 = 8, cw = 36, gap = 2.5;
    for (let i = 0; i < MENU.length; i++) {
      const x = x0 + i * (cw + gap), y = 7, sel = ui.cursor === i && ui.mode === 'main';
      c.save();
      rrect(c, x, y, cw, cw, 11);
      c.fillStyle = sel ? '#ffffff' : 'rgba(255,255,255,.55)'; c.fill();
      if (sel) { c.strokeStyle = '#ff6f9f'; c.lineWidth = 3; c.stroke(); }
      c.translate(x + cw / 2, y + cw / 2 + (sel ? Math.sin(ui.t * 6) * .8 : 0));
      if (sel) c.scale(1.1, 1.1);
      ICONS[MENU[i].id](c, p.lightsOn);
      c.restore();
    }
    if (ui.mode === 'main') {
      const lab = MENU[ui.cursor].label;
      c.font = '800 12px "Nunito",sans-serif'; const w = c.measureText(lab).width + 20;
      rrect(c, W / 2 - w / 2, 50, w, 20, 10); c.fillStyle = 'rgba(43,36,64,.72)'; c.fill();
      text(lab, W / 2, 60.5, 12, '#fff');
    }
  }

  /* ---------- mascota ---------- */
  function moodOf(p) {
    if (!p.alive) return 'dead';
    if (ui.anim && ui.anim.mood) return ui.anim.mood;
    if (p.sick) return 'sick';
    if (p.hunger === 0) return 'hungry';
    if (p.happy === 0 || p.health <= 1) return 'sad';
    if (p.happy >= 3 && p.hunger >= 2) return 'happy';
    return 'neutral';
  }
  function petOpts(extra) {
    const p = P();
    const o = {
      x: ui.pet.x, y: GROUND, t: ui.t, mood: moodOf(p), dir: ui.pet.dir, sleeping: p.sleeping, sick: p.sick,
      senior: p.stage === 'senior', blink: ui.pet.blink > 0, hop: ui.pet.moving, scale: p.stage === 'senior' ? .95 : 1,
      eating: !!(ui.anim && ui.anim.eating), squash: ui.wobble > 0 ? Math.sin(ui.t * 30) * .05 * ui.wobble : 0,
    };
    return Object.assign(o, extra);
  }
  function drawPoops() {
    const slots = [50, 92, 232, 272];
    for (let i = 0; i < P().poops; i++) drawPoop(c, slots[i], GROUND + 10, ui.t);
  }

  function updatePet(dt) {
    const p = P(), u = ui.pet;
    ui.wobble = Math.max(0, ui.wobble - dt * 2);
    u.nextBlink -= dt; if (u.nextBlink <= 0) { u.blink = .14; u.nextBlink = 2 + Math.random() * 3; }
    if (u.blink > 0) u.blink -= dt;
    if (ui.anim) { ui.anim.t += dt; if (ui.anim.t >= ui.anim.dur) { const f = ui.anim.after; ui.anim = null; if (f) f(); } }
    if (ui.game && ui.game.type === 'catch') return;
    const busy = ui.anim || ui.mode !== 'main' || !p.alive || p.stage === 'egg' || p.sleeping;
    u.moving = false;
    if (busy) { if (p.sleeping || !p.alive || p.stage === 'egg') { u.dir = 0; } if (ui.mode !== 'guess') return; }
    if (ui.mode === 'guess') return;
    if (Math.abs(u.tx - u.x) > 2) {
      const d = Math.sign(u.tx - u.x); u.x += d * 22 * dt; u.dir = d; u.moving = true;
    } else {
      u.wait -= dt;
      if (u.wait <= 0) { u.tx = 70 + Math.random() * 180; u.wait = 1 + Math.random() * 3; if (Math.random() < .3) u.tx = u.x; }
      else if (u.wait < .5) u.dir = 0;
    }
  }

  function startAnim(a) { ui.anim = Object.assign({ t: 0, dur: 1.5 }, a); }

  /* ---------- acciones del menú ---------- */
  function applyResult(r) {
    const p = P();
    say(r.msg);
    if (!r.ok) { Sound.play('no'); if (r.fx === 'refuse') { startAnim({ dur: 1, mood: 'sad' }); ui.wobble = 1; } vibrate(60); return; }
    const mx = ui.pet.x, my = GROUND - 60;
    switch (r.fx) {
      case 'eat': case 'snack':
        Sound.play('eat');
        startAnim({ dur: 2.0, kind: r.fx === 'eat' ? 'meal' : 'snack', eating: false, mood: 'happy', after: () => { spawn('heart', mx, my, 3); Sound.play('happy'); } });
        break;
      case 'light': Sound.play('light'); break;
      case 'cured': Sound.play('happy'); spawn('star', mx, my, 6); spawn('heart', mx, my, 3); startAnim({ dur: 1.4, mood: 'happy' }); break;
      case 'dose': Sound.play('med'); spawn('star', mx, my, 3); break;
      case 'clean': Sound.play('clean'); spawn('bubble', 160, GROUND, 14); for (let i = 0; i < 6; i++) spawn('bubble', 40 + i * 48, GROUND + 6, 2); startAnim({ dur: 1, mood: 'happy' }); break;
      case 'scold': Sound.play('happy'); startAnim({ dur: 1.4, mood: 'neutral' }); spawn('star', mx, my, 3); break;
      case 'scoldBad': Sound.play('sad'); startAnim({ dur: 1.4, mood: 'sad' }); ui.wobble = 1; break;
      default: Sound.play('ok');
    }
    vibrate(20);
  }

  function openList(l) { ui.list = Object.assign({ idx: 0, type: 'cards' }, l); ui.mode = 'list'; }
  function closeList() { ui.list = null; ui.mode = 'main'; }

  function needAwake() {
    if (P().sleeping) { say('Zzz… está durmiendo'); Sound.play('no'); return false; }
    return true;
  }

  function activate(id) {
    const p = P();
    if (id === 'stats') { ui.mode = 'stats'; Sound.play('ok'); return; }
    if (id === 'settings') { openSettings(); Sound.play('ok'); return; }
    if (!p.alive) { Game.restart(); ui.pet.x = ui.pet.tx = 160; ui.cursor = 0; ui.anim = null; say('¡Un huevo nuevo! Toca A para calentarlo', 3.5); Sound.play('hatch'); Game.save(); return; }
    if (p.stage === 'egg') { Game.warmEgg(); ui.wobble = 1; Sound.play('ok'); spawn('star', 160, GROUND - 80, 2); return; }
    switch (id) {
      case 'feed':
        if (!needAwake()) return;
        openList({ title: 'Comer', items: [
          { label: 'Comida', draw: () => drawFood(c, 'meal', 0, 0, 1.5) },
          { label: 'Dulce', draw: () => drawFood(c, 'snack', 0, 0, 1.3) }],
          onPick: i => { closeList(); applyResult(Game.feed(i === 0 ? 'meal' : 'snack')); } });
        Sound.play('ok'); break;
      case 'light': applyResult(Game.toggleLight()); break;
      case 'play':
        if (!needAwake()) return;
        openList({ title: 'Jugar', items: [
          { label: '¿Izq. o Der.?', draw: () => { text('◀ ▶', 0, 0, 22, '#6a7cff', 'center', 900); } },
          { label: 'Atrapa estrellas', draw: () => { drawStar(c, 0, 0, 16, '#ffd23a', ui.t); } }],
          onPick: i => { closeList(); i === 0 ? startGuess() : startCatch(); } });
        Sound.play('ok'); break;
      case 'med': applyResult(Game.medicine()); break;
      case 'clean': applyResult(Game.clean()); break;
      case 'disc': applyResult(Game.scold()); break;
    }
  }

  function openSettings() {
    const rows = [
      { label: 'Sonido', val: () => Game.cfg.sound ? 'Sí' : 'No', act: () => { Game.cfg.sound = !Game.cfg.sound; Sound.setEnabled(Game.cfg.sound); Sound.play('ok'); } },
      { label: 'Velocidad', val: () => Game.cfg.speed + 'x', act: d => { Game.tickTo(Date.now()); const i = SPEEDS.indexOf(Game.cfg.speed); Game.cfg.speed = SPEEDS[(i + d + SPEEDS.length) % SPEEDS.length]; Sound.play('nav'); } },
      { label: 'Ciclo día/noche', val: () => Game.cfg.nights ? 'Real' : 'Siempre día', act: () => { Game.tickTo(Date.now()); Game.cfg.nights = !Game.cfg.nights; Sound.play('ok'); } },
      { label: 'Nombre', val: () => P().name, act: () => { try { const n = window.prompt('Nombre de tu mascota:', P().name); if (n) Game.rename(n); } catch (e) { /* noop */ } } },
      { label: 'Nueva mascota', val: () => '', act: () => { try { if (window.confirm('¿Empezar con un huevo nuevo? Se perderá la mascota actual.')) { Game.restart(); closeList(); ui.pet.x = ui.pet.tx = 160; say('¡Un huevo nuevo!'); } } catch (e) { /* noop */ } } },
      { label: 'Cerrar', val: () => '', act: () => closeList() },
    ];
    openList({ type: 'rows', title: 'Ajustes', items: rows, onPick: i => rows[i].act(1) });
  }

  /* ---------- minijuego 1: izquierda o derecha ---------- */
  function startGuess() {
    ui.game = { type: 'guess', round: 0, wins: 0, phase: 'ask', timer: 0, answer: 0, pick: 0, hit: false };
    ui.mode = 'guess'; ui.pet.x = 160; ui.pet.dir = 0; ui.pet.moving = false;
  }
  function guessPress(k) {
    const g = ui.game;
    if (k === 'back') { endGame(false, false, true); return; }
    if (g.phase !== 'ask' || (k !== 'left' && k !== 'right')) return;
    g.pick = k === 'left' ? -1 : 1; g.answer = Math.random() < .5 ? -1 : 1; g.hit = g.pick === g.answer;
    g.phase = 'reveal'; g.timer = 1.2; ui.pet.dir = g.answer;
    if (g.hit) { g.wins++; Sound.play('catch'); spawn('heart', ui.pet.x, GROUND - 80, 2); } else Sound.play('hit');
  }
  function guessUpdate(dt) {
    const g = ui.game; if (g.phase !== 'reveal') return;
    g.timer -= dt; ui.pet.moving = g.hit && g.timer > .4;
    if (g.timer <= 0) { g.round++; g.phase = 'ask'; ui.pet.dir = 0; ui.pet.moving = false; if (g.round >= 5) endGame(g.wins >= 3, g.wins === 5); }
  }

  /* ---------- minijuego 2: atrapa estrellas ---------- */
  function startCatch() {
    ui.game = { type: 'catch', t: 25, score: 0, px: 160, items: [], spawn: .5 };
    ui.mode = 'catch'; ui.pet.x = 160; ui.pet.dir = 0;
  }
  function catchUpdate(dt) {
    const g = ui.game, h = ui.held;
    const dx = (h.right ? 1 : 0) - (h.left ? 1 : 0);
    g.px = Math.max(58, Math.min(262, g.px + dx * 190 * dt)); ui.pet.x = g.px; ui.pet.dir = dx; ui.pet.moving = dx !== 0;
    g.t -= dt; g.spawn -= dt;
    if (g.spawn <= 0) { g.spawn = .45 + Math.random() * .5; g.items.push({ x: 30 + Math.random() * 260, y: 60, v: 90 + Math.random() * 70 + (25 - g.t) * 2, bad: Math.random() < .26, r: Math.random() * 6 }); }
    for (const it of g.items) {
      it.y += it.v * dt;
      if (!it.dead && it.y > GROUND - 85 && it.y < GROUND - 15 && Math.abs(it.x - g.px) < 38) {
        it.dead = true;
        if (it.bad) { g.score = Math.max(0, g.score - 2); Sound.play('hit'); ui.wobble = 1; vibrate(40); }
        else { g.score++; Sound.play('catch'); spawn('star', it.x, it.y, 2); }
      }
      if (it.y > GROUND + 10) it.dead = true;
    }
    g.items = g.items.filter(i => !i.dead);
    if (g.t <= 0) endGame(g.score >= 10, g.score >= 18);
  }
  function drawCatch() {
    const g = ui.game;
    for (const it of g.items) {
      if (it.bad) {
        ell(c, it.x, it.y, 15, 12, '#5b5f78'); ell(c, it.x - 8, it.y + 5, 9, 7, '#5b5f78'); ell(c, it.x + 9, it.y + 5, 9, 7, '#5b5f78');
        ell(c, it.x - 4, it.y - 2, 2, 2.6, '#fff'); ell(c, it.x + 4, it.y - 2, 2, 2.6, '#fff');
        c.strokeStyle = '#ffd23a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(it.x, it.y + 12); c.lineTo(it.x - 4, it.y + 19); c.lineTo(it.x + 2, it.y + 19); c.lineTo(it.x - 2, it.y + 26); c.stroke();
      } else drawStar(c, it.x, it.y, 13, '#ffd23a', it.r + ui.t * 2);
    }
    rrect(c, 20, 56, 280, 10, 5); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
    rrect(c, 20, 56, Math.max(8, 280 * g.t / 25), 10, 5); c.fillStyle = '#ff6f9f'; c.fill();
    text(`★ ${g.score}`, 160, 82, 18, '#fff', 'center', 900);
    text('Mantén ◀ ▶ · B para salir', 160, 340, 12, '#fff', 'center', 800);
  }

  function endGame(win, big, quit) {
    ui.game = null; ui.mode = 'main'; ui.pet.moving = false; ui.pet.dir = 0;
    if (quit) { say('Juego cancelado'); Sound.play('back'); return; }
    Game.playResult(win, big);
    if (win) { say(big ? '¡Increíble! ¡Muy feliz!' : '¡Ganaste! ¡Está feliz!'); Sound.play('win'); spawn('heart', ui.pet.x, GROUND - 80, 5); startAnim({ dur: 1.6, mood: 'happy' }); }
    else { say('Perdiste… ¡otra vez!'); Sound.play('sad'); startAnim({ dur: 1.2, mood: 'neutral' }); }
  }

  /* ---------- entrada ---------- */
  function press(k) {
    Sound.unlock();
    if (k === 'start' && ui.mode === 'main') { activate('settings'); return; }
    if (k === 'select' && ui.mode === 'main') { activate('stats'); return; }
    switch (ui.mode) {
      case 'main':
        if (k === 'left') { ui.cursor = (ui.cursor + MENU.length - 1) % MENU.length; Sound.play('nav'); }
        else if (k === 'right') { ui.cursor = (ui.cursor + 1) % MENU.length; Sound.play('nav'); }
        else if (k === 'ok') activate(MENU[ui.cursor].id);
        break;
      case 'list': {
        const l = ui.list, n = l.items.length;
        const prev = l.type === 'rows' ? 'up' : 'left', next = l.type === 'rows' ? 'down' : 'right';
        if (k === prev || (l.type === 'cards' && k === 'up')) { l.idx = (l.idx + n - 1) % n; Sound.play('nav'); }
        else if (k === next || (l.type === 'cards' && k === 'down')) { l.idx = (l.idx + 1) % n; Sound.play('nav'); }
        else if (l.type === 'rows' && (k === 'left' || k === 'right') && l.items[l.idx].act) l.items[l.idx].act(k === 'left' ? -1 : 1);
        else if (k === 'ok') l.onPick(l.idx);
        else if (k === 'back' || k === 'start') { closeList(); Sound.play('back'); }
        break;
      }
      case 'stats':
        if (k === 'back' || k === 'ok' || k === 'select' || k === 'start') { ui.mode = 'main'; Sound.play('back'); }
        break;
      case 'guess': guessPress(k); break;
      case 'catch': if (k === 'back') endGame(false, false, true); break;
    }
  }

  const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down',
    KeyZ: 'ok', Enter: 'ok', Space: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back', Tab: 'start', ShiftLeft: 'select', ShiftRight: 'select' };
  addEventListener('keydown', e => {
    const k = KEYMAP[e.code]; if (!k || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (e.repeat && (k === 'ok' || k === 'back' || k === 'start' || k === 'select')) return;
    ui.held[k] = true; press(k);
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) ui.held[k] = false; });
  addEventListener('blur', () => { ui.held = {}; });

  // mando en pantalla (táctil / ratón)
  document.querySelectorAll('[data-key]').forEach(btn => {
    const k = btn.dataset.key; let t1 = null, t2 = null;
    const stop = () => { ui.held[k] = false; btn.classList.remove('on'); clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
      ui.held[k] = true; btn.classList.add('on'); press(k); vibrate(8);
      if (['left', 'right', 'up', 'down'].includes(k)) t1 = setTimeout(() => { t2 = setInterval(() => { if (ui.mode !== 'catch') press(k); }, 130); }, 380);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  /* ---------- eventos del juego ---------- */
  function processEvents() {
    while (Game.events.length) {
      const ev = Game.events.shift(), p = P();
      switch (ev.type) {
        case 'call': say(CALL_TEXT[ev.call] || '¡Atención!', 3); Sound.play('call'); vibrate([60, 60, 60]); break;
        case 'poop': Sound.play('poop'); spawn('drop', ui.pet.x, GROUND - 40, 0); break;
        case 'sick': say('¡Se ha puesto enfermo!', 3); Sound.play('sad'); break;
        case 'hurt': Sound.play('sad'); ui.wobble = 1; break;
        case 'hatch': ui.flash = 1; Sound.play('hatch'); say('¡Ha nacido! Dale un nombre en Ajustes', 4); spawn('star', 160, GROUND - 60, 10); break;
        case 'evolve': ui.flash = 1; Sound.play('evolve'); say(`¡Ha evolucionado a ${SPECIES[ev.species].name}!`, 4); spawn('star', ui.pet.x, GROUND - 70, 10); spawn('heart', ui.pet.x, GROUND - 70, 4); vibrate([80, 40, 120]); break;
        case 'die': Sound.play('die'); ui.anim = null; closeIfGame(); say(`${p.name} nos ha dejado… (${ev.cause})`, 6); break;
      }
    }
  }
  function closeIfGame() { if (ui.game) { ui.game = null; } if (ui.mode !== 'stats') { ui.mode = 'main'; ui.list = null; } }

  /* ---------- paneles ---------- */
  function panel(x, y, w, h) {
    rrect(c, x, y, w, h, 18); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); c.strokeStyle = '#ff9db8'; c.lineWidth = 3; c.stroke();
  }
  function hearts(x, y, val, fill) {
    for (let i = 0; i < 4; i++) drawHeart(c, x + i * 20, y, 6.5, i < val ? fill : 'rgba(150,150,170,.3)');
  }
  function drawList() {
    const l = ui.list;
    if (l.type === 'cards') {
      panel(26, 120, 268, 150);
      text(l.title, 160, 142, 16, '#ff5c8a', 'center', 900);
      const n = l.items.length, cw = 108, gap = 10, x0 = 160 - (n * cw + (n - 1) * gap) / 2;
      l.items.forEach((it, i) => {
        const x = x0 + i * (cw + gap), sel = i === l.idx;
        rrect(c, x, 158, cw, 92, 14); c.fillStyle = sel ? '#ffe3ef' : '#f1eefc'; c.fill();
        if (sel) { c.strokeStyle = '#ff6f9f'; c.lineWidth = 3; c.stroke(); }
        c.save(); c.translate(x + cw / 2, 194); if (sel) c.scale(1 + Math.sin(ui.t * 6) * .04, 1 + Math.sin(ui.t * 6) * .04); it.draw(); c.restore();
        text(it.label, x + cw / 2, 232, 12, '#2b2440');
      });
      text('A: elegir · B: volver', 160, 262, 10, '#8a82aa', 'center', 700);
    } else {
      const n = l.items.length, h = 52 + n * 30;
      panel(22, 74, 276, h);
      text(l.title, 160, 98, 16, '#ff5c8a', 'center', 900);
      l.items.forEach((it, i) => {
        const y = 118 + i * 30, sel = i === l.idx;
        rrect(c, 34, y, 252, 26, 10); c.fillStyle = sel ? '#ffe3ef' : '#f1eefc'; c.fill();
        if (sel) { c.strokeStyle = '#ff6f9f'; c.lineWidth = 2.4; c.stroke(); }
        text(it.label, 46, y + 13.5, 13, '#2b2440', 'left');
        text(it.val(), 274, y + 13.5, 13, '#6a7cff', 'right');
      });
    }
  }
  function drawStats() {
    const p = P(), sp = SPECIES[p.species];
    panel(16, 74, 288, 262);
    text(p.stage === 'egg' ? 'Huevo' : p.name, 160, 96, 17, '#ff5c8a', 'center', 900);
    text(`${sp ? sp.name : 'Huevo'} · ${STAGE_NAMES[p.stage]}`, 160, 114, 11, '#8a82aa', 'center', 700);
    const row = (i, label, fn) => { const y = 138 + i * 24; text(label, 32, y, 13, '#2b2440', 'left'); fn(y); };
    row(0, 'Edad', y => text(`${Math.floor(p.age / Game.DAY) + 1} días`, 288, y, 13, '#6a7cff', 'right'));
    row(1, 'Peso', y => text(`${p.weight} g`, 288, y, 13, '#6a7cff', 'right'));
    row(2, 'Hambre', y => hearts(212, y, p.hunger, '#ff8a3c'));
    row(3, 'Felicidad', y => hearts(212, y, p.happy, '#ff5c8a'));
    row(4, 'Salud', y => hearts(212, y, p.health, '#4fcf7a'));
    row(5, 'Disciplina', y => { rrect(c, 160, y - 5, 128, 10, 5); c.fillStyle = '#e4defa'; c.fill(); rrect(c, 160, y - 5, Math.max(8, 128 * p.disc / 100), 10, 5); c.fillStyle = '#6a7cff'; c.fill(); });
    row(6, 'Errores de cuidado', y => text(String(p.mistakes), 288, y, 13, p.mistakes > 3 ? '#ee5a52' : '#6a7cff', 'right'));
    const h = Game.history;
    if (h.length) { text(`Recuerdos: ${h.slice(0, 2).map(x => `${x.name} (${x.days}d)`).join(', ')}`, 160, 318, 10.5, '#8a82aa', 'center', 700); }
    else text('B: volver', 160, 318, 10.5, '#8a82aa', 'center', 700);
  }

  /* ---------- render ---------- */
  function render() {
    const p = P();
    c.clearRect(0, 0, W, H);
    drawScene();
    drawPoops();

    if (p.stage === 'egg') {
      drawEgg(c, 160, GROUND, ui.t, p.eggTime / Game.EGG_TIME, ui.wobble * .15);
    } else if (!p.alive) {
      drawTomb(c, 214, GROUND + 4); drawGhost(c, 120, GROUND, ui.t);
    } else {
      const sp = SP();
      drawPet(c, sp, petOpts());
      // comida animada
      const a = ui.anim;
      if (a && a.kind) {
        const k = Math.min(1, a.t / .8), my = GROUND - 6 - sp.ry * .74;
        if (a.t < .8) drawFood(c, a.kind, lerp(ui.pet.x + 70, ui.pet.x, k), lerp(my - 60, my, k), lerp(1.2, .5, k));
        a.eating = a.t >= .8 && a.t < a.dur - .1;
      }
      if (ui.mode === 'catch') drawCatch();
    }

    drawParts();

    if (!p.lightsOn && p.alive) {
      c.fillStyle = 'rgba(10,12,48,.58)'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(160, 100); c.scale(1.4, 1.4); c.globalAlpha = .8; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.fillStyle = '#fff6d6'; c.fill();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(7, -4, 12, 0, 7); c.fill(); c.restore();
    }
    if (ui.flash > 0) { c.fillStyle = `rgba(255,255,255,${ui.flash})`; c.fillRect(0, 0, W, H); }

    drawBar();

    // insignia de llamada
    if (p.call && p.alive && ui.mode === 'main') {
      const pulse = 1 + Math.sin(ui.t * 8) * .08;
      c.save(); c.translate(292, 90); c.scale(pulse, pulse);
      ell(c, 0, 0, 15, 15, '#ff4d6d'); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
      text('!', 0, 1, 20, '#fff', 'center', 900); c.restore();
    }
    if (ui.mode === 'guess') {
      const g = ui.game;
      for (let i = 0; i < 5; i++) ell(c, 120 + i * 20, 84, 6, 6, i < g.round ? '#4fcf7a' : 'rgba(255,255,255,.7)');
      if (g.phase === 'ask') {
        text('¿Hacia dónde mirará?', 160, 118, 15, '#fff', 'center', 900);
        text('◀', 70, 190, 34, '#fff', 'center', 900); text('▶', 250, 190, 34, '#fff', 'center', 900);
      } else {
        text(g.hit ? '¡Acertaste!' : '¡Fallaste!', 160, 118, 17, g.hit ? '#fff7a8' : '#ffd0d6', 'center', 900);
      }
      text('◀ ▶ elegir · B salir', 160, 340, 12, '#fff', 'center', 800);
    }
    if (ui.mode === 'list') drawList();
    if (ui.mode === 'stats') drawStats();

    // toast / etiqueta
    if (!p.alive && ui.mode === 'main' && ui.toastT <= 0) { ui.toast = 'Pulsa A para un huevo nuevo'; ui.toastT = .1; }
    if (ui.toastT > 0 && ui.toast && ui.mode !== 'guess' && ui.mode !== 'catch' && ui.mode !== 'stats') {
      c.font = '800 13px "Nunito",sans-serif'; const w = Math.min(300, c.measureText(ui.toast).width + 28);
      c.globalAlpha = Math.min(1, ui.toastT * 3);
      rrect(c, 160 - w / 2, 306, w, 28, 14); c.fillStyle = 'rgba(43,36,64,.85)'; c.fill();
      text(ui.toast, 160, 320.5, 13, '#fff'); c.globalAlpha = 1;
    } else if (ui.mode === 'main') {
      const day = Math.floor(p.age / Game.DAY) + 1;
      text(p.stage === 'egg' ? 'Toca A para calentar el huevo' : `${p.name} · día ${day}`, 160, 346, 12, 'rgba(255,255,255,.95)', 'center', 800);
    }
  }

  /* ---------- bucle ---------- */
  function update(dt) {
    ui.t += dt;
    const p = P();
    if (ui.toastT > 0) ui.toastT -= dt;
    if (ui.flash > 0) ui.flash = Math.max(0, ui.flash - dt * .9);
    for (const cl of ui.clouds) { cl.x += cl.v * dt; if (cl.x > W + 50) cl.x = -50; }
    updatePet(dt);
    if (ui.mode === 'guess') guessUpdate(dt);
    if (ui.mode === 'catch') catchUpdate(dt);
    // partículas ambientales
    ui.spawnT -= dt;
    if (ui.spawnT <= 0 && p.alive && p.stage !== 'egg') {
      ui.spawnT = 1.4;
      const my = GROUND - SP().ry * 2 - 8;
      if (p.sleeping) spawn('zzz', ui.pet.x + 30, my + 20);
      else if (p.sick) spawn('drop', ui.pet.x + 30, my + 20);
      else if (moodOf(p) === 'happy' && ui.mode === 'main' && Math.random() < .5) spawn('note', ui.pet.x + 30, my + 30);
    }
    updateParts(dt);
    // pitido de atención
    if (p.call && p.alive && !document.hidden) { ui.callBeep -= dt; if (ui.callBeep <= 0) { ui.callBeep = 8; Sound.play('call'); } } else ui.callBeep = 3;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    try { Game.tickTo(Date.now()); processEvents(); update(dt); render(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }

  /* ---------- arranque ---------- */
  Game.load();
  Game.events.length = 0;
  Sound.setEnabled(Game.cfg.sound);
  ui.pet.x = ui.pet.tx = 160;
  if (P().stage === 'egg') say('¡Toca A para calentar el huevo!', 4);
  else if (!P().alive) say('Tu mascota nos dejó…', 4);
  else say(`¡Hola de nuevo, ${P().name}!`, 3);
  setInterval(() => Game.save(), 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); });
  addEventListener('pagehide', () => Game.save());
  requestAnimationFrame(frame);
  window.__cuqui = { Game, ui, press };  // útil para depurar y probar
})();
