(function () {
  const COUNT_MIN = 1;
  const COUNT_MAX = 24;
  const SIDES_MIN = 2;
  const SIDES_MAX = 1000;
  const GENERIC_SHAPE_MIN = 21;
  const ROLL_MS = 580;
  const HISTORY_LIMIT = 8;

  const D6_PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const els = {
    countPicker: document.getElementById('dice-count-picker'),
    countCustomWrap: document.getElementById('dice-count-custom-wrap'),
    countCustom: document.getElementById('dice-count-custom'),
    sidesPicker: document.getElementById('dice-sides-picker'),
    sidesCustomWrap: document.getElementById('dice-sides-custom-wrap'),
    sidesCustom: document.getElementById('dice-sides-custom'),
    modifier: document.getElementById('dice-modifier'),
    sort: document.getElementById('dice-sort'),
    stage: document.getElementById('dice-stage'),
    empty: document.getElementById('dice-empty'),
    tray: document.getElementById('dice-tray'),
    summary: document.getElementById('dice-summary'),
    rollButton: document.getElementById('dice-roll'),
    clearButton: document.getElementById('dice-clear'),
    historyWrap: document.getElementById('dice-history-wrap'),
    history: document.getElementById('dice-history')
  };

  let activeCount = '2';
  let activeSides = '6';
  let rolling = false;
  let lastCustomCount = 6;
  let lastCustomSides = 30;

  if (!els.stage || !els.tray || !els.rollButton) {
    console.error('Dice roll failed to initialise.');
    return;
  }

  bindEvents();
  syncCustomVisibility('count');
  syncCustomVisibility('sides');
  renderTrayPlaceholder();

  function bindEvents() {
    els.countPicker?.querySelectorAll('.dice-pill').forEach((button) => {
      button.addEventListener('click', () => selectCount(button.dataset.count, button));
    });

    els.sidesPicker?.querySelectorAll('.dice-pill').forEach((button) => {
      button.addEventListener('click', () => selectSides(button.dataset.sides, button));
    });

    els.countCustom?.addEventListener('input', renderTrayPlaceholder);
    els.countCustom?.addEventListener('change', () => normalizeCustom('count'));
    els.sidesCustom?.addEventListener('input', renderTrayPlaceholder);
    els.sidesCustom?.addEventListener('change', () => normalizeCustom('sides'));

    els.rollButton.addEventListener('click', rollDice);
    els.clearButton?.addEventListener('click', clearResults);
    els.stage.addEventListener('click', () => {
      if (!rolling) rollDice();
    });
  }

  function selectCount(value, button) {
    if (!value || value === activeCount) return;
    const previous = activeCount;
    activeCount = value;

    els.countPicker.querySelectorAll('.dice-pill').forEach((item) => {
      const active = item === button || item.dataset.count === value;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    if (value === 'custom' && els.countCustom) {
      const preset = Number(previous);
      if (Number.isFinite(preset) && preset >= COUNT_MIN && preset <= COUNT_MAX) {
        els.countCustom.value = String(preset);
        lastCustomCount = preset;
      }
    }

    syncCustomVisibility('count');
    renderTrayPlaceholder();
  }

  function selectSides(value, button) {
    if (!value || value === activeSides) return;
    const previous = activeSides;
    activeSides = value;

    els.sidesPicker.querySelectorAll('.dice-pill').forEach((item) => {
      const active = item === button || item.dataset.sides === value;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    if (value === 'custom' && els.sidesCustom) {
      const preset = Number(previous);
      if (Number.isFinite(preset) && preset >= SIDES_MIN && preset <= SIDES_MAX) {
        els.sidesCustom.value = String(preset);
        lastCustomSides = preset;
      }
    }

    syncCustomVisibility('sides');
    renderTrayPlaceholder();
  }

  function syncCustomVisibility(kind) {
    if (kind === 'count' && els.countCustomWrap) {
      els.countCustomWrap.classList.toggle('is-visible', activeCount === 'custom');
    }
    if (kind === 'sides' && els.sidesCustomWrap) {
      els.sidesCustomWrap.classList.toggle('is-visible', activeSides === 'custom');
    }
  }

  function normalizeCustom(kind) {
    const input = kind === 'count' ? els.countCustom : els.sidesCustom;
    const min = kind === 'count' ? COUNT_MIN : SIDES_MIN;
    const max = kind === 'count' ? COUNT_MAX : SIDES_MAX;
    const fallback = kind === 'count' ? lastCustomCount : lastCustomSides;

    if (!input) return;

    const parsed = Number(input.value);
    const normalized = Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
    input.value = String(normalized);

    if (kind === 'count') lastCustomCount = normalized;
    else lastCustomSides = normalized;

    renderTrayPlaceholder();
  }

  function diceCount() {
    if (activeCount === 'custom') {
      const parsed = Number(els.countCustom?.value);
      if (!Number.isFinite(parsed)) return lastCustomCount;
      return clamp(Math.round(parsed), COUNT_MIN, COUNT_MAX);
    }
    return clamp(Number(activeCount || 2), COUNT_MIN, COUNT_MAX);
  }

  function diceSides() {
    if (activeSides === 'custom') {
      const parsed = Number(els.sidesCustom?.value);
      if (!Number.isFinite(parsed)) return lastCustomSides;
      return clamp(Math.round(parsed), SIDES_MIN, SIDES_MAX);
    }
    return clamp(Number(activeSides || 6), SIDES_MIN, SIDES_MAX);
  }

  function modifierValue() {
    const parsed = Number(els.modifier?.value || 0);
    if (!Number.isFinite(parsed)) return 0;
    return clamp(Math.round(parsed), -99, 99);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shapeSides(sides) {
    return sides === 100 ? 10 : sides;
  }

  function regularPolygonClip(sides) {
    const points = [];
    for (let i = 0; i < sides; i += 1) {
      const angle = ((Math.PI * 2 * i) / sides) - (Math.PI / 2);
      const x = 50 + (46 * Math.cos(angle));
      const y = 50 + (46 * Math.sin(angle));
      points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    }
    return `polygon(${points.join(', ')})`;
  }

  function getShapeMeta(sides) {
    const faceSides = shapeSides(sides);

    if (faceSides >= GENERIC_SHAPE_MIN) {
      return { className: 'die--shape-generic', clipPath: null };
    }

    if (faceSides === 2) {
      return { className: 'die--shape-coin', clipPath: null };
    }

    if (faceSides === 3 || faceSides === 4 || faceSides === 20) {
      return { className: 'die--shape-triangle', clipPath: null };
    }

    if (faceSides === 6) {
      return { className: 'die--shape-cube', clipPath: null };
    }

    if (faceSides === 8) {
      return { className: 'die--shape-diamond', clipPath: null };
    }

    if (faceSides === 10) {
      return { className: 'die--shape-d10', clipPath: null };
    }

    if (faceSides === 5 || faceSides === 12) {
      return { className: 'die--shape-pentagon', clipPath: null };
    }

    return {
      className: 'die--shape-polygon',
      clipPath: regularPolygonClip(faceSides)
    };
  }

  function shouldLargeText(value, sides) {
    const faceSides = shapeSides(sides);
    return faceSides > 20 || (value !== '?' && Number(value) >= 10);
  }

  function renderFace(value, sides) {
    const display = value === '?' ? '?' : Number(value);
    const useDots = sides === 6 && display >= 1 && display <= 6;
    return useDots
      ? renderDots(display)
      : `<span class="die__value">${display}</span>`;
  }

  function createDieMarkup(value, sides, index, rollingClass) {
    const display = value === '?' ? '?' : Number(value);
    const shape = getShapeMeta(sides);
    const tilt = ((index % 5) - 2) * 4;
    const clipStyle = shape.clipPath ? ` clip-path:${shape.clipPath};` : '';
    const classes = [
      'die',
      shape.className,
      shouldLargeText(display, sides) ? 'die--large-text' : '',
      rollingClass ? 'is-rolling' : ''
    ].filter(Boolean).join(' ');

    return `
      <div
        class="${classes}"
        style="--die-tilt:${tilt}deg;${clipStyle}"
        data-die="${index}"
        data-sides="${sides}"
        aria-label="${display === '?' ? 'Die waiting to roll' : `Die showing ${display}`}"
      >
        <span class="die__badge">d${sides}</span>
        ${renderFace(value, sides)}
      </div>
    `;
  }

  function updateDieFace(die, value, sides, rollingClass) {
    const display = value === '?' ? '?' : Number(value);
    die.classList.toggle('die--large-text', shouldLargeText(display, sides));
    die.classList.toggle('is-rolling', Boolean(rollingClass));
    die.setAttribute('aria-label', display === '?' ? 'Die waiting to roll' : `Die showing ${display}`);

    const badge = die.querySelector('.die__badge');
    const inner = renderFace(value, sides);
    if (badge) {
      die.innerHTML = `${badge.outerHTML}${inner}`;
    }
  }

  function renderDots(value) {
    const active = D6_PIPS[value] || [];
    const cells = Array.from({ length: 9 }, (_, index) =>
      `<span class="die__pip${active.includes(index) ? ' is-on' : ''}"></span>`
    ).join('');

    return `<div class="die__dots" aria-hidden="true">${cells}</div>`;
  }

  function renderTrayPlaceholder() {
    if (rolling || els.stage.classList.contains('has-results')) return;

    const count = diceCount();
    const sides = diceSides();
    els.tray.hidden = false;
    els.tray.innerHTML = Array.from({ length: count }, (_, index) =>
      createDieMarkup('?', sides, index, false)
    ).join('');
    els.stage.classList.remove('has-results');
    els.empty.hidden = count > 0;
  }

  async function rollDice() {
    if (rolling) return;

    const count = diceCount();
    const sides = diceSides();
    const modifier = modifierValue();
    const sort = Boolean(els.sort?.checked);

    rolling = true;
    els.rollButton.disabled = true;
    els.clearButton.disabled = true;
    els.stage.classList.add('has-results');
    els.empty.hidden = true;
    els.tray.hidden = false;

    const finalValues = Array.from({ length: count }, () => randomInt(1, sides));
    const displayOrder = sort ? [...finalValues].sort((a, b) => a - b) : finalValues;

    els.tray.innerHTML = Array.from({ length: count }, (_, index) =>
      createDieMarkup('?', sides, index, true)
    ).join('');

    const started = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        const done = now - started >= ROLL_MS;
        const dice = els.tray.querySelectorAll('.die');

        dice.forEach((die, index) => {
          const preview = done ? displayOrder[index] : randomInt(1, sides);
          updateDieFace(die, preview, sides, !done);
        });

        if (done) {
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });

    const subtotal = finalValues.reduce((sum, value) => sum + value, 0);
    const total = subtotal + modifier;

    updateSummary(count, sides, finalValues, modifier, subtotal, total);
    addHistory(count, sides, finalValues, modifier, total);

    rolling = false;
    els.rollButton.disabled = false;
    els.clearButton.disabled = false;
  }

  function updateSummary(count, sides, values, modifier, subtotal, total) {
    if (!els.summary) return;

    const modText = modifier === 0
      ? ''
      : modifier > 0
        ? ` + ${modifier} modifier`
        : ` − ${Math.abs(modifier)} modifier`;

    const breakdown = values.join(' + ');
    els.summary.hidden = false;
    els.summary.innerHTML = `
      <strong>${total}</strong> total
      <span aria-hidden="true">·</span>
      ${count}d${sides}: ${breakdown}${modText}
      <span aria-hidden="true">·</span>
      dice sum ${subtotal}
    `;
  }

  function addHistory(count, sides, values, modifier, total) {
    if (!els.history || !els.historyWrap) return;

    const item = document.createElement('li');
    const modPart = modifier ? (modifier > 0 ? ` + ${modifier}` : ` ${modifier}`) : '';
    item.innerHTML = `<strong>${total}</strong> — ${count}d${sides}: [${values.join(', ')}]${modPart}`;

    els.history.prepend(item);
    while (els.history.children.length > HISTORY_LIMIT) {
      els.history.lastElementChild?.remove();
    }

    els.historyWrap.hidden = false;
  }

  function clearResults() {
    els.stage.classList.remove('has-results');
    els.summary.hidden = true;
    els.empty.hidden = false;
    renderTrayPlaceholder();
  }
})();