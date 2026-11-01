'use strict';
/* Interfaz: render, menús, minijuegos, entrada por teclado y mando táctil. */
(() => {
  const W = 320, H = 360, GROUND = 292;
  const cv = document.getElementById('screen');
  const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const renderer = Scene.makeRenderer(cv, dpr);
  let c = null;   // contexto actual (lo fija el renderizador)

  const MENU = [
    { id: 'feed', label: 'Comer', icon: 'feed' }, { id: 'light', label: 'Luz', icon: 'light' }, { id: 'play', label: 'Jugar', icon: 'play' },
    { id: 'med', label: 'Medicina', icon: 'med' }, { id: 'clean', label: 'Limpieza', icon: 'clean' }, { id: 'care', label: 'Cariño', icon: 'care' },
    { id: 'train', label: 'Entrenar', icon: 'train' }, { id: 'shop', label: 'Tienda', icon: 'shop' }, { id: 'bag', label: 'Mochila', icon: 'bag' },
    { id: 'work', label: 'Trabajo', icon: 'work' }, { id: 'town', label: 'Amigos', icon: 'town' }, { id: 'album', label: 'Álbum', icon: 'album' },
    { id: 'quest', label: 'Misiones', icon: 'quest' }, { id: 'ach', label: 'Logros', icon: 'trophy' }, { id: 'photo', label: 'Foto', icon: 'camera' }, { id: 'stats', label: 'Estado', icon: 'stats' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];
  const ANYTIME = ['shop', 'bag', 'album', 'ach', 'quest', 'photo', 'stats', 'settings'];
  const SPEEDS = [1, 4, 16, 60];
  const THEMES = [['modern', 'Moderno'], ['color', 'Color retro'], ['classic', 'Clásico verde']];
  const VOLUMES = [['Bajo', .4], ['Medio', 1], ['Alto', 1.8]];
  const CALL_TEXT = { hungry: '¡Tiene hambre!', sad: '¡Está triste!', sick: '¡Se siente mal!', sleep: 'Quiere dormir: apaga la luz', fake: '¡Quiere atención!', dirty: '¡Necesita un baño!' };
  const HINTS = {
    puchi: 'Eclosiona un huevo', bunbun: 'Etapa niño (al azar)', kitto: 'Etapa niño (al azar)', lumi: 'Joven con buen cuidado', nimbo: 'Joven con cuidado normal',
    pinchi: 'Joven con mal cuidado', estrellin: 'Adulto con buen cuidado', nubi: 'Adulto con cuidado normal', grunon: 'Adulto con mal cuidado',
    cosmico: 'Cuidado perfecto, 0 errores', fortachon: 'Adulto con mucha Fuerza', sabio: 'Adulto con mucha Mente', diva: 'Adulto con mucho Encanto',
  };
  const BG_SWATCH = { meadow: ['#7cc7ff', '#7bd98f'], beach: ['#8fe0ff', '#f4dc9c'], space: ['#0a0820', '#8a86a6'], candy: ['#ffb3d9', '#fff2dc'], forest: ['#8fd8b0', '#4a9a52'], city: ['#7a86b8', '#8a8aa6'] };

  const ui = {
    mode: 'main', cursor: 0, t: 0, dt: .016, toast: '', toastT: 0, queue: [], parts: [], anim: null, flash: 0, list: null, stack: [], game: null,
    pet: { x: 160, tx: 160, dir: 0, wait: 1, blink: 0, nextBlink: 2, moving: false },
    held: {}, spawnT: 0, callBeep: 0, wobble: 0, album: 0, statPage: 0, hideUI: false, photoFlash: 0,
  };

  /* ---------- utilidades ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const P = () => Game.pet;
  const PR = () => Game.prof;
  const SP = () => SPECIES[P().species] || SPECIES.puchi;
  const retro = () => Game.cfg.theme !== 'modern';
  const TITLE = () => Game.cfg.theme === 'modern' ? '#ff5c8a' : '#2b2440';
  function text(str, x, y, size, color, align, weight) {
    c.font = `${weight || 800} ${size}px "Nunito","Trebuchet MS",system-ui,sans-serif`;
    c.fillStyle = color || '#2b2440'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(str, x, y);
  }
  function say(msg, secs) { ui.toast = msg; ui.toastT = secs || 2.4; }
  function sayQ(msg, secs) { if (ui.toastT > 0) ui.queue.push([msg, secs || 3]); else say(msg, secs || 3); }
  function vibrate(p) { try { if (Game.cfg.vibrate && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* noop */ } }

  /* ---------- partículas ---------- */
  function spawn(type, x, y, n) {
    for (let i = 0; i < (n === undefined ? 1 : n); i++) {
      const life = type === 'zzz' ? 2.2 : 1.2 + Math.random() * .6;
      ui.parts.push({ type, x: x + (Math.random() - .5) * 16, y, vx: (Math.random() - .5) * (type === 'zzz' ? 8 : 50),
        vy: type === 'drop' ? 40 : type === 'water' ? 140 : -(24 + Math.random() * 30), life, max: life, r: 4 + Math.random() * 4, rot: Math.random() * 6 });
    }
  }
  function drawParts() {
    for (const p of ui.parts) {
      const a = Math.max(0, Math.min(1, p.life / p.max * 1.4));
      c.save(); c.globalAlpha = a;
      if (p.type === 'heart') drawHeart(c, p.x, p.y, p.r * .9 + 2, '#ff5c8a');
      else if (p.type === 'star') drawStar(c, p.x, p.y, p.r + 1, '#ffe45e', p.rot + ui.t * 3);
      else if (p.type === 'drop' || p.type === 'water') ell(c, p.x, p.y, 2.6, 4, 'rgba(120,190,255,.95)');
      else if (p.type === 'bubble') { c.beginPath(); c.arc(p.x, p.y, p.r + 2, 0, 7); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2; c.stroke(); c.fillStyle = 'rgba(160,220,255,.35)'; c.fill(); }
      else if (p.type === 'zzz') text('Z', p.x, p.y, 12 + (1 - p.life / p.max) * 12, '#fff', 'center', 900);
      else if (p.type === 'note') text('♪', p.x, p.y, 16, '#ff7fb0', 'center', 900);
      else if (p.type === 'coin') drawCoin(c, p.x, p.y, 6);
      else if (p.type === 'confetti') { c.fillStyle = ['#ff5c8a', '#ffd23a', '#6bd6ff', '#9be8d0'][Math.floor(p.rot) % 4]; c.save(); c.translate(p.x, p.y); c.rotate(p.rot * 3 + ui.t * 5); c.fillRect(-3, -1.5, 6, 3); c.restore(); }
      c.restore();
    }
  }
  function updateParts(dt) {
    for (const p of ui.parts) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === 'confetti') p.vy += 90 * dt; p.life -= dt; }
    ui.parts = ui.parts.filter(p => p.life > 0);
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
      senior: p.stage === 'senior', blink: ui.pet.blink > 0, hop: ui.pet.moving || !!(ui.anim && ui.anim.hop), scale: p.stage === 'senior' ? .95 : 1,
      eating: !!(ui.anim && ui.anim.eating), squash: ui.wobble > 0 ? Math.sin(ui.t * 30) * .05 * ui.wobble : 0,
      acc: PR().equip, outline: retro(),
    };
    return Object.assign(o, extra);
  }
  function updatePet(dt) {
    const p = P(), u = ui.pet;
    ui.wobble = Math.max(0, ui.wobble - dt * 2);
    u.nextBlink -= dt; if (u.nextBlink <= 0) { u.blink = .14; u.nextBlink = 2 + Math.random() * 3; }
    if (u.blink > 0) u.blink -= dt;
    if (ui.anim) {
      ui.anim.t += dt;
      if (ui.anim.t >= ui.anim.dur) { const f = ui.anim.after; ui.anim = null; if (f) f(); }
    }
    if (ui.game && ui.game.type === 'catch') return;
    u.moving = false;
    if (ui.anim && ui.anim.friend) { u.x = lerp(u.x, 100, Math.min(1, dt * 4)); u.dir = 1; return; }
    const busy = ui.anim || ui.mode !== 'main' || !p.alive || p.stage === 'egg' || p.sleeping || p.work;
    if (busy) { if (p.sleeping || !p.alive || p.stage === 'egg') u.dir = 0; return; }
    if (Math.abs(u.tx - u.x) > 2) { const d = Math.sign(u.tx - u.x); u.x += d * 22 * dt; u.dir = d; u.moving = true; }
    else {
      u.wait -= dt;
      if (u.wait <= 0) { u.tx = 70 + Math.random() * 180; u.wait = 1 + Math.random() * 3; if (Math.random() < .3) u.tx = u.x; }
      else if (u.wait < .5) u.dir = 0;
    }
  }
  function startAnim(a) { ui.anim = Object.assign({ t: 0, dur: 1.5 }, a); }

  function drawStink(x, y) {
    c.save(); c.strokeStyle = 'rgba(120,170,60,.8)'; c.lineWidth = 2.4; c.lineCap = 'round';
    for (const dx of [-26, 0, 26]) { c.beginPath(); c.moveTo(x + dx, y); c.bezierCurveTo(x + dx + 8, y - 8 - Math.sin(ui.t * 4 + dx) * 3, x + dx - 8, y - 16, x + dx + 2, y - 26); c.stroke(); }
    c.restore();
  }
  function drawPoops() { const slots = [50, 92, 232, 272]; for (let i = 0; i < P().poops; i++) drawPoop(c, slots[i], GROUND + 10, ui.t); }

  /* ---------- acciones ---------- */
  function applyResult(r) {
    const p = P(), mx = ui.pet.x, my = GROUND - 60;
    say(r.msg);
    if (!r.ok) { Sound.play('no'); if (r.fx === 'refuse') { startAnim({ dur: 1, mood: 'sad' }); ui.wobble = 1; } vibrate(60); return; }
    switch (r.fx) {
      case 'eat': case 'snack':
        Sound.play('eat');
        startAnim({ dur: 2.0, kind: r.kind, eating: false, mood: 'happy', after: () => { spawn('heart', mx, my, 3); Sound.play('happy'); } });
        break;
      case 'light': Sound.play('light'); break;
      case 'cured': Sound.play('happy'); spawn('star', mx, my, 6); spawn('heart', mx, my, 3); startAnim({ dur: 1.4, mood: 'happy' }); break;
      case 'vit': Sound.play('med'); spawn('star', mx, my, 5); startAnim({ dur: 1.2, mood: 'happy' }); break;
      case 'dose': Sound.play('med'); spawn('star', mx, my, 3); break;
      case 'clean': Sound.play('clean'); for (let i = 0; i < 8; i++) spawn('bubble', 30 + i * 36, GROUND + 6, 2); startAnim({ dur: 1, mood: 'happy' }); break;
      case 'shower': Sound.play('clean'); for (let i = 0; i < 24; i++) setTimeout(() => spawn('water', mx, GROUND - 150, 1), i * 40); spawn('bubble', mx, GROUND - 40, 10); startAnim({ dur: 1.6, mood: 'happy', hop: true }); break;
      case 'scold': Sound.play('happy'); startAnim({ dur: 1.4, mood: 'neutral' }); spawn('star', mx, my, 3); break;
      case 'scoldBad': Sound.play('sad'); startAnim({ dur: 1.4, mood: 'sad' }); ui.wobble = 1; break;
      case 'cuddle': Sound.play('happy'); spawn('heart', mx, my, 5); startAnim({ dur: 1.2, mood: 'happy' }); break;
      case 'toy': Sound.play(r.toy === 'guitarra' ? 'guitar' : 'catch'); spawn('note', mx, my, r.toy === 'guitarra' ? 5 : 1); spawn('heart', mx, my, 2); startAnim({ dur: 2.4, toy: r.toy, mood: 'happy', hop: r.toy !== 'guitarra' }); break;
      case 'train': Sound.play('train'); spawn('star', mx, my, 4); startAnim({ dur: 1.8, trainStat: r.stat, hop: true, mood: 'happy' }); break;
      case 'visit': Sound.play('happy'); spawn('heart', 165, my, 6); startAnim({ dur: 3.4, friend: r.friend, lv: r.lv, mood: 'happy', hop: true }); break;
      case 'buy': Sound.play('buy'); spawn('coin', 40, 66, 2); break;
      case 'equip': case 'bg': Sound.play('ok'); spawn('star', mx, my, 3); break;
      case 'work': Sound.play('ok'); break;
      default: Sound.play('ok');
    }
    vibrate(20);
  }

  /* ---------- listas / menús ---------- */
  function openList(l) { if (ui.mode === 'list' && ui.list) ui.stack.push(ui.list); ui.list = Object.assign({ idx: 0, top: 0 }, l); ui.mode = 'list'; }
  function closeAll() { ui.list = null; ui.stack = []; ui.mode = 'main'; }
  function backList() { if (ui.stack.length) ui.list = ui.stack.pop(); else closeAll(); }
  function needAwake() {
    if (P().work) { say('Está trabajando…'); Sound.play('no'); return false; }
    if (P().sleeping) { say('Zzz… está durmiendo'); Sound.play('no'); return false; }
    return true;
  }
  const act = fn => () => { closeAll(); fn(); };

  function foodIcon(id) { return () => drawFoodItem(c, id, 0, 0, .75); }
  function openFeed() {
    const inv = PR().inv, items = [
      { label: 'Comida', val: () => '', draw: foodIcon('meal'), act: act(() => applyResult(Game.feed('meal'))) },
      { label: 'Dulce', val: () => '', draw: foodIcon('snack'), act: act(() => applyResult(Game.feed('snack'))) },
    ];
    for (const id of Object.keys(FOODS)) if (inv[id] > 0) items.push({ label: FOODS[id].name, val: () => `x${inv[id]}`, draw: foodIcon(id), act: act(() => applyResult(Game.eatItem(id))) });
    openList({ title: 'Comer', items, footer: 'Compra más comida en la Tienda' });
  }
  function openPlay() {
    const items = [
      { label: '¿Izquierda o derecha?', val: () => '', draw: () => text('◀▶', 0, 0, 14, '#6a7cff', 'center', 900), act: act(startGuess) },
      { label: 'Atrapa estrellas', val: () => '', draw: () => drawStar(c, 0, 0, 10, '#ffd23a', ui.t), act: act(startCatch) },
      { label: 'Mayor o menor', val: () => '', draw: () => drawCard(c, 0, 0, 16, 22, 7, true), act: act(startHilo) },
      { label: 'Piedra, papel, tijera', val: () => '', draw: () => drawHand(c, 'tijera', 0, 2, .6), act: act(startRps) },
      { label: 'Memoria', val: () => '', draw: () => drawCard(c, 0, 0, 16, 22, 0, false), act: act(startMemory) },
    ];
    openList({ title: 'Jugar', items });
  }
  function openCare() {
    openList({ title: 'Cariño', items: [
      { label: 'Acariciar', val: () => '', draw: () => drawHeart(c, 0, 0, 8, '#ff5c8a'), act: act(() => applyResult(Game.cuddle())) },
      { label: 'Regañar', val: () => '', draw: () => ICONS.disc(c), act: act(() => applyResult(Game.scold())) },
    ] });
  }
  function openClean() {
    openList({ title: 'Limpieza', items: [
      { label: 'Limpiar cacas', val: () => `${P().poops}`, draw: () => drawPoop(c, 0, 10, 0), act: act(() => applyResult(Game.clean())) },
      { label: 'Darse un baño', val: () => `${P().hygiene}/4`, draw: () => ICONS.clean(c), act: act(() => applyResult(Game.shower())) },
    ] });
  }
  function openTrain() {
    const p = P(), mk = (label, stat, icon) => ({ label, val: () => String(p[stat]), draw: icon, act: act(() => applyResult(Game.train(stat))) });
    openList({ title: 'Entrenar', items: [
      mk('Pesas · Fuerza', 'str', () => ICONS.train(c)), mk('Estudiar · Mente', 'mind', () => ICONS.album(c)), mk('Baile · Encanto', 'charm', () => text('♪', 0, 0, 18, '#ff7fb0', 'center', 900)),
    ], footer: `Energía: ${p.energy}/4 · los entrenos dan 1 moneda` });
  }
  function itemDraw(cat, id) {
    if (cat === 'food') return foodIcon(id);
    if (cat === 'toy') return () => drawToy(c, id, 0, 0, .7, ui.t);
    if (cat === 'acc') return () => drawAccIcon(c, id, .75);
    return () => { const s = BG_SWATCH[id]; const g = c.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, s[0]); g.addColorStop(1, s[1]); rrect(c, -13, -10, 26, 20, 5); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(40,20,70,.35)'; c.lineWidth = 1.5; c.stroke(); };
  }
  function openShop() {
    const cats = [['food', 'Comida y medicinas'], ['toy', 'Juguetes'], ['acc', 'Ropa y accesorios'], ['bg', 'Fondos']];
    openList({ title: 'Tienda', coins: true, items: cats.map(([cat, label]) => ({ label, val: () => '', act: () => {
      const cat_ = Game.catalogOf(cat);
      openList({ title: label, coins: true, footer: 'A: comprar', items: Object.keys(cat_).map(id => ({
        label: cat_[id].name, draw: itemDraw(cat, id),
        val: () => cat === 'food' ? `${cat_[id].price}c · x${PR().inv[id] || 0}` : PR().owned[id] ? 'Tuyo' : `${cat_[id].price}c`,
        act: () => applyResult(Game.buy(cat, id)),
      })) });
    } })), footer: 'c = monedas' });
  }
  function openBag() {
    const prof = PR();
    const cats = [
      ['Juguetes', () => Object.keys(TOYS).filter(id => prof.owned[id]).map(id => ({ label: TOYS[id].name, val: () => '', draw: itemDraw('toy', id), act: act(() => applyResult(Game.useToy(id))) }))],
      ['Ropa y accesorios', () => Object.keys(ACCESSORIES).filter(id => prof.owned[id]).map(id => ({ label: ACCESSORIES[id].name, val: () => prof.equip[ACCESSORIES[id].slot] === id ? 'Puesto' : '', draw: itemDraw('acc', id), act: act(() => applyResult(Game.equip(id))) }))],
      ['Fondos', () => Object.keys(WALLPAPERS).filter(id => prof.owned[id]).map(id => ({ label: WALLPAPERS[id].name, val: () => prof.bg === id ? 'Activo' : '', draw: itemDraw('bg', id), act: act(() => applyResult(Game.setBg(id))) }))],
      ['Comida', () => Object.keys(FOODS).filter(id => prof.inv[id] > 0).map(id => ({ label: FOODS[id].name, val: () => `x${prof.inv[id]}`, draw: foodIcon(id), act: act(() => applyResult(Game.eatItem(id))) }))],
    ];
    openList({ title: 'Mochila', items: cats.map(([label, fn]) => ({ label, val: () => '', act: () => {
      const items = fn();
      if (!items.length) { say('Aquí no tienes nada todavía'); Sound.play('no'); return; }
      openList({ title: label, items });
    } })) });
  }
  function openWork() {
    const p = P();
    if (p.work) {
      openList({ title: 'Trabajando', items: [
        { label: 'Seguir esperando', val: () => '', act: closeAll },
        { label: 'Llamarlo de vuelta', val: () => '', act: act(() => applyResult(Game.cancelWork())) },
      ] });
      return;
    }
    openList({ title: 'Trabajo', items: Object.keys(JOBS).map(id => ({ label: JOBS[id].name, val: () => `${JOBS[id].pay}c`, draw: () => ICONS.work(c), act: act(() => applyResult(Game.startWork(id))) })),
      footer: 'Vuelve con monedas, pero con hambre' });
  }
  function openTown() {
    const prof = PR();
    const items = Game.allFriends().map(f => ({
      label: f.name, val: () => { const fr = prof.friends[f.id]; const lv = fr ? fr.lv : 0; return Date.now() < (fr ? fr.cd : 0) ? `Nv ${lv} · ocupado` : `Nv ${lv}/5`; },
      draw: () => drawPet(c, SPECIES[f.species], { x: 0, y: 12, t: ui.t, mood: 'happy', scale: .22, outline: retro() }),
      act: () => openList({ title: f.name, items: [
        { label: 'Visitar', val: () => '', draw: () => ICONS.town(c), act: act(() => applyResult(Game.visit(f.id))) },
        { label: 'Combatir', val: () => '', draw: () => ICONS.battle(c), act: act(() => { const r = Game.startBattle(f.id); if (r.ok) startBattleMode(r); else applyResult(r); }) },
      ] }),
    }));
    items.push({ label: 'Mi código de amigo', val: () => '', draw: () => text('#', 0, 0, 16, '#6a7cff', 'center', 900), act: shareCode });
    items.push({ label: 'Añadir amigo con código', val: () => '', draw: () => text('+', 0, 0, 18, '#4fcf7a', 'center', 900), act: addFriend });
    openList({ title: 'Amigos', footer: 'Visita o combate · cada amigo descansa 5 min', items });
  }
  function shareCode() {
    const code = Game.myCode();
    try { if (navigator.clipboard) navigator.clipboard.writeText(code); } catch (e) { /* noop */ }
    try { window.prompt('Tu código de amigo (ya copiado). Envíaselo a un amigo:', code); } catch (e) { /* noop */ }
    say('Código copiado', 2.5);
  }
  function addFriend() {
    let s = null; try { s = window.prompt('Pega el código de tu amigo:'); } catch (e) { /* noop */ }
    if (!s) return;
    const r = Game.addFriendCode(s); applyResult(r);
    if (r.ok) { closeAll(); openTown(); }
  }
  function openMissions() {
    const prof = PR(); Game.ensureMissions();
    const items = [0, 1, 2].map(i => ({
      label: Game.missionList()[i].text, draw: () => ICONS.quest(c),
      val: () => { const q = Game.missionList()[i]; return q.done ? 'Cobrada' : q.prog >= q.n ? '¡Cobrar!' : `${q.prog}/${q.n}`; },
      act: () => applyResult(Game.claimMission(i)),
    }));
    openList({ title: 'Misiones de hoy', coins: true, items, footer: `Racha: ${prof.streak} día${prof.streak === 1 ? '' : 's'} · +20 extra por las 3` });
  }

  function openAchievements() {
    const prof = PR();
    openList({ title: `Logros ${Object.keys(prof.ach).length}/${ACHIEVEMENTS.length}`, footer: 'Cada logro da monedas', items: ACHIEVEMENTS.map(a => ({
      label: a.name, val: () => prof.ach[a.id] ? 'Hecho' : `+${a.coins}c`, dim: !prof.ach[a.id],
      draw: () => { if (prof.ach[a.id]) drawStar(c, 0, 0, 9, '#ffc93c'); else drawStar(c, 0, 0, 9, '#cfc9e4'); },
      act: () => say(a.desc, 3),
    })) });
  }
  function openSettings() {
    const cfg = Game.cfg;
    const cycle = (arr, cur, d) => (arr.findIndex(x => x === cur) + d + arr.length) % arr.length;
    const rows = [
      { label: 'Pantalla', adj: true, val: () => THEMES.find(t => t[0] === cfg.theme)[1], act: d => { cfg.theme = THEMES[cycle(THEMES.map(t => t[0]), cfg.theme, d)][0]; applyTheme(); Sound.play('nav'); } },
      { label: 'Sonido', adj: true, val: () => cfg.sound ? 'Sí' : 'No', act: () => { cfg.sound = !cfg.sound; Sound.setEnabled(cfg.sound); Sound.play('ok'); } },
      { label: 'Volumen', adj: true, val: () => VOLUMES[cfg.volume][0], act: d => { cfg.volume = (cfg.volume + d + VOLUMES.length) % VOLUMES.length; Sound.setVolume(VOLUMES[cfg.volume][1]); Sound.play('ok'); } },
      { label: 'Vibración', adj: true, val: () => cfg.vibrate ? 'Sí' : 'No', act: () => { cfg.vibrate = !cfg.vibrate; vibrate(40); Sound.play('ok'); } },
      { label: 'Velocidad', adj: true, val: () => cfg.speed + 'x', act: d => { Game.tickTo(Date.now()); cfg.speed = SPEEDS[(SPEEDS.indexOf(cfg.speed) + d + SPEEDS.length) % SPEEDS.length]; Sound.play('nav'); } },
      { label: 'Ciclo día/noche', adj: true, val: () => cfg.nights ? 'Real' : 'Siempre día', act: () => { Game.tickTo(Date.now()); cfg.nights = !cfg.nights; Sound.play('ok'); } },
      { label: 'Clima', adj: true, val: () => cfg.weather ? 'Real' : 'Sin clima', act: () => { cfg.weather = !cfg.weather; Sound.play('ok'); } },
      { label: 'Reloj en pantalla', adj: true, val: () => cfg.clock ? 'Sí' : 'No', act: () => { cfg.clock = !cfg.clock; Sound.play('ok'); } },
      { label: 'Música', adj: true, val: () => cfg.music ? 'Sí' : 'No', act: () => { cfg.music = !cfg.music; Sound.setMusic(cfg.music); Sound.play('ok'); } },
      { label: 'Pausar el tiempo', adj: true, val: () => cfg.paused ? 'Sí' : 'No', act: () => { Game.tickTo(Date.now()); cfg.paused = !cfg.paused; if (!cfg.paused) P().lastSeen = Date.now(); Sound.play('ok'); } },
      { label: 'Avisos del navegador', adj: true, val: () => cfg.notify ? 'Sí' : 'No', act: () => { cfg.notify = !cfg.notify; try { if (cfg.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* noop */ } Sound.play('ok'); } },
      { label: 'Nombre', val: () => P().name, act: () => { try { const n = window.prompt('Nombre de tu mascota:', P().name); if (n) Game.rename(n); } catch (e) { /* noop */ } } },
      { label: 'Ayuda', val: () => '', act: () => { closeAll(); ui.mode = 'help'; } },
      { label: 'Exportar partida', val: () => '', act: exportSave },
      { label: 'Importar partida', val: () => '', act: importSave },
      { label: 'Nueva mascota', val: () => '', act: () => { try { if (window.confirm('¿Empezar con un huevo nuevo? Se perderá la mascota actual (conservas monedas y objetos).')) { Game.restart(); closeAll(); ui.pet.x = ui.pet.tx = 160; say('¡Un huevo nuevo!'); } } catch (e) { /* noop */ } } },
      { label: 'Cerrar', val: () => '', act: backList },
    ];
    openList({ type: 'rows', title: 'Ajustes', items: rows });
  }
  function exportSave() {
    const data = Game.exportData();
    try { if (navigator.clipboard) navigator.clipboard.writeText(data); } catch (e) { /* noop */ }
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'cuquigotxi-partida.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { /* noop */ }
    say('Partida exportada (copiada y descargada)', 3);
  }
  function importSave() {
    try {
      const s = window.prompt('Pega aquí tu partida exportada:'); if (!s) return;
      Game.importData(s); closeAll(); ui.pet.x = ui.pet.tx = 160; Sound.setEnabled(Game.cfg.sound); applyTheme(); say('Partida importada', 3); Sound.play('happy');
    } catch (e) { say('No se pudo importar', 3); Sound.play('no'); }
  }
  function applyTheme() { document.body.dataset.theme = Game.cfg.theme; }

  function activate(id) {
    const p = P();
    if (!p.alive && !ANYTIME.includes(id)) { Game.restart(); ui.pet.x = ui.pet.tx = 160; ui.anim = null; say('¡Un huevo nuevo! Toca A para calentarlo', 3.5); Sound.play('hatch'); Game.save(); return; }
    if (p.stage === 'egg' && !ANYTIME.includes(id)) { Game.warmEgg(); ui.wobble = 1; Sound.play('ok'); spawn('star', 160, GROUND - 80, 2); return; }
    switch (id) {
      case 'stats': ui.mode = 'stats'; ui.statPage = 0; Sound.play('ok'); return;
      case 'settings': openSettings(); Sound.play('ok'); return;
      case 'shop': openShop(); Sound.play('ok'); return;
      case 'bag': openBag(); Sound.play('ok'); return;
      case 'album': ui.mode = 'album'; ui.album = 0; Sound.play('ok'); return;
      case 'ach': openAchievements(); Sound.play('ok'); return;
      case 'quest': openMissions(); Sound.play('ok'); return;
      case 'photo': takePhoto(); return;
      case 'light': applyResult(Game.toggleLight()); return;
      case 'med': if (p.work) { say('Está trabajando…'); return; } applyResult(Game.medicine()); return;
      case 'clean': openClean(); Sound.play('ok'); return;
      case 'work': if (p.sleeping) { needAwake(); return; } openWork(); Sound.play('ok'); return;
    }
    if (!needAwake()) return;
    Sound.play('ok');
    switch (id) {
      case 'feed': openFeed(); break;
      case 'play': openPlay(); break;
      case 'care': openCare(); break;
      case 'train': openTrain(); break;
      case 'town': openTown(); break;
    }
  }

  function takePhoto() {
    ui.hideUI = true; drawFrame(); ui.hideUI = false;
    try {
      cv.toBlob(b => {
        if (!b) return;
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `cuquigotxi-${Date.now()}.png`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    } catch (e) { /* noop */ }
    ui.photoFlash = 1; Game.countPhoto(); Sound.play('photo'); say('¡Foto guardada!');
  }

  /* ---------- minijuegos ---------- */
  function endGame(win, big, quit, coins, stat, label) {
    ui.game = null; ui.mode = 'main'; ui.pet.moving = false; ui.pet.dir = 0;
    if (quit) { say('Juego cancelado'); Sound.play('back'); return; }
    coins = win ? (coins || 0) : Math.min(1, coins || 0);
    Game.playResult(win, big, coins, stat);
    if (win) { say(`${big ? '¡Increíble!' : '¡Ganaste!'} +${coins} monedas`, 3); Sound.play('win'); spawn('heart', ui.pet.x, GROUND - 80, 5); spawn('coin', ui.pet.x, GROUND - 80, 4); startAnim({ dur: 1.6, mood: 'happy' }); }
    else { say(`Perdiste… ${coins ? '+' + coins + ' moneda' : '¡otra vez!'}`); Sound.play('sad'); startAnim({ dur: 1.2, mood: 'neutral' }); }
  }
  const rnd13 = () => 1 + Math.floor(Math.random() * 13);

  // 1) izquierda o derecha
  function startGuess() { ui.game = { type: 'guess', round: 0, wins: 0, phase: 'ask', timer: 0, answer: 0, pick: 0, hit: false }; ui.mode = 'guess'; ui.pet.x = 160; ui.pet.dir = 0; ui.pet.moving = false; }
  function guessPress(k) {
    const g = ui.game;
    if (k === 'back') return endGame(false, false, true);
    if (g.phase !== 'ask' || (k !== 'left' && k !== 'right')) return;
    g.pick = k === 'left' ? -1 : 1; g.answer = Math.random() < .5 ? -1 : 1; g.hit = g.pick === g.answer;
    g.phase = 'reveal'; g.timer = 1.2; ui.pet.dir = g.answer;
    if (g.hit) { g.wins++; Sound.play('catch'); spawn('heart', ui.pet.x, GROUND - 80, 2); } else Sound.play('hit');
  }
  function guessUpdate(dt) {
    const g = ui.game; if (g.phase !== 'reveal') return;
    g.timer -= dt; ui.pet.moving = g.hit && g.timer > .4;
    if (g.timer <= 0) { g.round++; g.phase = 'ask'; ui.pet.dir = 0; ui.pet.moving = false; if (g.round >= 5) endGame(g.wins >= 3, g.wins === 5, false, g.wins * 2, 'mind'); }
  }

  // 2) atrapa estrellas
  function startCatch() { ui.game = { type: 'catch', t: 25, score: 0, px: 160, items: [], spawn: .5 }; ui.mode = 'catch'; ui.pet.x = 160; ui.pet.dir = 0; }
  function catchUpdate(dt) {
    const g = ui.game, h = ui.held, dx = (h.right ? 1 : 0) - (h.left ? 1 : 0);
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
    if (g.t <= 0) endGame(g.score >= 10, g.score >= 18, false, Math.floor(g.score / 2), 'str');
  }
  function drawCatchWorld() {
    for (const it of ui.game.items) {
      if (it.bad) {
        ell(c, it.x, it.y, 15, 12, '#5b5f78'); ell(c, it.x - 8, it.y + 5, 9, 7, '#5b5f78'); ell(c, it.x + 9, it.y + 5, 9, 7, '#5b5f78');
        ell(c, it.x - 4, it.y - 2, 2, 2.6, '#fff'); ell(c, it.x + 4, it.y - 2, 2, 2.6, '#fff');
        c.strokeStyle = '#ffd23a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(it.x, it.y + 12); c.lineTo(it.x - 4, it.y + 19); c.lineTo(it.x + 2, it.y + 19); c.lineTo(it.x - 2, it.y + 26); c.stroke();
      } else drawStar(c, it.x, it.y, 13, '#ffd23a', it.r + ui.t * 2);
    }
  }

  // 3) mayor o menor
  function startHilo() { ui.game = { type: 'hilo', round: 0, wins: 0, card: rnd13(), next: 0, phase: 'ask', timer: 0, hit: false }; ui.mode = 'hilo'; }
  function hiloPress(k) {
    const g = ui.game;
    if (k === 'back') return endGame(false, false, true);
    if (g.phase !== 'ask' || (k !== 'up' && k !== 'down')) return;
    do { g.next = rnd13(); } while (g.next === g.card);
    g.hit = (k === 'up') === (g.next > g.card); g.phase = 'reveal'; g.timer = 1.3; Sound.play('flip');
    if (g.hit) { g.wins++; spawn('heart', 210, 150, 2); } 
  }
  function hiloUpdate(dt) {
    const g = ui.game; if (g.phase !== 'reveal') return;
    g.timer -= dt; if (g.timer > 1.0 && g.timer < 1.05) Sound.play(g.hit ? 'catch' : 'hit');
    if (g.timer <= 0) { g.round++; g.card = g.next; g.phase = 'ask'; if (g.round >= 5) endGame(g.wins >= 3, g.wins === 5, false, g.wins * 2, 'mind'); }
  }

  // 4) piedra, papel, tijera
  const BEATS = { piedra: 'tijera', tijera: 'papel', papel: 'piedra' };
  function startRps() { ui.game = { type: 'rps', pw: 0, cw: 0, phase: 'ask', timer: 0, pick: null, cpu: null, res: '' }; ui.mode = 'rps'; }
  function rpsPress(k) {
    const g = ui.game;
    if (k === 'back') return endGame(false, false, true);
    const pick = { left: 'piedra', up: 'papel', right: 'tijera' }[k];
    if (g.phase !== 'ask' || !pick) return;
    g.pick = pick; g.cpu = ['piedra', 'papel', 'tijera'][Math.floor(Math.random() * 3)];
    g.res = g.pick === g.cpu ? 'Empate' : BEATS[g.pick] === g.cpu ? '¡Punto para ti!' : 'Punto para él…';
    if (BEATS[g.pick] === g.cpu) g.pw++; else if (g.pick !== g.cpu) g.cw++;
    g.phase = 'reveal'; g.timer = 1.4; Sound.play('flip');
  }
  function rpsUpdate(dt) {
    const g = ui.game; if (g.phase !== 'reveal') return;
    g.timer -= dt; if (g.timer <= 0) { if (g.pw >= 2 || g.cw >= 2) endGame(g.pw >= 2, g.pw >= 2 && g.cw === 0, false, g.pw >= 2 ? (g.cw === 0 ? 8 : 5) : 0, 'mind'); else g.phase = 'ask'; }
  }

  // 5) memoria
  function drawSymbol(i, x, y) {
    c.save(); c.translate(x, y);
    [() => drawStar(c, 0, 0, 12, '#ffc93c'), () => drawHeart(c, 0, 0, 10, '#ff5c8a'), () => drawCoin(c, 0, 0, 11), () => drawFoodItem(c, 'manzana', 0, 0, .95), () => drawToy(c, 'pelota', 0, 0, .8, 0),
      () => { ell(c, 0, 0, 11, 11, '#ffe97a'); c.strokeStyle = '#ffb347'; c.lineWidth = 2.4; for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(Math.cos(a * .785) * 14, Math.sin(a * .785) * 14); c.lineTo(Math.cos(a * .785) * 18, Math.sin(a * .785) * 18); c.stroke(); } }][i]();
    c.restore();
  }
  function startMemory() {
    const ids = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ui.game = { type: 'memory', cards: ids, open: [], matched: {}, cur: 0, tries: 0, max: 10, lock: 0, done: 0 };
    ui.mode = 'memory';
  }
  function memoryPress(k) {
    const g = ui.game;
    if (k === 'back') return endGame(false, false, true);
    if (g.lock > 0) return;
    if (k === 'left') g.cur = (g.cur % 4 === 0) ? g.cur + 3 : g.cur - 1;
    else if (k === 'right') g.cur = (g.cur % 4 === 3) ? g.cur - 3 : g.cur + 1;
    else if (k === 'up') g.cur = (g.cur + 8) % 12;
    else if (k === 'down') g.cur = (g.cur + 4) % 12;
    else if (k === 'ok' && !g.matched[g.cur] && !g.open.includes(g.cur)) {
      g.open.push(g.cur); Sound.play('flip');
      if (g.open.length === 2) { g.tries++; g.lock = .9; }
    }
    if (k !== 'ok') Sound.play('nav');
  }
  function memoryUpdate(dt) {
    const g = ui.game; if (g.lock <= 0) return;
    g.lock -= dt;
    if (g.lock <= 0) {
      const [a, b] = g.open;
      if (g.cards[a] === g.cards[b]) { g.matched[a] = g.matched[b] = true; g.done++; Sound.play('catch'); spawn('star', 160, 190, 3); } else Sound.play('hit');
      g.open = [];
      if (g.done === 6) endGame(true, g.tries <= 7, false, 4 + (g.max - g.tries), 'mind');
      else if (g.tries >= g.max) endGame(false, false, false, 1, 'mind');
    }
  }

  // 6) combate con amigos
  const MOVES = [['Golpe', 'ICON_TRAIN'], ['Ingenio', 'ICON_ALBUM'], ['Truco', 'NOTE']];
  const beatsMove = (a, b) => (a === 0 && b === 2) || (a === 2 && b === 1) || (a === 1 && b === 0);
  function startBattleMode(r) {
    ui.game = { type: 'battle', friend: r.friend, opp: r.opp, me: r.me, php: 30, ohp: 30, phase: 'ask', timer: 0, pm: 0, om: 0, res: '', pHit: false, oHit: false };
    ui.mode = 'battle'; ui.pet.x = 100; ui.pet.dir = 1; ui.pet.moving = false; Sound.play('ok');
  }
  function battlePress(k) {
    const g = ui.game;
    if (k === 'back') return endGame(false, false, true);
    const m = { left: 0, up: 1, right: 2 }[k];
    if (g.phase !== 'ask' || m === undefined) return;
    g.pm = m; g.om = Math.floor(Math.random() * 3); g.pHit = g.oHit = false;
    const dmg = (st, mv) => Math.round(5 + st[mv] / 6 + Math.random() * 3);
    if (g.pm === g.om) { const a = Math.round(dmg(g.me, g.pm) / 2), b = Math.round(dmg(g.opp, g.om) / 2); g.ohp = Math.max(0, g.ohp - a); g.php = Math.max(0, g.php - b); g.res = '¡Empate de jugadas!'; g.pHit = g.oHit = true; }
    else if (beatsMove(g.pm, g.om)) { const d = dmg(g.me, g.pm); g.ohp = Math.max(0, g.ohp - d); g.res = `¡Aciertas! -${d}`; g.oHit = true; }
    else { const d = dmg(g.opp, g.om); g.php = Math.max(0, g.php - d); g.res = `¡Te dan! -${d}`; g.pHit = true; }
    g.phase = 'reveal'; g.timer = 1.5; Sound.play(g.oHit && !g.pHit ? 'catch' : 'hit'); ui.wobble = g.pHit ? 1 : 0;
    spawn('star', g.oHit ? 235 : 100, GROUND - 70, 3);
  }
  function battleUpdate(dt) {
    const g = ui.game; ui.pet.moving = g.phase === 'reveal' && g.oHit && !g.pHit && g.timer > .5;
    if (g.phase !== 'reveal') return;
    g.timer -= dt; if (g.timer > 0) return;
    g.phase = 'ask';
    if (g.ohp <= 0 || g.php <= 0) {
      const win = g.ohp <= 0 && (g.php > 0 || g.ohp < g.php), id = g.friend.id, coins = Game.battleResult(win, id);
      ui.game = null; ui.mode = 'main'; ui.pet.dir = 0; ui.pet.moving = false;
      if (win) { say(`¡Victoria! +${coins} monedas`, 3); Sound.play('win'); spawn('heart', ui.pet.x, GROUND - 80, 5); spawn('coin', ui.pet.x, GROUND - 80, 4); startAnim({ dur: 1.6, mood: 'happy', hop: true }); }
      else { say(`Derrota… +${coins} monedas por intentarlo`, 3); Sound.play('sad'); startAnim({ dur: 1.4, mood: 'sad' }); }
    }
  }
  function drawBattleUI() {
    const g = ui.game;
    text(P().name, 12, 76, 11, '#fff', 'left'); bar(12, 90, 128, g.php, 30, '#4fcf7a');
    text(g.friend.name, 308, 76, 11, '#fff', 'right'); bar(180, 90, 128, g.ohp, 30, '#ff6f6f');
    text('VS', 160, 90, 13, '#fff', 'center', 900);
    if (g.phase === 'ask') {
      text('Elige tu jugada', 160, 120, 14, '#fff', 'center', 900);
      [['Golpe ◀', 16, () => ICONS.train(c)], ['Ingenio ▲', 114, () => ICONS.album(c)], ['Truco ▶', 212, () => text('♪', 0, 0, 22, '#ff7fb0', 'center', 900)]].forEach(([l, x, ic]) => {
        rrect(c, x, 300, 92, 50, 12); c.fillStyle = 'rgba(255,255,255,.92)'; c.fill(); c.save(); c.translate(x + 46, 315); ic(); c.restore(); text(l, x + 46, 338, 11, '#2b2440');
      });
      text('Golpe vence a Truco · Truco a Ingenio · Ingenio a Golpe', 160, 142, 9, '#fff', 'center', 700);
    } else {
      text(g.res, 160, 120, 16, g.pHit && !g.oHit ? '#ffd0d6' : '#fff7a8', 'center', 900);
      text(`Tú: ${MOVES[g.pm][0]}  ·  Él: ${MOVES[g.om][0]}`, 160, 142, 12, '#fff', 'center', 800);
    }
  }
  function drawThought() {
    const p = P(), sp = SP();
    if (!p.call || !p.alive || p.stage === 'egg' || p.work || ui.mode !== 'main' || ui.anim) return;
    const x = Math.max(50, Math.min(270, ui.pet.x + 44)), y = GROUND - sp.ry * 2 - 34 + Math.sin(ui.t * 3) * 3;
    c.save(); c.globalAlpha = .95;
    ell(c, x - 22, y + 22, 3.5, 3.5, '#fff'); ell(c, x - 14, y + 14, 5, 5, '#fff'); ell(c, x, y, 21, 19, '#fff'); c.strokeStyle = 'rgba(40,20,70,.25)'; c.lineWidth = 1.5; c.stroke();
    c.globalAlpha = 1; c.translate(x, y);
    switch (p.call) {
      case 'hungry': drawFoodItem(c, 'manzana', 0, 1, .85); break;
      case 'sad': drawHeart(c, 0, 0, 9, '#9aa0c0'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -6); c.lineTo(-2, 0); c.lineTo(2, 3); c.stroke(); break;
      case 'sick': ICONS.med(c); break;
      case 'sleep': c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fillStyle = '#7b6fd6'; c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(5, -3, 9, 0, 7); c.fill(); break;
      case 'dirty': ICONS.clean(c); break;
      default: text('!', 0, 1, 22, '#ff4d6d', 'center', 900);
    }
    c.restore();
  }

  /* ---------- entrada ---------- */
  function press(k) {
    Sound.unlock();
    if (Game.cfg.music && !musicStarted) { musicStarted = true; Sound.setMusic(true); }
    if (k === 'start' && ui.mode === 'main') { activate('settings'); return; }
    if (k === 'select' && ui.mode === 'main') { activate('stats'); return; }
    switch (ui.mode) {
      case 'main':
        if (k === 'left') { ui.cursor = (ui.cursor + MENU.length - 1) % MENU.length; Sound.play('nav'); }
        else if (k === 'right') { ui.cursor = (ui.cursor + 1) % MENU.length; Sound.play('nav'); }
        else if (k === 'up') { ui.cursor = (ui.cursor + MENU.length - 8) % MENU.length; Sound.play('nav'); }
        else if (k === 'down') { ui.cursor = (ui.cursor + 8) % MENU.length; Sound.play('nav'); }
        else if (k === 'ok') activate(MENU[ui.cursor].id);
        break;
      case 'list': {
        const l = ui.list, n = l.items.length;
        if (k === 'up' || k === 'left' && !l.items[l.idx].adj) { l.idx = (l.idx + n - 1) % n; Sound.play('nav'); }
        else if (k === 'down' || k === 'right' && !l.items[l.idx].adj) { l.idx = (l.idx + 1) % n; Sound.play('nav'); }
        else if ((k === 'left' || k === 'right') && l.items[l.idx].adj) l.items[l.idx].act(k === 'left' ? -1 : 1);
        else if (k === 'ok') { const it = l.items[l.idx]; if (it.act) it.act(1); }
        else if (k === 'back' || k === 'start') { backList(); Sound.play('back'); }
        break;
      }
      case 'stats':
        if (k === 'left' || k === 'right') { ui.statPage = (ui.statPage + 1) % 2; Sound.play('nav'); }
        else if (k === 'back' || k === 'ok' || k === 'select' || k === 'start') { ui.mode = 'main'; Sound.play('back'); }
        break;
      case 'album': {
        const n = ALBUM_ORDER.length;
        if (k === 'left') { ui.album = (ui.album + n - 1) % n; Sound.play('nav'); }
        else if (k === 'right') { ui.album = (ui.album + 1) % n; Sound.play('nav'); }
        else if (k === 'up') { ui.album = (ui.album + n - 5) % n; Sound.play('nav'); }
        else if (k === 'down') { ui.album = (ui.album + 5) % n; Sound.play('nav'); }
        else if (k === 'back' || k === 'ok' || k === 'start' || k === 'select') { ui.mode = 'main'; Sound.play('back'); }
        break;
      }
      case 'help': if (k === 'back' || k === 'ok' || k === 'start' || k === 'select') { ui.mode = 'main'; Sound.play('back'); } break;
      case 'guess': guessPress(k); break;
      case 'catch': if (k === 'back') endGame(false, false, true); break;
      case 'hilo': hiloPress(k); break;
      case 'rps': rpsPress(k); break;
      case 'memory': memoryPress(k); break;
      case 'battle': battlePress(k); break;
    }
  }

  let musicStarted = false;
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

  document.querySelectorAll('[data-key]').forEach(btn => {
    const k = btn.dataset.key; let t1 = null, t2 = null;
    const stop = () => { ui.held[k] = false; btn.classList.remove('on'); clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
      ui.held[k] = true; btn.classList.add('on'); press(k); vibrate(8);
      if (['left', 'right', 'up', 'down'].includes(k)) t1 = setTimeout(() => { t2 = setInterval(() => { if (!['catch', 'guess', 'hilo', 'rps', 'battle'].includes(ui.mode)) press(k); }, 130); }, 380);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
  let lastTap = 0;
  cv.addEventListener('pointerdown', e => {
    Sound.unlock();
    if (Game.cfg.music && !musicStarted) { musicStarted = true; Sound.setMusic(true); }
    if (ui.mode !== 'main') return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H, p = P();
    if (y < 46) {
      const n = MENU.length, off = Math.max(0, Math.min(n - 8, ui.cursor - 3)), j = Math.floor((x - 8) / 38.5);
      if (j >= 0 && j < 8) { const i = off + j; if (i === ui.cursor) activate(MENU[i].id); else { ui.cursor = i; Sound.play('nav'); } }
      return;
    }
    if (!p.alive || p.work || Date.now() - lastTap < 900) return;
    if (p.stage === 'egg') { if (Math.abs(x - 160) < 50 && y > GROUND - 100) { lastTap = Date.now(); Game.warmEgg(); ui.wobble = 1; Sound.play('ok'); } return; }
    const sp = SP();
    if (Math.abs(x - ui.pet.x) < sp.rx * 1.15 && y > GROUND - sp.ry * 2.3 && y < GROUND + 8) { lastTap = Date.now(); applyResult(Game.cuddle()); }
  });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  /* ---------- eventos del juego ---------- */
  function processEvents() {
    while (Game.events.length) {
      const ev = Game.events.shift(), p = P();
      switch (ev.type) {
        case 'call': sayQ(CALL_TEXT[ev.call] || '¡Atención!', 3); Sound.play('call'); vibrate([60, 60, 60]);
          try { if (Game.cfg.notify && document.hidden && 'Notification' in window && Notification.permission === 'granted' && ev.call !== 'fake') new Notification('Cuquigotxi', { body: `${p.name}: ${CALL_TEXT[ev.call]}`, icon: 'icon.svg' }); } catch (e) { /* noop */ }
          break;
        case 'poop': Sound.play('poop'); break;
        case 'sick': sayQ('¡Se ha puesto enfermo!', 3); Sound.play('sad'); break;
        case 'hurt': Sound.play('sad'); ui.wobble = 1; break;
        case 'hatch': ui.flash = 1; Sound.play('hatch'); sayQ('¡Ha nacido! Dale un nombre en Ajustes', 4); spawn('star', 160, GROUND - 60, 10); break;
        case 'evolve': ui.flash = 1; Sound.play('evolve'); sayQ(`¡Ha evolucionado a ${SPECIES[ev.species].name}!`, 4); spawn('star', ui.pet.x, GROUND - 70, 10); spawn('heart', ui.pet.x, GROUND - 70, 4); vibrate([80, 40, 120]); break;
        case 'die': Sound.play('die'); ui.anim = null; if (ui.game) { ui.game = null; } ui.mode = 'main'; ui.list = null; ui.stack = []; say(`${p.name} nos ha dejado… (${ev.cause})`, 6); break;
        case 'birthday': sayQ(`¡Cumpleaños! Día ${ev.day} · +5 monedas`, 3.5); spawn('confetti', ui.pet.x, GROUND - 130, 30); Sound.play('win'); break;
        case 'workdone': sayQ(`¡Vuelve de ${ev.name}! +${ev.pay} monedas`, 3.5); Sound.play('coin'); spawn('coin', ui.pet.x, GROUND - 80, 5); break;
        case 'daily': sayQ(`Regalo diario: +${ev.coins} monedas y ${ev.item}${ev.streak > 1 ? ` · racha ${ev.streak}` : ''}`, 4); Sound.play('buy'); break;
        case 'legacy': sayQ('Hereda habilidades de su antecesor · +30 monedas', 4); Sound.play('happy'); break;
        case 'ach': sayQ(`Logro: ${ev.ach.name} (+${ev.ach.coins}c)`, 3.5); Sound.play('ach'); spawn('star', 160, 100, 8); break;
      }
    }
  }

  /* ---------- paneles ---------- */
  function panel(x, y, w, h) { rrect(c, x, y, w, h, 18); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); c.strokeStyle = '#ff9db8'; c.lineWidth = 3; c.stroke(); }
  function hearts(x, y, val, fill) { for (let i = 0; i < 4; i++) drawHeart(c, x + i * 20, y, 6.5, i < val ? fill : 'rgba(150,150,170,.3)'); }
  function bar(x, y, w, val, max, col) { rrect(c, x, y - 5, w, 10, 5); c.fillStyle = '#e4defa'; c.fill(); if (val > 0) { rrect(c, x, y - 5, Math.max(8, w * Math.min(1, val / max)), 10, 5); c.fillStyle = col; c.fill(); } }

  function drawList() {
    const l = ui.list, n = l.items.length, vis = Math.min(n, 7);
    if (l.idx < l.top) l.top = l.idx; if (l.idx >= l.top + vis) l.top = l.idx - vis + 1;
    const h = 56 + vis * 30 + (l.footer ? 16 : 0), y0 = Math.max(60, Math.round((H - h) / 2) - 6);
    panel(18, y0, 284, h);
    text(l.title, 160, y0 + 22, 16, TITLE(), 'center', 900);
    for (let r = 0; r < vis; r++) {
      const it = l.items[l.top + r], y = y0 + 40 + r * 30, sel = l.top + r === l.idx;
      rrect(c, 30, y, 260, 26, 10); c.fillStyle = sel ? '#ffe3ef' : '#f1eefc'; c.fill();
      if (sel) { c.strokeStyle = '#ff6f9f'; c.lineWidth = 2.4; c.stroke(); }
      let tx = 42;
      if (it.draw) { c.save(); c.translate(52, y + 13); it.draw(); c.restore(); tx = 74; }
      text(it.label, tx, y + 13.5, 12.5, it.dim ? '#9a93b8' : '#2b2440', 'left');
      const v = it.val ? it.val() : ''; if (v) text(v, 278, y + 13.5, 12, '#6a7cff', 'right');
    }
    c.fillStyle = '#ff9db8';
    if (l.top > 0) { c.beginPath(); c.moveTo(160, y0 + 33); c.lineTo(154, y0 + 38); c.lineTo(166, y0 + 38); c.fill(); }
    if (l.top + vis < n) { const yy = y0 + 40 + vis * 30 + 2; c.beginPath(); c.moveTo(160, yy + 5); c.lineTo(154, yy); c.lineTo(166, yy); c.fill(); }
    if (l.footer) text(l.footer, 160, y0 + h - 14, 10, '#8a82aa', 'center', 700);
    if (l.coins) { const cs = String(PR().coins); drawCoin(c, 256, y0 + 22, 7); text(cs, 268, y0 + 22.5, 12, '#6a7cff', 'left'); }
  }
  function drawStats() {
    const p = P(), sp = SPECIES[p.species], prof = PR();
    panel(16, 66, 288, 276);
    text(p.stage === 'egg' ? 'Huevo' : p.name, 160, 88, 17, TITLE(), 'center', 900);
    text(`${sp ? sp.name : 'Huevo'} · ${STAGE_NAMES[p.stage]}  (${ui.statPage + 1}/2)`, 160, 106, 11, '#8a82aa', 'center', 700);
    const row = (i, label, fn) => { const y = 128 + i * 22; text(label, 32, y, 12.5, '#2b2440', 'left'); fn(y); };
    if (ui.statPage === 0) {
      row(0, 'Edad', y => text(`${Math.floor(p.age / Game.DAY) + 1} días`, 288, y, 12.5, '#6a7cff', 'right'));
      row(1, 'Peso', y => text(`${p.weight} g`, 288, y, 12.5, '#6a7cff', 'right'));
      row(2, 'Hambre', y => hearts(212, y, p.hunger, '#ff8a3c'));
      row(3, 'Felicidad', y => hearts(212, y, p.happy, '#ff5c8a'));
      row(4, 'Salud', y => hearts(212, y, p.health, '#4fcf7a'));
      row(5, 'Higiene', y => hearts(212, y, p.hygiene, '#4fb6f0'));
      row(6, 'Energía', y => hearts(212, y, p.energy, '#ffc93c'));
      row(7, 'Disciplina', y => bar(160, y, 128, p.disc, 100, '#6a7cff'));
      row(8, 'Errores de cuidado', y => text(String(p.mistakes), 288, y, 12.5, p.mistakes > 3 ? '#ee5a52' : '#6a7cff', 'right'));
    } else {
      row(0, 'Fuerza', y => bar(160, y, 128, p.str, 60, '#ff7a3c'));
      row(1, 'Mente', y => bar(160, y, 128, p.mind, 60, '#3fa7d6'));
      row(2, 'Encanto', y => bar(160, y, 128, p.charm, 60, '#ee6fb7'));
      row(3, 'Afecto', y => bar(160, y, 128, p.bond, 60, '#ff5c8a'));
      row(4, 'Personalidad', y => text(p.trait, 288, y, 12.5, '#6a7cff', 'right'));
      row(5, 'Comida favorita', y => { text(FOODS[p.fav].name, 288, y, 12.5, '#6a7cff', 'right'); });
      row(6, 'Monedas', y => { drawCoin(c, 190, y, 7); text(String(prof.coins), 288, y, 12.5, '#6a7cff', 'right'); });
      row(7, 'Minijuegos ganados', y => text(String(prof.c.wins), 288, y, 12.5, '#6a7cff', 'right'));
      row(8, 'Generación', y => text(String(prof.gen), 288, y, 12.5, '#6a7cff', 'right'));
      text(TRAITS[p.trait].desc, 160, 321, 10, '#8a82aa', 'center', 700);
    }
    const h = Game.history;
    text(ui.statPage === 0 ? (h.length ? `Recuerdos: ${h.slice(0, 2).map(x => `${x.name} (${x.days}d)`).join(', ')}` : '◀ ▶ cambiar página · B volver') : '◀ ▶ cambiar página · B volver', 160, 334, 10, '#8a82aa', 'center', 700);
  }
  function drawAlbum() {
    const prof = PR();
    panel(12, 62, 296, 282);
    text(`Álbum ${Object.keys(prof.album).length}/${ALBUM_ORDER.length}`, 160, 84, 16, TITLE(), 'center', 900);
    ALBUM_ORDER.forEach((id, i) => {
      const col = i % 5, row = Math.floor(i / 5), x = 22 + col * 56, y = 98 + row * 66, sel = i === ui.album, got = prof.album[id];
      rrect(c, x, y, 52, 60, 10); c.fillStyle = sel ? '#ffe3ef' : '#f1eefc'; c.fill(); if (sel) { c.strokeStyle = '#ff6f9f'; c.lineWidth = 2.4; c.stroke(); }
      if (got) drawPet(c, SPECIES[id], { x: x + 26, y: y + 52, t: ui.t, mood: 'happy', scale: .36, outline: retro(), hop: sel });
      else text('?', x + 26, y + 32, 24, '#c9c2e6', 'center', 900);
    });
    const id = ALBUM_ORDER[ui.album], got = prof.album[id];
    text(got ? SPECIES[id].name : '???', 160, 304, 14, '#2b2440', 'center', 900);
    text(HINTS[id], 160, 322, 10.5, '#8a82aa', 'center', 700);
  }
  function drawHelp() {
    panel(14, 64, 292, 276);
    text('Ayuda', 160, 86, 16, TITLE(), 'center', 900);
    const lines = ['◀ ▶ mover el menú · A elegir · B volver', 'START ajustes · SELECT estado · también puedes tocar', '', 'Dale de comer, límpialo y juega con él.', 'Apaga la luz de noche para que duerma.', 'Si te llama sin motivo, regáñalo.', 'Toca a tu mascota para acariciarla.', '', 'Cumple misiones, juega, entrena y trabaja.', 'Cómprale ropa, juguetes y fondos nuevos.', 'Combate con tus amigos o añade uno con código.', 'Lo que haga de pequeño decide su evolución.', 'Descubre las 13 criaturas en el Álbum.'];
    lines.forEach((s, i) => text(s, 160, 108 + i * 17, 10.5, '#2b2440', 'center', 700));
    text('A / B: cerrar', 160, 328, 10.5, '#8a82aa', 'center', 700);
  }

  /* ---------- UI de minijuegos (capa de interfaz) ---------- */
  function drawGameUI() {
    const g = ui.game; if (!g) return;
    if (g.type === 'guess') {
      for (let i = 0; i < 5; i++) ell(c, 120 + i * 20, 84, 6, 6, i < g.round ? '#4fcf7a' : 'rgba(255,255,255,.7)');
      if (g.phase === 'ask') { text('¿Hacia dónde mirará?', 160, 118, 15, '#fff', 'center', 900); text('◀', 70, 190, 34, '#fff', 'center', 900); text('▶', 250, 190, 34, '#fff', 'center', 900); }
      else text(g.hit ? '¡Acertaste!' : '¡Fallaste!', 160, 118, 17, g.hit ? '#fff7a8' : '#ffd0d6', 'center', 900);
      text('◀ ▶ elegir · B salir', 160, 340, 12, '#fff', 'center', 800);
    } else if (g.type === 'catch') {
      rrect(c, 20, 56, 280, 10, 5); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
      rrect(c, 20, 56, Math.max(8, 280 * g.t / 25), 10, 5); c.fillStyle = '#ff6f9f'; c.fill();
      text(`★ ${g.score}`, 160, 82, 18, '#fff', 'center', 900);
      text('Mantén ◀ ▶ · B para salir', 160, 340, 12, '#fff', 'center', 800);
    } else if (g.type === 'hilo') {
      c.fillStyle = 'rgba(30,20,60,.35)'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) ell(c, 120 + i * 20, 84, 6, 6, i < g.round ? '#4fcf7a' : 'rgba(255,255,255,.7)');
      text(g.phase === 'ask' ? '¿La siguiente es mayor o menor?' : g.hit ? '¡Acertaste!' : '¡Fallaste!', 160, 112, 14, g.hit && g.phase !== 'ask' ? '#fff7a8' : '#fff', 'center', 900);
      drawCard(c, 105, 200, 78, 108, g.card, true);
      drawCard(c, 215, 200, 78, 108, g.next, g.phase === 'reveal');
      text('▲ Mayor      ▼ Menor', 160, 295, 14, '#fff', 'center', 900);
      text('B salir', 160, 340, 12, '#fff', 'center', 800);
    } else if (g.type === 'rps') {
      c.fillStyle = 'rgba(30,20,60,.35)'; c.fillRect(0, 0, W, H);
      text(`Tú ${g.pw} - ${g.cw} Él`, 160, 84, 16, '#fff', 'center', 900);
      if (g.phase === 'ask') {
        text('Elige tu jugada', 160, 112, 14, '#fff', 'center', 900);
        [['piedra', 60, 'Piedra ◀'], ['papel', 160, 'Papel ▲'], ['tijera', 260, 'Tijera ▶']].forEach(([k, x, l]) => { rrect(c, x - 44, 150, 88, 100, 14); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); drawHand(c, k, x, 200, 1.6); text(l, x, 238, 11, '#2b2440'); });
      } else {
        text(g.res, 160, 112, 16, '#fff7a8', 'center', 900);
        drawHand(c, g.pick, 105, 200, 2.2); drawHand(c, g.cpu, 215, 200, 2.2);
        text('Tú', 105, 258, 13, '#fff', 'center', 900); text('Él', 215, 258, 13, '#fff', 'center', 900);
      }
      text('B salir', 160, 340, 12, '#fff', 'center', 800);
    } else if (g.type === 'memory') {
      c.fillStyle = 'rgba(30,20,60,.4)'; c.fillRect(0, 0, W, H);
      text(`Intentos ${g.tries}/${g.max}`, 160, 84, 15, '#fff', 'center', 900);
      for (let i = 0; i < 12; i++) {
        const x = 36 + (i % 4) * 64 + 28, y = 98 + Math.floor(i / 4) * 74 + 33, up = g.matched[i] || g.open.includes(i);
        if (up) { rrect(c, x - 28, y - 33, 56, 66, 10); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = g.matched[i] ? '#4fcf7a' : '#ff9db8'; c.lineWidth = 3; c.stroke(); drawSymbol(g.cards[i], x, y); }
        else drawCard(c, x, y, 56, 66, 0, false);
        if (i === g.cur) { rrect(c, x - 31, y - 36, 62, 72, 12); c.strokeStyle = '#ffe45e'; c.lineWidth = 3.5; c.stroke(); }
      }
      text('◀▶▲▼ mover · A girar · B salir', 160, 340, 11, '#fff', 'center', 800);
    }
  }

  /* ---------- render del mundo ---------- */
  function drawWorkSign() {
    const w = P().work, prog = 1 - w.left / w.total;
    c.save(); c.translate(160, GROUND - 40); c.scale(4.4, 4.4); ICONS.work(c); c.restore();
    ell(c, 160, GROUND, 60, 8, 'rgba(0,0,0,.18)');
  }
  function renderWorld(ctx) {
    c = ctx; const p = P(), prof = PR();
    Scene.draw(c, { t: ui.t, bg: prof.bg, cfg: Game.cfg });
    drawPoops();
    if (p.work) drawWorkSign();
    else if (p.stage === 'egg') drawEgg(c, 160, GROUND, ui.t, p.eggTime / Game.EGG_TIME, ui.wobble * .15);
    else if (!p.alive) { drawTomb(c, 214, GROUND + 4); drawGhost(c, 120, GROUND, ui.t); }
    else {
      const sp = SP(), a = ui.anim;
      if (a && a.friend) { drawPet(c, SPECIES[a.friend.species], { x: 235, y: GROUND, t: ui.t, mood: 'happy', dir: -1, scale: .85, hop: true, outline: retro() }); }
      if (!(ui.mode === 'memory')) drawPet(c, sp, petOpts());
      if (p.hygiene <= 1 && !p.sleeping) drawStink(ui.pet.x, GROUND - sp.ry * 2 - 8);
      if (a && a.kind) {
        const k = Math.min(1, a.t / .8), my = GROUND - 6 - sp.ry * .74;
        if (a.t < .8) drawFoodItem(c, a.kind, lerp(ui.pet.x + 70, ui.pet.x, k), lerp(my - 60, my, k), lerp(1.2, .5, k));
        a.eating = a.t >= .8 && a.t < a.dur - .1;
      }
      if (a && a.toy) drawToy(c, a.toy, ui.pet.x + 52, GROUND - 40 - Math.abs(Math.sin(ui.t * 7)) * 22, 1.2, ui.t);
      if (a && a.trainStat) {
        const x = ui.pet.x + 55, y = GROUND - 62 - Math.sin(ui.t * 10) * 4;
        if (a.trainStat === 'str') { c.save(); c.translate(x, y); c.scale(1.5, 1.5); ICONS.train(c); c.restore(); }
        else if (a.trainStat === 'mind') { c.save(); c.translate(x, y); c.scale(1.5, 1.5); ICONS.album(c); c.restore(); }
        else text('♪', x, y, 28, '#ff7fb0', 'center', 900);
      }
      if (ui.mode === 'catch' && ui.game) drawCatchWorld();
      if (ui.mode === 'battle' && ui.game) { const g = ui.game; drawPet(c, SPECIES[g.friend.species], { x: 235, y: GROUND, t: ui.t, mood: g.phase === 'reveal' && g.oHit ? 'sad' : 'neutral', dir: -1, scale: .9, hop: g.phase === 'reveal' && g.pHit && !g.oHit && g.timer > .5, outline: retro() }); }
      drawThought();
    }
    drawParts();
    Scene.drawWeather(c, ui.t, ui.dt, Game.cfg, prof.bg);
    if (!p.lightsOn && p.alive) {
      c.fillStyle = 'rgba(10,12,48,.58)'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(160, 100); c.scale(1.4, 1.4); c.globalAlpha = .8; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.fillStyle = '#fff6d6'; c.fill();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(7, -4, 12, 0, 7); c.fill(); c.restore();
    }
    if (ui.flash > 0) { c.fillStyle = `rgba(255,255,255,${ui.flash})`; c.fillRect(0, 0, W, H); }
    if (ui.photoFlash > 0) { c.fillStyle = `rgba(255,255,255,${ui.photoFlash})`; c.fillRect(0, 0, W, H); }
  }

  /* ---------- render de la interfaz ---------- */
  function drawBar() {
    const p = P(), n = MENU.length, off = Math.max(0, Math.min(n - 8, ui.cursor - 3));
    const x0 = 8, cw = 36, gap = 2.5;
    for (let j = 0; j < 8; j++) {
      const i = off + j, x = x0 + j * (cw + gap), y = 7, sel = ui.cursor === i && ui.mode === 'main';
      c.save(); rrect(c, x, y, cw, cw, 11); c.fillStyle = sel ? '#ffffff' : 'rgba(255,255,255,.55)'; c.fill();
      if (sel) { c.strokeStyle = '#ff6f9f'; c.lineWidth = 3; c.stroke(); } else if (retro()) { c.strokeStyle = 'rgba(20,20,40,.7)'; c.lineWidth = 1.6; c.stroke(); }
      c.translate(x + cw / 2, y + cw / 2 + (sel ? Math.sin(ui.t * 6) * .8 : 0)); if (sel) c.scale(1.1, 1.1);
      ICONS[MENU[i].icon](c, p.lightsOn); c.restore();
    }
    c.fillStyle = 'rgba(255,255,255,.9)';
    if (off > 0) { c.beginPath(); c.moveTo(2, 25); c.lineTo(6, 20); c.lineTo(6, 30); c.fill(); }
    if (off < n - 8) { c.beginPath(); c.moveTo(W - 2, 25); c.lineTo(W - 6, 20); c.lineTo(W - 6, 30); c.fill(); }
    if (ui.mode === 'main') {
      const lab = MENU[ui.cursor].label;
      c.font = '800 12px "Nunito",sans-serif'; const w = c.measureText(lab).width + 20;
      rrect(c, W / 2 - w / 2, 50, w, 20, 10); c.fillStyle = 'rgba(43,36,64,.72)'; c.fill(); text(lab, W / 2, 60.5, 12, '#fff');
      const cs = String(PR().coins); c.font = '800 12px "Nunito",sans-serif'; const cwid = c.measureText(cs).width + 32;
      rrect(c, 8, 51, cwid, 18, 9); c.fillStyle = 'rgba(43,36,64,.72)'; c.fill(); drawCoin(c, 19, 60, 6.5); text(cs, 30, 60.5, 12, '#fff', 'left');
      if (Game.cfg.clock) { const d = new Date(), s = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; rrect(c, W - 58, 51, 50, 18, 9); c.fillStyle = 'rgba(43,36,64,.72)'; c.fill(); text(s, W - 33, 60.5, 12, '#fff'); }
    }
  }
  function renderUI(ctx) {
    c = ctx;
    if (ui.hideUI) return;
    const p = P();
    drawBar();
    if (p.call && p.alive && ui.mode === 'main') {
      const pulse = 1 + Math.sin(ui.t * 8) * .08;
      c.save(); c.translate(292, 92); c.scale(pulse, pulse); ell(c, 0, 0, 15, 15, '#ff4d6d'); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); text('!', 0, 1, 20, '#fff', 'center', 900); c.restore();
    }
    if (p.work && p.alive) {
      const w = p.work, secs = Math.ceil(w.left / Game.cfg.speed), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
      text(`${p.name} trabaja en ${JOBS[w.id].name}`, 160, 150, 13, '#fff', 'center', 900);
      text(`${mm}:${ss}`, 160, 172, 20, '#fff', 'center', 900);
      bar(60, 196, 200, w.total - w.left, w.total, '#ff7fb0');
    }
    drawGameUI();
    if (ui.mode === 'battle' && ui.game) drawBattleUI();
    if (Game.cfg.paused) { rrect(c, 130, 76, 60, 18, 9); c.fillStyle = 'rgba(255,92,138,.9)'; c.fill(); text('PAUSA', 160, 85.5, 11, '#fff', 'center', 900); }
    if (ui.mode === 'list') drawList();
    if (ui.mode === 'stats') drawStats();
    if (ui.mode === 'album') drawAlbum();
    if (ui.mode === 'help') drawHelp();
    const gameMode = ['guess', 'catch', 'hilo', 'rps', 'memory', 'battle', 'stats', 'album', 'help'].includes(ui.mode);
    if (!p.alive && ui.mode === 'main' && ui.toastT <= 0) { ui.toast = 'Pulsa A para un huevo nuevo'; ui.toastT = .1; }
    if (ui.toastT > 0 && ui.toast && !gameMode) {
      c.font = '800 13px "Nunito",sans-serif'; const w = Math.min(304, c.measureText(ui.toast).width + 28);
      c.globalAlpha = Math.min(1, ui.toastT * 3); rrect(c, 160 - w / 2, 306, w, 28, 14); c.fillStyle = 'rgba(43,36,64,.85)'; c.fill();
      text(ui.toast, 160, 320.5, 13, '#fff'); c.globalAlpha = 1;
    } else if (ui.mode === 'main') {
      const day = Math.floor(p.age / Game.DAY) + 1;
      text(p.stage === 'egg' ? 'Toca A para calentar el huevo' : `${p.name} · día ${day}`, 160, 346, 12, 'rgba(255,255,255,.95)', 'center', 800);
    }
  }
  function drawFrame() { renderer.render(Game.cfg.theme, renderWorld, renderUI); }

  /* ---------- bucle ---------- */
  function update(dt) {
    ui.t += dt; ui.dt = dt;
    const p = P();
    if (ui.toastT > 0) ui.toastT -= dt; else if (ui.queue.length) { const [m, s] = ui.queue.shift(); say(m, s); }
    if (ui.flash > 0) ui.flash = Math.max(0, ui.flash - dt * .9);
    if (ui.photoFlash > 0) ui.photoFlash = Math.max(0, ui.photoFlash - dt * 3);
    Scene.update(dt);
    updatePet(dt);
    if (ui.mode === 'guess') guessUpdate(dt);
    if (ui.mode === 'catch') catchUpdate(dt);
    if (ui.mode === 'hilo') hiloUpdate(dt);
    if (ui.mode === 'rps') rpsUpdate(dt);
    if (ui.mode === 'memory') memoryUpdate(dt);
    if (ui.mode === 'battle') battleUpdate(dt);
    ui.spawnT -= dt;
    if (ui.spawnT <= 0 && p.alive && p.stage !== 'egg') {
      ui.spawnT = 1.4;
      const my = GROUND - SP().ry * 2 - 8;
      if (p.sleeping && !p.work) spawn('zzz', ui.pet.x + 30, my + 20);
      else if (p.sick) spawn('drop', ui.pet.x + 30, my + 20);
      else if (moodOf(p) === 'happy' && ui.mode === 'main' && !p.work && Math.random() < .5) spawn('note', ui.pet.x + 30, my + 30);
    }
    updateParts(dt);
    if (p.call && p.alive && !document.hidden) { ui.callBeep -= dt; if (ui.callBeep <= 0) { ui.callBeep = 8; Sound.play('call'); } } else ui.callBeep = 3;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    try { Game.tickTo(Date.now()); processEvents(); update(dt); drawFrame(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }

  /* ---------- arranque ---------- */
  Game.load();
  Sound.setEnabled(Game.cfg.sound); Sound.setVolume(VOLUMES[Game.cfg.volume] ? VOLUMES[Game.cfg.volume][1] : 1);
  applyTheme();
  ui.pet.x = ui.pet.tx = 160;
  const pending = Game.events.filter(e => e.type === 'daily' || e.type === 'ach'); Game.events.length = 0; Game.events.push(...pending);
  if (P().stage === 'egg') say('¡Toca A para calentar el huevo!', 4);
  else if (!P().alive) say('Tu mascota nos dejó…', 4);
  else say(`¡Hola de nuevo, ${P().name}!`, 3);
  setInterval(() => Game.save(), 5000);
  setInterval(() => Game.checkDaily(), 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); });
  addEventListener('pagehide', () => Game.save());
  requestAnimationFrame(frame);
  window.__cuqui = { Game, ui, press, Scene };  // útil para depurar y probar
})();
