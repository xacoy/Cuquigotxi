'use strict';
/* Lógica del juego: mascota, perfil (monedas, objetos, logros), simulación y acciones. */
const Game = (() => {
  const DAY = 1200;            // un "día" de la mascota = 20 min reales (a velocidad 1x)
  const EGG_TIME = 60;
  const HUNGER_INT = 300, HAPPY_INT = 420;
  const KEY = 'cuquigotxi.v1';

  const cfg = { sound: true, volume: 1, vibrate: true, speed: 1, nights: true, theme: 'modern', clock: false, weather: true };
  let pet = null;
  let prof = null;
  let history = [];
  const events = [];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const emit = (type, extra) => events.push(Object.assign({ type }, extra));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function newProfile() {
    return {
      coins: 20, inv: {}, owned: { meadow: true, pelota: true },
      equip: { head: null, face: null, neck: null }, bg: 'meadow',
      album: {}, ach: {}, friends: {}, daily: '',
      c: { births: 0, meals: 0, snacks: 0, wins: 0, games: 0, buys: 0, equips: 0, trains: 0, jobs: 0, visits: 0, cures: 0, cleans: 0, photos: 0, pets: 0, maxDays: 0 },
    };
  }
  function newPet() {
    return {
      stage: 'egg', species: null, name: 'Cuqui', alive: true,
      born: Date.now(), age: 0, eggTime: 0,
      hunger: 3, happy: 3, health: 4, disc: 0, weight: 5, hygiene: 4, energy: 4,
      str: 0, mind: 0, charm: 0, bond: 0, trait: pick(Object.keys(TRAITS)), fav: pick(Object.keys(FOODS).filter(k => FOODS[k].kind !== 'drug')),
      poops: 0, poopT: 0, poopNext: 540, sick: false, doses: 0,
      sleeping: false, lightsOn: true, napT: 0, litT: 0, nightFlag: false,
      call: null, callT: 0, mistakes: 0, work: null, petCd: 0, toyCd: {}, lastDay: 0,
      hungerT: 0, happyT: 0, sickT: 0, starveT: 0, fakeT: 0, fakeNext: 1800, regenT: 0, dirtyT: 0, snackLoad: 0, hygT: 0, energyT: 0,
      childVariant: Math.random() < .5 ? 'bunbun' : 'kitto',
      meals: 0, snacks: 0, wins: 0, causeOfDeath: '', lastSeen: Date.now(),
    };
  }

  function hourAt(ts) { const d = new Date(ts); return d.getHours() + d.getMinutes() / 60; }
  function isNight(ts) { if (!cfg.nights) return false; const h = hourAt(ts); return h >= 22 || h < 7; }

  function quality(p) {
    if (p.mistakes === 0 && p.disc >= 75) return 'perfect';
    if (p.mistakes <= 2 && p.disc >= 50) return 'good';
    if (p.mistakes <= 6) return 'ok';
    return 'bad';
  }
  function stageForAge(age) {
    if (age < DAY * .5) return 'baby';
    if (age < DAY * 2.5) return 'child';
    if (age < DAY * 5) return 'teen';
    if (age < DAY * 11) return 'adult';
    return 'senior';
  }
  function pickSpecies(p, stage) {
    const q = quality(p);
    if (stage === 'baby') return 'puchi';
    if (stage === 'child') return p.childVariant;
    if (stage === 'teen') return q === 'bad' ? 'pinchi' : (q === 'ok' ? 'nimbo' : 'lumi');
    if (stage === 'adult') {
      if (q === 'perfect') return 'cosmico';
      const top = Math.max(p.str, p.mind, p.charm);
      if (q !== 'bad' && top >= 30) return p.str === top ? 'fortachon' : p.mind === top ? 'sabio' : 'diva';
      return q === 'good' ? 'estrellin' : q === 'ok' ? 'nubi' : 'grunon';
    }
    return p.species;
  }

  /* ---------- logros ---------- */
  function check() {
    const q = { p: prof, c: prof.c, pet };
    for (const a of ACHIEVEMENTS) {
      if (prof.ach[a.id]) continue;
      let ok = false; try { ok = a.test(q); } catch (e) { ok = false; }
      if (ok) { prof.ach[a.id] = Date.now(); prof.coins += a.coins; emit('ach', { ach: a }); }
    }
  }
  const R = (ok, msg, fx, extra) => { check(); return Object.assign({ ok, msg, fx }, extra); };
  const sleepingMsg = () => R(false, 'Zzz… está durmiendo');
  const busyMsg = () => R(false, 'Está trabajando…');

  function discover(sp) { if (sp) prof.album[sp] = true; }

  function evolve(p, stage) {
    p.stage = stage;
    p.species = pickSpecies(p, stage);
    if (stage === 'senior') p.weight = Math.max(8, p.weight - 3);
    if (stage === 'teen') p.weight += 6;
    if (stage === 'adult') p.weight += 10;
    if (stage === 'child') p.weight += 3;
    discover(p.species);
    emit('evolve', { stage, species: p.species });
  }
  function hatch(p) {
    p.stage = 'baby'; p.species = 'puchi'; p.age = 0; p.hunger = 3; p.happy = 3;
    prof.c.births++; discover('puchi');
    emit('hatch');
  }
  function die(p, cause) {
    if (!p.alive) return;
    p.alive = false; p.stage = 'dead'; p.call = null; p.work = null; p.causeOfDeath = cause;
    history.unshift({ name: p.name, species: p.species, days: Math.floor(p.age / DAY) + 1, cause });
    history = history.slice(0, 8);
    emit('die', { cause });
  }

  /* Un segundo de simulación. ts = marca de tiempo real correspondiente. */
  function step(p, ts) {
    if (p.stage === 'egg') {
      if (++p.eggTime >= EGG_TIME) hatch(p);
      return;
    }
    if (!p.alive) return;
    p.age++;

    const target = stageForAge(p.age);
    if (target !== p.stage && p.stage !== 'senior') evolve(p, target);
    const dayNum = Math.floor(p.age / DAY);
    if (dayNum > p.lastDay) {
      p.lastDay = dayNum; prof.coins += 5; prof.c.maxDays = Math.max(prof.c.maxDays, dayNum + 1);
      emit('birthday', { day: dayNum + 1 });
    }

    // --- ciclo día / noche ---
    const night = isNight(ts);
    if (night && !p.nightFlag) { p.nightFlag = true; p.sleeping = true; }
    if (!night && p.nightFlag) { p.nightFlag = false; p.lightsOn = true; p.sleeping = false; p.litT = 0; }
    if (night) {
      p.sleeping = true;
      if (p.lightsOn) { p.litT++; if (p.litT >= 120 && !p.call) { p.call = 'sleep'; p.callT = 0; emit('call', { call: 'sleep' }); } }
      else p.litT = 0;
    } else if (!p.lightsOn) {
      p.sleeping = true;
      if (++p.napT >= 600) { p.lightsOn = true; p.napT = 0; p.sleeping = false; }
    } else { p.sleeping = false; p.napT = 0; }

    const awake = !p.sleeping;
    const rate = awake ? 1 : .25;
    const working = !!p.work;

    // --- trabajo ---
    if (p.work && --p.work.left <= 0) {
      const j = JOBS[p.work.id];
      prof.coins += j.pay; prof.c.jobs++; p.hunger = Math.max(0, p.hunger - j.hunger);
      emit('workdone', { pay: j.pay, name: j.name }); p.work = null;
    }

    // --- necesidades ---
    p.hungerT += rate * (p.trait === 'glotón' ? 1.25 : 1);
    if (p.hungerT >= HUNGER_INT) { p.hungerT = 0; p.hunger = Math.max(0, p.hunger - 1); }
    const tf = p.trait === 'tranquilo' ? .77 : p.trait === 'juguetón' ? 1.25 : 1;
    p.happyT += rate * tf * (1 + p.poops * .35) * (p.hygiene === 0 ? 1.3 : 1);
    if (p.happyT >= HAPPY_INT) { p.happyT = 0; p.happy = Math.max(0, p.happy - 1); }
    p.hygT += rate + p.poops * .3;
    if (p.hygT >= 600) { p.hygT = 0; p.hygiene = Math.max(0, p.hygiene - 1); }
    p.energyT += awake ? 1 : 3;
    if (p.energyT >= 600) { p.energyT = 0; p.energy = Math.min(4, p.energy + 1); }

    // --- caca ---
    p.poopT += rate;
    if (p.poopT >= p.poopNext && p.poops < 4) {
      p.poops++; p.poopT = 0; p.poopNext = 480 + Math.floor(Math.random() * 300);
      emit('poop');
    }
    if (p.poops > 0) p.dirtyT++; else p.dirtyT = 0;

    // --- enfermedad ---
    if (p.snackLoad > 0 && p.age % 120 === 0) p.snackLoad = Math.max(0, p.snackLoad - 1);
    if (!p.sick && awake) {
      let chance = 1 / 6000;
      if (p.poops >= 2 && p.dirtyT > 400) chance += 1 / 500;
      if (p.hygiene === 0) chance += 1 / 1500;
      chance *= 1 + p.snackLoad * .8;
      if (p.health <= 2) chance *= 2;
      if (Math.random() < chance) { p.sick = true; p.doses = 0; p.sickT = 0; emit('sick'); }
    }
    if (p.sick && ++p.sickT >= 400) { p.sickT = 0; p.health--; emit('hurt'); }
    if (p.hunger === 0) {
      if (++p.starveT >= 300) { p.starveT = 0; p.health--; emit('hurt'); }
    } else p.starveT = 0;
    if (!p.sick && p.hunger > 0 && p.happy > 0 && p.health < 4) {
      if (++p.regenT >= 900) { p.regenT = 0; p.health++; }
    } else p.regenT = 0;

    // --- llamadas de atención ---
    if (p.call) {
      const c = p.call;
      const solved = (c === 'hungry' && p.hunger > 0) || (c === 'sad' && p.happy > 0) || (c === 'sick' && !p.sick) ||
        (c === 'sleep' && (!night || !p.lightsOn)) || (c === 'dirty' && p.hygiene > 0);
      if (solved) p.call = null;
      else if (c === 'fake') { if (++p.callT > 300) p.call = null; }
      else if (++p.callT >= 450) { p.mistakes++; p.callT = 0; emit('mistake'); }
    } else if (awake && !working) {
      let c = null;
      if (p.sick) c = 'sick'; else if (p.hunger === 0) c = 'hungry'; else if (p.happy === 0) c = 'sad'; else if (p.hygiene === 0) c = 'dirty';
      else if (++p.fakeT >= p.fakeNext) { c = 'fake'; p.fakeT = 0; p.fakeNext = (1500 + Math.floor(Math.random() * 1800)) * (p.trait === 'travieso' ? .6 : 1); }
      if (c) { p.call = c; p.callT = 0; emit('call', { call: c }); }
    }

    // --- muerte ---
    if (p.health <= 0) die(p, p.sick ? 'enfermedad' : 'hambre');
    else if (p.stage === 'senior' && p.age > DAY * 15 + Math.random() * DAY * 4 && Math.random() < .002) die(p, 'vejez');
    else if (p.age > DAY * 19) die(p, 'vejez');
  }

  /* Avanza la simulación hasta "now" (soporta ausencias largas). */
  function tickTo(now) {
    const p = pet;
    const elapsed = (now - p.lastSeen) / 1000;
    if (elapsed < 0) { p.lastSeen = now; return; }
    let steps = Math.floor(elapsed * cfg.speed);
    if (steps < 1) return;
    steps = Math.min(steps, 200000);
    const per = 1000 / cfg.speed;
    for (let i = 0; i < steps; i++) {
      if (p.stage === 'dead') break;
      step(p, p.lastSeen + per * i);
    }
    p.lastSeen = steps >= 200000 ? now : p.lastSeen + per * steps;
    if (p.stage === 'dead') p.lastSeen = now;
    check();
  }

  /* ---------- Cuidados ---------- */
  function feed(kind) {
    const p = pet;
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    if (kind === 'meal') {
      if (p.hunger >= 4) return R(false, 'No quiere más comida');
      if (p.disc < 30 && Math.random() < .25) return R(false, '¡Se niega a comer!', 'refuse');
      p.hunger++; p.weight += 1; p.meals++; prof.c.meals++;
      return R(true, '¡Ñam ñam!', 'eat', { kind: 'meal' });
    }
    if (p.snackLoad >= 5) return R(false, 'Ya no quiere más dulces');
    p.happy = Math.min(4, p.happy + 1); p.weight += 2; p.snacks++; prof.c.snacks++; p.snackLoad += 1.5;
    return R(true, '¡Qué dulce!', 'snack', { kind: 'snack' });
  }
  function eatItem(id) {
    const p = pet, f = FOODS[id];
    if (!f || !(prof.inv[id] > 0)) return R(false, 'No te queda');
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    let msg, fx = 'eat';
    if (f.kind === 'meal') {
      if (p.hunger >= 4) return R(false, 'No quiere más comida');
      p.hunger = Math.min(4, p.hunger + f.hunger); p.weight += f.weight; p.meals++; prof.c.meals++; msg = '¡Delicioso!';
    } else if (f.kind === 'snack') {
      if (p.snackLoad >= 5) return R(false, 'Ya no quiere más dulces');
      p.happy = Math.min(4, p.happy + f.happy); p.weight += f.weight; p.snacks++; prof.c.snacks++; p.snackLoad += 1.5; fx = 'snack'; msg = '¡Qué rico!';
    } else if (f.cure) {
      if (!p.sick) return R(false, 'No está enfermo');
      p.sick = false; p.doses = 0; p.sickT = 0; p.health = Math.min(4, p.health + 1); prof.c.cures++; fx = 'cured'; msg = '¡Curado al instante!';
    } else {
      if (p.health >= 4) return R(false, 'Ya está en plena forma');
      p.health = Math.min(4, p.health + f.health); fx = 'vit'; msg = '¡Se siente mejor!';
    }
    prof.inv[id]--;
    if (p.fav === id && f.kind !== 'drug') { p.happy = Math.min(4, p.happy + 1); p.bond++; msg = '¡Era su favorito!'; }
    return R(true, msg, fx, { kind: id });
  }
  function toggleLight() {
    const p = pet;
    p.lightsOn = !p.lightsOn;
    if (p.lightsOn) { p.napT = 0; if (!isNight(Date.now())) p.sleeping = false; }
    else p.sleeping = true;
    return R(true, p.lightsOn ? 'Luz encendida' : 'Luz apagada', 'light');
  }
  function medicine() {
    const p = pet;
    if (!p.sick) return R(false, 'No está enfermo');
    p.doses++;
    if (p.doses >= 2) { p.sick = false; p.doses = 0; p.health = Math.min(4, p.health + 1); p.sickT = 0; prof.c.cures++; return R(true, '¡Curado!', 'cured'); }
    return R(true, 'Una dosis más…', 'dose');
  }
  function clean() {
    const p = pet;
    if (p.poops === 0) return R(false, 'Todo está limpio');
    p.poops = 0; p.dirtyT = 0; p.poopT = 0; prof.c.cleans++;
    return R(true, '¡Limpio y reluciente!', 'clean');
  }
  function shower() {
    const p = pet;
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    if (p.hygiene >= 4) return R(false, 'Ya está limpísimo');
    p.hygiene = 4; p.hygT = 0; p.happy = Math.min(4, p.happy + (Math.random() < .5 ? 1 : 0)); prof.c.cleans++;
    return R(true, '¡Qué bien huele!', 'shower');
  }
  function scold() {
    const p = pet;
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    if (p.call === 'fake') { p.call = null; p.disc = clamp(p.disc + 25, 0, 100); return R(true, 'Aprendió la lección', 'scold'); }
    p.disc = clamp(p.disc + 4, 0, 100); p.happy = Math.max(1, p.happy - 1);
    return R(true, 'Se ha puesto triste…', 'scoldBad');
  }
  function cuddle() {
    const p = pet, now = Date.now();
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    p.bond = clamp(p.bond + 1, 0, 99); prof.c.pets++;
    if (now - p.petCd > 60000 && p.happy < 4) { p.petCd = now; p.happy++; return R(true, '¡Le encantan tus caricias!', 'cuddle'); }
    p.petCd = Math.max(p.petCd, now - 50000);
    return R(true, 'Ronronea feliz', 'cuddle');
  }
  function useToy(id) {
    const p = pet, t = TOYS[id], now = Date.now();
    if (!t || !prof.owned[id]) return R(false, 'No lo tienes');
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    if (p.toyCd[id] && now - p.toyCd[id] < 30000) return R(false, 'Ya jugó con eso hace un momento');
    p.toyCd[id] = now; p.bond = clamp(p.bond + t.bond, 0, 99); p.weight = Math.max(1, p.weight - 1);
    if (p.happy < 4) p.happy = Math.min(4, p.happy + t.happy);
    return R(true, '¡Se divierte mucho!', 'toy', { toy: id });
  }
  function train(stat) {
    const p = pet;
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    if (p.hunger < 1) return R(false, 'Tiene demasiada hambre');
    if (p.energy < 1) return R(false, 'Está agotado, déjalo descansar');
    if (p.happy < 1) return R(false, 'No tiene ganas…');
    p.energy--; p[stat] = clamp(p[stat] + 2 + (p.trait === 'juguetón' ? 1 : 0), 0, 99);
    if (stat === 'str') p.weight = Math.max(1, p.weight - 1);
    if (Math.random() < .4) p.hunger = Math.max(0, p.hunger - 1);
    prof.coins += 1; prof.c.trains++;
    return R(true, '¡Buen entrenamiento! +2', 'train', { stat });
  }

  /* ---------- Trabajo ---------- */
  function startWork(id) {
    const p = pet, j = JOBS[id];
    if (p.sleeping) return sleepingMsg();
    if (p.work) return R(false, 'Ya está trabajando');
    if (p.hunger < 2) return R(false, 'Primero dale de comer');
    if (p.happy < 1) return R(false, 'Está demasiado triste');
    p.work = { id, left: j.secs, total: j.secs }; p.call = null;
    return R(true, `Se fue a trabajar: ${j.name}`, 'work');
  }
  function cancelWork() { pet.work = null; pet.happy = Math.max(0, pet.happy - 1); return R(true, 'Ha vuelto sin cobrar', 'cancel'); }

  /* ---------- Amigos ---------- */
  function visit(id) {
    const p = pet, f = FRIENDS.find(x => x.id === id), now = Date.now();
    if (!f) return R(false, '¿Quién?');
    if (p.work) return busyMsg();
    if (p.sleeping) return sleepingMsg();
    const fr = prof.friends[id] = prof.friends[id] || { lv: 0, cd: 0 };
    if (now < fr.cd) return R(false, `${f.name} está ocupado ahora`);
    fr.cd = now + 5 * 60000; fr.lv = Math.min(5, fr.lv + 1);
    p.happy = Math.min(4, p.happy + 1 + (p.trait === 'sociable' ? 1 : 0)); p.bond = clamp(p.bond + 2, 0, 99); p.charm = clamp(p.charm + 1, 0, 99);
    prof.c.visits++;
    let gift = '';
    if (Math.random() < .55) { const n = 2 + Math.floor(Math.random() * 5); prof.coins += n; gift = ` Te regala ${n} monedas.`; }
    else if (Math.random() < .35) { const k = pick(['manzana', 'helado', 'sopa']); prof.inv[k] = (prof.inv[k] || 0) + 1; gift = ` Te regala: ${FOODS[k].name}.`; }
    return R(true, '¡Pasaron un rato genial!' + gift, 'visit', { friend: f, lv: fr.lv });
  }

  /* ---------- Tienda / inventario ---------- */
  function catalogOf(cat) { return cat === 'food' ? FOODS : cat === 'toy' ? TOYS : cat === 'acc' ? ACCESSORIES : WALLPAPERS; }
  function buy(cat, id) {
    const it = catalogOf(cat)[id];
    if (!it) return R(false, 'No existe');
    if (cat !== 'food' && prof.owned[id]) return R(false, 'Ya lo tienes');
    if (prof.coins < it.price) return R(false, 'Te faltan monedas');
    prof.coins -= it.price; prof.c.buys++;
    if (cat === 'food') prof.inv[id] = (prof.inv[id] || 0) + 1; else prof.owned[id] = true;
    return R(true, `Compraste: ${it.name}`, 'buy');
  }
  function equip(id) {
    const a = ACCESSORIES[id]; if (!a || !prof.owned[id]) return R(false, 'No lo tienes');
    if (prof.equip[a.slot] === id) { prof.equip[a.slot] = null; return R(true, `Te quitas: ${a.name}`, 'equip'); }
    prof.equip[a.slot] = id; prof.c.equips++;
    return R(true, `Puesto: ${a.name}`, 'equip');
  }
  function setBg(id) { if (!prof.owned[id]) return R(false, 'No lo tienes'); prof.bg = id; return R(true, `Fondo: ${WALLPAPERS[id].name}`, 'bg'); }

  function playResult(win, big, coins, stat) {
    const p = pet;
    p.weight = Math.max(1, p.weight - 1); prof.c.games++;
    if (win) { p.happy = Math.min(4, p.happy + (big ? 2 : 1)); p.wins++; prof.c.wins++; p.bond = clamp(p.bond + 1, 0, 99); if (stat) p[stat] = clamp(p[stat] + 1, 0, 99); }
    prof.coins += Math.max(0, coins || 0);
    p.hunger = Math.max(0, p.hunger - (Math.random() < .35 ? 1 : 0));
    check();
  }
  function countPhoto() { prof.c.photos++; check(); }

  function checkDaily() {
    const d = new Date(), key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (prof.daily === key) return;
    const first = prof.daily === '';
    prof.daily = key;
    const coins = first ? 30 : 10 + Math.floor(Math.random() * 11), k = pick(['manzana', 'helado', 'vitamina']);
    prof.coins += coins; prof.inv[k] = (prof.inv[k] || 0) + 1;
    emit('daily', { coins, item: FOODS[k].name });
  }

  function warmEgg() { if (pet.stage === 'egg') { pet.eggTime = Math.min(EGG_TIME, pet.eggTime + 3); } }
  function rename(name) { pet.name = String(name || '').trim().slice(0, 12) || pet.name; }
  function restart() { pet = newPet(); }

  /* ---------- Persistencia ---------- */
  function exportData() { return JSON.stringify({ app: 'cuquigotxi', v: 2, pet, cfg, history, prof }); }
  function importData(str) {
    const d = JSON.parse(str);
    if (!d || d.app !== 'cuquigotxi' || !d.pet) throw new Error('Datos no válidos');
    pet = Object.assign(newPet(), d.pet); Object.assign(cfg, d.cfg || {}); history = d.history || []; prof = Object.assign(newProfile(), d.prof || {});
    prof.c = Object.assign(newProfile().c, prof.c);
    if (pet.stage === 'dead') pet.alive = false;
    pet.lastSeen = Date.now();
  }
  function save() {
    try { localStorage.setItem(KEY, exportData()); } catch (e) { /* sin almacenamiento */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.pet) { pet = Object.assign(newPet(), d.pet); Object.assign(cfg, d.cfg || {}); history = d.history || []; prof = Object.assign(newProfile(), d.prof || {}); prof.c = Object.assign(newProfile().c, prof.c); }
      }
    } catch (e) { pet = null; }
    if (!pet) pet = newPet();
    if (!prof) prof = newProfile();
    if (pet.stage === 'dead') pet.alive = false;
    if (pet.species) discover(pet.species);
    tickTo(Date.now());
    checkDaily();
  }

  return {
    cfg, DAY, EGG_TIME,
    get pet() { return pet; },
    get prof() { return prof; },
    get history() { return history; },
    events, load, save, tickTo, restart, exportData, importData,
    feed, eatItem, toggleLight, medicine, clean, shower, scold, cuddle, useToy, train, startWork, cancelWork, visit,
    buy, equip, setBg, catalogOf, playResult, countPhoto, checkDaily, warmEgg, rename, quality, isNight, check,
  };
})();
