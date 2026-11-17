// Every sound is synthesised here with WebAudio, nothing is loaded: plucked stars that climb a
// scale as a chain grows, bell-like novas, soft bolts, thuds, and a generative night-music bed
// (pad, bass and a star-arpeggio) that grows denser watch by watch. Starts on the first gesture.

const SCALE = [0, 2, 3, 5, 7, 9, 10]; // D dorian
const ROOT = 146.83; // D3
const CHORDS = [[0, 4, 7], [5, 9, 12], [3, 7, 10], [4, 7, 11]];

function hz(step, octave = 0) {
  const n = SCALE[((step % 7) + 7) % 7] + 12 * (Math.floor(step / 7) + octave);
  return ROOT * 2 ** (n / 12);
}

export function createAudio(settings) {
  let ctx = null;
  let master;
  let musicBus;
  let sfxBus;
  let echo;
  let noiseBuf;
  let intensity = 0;
  let nextBeat = 0;
  let beat = 0;
  let musicOn = false;
  const lastPlayed = {};

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    echo = ctx.createDelay(1.5);
    echo.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    echo.connect(tone).connect(fb).connect(echo);
    tone.connect(master);
    musicBus.connect(master);
    sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    applyVolumes();
    nextBeat = ctx.currentTime + 0.1;
    setInterval(scheduleMusic, 90);
  }

  function applyVolumes() {
    if (!ctx) return;
    const m = settings.muted ? 0 : settings.master;
    master.gain.setTargetAtTime(m, ctx.currentTime, 0.05);
    musicBus.gain.setTargetAtTime(settings.music * 0.5, ctx.currentTime, 0.05);
    sfxBus.gain.setTargetAtTime(settings.sfx, ctx.currentTime, 0.05);
  }

  function voice(freq, { type = 'sine', at = 0, dur = 0.3, vol = 0.2, attack = 0.005, slide = 0, bus = sfxBus, wet = 0.3, filter = 0 } = {}) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o.connect(g);
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      node = node.connect(f);
    }
    node.connect(bus);
    if (wet > 0) {
      const send = ctx.createGain();
      send.gain.value = wet;
      node.connect(send).connect(echo);
    }
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise({ at = 0, dur = 0.3, vol = 0.2, from = 3000, to = 300, q = 1, type = 'bandpass', wet = 0.1 } = {}) {
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(sfxBus);
    if (wet) {
      const s = ctx.createGain();
      s.gain.value = wet;
      g.connect(s).connect(echo);
    }
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /** Skip a sound that already played within `gap` seconds (swarms die in bunches). */
  function throttle(name, gap) {
    const now = ctx.currentTime;
    if (lastPlayed[name] && now - lastPlayed[name] < gap) return false;
    lastPlayed[name] = now;
    return true;
  }

  const SOUNDS = {
    star(d) {
      const f = hz(7 + (d?.index ?? 1) * 2);
      voice(f, { type: 'triangle', dur: 0.6, vol: 0.22, wet: 0.5 });
      voice(f * 2, { type: 'sine', dur: 0.3, vol: 0.06, wet: 0.4 });
    },
    nova(d) {
      const hits = d?.hits ?? 0;
      [0, 4, 7, 11, 14].forEach((s, i) => voice(hz(s + 7), { type: 'sine', at: i * 0.035, dur: 1.6, vol: 0.13, wet: 0.6 }));
      voice(hz(0, -1), { type: 'triangle', dur: 1.2, vol: 0.25, wet: 0.2 });
      noise({ dur: 0.7, vol: 0.18 + Math.min(0.2, hits * 0.02), from: 6000, to: 400, q: 0.7, wet: 0.3 });
    },
    echo() {
      [7, 11, 14].forEach((s, i) => voice(hz(s + 7), { at: i * 0.04, dur: 0.9, vol: 0.07, wet: 0.7 }));
    },
    bolt() {
      if (throttle('bolt', 0.09)) voice(1300 + Math.random() * 300, { type: 'sine', dur: 0.07, vol: 0.035, slide: 0.6, wet: 0 });
    },
    kill(d) {
      if (!throttle('kill', 0.04)) return;
      const big = d?.type === 'hulk' || d?.type === 'mire';
      voice(big ? 90 : 180 + Math.random() * 60, { type: 'sine', dur: big ? 0.45 : 0.18, vol: big ? 0.3 : 0.14, slide: 0.4, wet: 0.1 });
      noise({ dur: 0.12, vol: 0.06, from: 2000, to: 500 });
    },
    hurt() {
      voice(220, { type: 'sawtooth', dur: 0.35, vol: 0.12, slide: 0.3, filter: 1200, wet: 0.1 });
      noise({ dur: 0.25, vol: 0.2, from: 1200, to: 200, q: 0.5 });
    },
    dash() {
      noise({ dur: 0.22, vol: 0.12, from: 800, to: 5000, q: 2, wet: 0.2 });
    },
    mote() {
      if (throttle('mote', 0.05)) voice(2400 + Math.random() * 800, { dur: 0.06, vol: 0.025, wet: 0.2 });
    },
    deny() {
      if (throttle('deny', 0.15)) voice(110, { type: 'square', dur: 0.12, vol: 0.05, filter: 600, wet: 0 });
    },
    snap() {
      voice(600, { type: 'triangle', dur: 0.4, vol: 0.15, slide: 0.2, wet: 0.3 });
    },
    eaten() {
      noise({ dur: 0.18, vol: 0.18, from: 900, to: 150, q: 3 });
      voice(300, { type: 'square', dur: 0.15, vol: 0.05, slide: 0.5, filter: 900, wet: 0 });
    },
    unravel() {
      [4, 2, 0].forEach((s, i) => voice(hz(s + 7), { type: 'triangle', at: i * 0.05, dur: 0.25, vol: 0.06 }));
    },
    spit() {
      if (throttle('spit', 0.2)) voice(160, { type: 'sine', dur: 0.25, vol: 0.12, slide: 1.8, wet: 0.1 });
    },
    eclipsePulse() {
      voice(55, { type: 'sawtooth', dur: 1.1, vol: 0.2, slide: 0.7, filter: 400, wet: 0.3 });
    },
    bossRise() {
      voice(41, { type: 'sawtooth', dur: 3.5, vol: 0.25, attack: 1.2, filter: 300, wet: 0.4 });
      voice(61.7, { type: 'sawtooth', dur: 3.5, vol: 0.15, attack: 1.5, filter: 300, wet: 0.4 });
    },
    bossDown() {
      [0, 4, 7, 9, 11, 14, 16].forEach((s, i) => voice(hz(s + 7), { at: i * 0.08, dur: 2.4, vol: 0.1, wet: 0.7 }));
      noise({ dur: 2, vol: 0.3, from: 8000, to: 100, q: 0.4, wet: 0.5 });
    },
    watch() {
      voice(hz(0), { type: 'sine', dur: 2.5, vol: 0.18, wet: 0.6 });
      voice(hz(0) * 2.01, { type: 'sine', dur: 1.8, vol: 0.06, wet: 0.6 });
    },
    dawnbell() {
      [0, 7, 14].forEach((s, i) => voice(hz(s + 7), { at: i * 0.18, dur: 2.2, vol: 0.14, wet: 0.7 }));
    },
    hand() {
      voice(hz(11), { type: 'triangle', dur: 0.5, vol: 0.08, wet: 0.5 });
    },
    boon() {
      [0, 2, 4, 7, 9].forEach((s, i) => voice(hz(s + 7), { type: 'triangle', at: i * 0.06, dur: 0.6, vol: 0.1, wet: 0.5 }));
    },
    victory() {
      [0, 4, 7, 11, 14, 18, 21].forEach((s, i) => voice(hz(s + 7), { type: 'triangle', at: i * 0.12, dur: 2.6, vol: 0.12, wet: 0.6 }));
    },
    defeat() {
      [7, 5, 3, 0].forEach((s, i) => voice(hz(s), { type: 'triangle', at: i * 0.3, dur: 1.4, vol: 0.12, wet: 0.6 }));
    },
    ui() {
      voice(hz(9), { type: 'sine', dur: 0.12, vol: 0.06, wet: 0.2 });
    },
  };

  function scheduleMusic() {
    if (!ctx || !musicOn) return;
    const spb = 60 / 84 / 2; // eighth notes at 84 bpm
    while (nextBeat < ctx.currentTime + 0.3) {
      const at = nextBeat - ctx.currentTime;
      const bar = Math.floor(beat / 8);
      const chord = CHORDS[bar % CHORDS.length];
      if (beat % 32 === 0) {
        chord.forEach((s) =>
          voice(hz(s, -1), { type: 'sawtooth', at, dur: spb * 32 + 0.6, vol: 0.035, attack: 1.4, filter: 700 + intensity * 900, bus: musicBus, wet: 0.25 }),
        );
      }
      if (beat % 8 === 0) voice(hz(chord[0], -2), { type: 'triangle', at, dur: spb * 7, vol: 0.12, attack: 0.05, bus: musicBus, wet: 0 });
      const arpChance = 0.35 + intensity * 0.55;
      if ((beat * 7919) % 100 < arpChance * 100) {
        const s = chord[(beat * 3) % 3] + 7 + (beat % 16 > 8 ? 7 : 0);
        voice(hz(s), { type: 'triangle', at, dur: 0.5, vol: 0.05, bus: musicBus, wet: 0.6 });
      }
      if (intensity > 0.45 && beat % 4 === 0) voice(70, { type: 'sine', at, dur: 0.18, vol: 0.13 * intensity, slide: 0.5, bus: musicBus, wet: 0 });
      nextBeat += spb;
      beat += 1;
    }
  }

  return {
    unlock() {
      init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      musicOn = true;
    },
    play(name, data) {
      if (!ctx || !SOUNDS[name]) return;
      SOUNDS[name](data);
    },
    setIntensity(v) {
      intensity = v;
    },
    applyVolumes,
  };
}
