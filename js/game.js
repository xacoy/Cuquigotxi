'use strict';
/* Lógica del juego: estado de la mascota, simulación por segundos y acciones. */
const Game = (() => {
  const DAY = 1200;            // un "día" de la mascota = 20 min reales (a velocidad 1x)
  const EGG_TIME = 60;
  const HUNGER_INT = 300, HAPPY_INT = 420;
  const KEY = 'cuquigotxi.v1';

  const cfg = { sound: true, speed: 1, nights: true };
  let pet = null;
  let history = [];
  const events = [];           // eventos para la UI: {type, ...}

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const emit = (type, extra) => events.push(Object.assign({ type }, extra));

  function newPet() {
    return {
      stage: 'egg', species: null, name: 'Cuqui', alive: true,
      born: Date.now(), age: 0, eggTime: 0,
      hunger: 3, happy: 3, health: 4, disc: 0, weight: 5,
      poops: 0, poopT: 0, poopNext: 540, sick: false, doses: 0,
      sleeping: false, lightsOn: true, napT: 0, litT: 0, nightFlag: false,
      call: null, callT: 0, mistakes: 0,
      hungerT: 0, happyT: 0, sickT: 0, starveT: 0, fakeT: 0, fakeNext: 1800, regenT: 0, dirtyT: 0, snackLoad: 0,
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
    if (stage === 'adult') return q === 'perfect' ? 'cosmico' : q === 'good' ? 'estrellin' : q === 'ok' ? 'nubi' : 'grunon';
    return p.species; // senior conserva especie adulta
  }

  function evolve(p, stage) {
    p.stage = stage;
    p.species = pickSpecies(p, stage);
    if (stage === 'senior') p.weight = Math.max(8, p.weight - 3);
    if (stage === 'teen') p.weight += 6;
    if (stage === 'adult') p.weight += 10;
    if (stage === 'child') p.weight += 3;
    emit('evolve', { stage, species: p.species });
  }

  function hatch(p) {
    p.stage = 'baby'; p.species = 'puchi'; p.age = 0; p.hunger = 3; p.happy = 3;
    emit('hatch');
  }

  function die(p, cause) {
    if (!p.alive) return;
    p.alive = false; p.stage = 'dead'; p.call = null; p.causeOfDeath = cause;
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

    // --- necesidades ---
    p.hungerT += rate;
    if (p.hungerT >= HUNGER_INT) { p.hungerT = 0; p.hunger = Math.max(0, p.hunger - 1); }
    p.happyT += rate * (1 + p.poops * .35);
    if (p.happyT >= HAPPY_INT) { p.happyT = 0; p.happy = Math.max(0, p.happy - 1); }

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
      chance *= 1 + p.snackLoad * .8;
      if (p.health <= 2) chance *= 2;
      if (Math.random() < chance) { p.sick = true; p.doses = 0; p.sickT = 0; emit('sick'); }
    }
    if (p.sick) {
      if (++p.sickT >= 400) { p.sickT = 0; p.health--; emit('hurt'); }
    }
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
        (c === 'sleep' && (!night || !p.lightsOn));
      if (solved) p.call = null;
      else if (c === 'fake') { if (++p.callT > 300) p.call = null; }
      else if (++p.callT >= 450) { p.mistakes++; p.callT = 0; emit('mistake'); }
    } else if (awake) {
      let c = null;
      if (p.sick) c = 'sick'; else if (p.hunger === 0) c = 'hungry'; else if (p.happy === 0) c = 'sad';
      else if (++p.fakeT >= p.fakeNext) { c = 'fake'; p.fakeT = 0; p.fakeNext = 1500 + Math.floor(Math.random() * 1800); }
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
    let elapsed = (now - p.lastSeen) / 1000;
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
  }

  /* ---------- Acciones (devuelven mensaje y resultado) ---------- */
  const R = (ok, msg, fx) => ({ ok, msg, fx });
  const sleepingMsg = () => R(false, 'Zzz… está durmiendo');

  function feed(kind) {
    const p = pet;
    if (p.sleeping) return sleepingMsg();
    if (kind === 'meal') {
      if (p.hunger >= 4) return R(false, 'No quiere más comida');
      if (p.disc < 30 && Math.random() < .25) return R(false, '¡Se niega a comer!', 'refuse');
      p.hunger++; p.weight += 1; p.meals++;
      return R(true, '¡Ñam ñam!', 'eat');
    }
    if (p.snackLoad >= 5) return R(false, 'Ya no quiere más dulces');
    p.happy = Math.min(4, p.happy + 1); p.weight += 2; p.snacks++; p.snackLoad += 1.5;
    return R(true, '¡Qué dulce!', 'snack');
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
    if (p.doses >= 2) { p.sick = false; p.doses = 0; p.health = Math.min(4, p.health + 1); p.sickT = 0; return R(true, '¡Curado!', 'cured'); }
    return R(true, 'Una dosis más…', 'dose');
  }
  function clean() {
    const p = pet;
    if (p.poops === 0) return R(false, 'Todo está limpio');
    p.poops = 0; p.dirtyT = 0; p.poopT = 0;
    return R(true, '¡Limpio y reluciente!', 'clean');
  }
  function scold() {
    const p = pet;
    if (p.sleeping) return sleepingMsg();
    if (p.call === 'fake') { p.call = null; p.disc = clamp(p.disc + 25, 0, 100); return R(true, 'Aprendió la lección', 'scold'); }
    p.disc = clamp(p.disc + 4, 0, 100); p.happy = Math.max(1, p.happy - 1);
    return R(true, 'Se ha puesto triste…', 'scoldBad');
  }
  function playResult(win, big) {
    const p = pet;
    p.weight = Math.max(1, p.weight - 1);
    if (win) { p.happy = Math.min(4, p.happy + (big ? 2 : 1)); p.wins++; }
    p.hunger = Math.max(0, p.hunger - (Math.random() < .35 ? 1 : 0));
  }
  function warmEgg() { if (pet.stage === 'egg') { pet.eggTime = Math.min(EGG_TIME, pet.eggTime + 3); } }
  function rename(name) { pet.name = String(name || '').trim().slice(0, 12) || pet.name; }
  function restart() { pet = newPet(); }

  /* ---------- Persistencia ---------- */
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ pet, cfg, history })); } catch (e) { /* sin almacenamiento */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.pet) { pet = Object.assign(newPet(), d.pet); Object.assign(cfg, d.cfg || {}); history = d.history || []; }
      }
    } catch (e) { /* datos corruptos: empezar de cero */ }
    if (!pet) pet = newPet();
    if (pet.stage === 'dead') pet.alive = false;
    tickTo(Date.now());
  }

  return {
    cfg, DAY, EGG_TIME,
    get pet() { return pet; },
    get history() { return history; },
    events, load, save, tickTo, restart,
    feed, toggleLight, medicine, clean, scold, playResult, warmEgg, rename, quality, isNight,
  };
})();
