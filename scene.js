/* An original, local canvas study of the systems behind my work. */
(() => {
  'use strict';
  const canvas = document.getElementById('signal-canvas');
  const stage = canvas?.closest('.signal-stage');
  if (!canvas || !stage) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const TAU = Math.PI * 2;
  const COLUMNS = 44;
  const ROWS = 20;
  const COUNT = COLUMNS * ROWS;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const palette = ['124,154,255', '96,228,204', '225,237,255'];
  const modeButtons = [...document.querySelectorAll('[data-scene-mode]')];
  const pauseButton = document.getElementById('scene-pause');
  const copy = {
    agents: ['Agent systems', 'I connect retrieval, customer data, and predictive models into one workflow.'],
    vision: ['Computer vision', 'I build models that interpret images, gestures, and visual scenes.'],
    data: ['Data engineering', 'I bring customer, product, and sales data together for useful analysis.']
  };

  let width = 1;
  let height = 1;
  let mode = 'agents';
  let paused = reducedMotion.matches;
  let manuallyPaused = false;
  let motionOptIn = false;
  let visible = true;
  let frame = null;
  let lastTime = null;
  let elapsed = 0;
  let morph = 1;
  let pixelRatio = 0;
  let pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let current = [];
  let origin = [];
  let destination = [];
  const camera = { pitch: 0.38, yawOffset: -0.44, roll: -0.32, yaw: 0, speed: 0.065, dataMix: 0, agentMix: 1 };
  const projected = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0, perspective: 1 }));
  const depthOrder = Array.from({ length: COUNT }, (_, index) => index);
  const backdrop = document.createElement('canvas');
  const backdropContext = backdrop.getContext('2d');

  function glowSprite(stops) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 96;
    const painter = sprite.getContext('2d');
    const glow = painter.createRadialGradient(48, 48, 0, 48, 48, 48);
    stops.forEach(([offset, color]) => glow.addColorStop(offset, color));
    painter.fillStyle = glow;
    painter.fillRect(0, 0, 96, 96);
    return sprite;
  }
  const particleGlows = palette.map(color => glowSprite([[0, `rgba(${color},1)`], [1, `rgba(${color},0)`]]));
  const signalGlow = glowSprite([[0, 'rgba(219,244,255,.85)'], [0.15, 'rgba(114,176,255,.4)'], [1, 'rgba(66,113,255,0)']]);
  const centerGlow = glowSprite([[0, 'rgba(212,234,255,.65)'], [0.12, 'rgba(95,144,255,.35)'], [1, 'rgba(66,113,255,0)']]);

  function shape(name) {
    return Array.from({ length: COUNT }, (_, index) => {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const u = column / COLUMNS * TAU;
      const v = row / ROWS * TAU;
      if (name === 'vision') {
        const latitude = (row + 0.5) / ROWS * Math.PI;
        return {
          x: Math.sin(latitude) * Math.cos(u) * 1.52,
          y: Math.cos(latitude) * 1.52,
          z: Math.sin(latitude) * Math.sin(u) * 1.02
        };
      }
      if (name === 'data') {
        const layer = row % 3;
        const depth = Math.floor(row / 3);
        const x = (column / (COLUMNS - 1) - 0.5) * 3.25;
        const z = (depth / 6 - 0.5) * 2.15;
        return {
          x,
          y: (layer - 1) * 0.72 + Math.sin(x * 1.6 + z * 1.2) * 0.13,
          z
        };
      }
      const radius = 1.16 + Math.cos(v) * 0.4;
      return {
        x: Math.cos(u) * radius,
        y: Math.sin(u) * radius,
        z: Math.sin(v) * 0.4
      };
    });
  }

  destination = shape(mode);
  current = destination.map(point => ({ ...point }));
  origin = current.map(point => ({ ...point }));

  function project(point, view, output = {}) {
    const { cx, sx, cy, sy, cz, sz, scale } = view;
    const y = point.y * cx - point.z * sx;
    const z1 = point.y * sx + point.z * cx;
    const x = point.x * cy + z1 * sy;
    const z = -point.x * sy + z1 * cy;
    const rotatedX = x * cz - y * sz;
    const rotatedY = x * sz + y * cz;
    const perspective = 4.8 / (4.8 + z);
    output.x = width * 0.5 + rotatedX * scale * perspective;
    output.y = height * 0.47 + rotatedY * scale * perspective;
    output.z = z;
    output.perspective = perspective;
    return output;
  }

  function paintBackdrop(context) {
    const x = width * 0.5;
    const y = height * 0.46;
    const radius = Math.min(width, height) * 0.56;
    const aura = context.createRadialGradient(x, y, radius * 0.05, x, y, radius);
    aura.addColorStop(0, 'rgba(50,86,189,0.19)');
    aura.addColorStop(0.62, 'rgba(47,77,157,0.055)');
    aura.addColorStop(1, 'rgba(47,77,157,0)');
    context.fillStyle = aura;
    context.fillRect(0, 0, width, height);

    context.lineWidth = 0.6;
    context.strokeStyle = 'rgba(130,159,209,0.065)';
    const gap = Math.max(35, width / 13);
    for (let gx = (width / 2) % gap; gx < width; gx += gap) {
      context.beginPath(); context.moveTo(gx, height * 0.08); context.lineTo(gx, height * 0.91); context.stroke();
    }
    for (let gy = (height / 2) % gap; gy < height; gy += gap) {
      context.beginPath(); context.moveTo(width * 0.04, gy); context.lineTo(width * 0.96, gy); context.stroke();
    }

    // Grounding ellipses give the particle sculpture a quiet sense of depth.
    context.save();
    context.translate(x, height * 0.81);
    const ringRadius = Math.min(width * 0.36, height * 0.35);
    for (let ring = 0; ring < 3; ring++) {
      context.beginPath();
      context.strokeStyle = `rgba(121,158,233,${0.13 - ring * 0.035})`;
      context.ellipse(0, 0, ringRadius * (1 + ring * 0.17), ringRadius * (0.16 + ring * 0.035), 0, 0, TAU);
      context.stroke();
    }
    context.restore();

    context.strokeStyle = 'rgba(158,183,221,0.22)';
    context.lineWidth = 1;
    [[width * 0.08, height * 0.14], [width * 0.92, height * 0.14], [width * 0.08, height * 0.77], [width * 0.92, height * 0.77]].forEach(([bx, by], index) => {
      const dx = index % 2 ? -1 : 1;
      const dy = index < 2 ? 1 : -1;
      context.beginPath(); context.moveTo(bx, by + dy * 9); context.lineTo(bx, by); context.lineTo(bx + dx * 9, by); context.stroke();
    });
  }

  function advance(delta) {
    elapsed += delta;
    morph = Math.min(1, morph + delta / 1.25);
    const follow = 1 - Math.exp(-3.4 * delta);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;
    const settle = 1 - Math.exp(-4 * delta);
    const data = mode === 'data';
    camera.pitch += ((data ? -0.52 : 0.38) - camera.pitch) * settle;
    camera.yawOffset += ((data ? -0.4 : -0.44) - camera.yawOffset) * settle;
    camera.roll += ((data ? -0.08 : -0.32) - camera.roll) * settle;
    const nextSpeed = data ? 0.025 : 0.065;
    // Integrate the eased speed analytically so refresh rate cannot change the turn.
    camera.yaw += nextSpeed * delta + (camera.speed - nextSpeed) * settle / 4;
    camera.speed += (nextSpeed - camera.speed) * settle;
    camera.dataMix += ((data ? 1 : 0) - camera.dataMix) * settle;
    camera.agentMix += ((mode === 'agents' ? 1 : 0) - camera.agentMix) * settle;
  }

  function draw() {
    const eased = morph < 0.5 ? 4 * morph * morph * morph : 1 - Math.pow(-2 * morph + 2, 3) / 2;
    for (let index = 0; index < COUNT; index++) {
      current[index].x = origin[index].x + (destination[index].x - origin[index].x) * eased;
      current[index].y = origin[index].y + (destination[index].y - origin[index].y) * eased;
      current[index].z = origin[index].z + (destination[index].z - origin[index].z) * eased;
    }
    context.clearRect(0, 0, width, height);
    context.drawImage(backdrop, 0, 0, width, height);
    const ringRadius = Math.min(width * 0.36, height * 0.35);
    context.beginPath();
    context.fillStyle = 'rgba(135,226,222,.7)';
    context.arc(width * 0.5 + Math.cos(elapsed * 0.16) * ringRadius, height * 0.81 + Math.sin(elapsed * 0.16) * ringRadius * 0.16, 1.8, 0, TAU);
    context.fill();
    const rotation = {
      x: camera.pitch + pointer.y * 0.19 + Math.sin(elapsed * 0.15) * 0.1,
      y: camera.yawOffset + pointer.x * 0.32 + camera.yaw,
      z: camera.roll + Math.sin(elapsed * 0.1) * 0.05 * (1 - camera.dataMix)
    };
    const view = { cx: Math.cos(rotation.x), sx: Math.sin(rotation.x), cy: Math.cos(rotation.y), sy: Math.sin(rotation.y), cz: Math.cos(rotation.z), sz: Math.sin(rotation.z), scale: Math.min(width * 0.255, height * 0.265) };
    for (let index = 0; index < COUNT; index++) project(current[index], view, projected[index]);

    // Sparse, coherent contours reveal the form without covering it in a mesh.
    context.lineWidth = 0.65;
    function contours(data, weight) {
      if (weight < 0.002) return;
      context.globalAlpha = weight;
      for (let row = 0; row < ROWS; row += data ? 1 : 4) {
      context.beginPath();
      for (let column = 0; column <= COLUMNS; column++) {
        if (data && column === COLUMNS) break;
        const point = projected[row * COLUMNS + column % COLUMNS];
        column ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y);
      }
      context.strokeStyle = row % 3 === 0 ? 'rgba(93,220,209,0.25)' : 'rgba(120,153,255,0.23)';
      context.stroke();
    }
    if (!data) {
      for (let column = 0; column < COLUMNS; column += 7) {
        context.beginPath();
        for (let row = 0; row <= ROWS; row++) {
          const point = projected[(row % ROWS) * COLUMNS + column];
          row ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y);
        }
        context.strokeStyle = 'rgba(120,153,255,0.19)';context.stroke();
      }
    }
      context.globalAlpha = 1;
    }
    contours(false, 1 - camera.dataMix);
    contours(true, camera.dataMix);

    depthOrder.sort((a, b) => projected[b].z - projected[a].z);
    for (const index of depthOrder) {
      const point = projected[index];
      const colorIndex = index % 23 === 0 ? 2 : index % 5 === 0 ? 1 : 0;
      const alpha = Math.min(0.98, Math.max(0.22, 0.72 - point.z * 0.22));
      const pulse = 1 + Math.sin(elapsed * 0.8 + index * 0.16) * 0.13;
      const radius = (colorIndex === 2 ? 1.85 : colorIndex === 1 ? 1.45 : 1.05) * point.perspective * pulse;
      if (colorIndex === 2 || (colorIndex === 1 && index % 25 === 0)) {
        const size = radius * 5;
        context.globalAlpha = alpha * 0.26;
        context.drawImage(particleGlows[colorIndex], point.x - size, point.y - size, size * 2, size * 2);
        context.globalAlpha = 1;
      }
      context.fillStyle = `rgba(${palette[colorIndex]},${alpha})`;
      context.beginPath();context.arc(point.x, point.y, radius, 0, TAU);context.fill();
    }

    // A few intentional signal paths anchor the form; this is an abstract study.
    if (camera.agentMix > 0.002) {
      context.globalAlpha = camera.agentMix;
      for (let band = 0; band < 2; band++) {
        const start = elapsed * 0.22 + band * Math.PI;
        context.beginPath();
        for (let step = 0; step <= 36; step++) {
          const u = start + step / 36 * Math.PI * 0.55;
          const v = band ? Math.PI * 0.6 : -Math.PI * 0.5;
          const r = 1.16 + Math.cos(v) * 0.4;
          const point = project({ x: Math.cos(u) * r, y: Math.sin(u) * r, z: Math.sin(v) * 0.4 }, view);
          step ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y);
        }
        context.strokeStyle = band ? 'rgba(105,222,200,0.7)' : 'rgba(125,164,255,0.86)';
        context.shadowColor = band ? '#69dec8' : '#4271ff';
        context.shadowBlur = 12;context.lineWidth = 1.4;context.stroke();context.shadowBlur = 0;
        const u = start + Math.PI * 0.55;
        const v = band ? Math.PI * 0.6 : -Math.PI * 0.5;
        const r = 1.16 + Math.cos(v) * 0.4;
        const point = project({ x: Math.cos(u) * r, y: Math.sin(u) * r, z: Math.sin(v) * 0.4 }, view);
        context.drawImage(signalGlow, point.x - 24, point.y - 24, 48, 48);
        context.fillStyle = '#f3f5fc';context.beginPath();context.arc(point.x, point.y, 2.7, 0, TAU);context.fill();
      }
      context.globalAlpha = 1;
    }
    const core = project({ x: 0, y: 0, z: 0 }, view);
    const coreSize = 42 - camera.dataMix * 20;
    context.drawImage(centerGlow, core.x - coreSize, core.y - coreSize, coreSize * 2, coreSize * 2);
    context.strokeStyle = 'rgba(174,211,255,.75)';context.lineWidth = 0.8;context.beginPath();context.arc(core.x, core.y, 6, 0, TAU);context.stroke();
    context.fillStyle = '#dceaff';context.beginPath();context.arc(core.x, core.y, 1.8, 0, TAU);context.fill();
  }

  function active() {
    return visible && !document.hidden && !paused && (!reducedMotion.matches || motionOptIn);
  }
  function tick(timestamp) {
    frame = null;
    if (!active()) { lastTime = null; return; }
    const delta = lastTime === null ? 0 : Math.max(0, Math.min((timestamp - lastTime) / 1000, 0.05));
    lastTime = timestamp;
    advance(delta);
    draw();
    frame = requestAnimationFrame(tick);
  }
  function synchronize() {
    if (active()) {
      if (frame === null) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }
  }
  function setMode(nextMode) {
    if (!copy[nextMode] || nextMode === mode) return;
    origin = current.map(point => ({ ...point }));
    mode = nextMode;
    destination = shape(mode);
    morph = (reducedMotion.matches && !motionOptIn) || paused ? 1 : 0;
    modeButtons.forEach(button => {
      const selected = button.dataset.sceneMode === mode;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('active', selected);
    });
    const title = document.getElementById('scene-title');
    const description = document.getElementById('scene-description');
    if (title) title.textContent = copy[mode][0];
    if (description) description.textContent = copy[mode][1];
    stage.dispatchEvent(new CustomEvent('portfolio:scenechange', { bubbles: true, detail: { mode } }));
    if (paused) {
      // A deliberate mode selection changes the still image, without starting motion.
      camera.pitch = mode === 'data' ? -0.52 : 0.38;
      camera.yawOffset = mode === 'data' ? -0.4 : -0.44;
      camera.roll = mode === 'data' ? -0.08 : -0.32;
      camera.dataMix = mode === 'data' ? 1 : 0;
      camera.agentMix = mode === 'agents' ? 1 : 0;
      draw();
    }
    synchronize();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width || stageRect.width);
    const nextHeight = Math.max(1, rect.height || stageRect.height || 480);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (width === nextWidth && height === nextHeight && pixelRatio === dpr) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    backdropContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintBackdrop(backdropContext);
    draw();
    synchronize();
  }
  stage.addEventListener('pointermove', event => {
    if (!active() || event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    pointer.tx = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
    pointer.ty = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    if (!active()) return;
    pointer.tx = 0;pointer.ty = 0;
  }, { passive: true });
  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.sceneMode)));
  function updatePauseControl() {
    document.body.classList.toggle('motion-paused', paused);
    if (!pauseButton) return;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Resume visual motion' : 'Pause visual motion');
    pauseButton.textContent = paused ? 'Play motion ↗' : 'Pause motion Ⅱ';
  }
  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    manuallyPaused = paused;
    if (!paused && reducedMotion.matches) motionOptIn = true;
    updatePauseControl();
    synchronize();
  });
  document.addEventListener('visibilitychange', synchronize);
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches || manuallyPaused;
    motionOptIn = false;
    updatePauseControl();
    synchronize();
  });
  new IntersectionObserver(entries => {visible = entries[0].isIntersecting;synchronize();}, { rootMargin: '80px' }).observe(stage);
  new ResizeObserver(resize).observe(stage);
  updatePauseControl();
  setMode('agents');
  resize();
})();
