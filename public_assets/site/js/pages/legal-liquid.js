(() => {
  const shell = document.querySelector('.legal-shell');
  if (!shell || document.getElementById('masthead-canvas')) return;

  shell.id = shell.id || 'masthead';

  const layer = document.createElement('div');
  layer.className = 'legal-liquid-layer';
  layer.setAttribute('aria-hidden', 'true');

  const background = document.createElement('div');
  background.className = 'masthead__bg';

  const canvas = document.createElement('canvas');
  canvas.className = 'masthead__canvas';
  canvas.id = 'masthead-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  layer.append(background, canvas);
  shell.prepend(layer);

  if (document.getElementById('liquid-metaball')) return;

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';

  const definitions = document.createElementNS(svgNamespace, 'defs');
  const filter = document.createElementNS(svgNamespace, 'filter');
  filter.id = 'liquid-metaball';

  const blur = document.createElementNS(svgNamespace, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '9');
  blur.setAttribute('result', 'blur');

  const matrix = document.createElementNS(svgNamespace, 'feColorMatrix');
  matrix.setAttribute('in', 'blur');
  matrix.setAttribute('mode', 'matrix');
  matrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9');
  matrix.setAttribute('result', 'liquid');

  filter.append(blur, matrix);
  definitions.append(filter);
  svg.append(definitions);
  document.body.append(svg);
})();
