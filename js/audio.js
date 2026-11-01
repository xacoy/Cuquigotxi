'use strict';
/* Sonidos sintetizados con WebAudio (sin archivos externos). */
const Sound = (() => {
  let ctx = null;
  let enabled = true;
  let vol = 1;
  const S = {
    nav:    [[880, 0, .04, 'square', .03]],
    ok:     [[660, 0, .05, 'square', .04], [990, .05, .08, 'square', .04]],
    back:   [[520, 0, .05, 'square', .04], [390, .05, .08, 'square', .04]],
    no:     [[200, 0, .12, 'sawtooth', .04], [160, .12, .16, 'sawtooth', .04]],
    eat:    [[500, 0, .06, 'triangle', .06], [420, .1, .06, 'triangle', .06], [500, .2, .06, 'triangle', .06], [600, .3, .08, 'triangle', .06]],
    happy:  [[523, 0, .1, 'triangle', .06], [659, .1, .1, 'triangle', .06], [784, .2, .1, 'triangle', .06], [1046, .3, .2, 'triangle', .06]],
    sad:    [[392, 0, .18, 'triangle', .06], [330, .2, .18, 'triangle', .06], [262, .4, .3, 'triangle', .06]],
    call:   [[1320, 0, .08, 'square', .04], [1320, .14, .08, 'square', .04], [1760, .28, .12, 'square', .04]],
    poop:   [[180, 0, .1, 'sawtooth', .04], [140, .1, .15, 'sawtooth', .04]],
    clean:  [[900, 0, .05, 'sine', .06], [1200, .05, .05, 'sine', .06], [1500, .1, .05, 'sine', .06], [1900, .15, .1, 'sine', .06]],
    med:    [[600, 0, .08, 'sine', .06], [800, .1, .08, 'sine', .06], [1000, .2, .12, 'sine', .06]],
    light:  [[700, 0, .06, 'square', .03], [350, .07, .06, 'square', .03]],
    catch:  [[1200, 0, .05, 'sine', .06], [1600, .05, .07, 'sine', .06]],
    hit:    [[150, 0, .15, 'sawtooth', .06]],
    win:    [[523, 0, .12, 'square', .04], [659, .12, .12, 'square', .04], [784, .24, .12, 'square', .04], [1046, .36, .3, 'square', .04]],
    evolve: [[392, 0, .12, 'triangle', .07], [523, .12, .12, 'triangle', .07], [659, .24, .12, 'triangle', .07],
             [784, .36, .12, 'triangle', .07], [1046, .48, .12, 'triangle', .07], [784, .6, .1, 'triangle', .07], [1318, .7, .4, 'triangle', .07]],
    hatch:  [[300, 0, .05, 'square', .05], [300, .12, .05, 'square', .05], [600, .3, .1, 'triangle', .07], [900, .4, .2, 'triangle', .07]],
    coin:   [[1318, 0, .06, 'square', .035], [1760, .07, .12, 'square', .035]],
    buy:    [[880, 0, .06, 'triangle', .06], [1175, .07, .06, 'triangle', .06], [1568, .14, .14, 'triangle', .06]],
    photo:  [[2000, 0, .04, 'square', .03], [1000, .05, .1, 'sawtooth', .02]],
    flip:   [[700, 0, .04, 'triangle', .05], [900, .04, .05, 'triangle', .05]],
    ach:    [[784, 0, .1, 'triangle', .07], [988, .1, .1, 'triangle', .07], [1318, .2, .1, 'triangle', .07], [1568, .3, .3, 'triangle', .07]],
    train:  [[330, 0, .08, 'square', .04], [440, .1, .08, 'square', .04], [550, .2, .12, 'square', .04]],
    guitar: [[330, 0, .12, 'triangle', .07], [392, .15, .12, 'triangle', .07], [494, .3, .12, 'triangle', .07], [392, .45, .2, 'triangle', .07]],
    die:    [[440, 0, .3, 'triangle', .07], [349, .3, .3, 'triangle', .07], [294, .6, .3, 'triangle', .07], [220, .9, .7, 'triangle', .07]],
  };
  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { try { ctx = new AC(); } catch (e) { ctx = null; } }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function play(name) {
    if (!enabled) return;
    const c = unlock();
    if (!c || !S[name]) return;
    const t0 = c.currentTime;
    for (const [f, s, d, type, v] of S[name]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + s);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * vol), t0 + s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d);
      o.connect(g).connect(c.destination);
      o.start(t0 + s); o.stop(t0 + s + d + 0.02);
    }
  }
  /* Música de fondo procedural (pentatónica, sin archivos) */
  let musicOn = false, musicTimer = null, step = 0, nextAt = 0;
  const SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
  const BASS = [130.81, 146.83, 98, 110];
  const MEL = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 7, 5, 4, 2, 4, 3, 4, 5, 4, 2, 1, 0, 1, 2, 4, 5, 4, 2, 0, 1, 0];
  function note(c, f, t, d, type, v) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * vol), t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02);
  }
  function schedule() {
    const c = unlock(); if (!c || !musicOn || !enabled) return;
    const beat = .26;
    if (nextAt < c.currentTime) nextAt = c.currentTime + .05;
    while (nextAt < c.currentTime + .6) {
      const i = step % MEL.length;
      note(c, SCALE[MEL[i]], nextAt, beat * .9, 'triangle', .035);
      if (i % 4 === 0) note(c, BASS[Math.floor(i / 8) % BASS.length], nextAt, beat * 3.2, 'sine', .05);
      nextAt += beat; step++;
    }
  }
  function setMusic(on) {
    musicOn = !!on; clearInterval(musicTimer);
    if (musicOn) { nextAt = 0; schedule(); musicTimer = setInterval(schedule, 200); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(musicTimer); else if (musicOn) { nextAt = 0; musicTimer = setInterval(schedule, 200); } });

  return {
    play, unlock, setMusic,
    setEnabled(v) { enabled = !!v; },
    setVolume(v) { vol = Math.max(0, Math.min(2, v)); },
    get enabled() { return enabled; },
  };
})();
