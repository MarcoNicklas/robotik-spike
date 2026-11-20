(() => {
  'use strict';

  const fieldSize = 88;
  const origin = [41, 40];
  const colors = {
    ink: '#15243b',
    muted: '#495d71',
    route: '#087768',
    start: '#065b4f',
    target: '#9a4b13',
    storage: '#c9d2dc',
    storageLine: '#a6b4c3',
  };
  const shelves = [
    [0, 1, 1, 2.6],
    [2, 0, 3, 1],
    [3, 5, 1, 2],
    [4.25, 5, 0.75, 2],
    [2, 4.8, 0.72, 2.2],
  ];
  const marks = [
    ['A', 1.5, 7.5],
    ['B', 1.5, 5.75],
    ['C', 1.5, 4],
    ['D', 1.5, 2.25],
    ['E', 1.5, 0.5],
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
      ctx.lineWidth = 1.5;
      ctx.strokeRect(left, top, width * fieldSize, height * fieldSize);
    }
  }

  function label(ctx, text, x, y, options = {}) {
    const { color = colors.ink, size = 14, weight = 700, align = 'center' } = options;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
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

  function shelf(ctx, [x, y, width, height]) {
    box(ctx, x, y, width, height, colors.storage, colors.storageLine);
    const [left, top] = point(x, y);
    const right = left + width * fieldSize;
    const bottom = top + height * fieldSize;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
    for (let lineX = left - (bottom - top); lineX < right; lineX += 11) {
      stroke(ctx, [[lineX, top], [lineX + bottom - top, bottom]], '#abbaca');
    }
    ctx.restore();
  }

  function zone(ctx, bounds, title, fill, outline, textColor, titleInset = 13) {
    const [x, y, width] = bounds;
    box(ctx, ...bounds, fill, outline);
    const [center, top] = point(x + width / 2, y);
    label(ctx, title, center, top + titleInset, { color: textColor, size: 10 });
  }

  function drawMat(ctx, canvas) {
    ctx.fillStyle = '#eef3f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const [left, top] = point(0, 0);
    label(ctx, 'FAHRMATTE', left, top - 18, { align: 'left', size: 14 });
    label(ctx, 'DRAUFSICHT', point(5, 0)[0], top - 18, {
      align: 'right', color: colors.muted, size: 11,
    });
    box(ctx, 0, 0, 5, 8, '#fbfcfd', '#667b8a');
    for (let x = 1; x < 5; x++) stroke(ctx, [point(x, 0), point(x, 8)], '#dce4e9');
    for (let y = 1; y < 8; y++) stroke(ctx, [point(0, y), point(5, y)], '#dce4e9');
    for (const bounds of shelves) shelf(ctx, bounds);
    zone(ctx, [1, 0, 1, 1], 'ABLADEN', '#f7c6cc', '#b46a78', '#7a3a49');
    zone(ctx, [4, 2.6, 1, 1], 'RAMPE', '#c0e3f6', '#7aafcc', '#2b5973');
    zone(ctx, [1.04, 3.66, 0.92, 0.88], 'FELD 1', '#fcf0c0', '#ceab4c', '#684e0c', 8);
    zone(ctx, [3.04, 2.66, 0.92, 0.88], 'FELD 2', '#fcf0c0', '#ceab4c', '#684e0c');
    zone(ctx, [1, 7, 1, 1], 'STARTFELD', '#dce9e1', '#9bbba8', '#375c4d');
    for (const [x, y] of [[0.1, 0], [0.5, 0.35], [0.1, 7.4], [4.3, 7.5]]) {
      box(ctx, x, y, 0.30, 0.22, '#c6a381', '#9b7658');
      box(ctx, x + 0.09, y, 0.02, 0.22, '#ead1b1');
      box(ctx, x + 0.19, y, 0.02, 0.22, '#ead1b1');
    }
    const [legendX, legendY] = point(0, 8);
    ctx.fillStyle = colors.storage;
    ctx.fillRect(legendX, legendY + 14, 14, 12);
    stroke(ctx, [[legendX, legendY + 14], [legendX + 12, legendY + 26]], colors.storageLine);
    label(ctx, 'Lagerfläche', legendX + 23, legendY + 20, {
      align: 'left', color: colors.muted, size: 12,
    });
  }

  function arrow(ctx, x, y, heading) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, 6);
    ctx.lineTo(-9, 6);
    ctx.closePath();
    ctx.fillStyle = colors.route;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  function drawRoute(ctx, variant) {
    const from = point(...variant.start);
    const to = point(...variant.target);
    ctx.save();
    ctx.lineCap = 'round';
    stroke(ctx, [from, to], '#fff', 14);
    stroke(ctx, [from, to], colors.route, 7);
    arrow(ctx, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, variant.heading);
    ctx.restore();
  }

  function marker(ctx, x, y, letter, role) {
    const active = Boolean(role);
    const color = role === 'Start' ? colors.start : colors.target;
    const [px, py] = point(x, y);
    ctx.beginPath();
    ctx.arc(px, py, active ? 18 : 6, 0, Math.PI * 2);
    ctx.fillStyle = active ? color : colors.muted;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = active ? 3 : 2;
    ctx.stroke();
    if (active) label(ctx, role[0], px, py, { color: '#fff', size: 16 });

    const caption = active ? `${role} ${letter}` : letter;
    ctx.font = '700 14px system-ui, sans-serif';
    const left = px + (active ? 33 : 12);
    const width = ctx.measureText(caption).width + 16;
    ctx.fillStyle = active ? color : '#fff';
    pill(ctx, left, py - 12, width, 24, 6);
    ctx.fill();
    label(ctx, caption, left + width / 2, py, { color: active ? '#fff' : colors.muted });
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
      let role = '';
      if (samePoint(x, y, variant.start)) role = 'Start';
      if (samePoint(x, y, variant.target)) role = 'Ziel';
      marker(ctx, x, y, letter, role);
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
    const turnSide = variant.turn < 0 ? 'links' : 'rechts';
    const distance = Math.hypot(variant.target[0] - variant.start[0], variant.target[1] - variant.start[1]);
    const phases = [
      { id: 'word', duration: 1200, text: `Die Hub-Anzeige zeigt „${variant.word}“.` },
      { id: 'drive', duration: 1200 * distance, text: `Der Roboter fährt geradeaus zu ${variant.targetLabel}.` },
      { id: 'stop', duration: 450, text: 'Der Roboter hält am Ziel an.' },
      { id: 'turn', duration: 950, text: `Der Roboter dreht am Ziel um 90° nach ${turnSide}.` },
      { id: 'tone', duration: 500, text: 'Der Hub spielt am Ziel einen kurzen Ton.' },
    ];
    let start = 0;
    for (const phase of phases) {
      phase.start = start;
      start += phase.duration;
    }
    return [...phases, { id: 'done', start, duration: 0, text: 'Fertig. Der Roboter steht am Ziel.' }];
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
    let previousPhase = 'ready';
    let audio;
    let oscillator;

    function prepareAudio() {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio || mute.checked) return;
      try {
        audio ??= new Audio();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
      } catch {
        // Playback remains usable when browser audio is unavailable.
      }
    }

    function stopTone() {
      oscillator?.stop();
      oscillator = undefined;
    }

    function tone() {
      if (mute.checked || !audio || audio.state !== 'running') return;
      stopTone();
      const node = audio.createOscillator();
      oscillator = node;
      const gain = audio.createGain();
      node.frequency.value = Number(variant.tone) || 440;
      node.connect(gain);
      gain.connect(audio.destination);
      const now = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      node.onended = () => {
        node.disconnect();
        gain.disconnect();
        if (oscillator === node) oscillator = undefined;
      };
      node.start(now);
      node.stop(now + 0.4);
    }

    function draw() {
      const phase = phases.findLast((candidate) => elapsed >= candidate.start);
      const phaseId = phase?.id ?? 'ready';
      let distance = 0;
      let turnProgress = 0;
      if (phaseId === 'drive') distance = (elapsed - phase.start) / phase.duration;
      if (['stop', 'turn', 'tone', 'done'].includes(phaseId)) distance = 1;
      if (phaseId === 'turn') turnProgress = (elapsed - phase.start) / phase.duration;
      if (['tone', 'done'].includes(phaseId)) turnProgress = 1;
      const x = variant.start[0] + (variant.target[0] - variant.start[0]) * distance;
      const y = variant.start[1] + (variant.target[1] - variant.start[1]) * distance;
      ctx.drawImage(base, 0, 0);
      drawRobot(ctx, x, y, variant.heading + variant.turn * turnProgress);

      if (phaseId !== previousPhase) {
        display.textContent = phaseId === 'word' ? variant.word : '—';
        status.textContent = phase?.text ?? 'Der Roboter steht am Start.';
        previousPhase = phaseId;
        if (phaseId === 'tone') {
          if (audio?.state === 'suspended' && !mute.checked) {
            audio.resume().then(() => {
              if (previousPhase === 'tone' && elapsed === phase.start) tone();
            }).catch(() => {});
          } else {
            tone();
          }
        }
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
