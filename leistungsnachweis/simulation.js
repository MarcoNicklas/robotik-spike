(() => {
  'use strict';

  const fieldSize = 100;
  const origin = [70, 50];
  const colors = {
    ink: '#15243b',
    muted: '#495d71',
    route: '#087768',
    reverse: '#284aab',
    start: '#065b4f',
    load: '#9a4b13',
    turn: '#284aab',
    target: '#543889',
  };
  const shelves = [
    [0, 1, 1, 2.6],
    [2, 0, 3, 1],
    [3, 5, 1, 2],
    [4.25, 5, 0.75, 2],
    [2, 4.8, 0.72, 2.2],
  ];
  const yellowFields = [[1.5, 4.1], [3.5, 3.1]];
  const marks = [
    ['A', 1.5, 7.5],
    ['B', 1.5, 5.75],
    ['C', 1.5, 4],
    ['D', 1.5, 2.25],
    ['E', 1.5, 0.5],
  ];
  const goals = [
    ['R3', 2.375, 2.25, 'below'],
    ['L2', 0.625, 4, 'farther'],
    ['L1', 1.0625, 4, 'below'],
    ['R1', 1.9375, 4, 'below'],
    ['R2', 2.375, 4, 'farther'],
    ['L3', 1.0625, 5.75, 'below'],
  ];

  function point(x, y) {
    return [origin[0] + x * fieldSize, origin[1] + y * fieldSize];
  }

  function box(ctx, x, y, width, height, color, stroke) {
    const [left, top] = point(x, y);
    ctx.fillStyle = color;
    ctx.fillRect(left, top, width * fieldSize, height * fieldSize);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, width * fieldSize, height * fieldSize);
    }
  }

  function label(ctx, text, x, y, options = {}) {
    const { color = colors.ink, size = 14, weight = 700, align = 'center', family = 'system-ui, sans-serif' } = options;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function stroke(ctx, points, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const vertex of points.slice(1)) ctx.lineTo(...vertex);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function pallet(ctx, x, y, width = 0.34, height = 0.22) {
    box(ctx, x, y, width, height, '#b78956', '#7a6146');
    for (let stripe = 1; stripe < 3; stripe++) {
      box(ctx, x + width * stripe / 3, y, 0.018, height, '#e7c292');
    }
  }

  function shelf(ctx, [x, y, width, height], index) {
    box(ctx, x, y, width, height, '#929da5', '#68747d');
    const [left, top] = point(x, y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width * fieldSize, height * fieldSize);
    ctx.clip();
    for (let offset = -900; offset < 900; offset += 13) {
      stroke(ctx, [[left + offset, top], [left + offset + 300, top + 300]], '#aeb8be', 2);
    }
    ctx.restore();

    if (index === 4) {
      box(ctx, x + 0.15, y + 0.7, 0.4, 0.45, '#737e87', '#495863');
      matLabel(ctx, 'GESPERRT', left + width * 50, top + height * 50 + 30, 10, '#fff');
      return;
    }
    for (let row = y + 0.12; row < y + height - 0.15; row += 0.4) {
      for (let column = x + 0.1; column < x + width - 0.3; column += 0.44) {
        pallet(ctx, column, row);
      }
    }
  }

  function matLabel(ctx, text, x, y, size, color = '#304452') {
    label(ctx, text, x, y, { size, color, weight: 600, family: 'system-ui' });
  }

  function drawMat(ctx, canvas) {
    ctx.fillStyle = '#eef2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    box(ctx, -0.13, -0.13, 5.26, 8.26, '#75828a');
    box(ctx, 0, 0, 5, 8, '#fafbf9');
    for (let x = 0; x <= 5; x++) stroke(ctx, [point(x, 0), point(x, 8)], '#d5dee3');
    for (let y = 0; y <= 8; y++) stroke(ctx, [point(0, y), point(5, y)], '#d5dee3');
    shelves.forEach((bounds, index) => shelf(ctx, bounds, index));

    box(ctx, 1, 0, 1, 1, '#ef7378', '#a23848');
    box(ctx, 1.05, 0.03, 0.9, 0.18, '#8f396e');
    matLabel(ctx, 'ABLADEN', 220, 119, 13, '#652431');
    box(ctx, 4, 2.6, 1, 1, '#75b6dc', '#1f6f9d');
    matLabel(ctx, 'RAMPE', 520, 360, 13, '#23526f');
    yellowFields.forEach(([x, y], index) => {
      box(ctx, x - 0.46, y - 0.44, 0.92, 0.88, '#fff0b3');
      const [left, top] = point(x - 0.46, y - 0.44);
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#d9a918';
      ctx.strokeRect(left, top, 92, 88);
      ctx.setLineDash([]);
      matLabel(ctx, `FELD ${index + 1}`, left + 46, top + 15, 12, '#80631b');
    });
    box(ctx, 1, 7, 1, 1, '#dce8e1', '#6c9b83');
    matLabel(ctx, 'START', 220, 832, 16, '#275c41');
    matLabel(ctx, '↑', 220, 788, 39, '#568b72');
    for (const [x, y] of [[0.1, 0], [0.5, 0.35], [0.1, 7.4], [4.3, 7.5]]) {
      pallet(ctx, x, y, 0.3, 0.22);
    }
    matLabel(ctx, 'FAHRMATTE · DRAUFSICHT', 320, 20, 17);
    matLabel(ctx, 'Aufteilung nach Fotovorlage · nicht maßstabsgetreu', 320, 888, 13, '#60717d');
  }

  function arrow(ctx, x, y, heading, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, 6);
    ctx.lineTo(-9, 6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  function drawLeg(ctx, start, destination, heading, offset, color) {
    const [fromX, fromY] = point(...start);
    const [toX, toY] = point(...destination);
    const line = [[fromX + offset, fromY], [toX + offset, toY]];
    stroke(ctx, line, '#fff', 10);
    stroke(ctx, line, color, 5);
    arrow(ctx, fromX + (toX - fromX) * 0.5 + offset, fromY + (toY - fromY) * 0.5, heading, color);
  }

  function drawRoute(ctx, variant) {
    ctx.save();
    ctx.lineCap = 'round';
    drawLeg(ctx, variant.start, variant.load, variant.heading, -8, colors.route);
    drawLeg(ctx, variant.load, variant.turnPoint, variant.heading + 180, 8, colors.reverse);
    drawLeg(ctx, variant.turnPoint, variant.target, variant.heading + variant.turn, 0, colors.route);
    ctx.restore();
  }

  function marker(ctx, x, y, glyph, { caption, color = colors.muted, placement = 'right' } = {}) {
    const active = Boolean(caption);
    const [px, py] = point(x, y);
    ctx.beginPath();
    ctx.arc(px, py, active ? 15 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = active ? 3 : 2;
    ctx.stroke();
    if (active) label(ctx, glyph, px, py, { color: '#fff', size: 15 });
    const text = caption ?? glyph;
    const textSize = active ? 15 : 13;
    ctx.font = `700 ${textSize}px system-ui, sans-serif`;
    const width = ctx.measureText(text).width + 12;
    const left = placement === 'right' ? px + (active ? 19 : 9) : px - width / 2;
    const topOffsets = { right: -10, above: -47, below: 18, farther: 42 };
    const top = py + topOffsets[placement];
    ctx.fillStyle = active ? color : '#fff';
    pill(ctx, left, top, width, 20, 5);
    ctx.fill();
    label(ctx, text, left + width / 2, top + 10, { color: active ? '#fff' : colors.muted, size: textSize });
  }

  function pill(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function samePoint(x, y, coordinates) {
    return Math.abs(x - coordinates[0]) < 0.001 && Math.abs(y - coordinates[1]) < 0.001;
  }

  function drawMarkers(ctx, variant) {
    for (const [letter, x, y] of marks) {
      const isStart = samePoint(x, y, variant.start);
      if (samePoint(x, y, variant.load)) {
        marker(ctx, x, y, 'A', { caption: variant.loadLabel, color: colors.load });
      } else if (samePoint(x, y, variant.turnPoint)) {
        marker(ctx, x, y, isStart ? 'S' : letter, {
          caption: isStart ? `Start / Drehung ${letter}` : `Drehung ${letter}`,
          color: isStart ? colors.start : colors.turn,
          placement: 'above',
        });
      } else if (isStart) {
        marker(ctx, x, y, 'S', { caption: `Start ${letter}`, color: colors.start });
      } else {
        marker(ctx, x, y, letter);
      }
    }
    for (const [code, x, y, placement] of goals) {
      const active = samePoint(x, y, variant.target);
      if (active) {
        marker(ctx, x, y, 'Z', { caption: variant.targetLabel, color: colors.target, placement });
      } else {
        marker(ctx, x, y, code, { placement });
      }
    }
  }

  function drawRobot(ctx, x, y, heading) {
    ctx.save();
    ctx.translate(...point(x, y));
    ctx.rotate(heading * Math.PI / 180);
    ctx.fillStyle = colors.ink;
    for (const left of [-20, 13]) {
      pill(ctx, left, -12, 7, 28, 3);
      ctx.fill();
    }
    pill(ctx, -15, -21, 30, 43, 6);
    ctx.fillStyle = '#ffcf55';
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#fff8db';
    pill(ctx, -8, -1, 16, 13, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(8, -5);
    ctx.lineTo(-8, -5);
    ctx.closePath();
    ctx.fillStyle = colors.ink;
    ctx.fill();
    ctx.restore();
  }

  function makePhases(variant) {
    const { start, load, turnPoint, target } = variant;
    const turnSide = variant.turn < 0 ? 'links' : 'rechts';
    const travelTime = (from, to) => 1200 * Math.hypot(to[0] - from[0], to[1] - from[1]);
    const phases = [
      { duration: travelTime(start, load), from: start, to: load, text: `Vorwärts zu ${variant.loadLabel}` },
      { duration: variant.holdSeconds * 1000, from: load, display: variant.loadWord, text: `${variant.loadLabel} · ${variant.holdSeconds} s Stillstand` },
      { duration: travelTime(load, turnPoint), from: load, to: turnPoint, text: `Rückwärts zu ${variant.turnLabel}` },
      { duration: 950, from: turnPoint, turn: true, text: `Auf der Stelle 90° nach ${turnSide}` },
      { duration: travelTime(turnPoint, target), from: turnPoint, to: target, turned: true, text: `Vorwärts zu ${variant.targetLabel}` },
      { duration: 800, from: target, turned: true, display: variant.unloadWord, text: `${variant.targetLabel} · Signalton`, sound: { frequency: variant.tone, seconds: 0.4 } },
      { duration: 0, from: target, turned: true, display: variant.unloadWord, text: `Fertig am ${variant.targetLabel}` },
    ];
    let elapsed = 0;
    for (const phase of phases) {
      phase.start = elapsed;
      elapsed += phase.duration;
    }
    return phases;
  }

  globalThis.mountSimulation = function mountSimulation(root, variant) {
    const scope = root.matches('[data-sim-task]') ? root : root.querySelector('[data-sim-task]');
    if (!scope) return;
    const canvas = scope.querySelector('[data-sim-map]');
    const ctx = canvas.getContext('2d');
    const play = scope.querySelector('[data-sim-play]');
    const step = scope.querySelector('[data-sim-step]');
    const reset = scope.querySelector('[data-sim-reset]');
    const mute = scope.querySelector('[data-sim-mute]');
    const status = scope.querySelector('[data-sim-status]');
    const display = scope.querySelector('[data-sim-display]');
    if (!ctx) {
      status.textContent = 'Die Simulation ist in diesem Browser nicht verfügbar.';
      play.disabled = step.disabled = reset.disabled = mute.disabled = true;
      return;
    }

    const base = document.createElement('canvas');
    base.width = canvas.width;
    base.height = canvas.height;
    const baseContext = base.getContext('2d');
    drawMat(baseContext, base);
    drawRoute(baseContext, variant);
    drawMarkers(baseContext, variant);
    const phases = makePhases(variant);
    const end = phases[phases.length - 1].start;
    let elapsed = -1;
    let running = false;
    let animation = 0;
    let lastFrame = 0;
    let previousPhase;
    let audio;
    let oscillator;
    let soundGeneration = 0;

    function prepareAudio() {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio || mute.checked) return;
      try {
        audio ??= new Audio();
        if (audio.state !== 'running') audio.resume().catch(() => {});
      } catch {
        // Playback remains usable when browser audio is unavailable.
      }
    }

    function stopTone() {
      soundGeneration += 1;
      oscillator?.stop();
      oscillator = undefined;
    }

    function tone({ frequency, seconds }) {
      const node = audio.createOscillator();
      oscillator = node;
      const gain = audio.createGain();
      node.frequency.value = frequency;
      node.connect(gain);
      gain.connect(audio.destination);
      const now = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds - 0.02);
      node.onended = () => {
        node.disconnect();
        gain.disconnect();
        if (oscillator === node) oscillator = undefined;
      };
      node.start(now);
      node.stop(now + seconds);
    }

    function playPhaseSound(sound) {
      stopTone();
      if (!sound || !audio || mute.checked) return;
      const generation = soundGeneration;
      function playIfCurrent() {
        if (generation === soundGeneration && !mute.checked && scope.isConnected && audio.state === 'running') {
          tone(sound);
        }
      }
      if (audio.state === 'running') playIfCurrent();
      else audio.resume().then(playIfCurrent).catch(() => {});
    }

    function draw() {
      const phase = phases.findLast((candidate) => elapsed >= candidate.start);
      const progress = phase?.duration ? (elapsed - phase.start) / phase.duration : 0;
      const from = phase?.from ?? variant.start;
      const to = phase?.to ?? from;
      const turnProgress = phase?.turn ? progress : Number(Boolean(phase?.turned));
      const x = from[0] + (to[0] - from[0]) * progress;
      const y = from[1] + (to[1] - from[1]) * progress;
      ctx.drawImage(base, 0, 0);
      drawRobot(ctx, x, y, variant.heading + variant.turn * turnProgress);

      if (phase !== previousPhase) {
        display.textContent = phase?.display ?? '—';
        status.textContent = phase?.text ?? 'Bereit';
        previousPhase = phase;
        playPhaseSound(phase?.sound);
      }
      play.textContent = running ? 'Pausieren' : elapsed >= end ? 'Erneut abspielen' : 'Abspielen';
      step.disabled = elapsed >= end;
    }

    function pause() {
      running = false;
      if (animation) cancelAnimationFrame(animation);
      animation = 0;
      stopTone();
    }

    function frame(now) {
      if (!scope.isConnected) {
        pause();
        return;
      }
      elapsed = Math.min(end, elapsed + Math.min(now - lastFrame, 100));
      lastFrame = now;
      if (elapsed >= end) pause();
      draw();
      if (running) animation = requestAnimationFrame(frame);
    }

    play.addEventListener('click', () => {
      if (running) {
        pause();
      } else {
        prepareAudio();
        if (elapsed < 0 || elapsed >= end) elapsed = 0;
        running = true;
        lastFrame = performance.now();
        animation = requestAnimationFrame(frame);
      }
      draw();
    });

    step.addEventListener('click', () => {
      pause();
      prepareAudio();
      const next = phases.find((phase) => phase.start > elapsed);
      if (next) elapsed = next.start;
      draw();
    });

    reset.addEventListener('click', () => {
      pause();
      elapsed = -1;
      draw();
    });

    mute.addEventListener('change', () => {
      if (mute.checked) stopTone();
      else prepareAudio();
    });

    draw();
    return () => {
      pause();
      audio?.close().catch(() => {});
    };
  };
})();
