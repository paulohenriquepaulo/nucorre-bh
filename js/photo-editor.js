const VIEW = 300;
const OUTPUT = 900;

let editor = null;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = url;
  });
}

function drawPreview() {
  if (!editor) return;
  const { ctx, img, baseScale, zoom, offsetX, offsetY, canvas } = editor;
  const scale = baseScale * zoom;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, VIEW, VIEW);
  ctx.save();
  ctx.translate(VIEW / 2 + offsetX, VIEW / 2 + offsetY);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 102, 0, 0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, VIEW - 3, VIEW - 3);
}

function exportBlob() {
  const { img, baseScale, zoom, offsetX, offsetY } = editor;
  const out = document.createElement('canvas');
  out.width = OUTPUT;
  out.height = OUTPUT;
  const ctx = out.getContext('2d');
  const ratio = OUTPUT / VIEW;
  const scale = baseScale * zoom * ratio;
  const ox = OUTPUT / 2 + offsetX * ratio;
  const oy = OUTPUT / 2 + offsetY * ratio;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, OUTPUT, OUTPUT);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
  return new Promise((resolve, reject) => {
    out.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao exportar foto'))),
      'image/jpeg',
      0.92
    );
  });
}

function closeOverlay(resolve, value) {
  const overlay = document.getElementById('photo-editor-overlay');
  overlay?.classList.remove('photo-editor--open');
  overlay?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('photo-editor-active');
  editor = null;
  resolve(value);
}

function setupPan(canvas) {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const onStart = (x, y) => {
    dragging = true;
    lastX = x;
    lastY = y;
  };
  const onMove = (x, y) => {
    if (!dragging || !editor) return;
    editor.offsetX += x - lastX;
    editor.offsetY += y - lastY;
    lastX = x;
    lastY = y;
    drawPreview();
  };
  const onEnd = () => {
    dragging = false;
  };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    onStart(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) onMove(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('pointerup', onEnd);
  canvas.addEventListener('pointercancel', onEnd);
}

/**
 * @param {File|Blob} fileOrBlob
 * @returns {Promise<Blob|null>}
 */
export async function openPhotoEditor(fileOrBlob) {
  const type = fileOrBlob.type || 'image/jpeg';
  const file =
    fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], 'foto.jpg', { type });

  const img = await loadImageFromFile(file);
  const baseScale = Math.max(VIEW / img.width, VIEW / img.height);

  return new Promise((resolve) => {
    const overlay = document.getElementById('photo-editor-overlay');
    const canvas = document.getElementById('photo-editor-canvas');
    const zoomInput = document.getElementById('photo-editor-zoom');
    if (!overlay || !canvas || !zoomInput) {
      resolve(null);
      return;
    }

    canvas.width = VIEW;
    canvas.height = VIEW;
    const ctx = canvas.getContext('2d');

    editor = {
      img,
      ctx,
      canvas,
      baseScale,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    };

    zoomInput.value = '1';
    drawPreview();

    overlay.classList.add('photo-editor--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('photo-editor-active');

    const onZoom = () => {
      if (!editor) return;
      editor.zoom = Number(zoomInput.value) || 1;
      drawPreview();
    };

    const onConfirm = async () => {
      try {
        const blob = await exportBlob();
        cleanup();
        closeOverlay(resolve, blob);
      } catch {
        cleanup();
        closeOverlay(resolve, null);
      }
    };

    const onCancel = () => {
      cleanup();
      closeOverlay(resolve, null);
    };

    function cleanup() {
      zoomInput.removeEventListener('input', onZoom);
      document.getElementById('photo-editor-confirm')?.removeEventListener('click', onConfirm);
      document.getElementById('photo-editor-cancel')?.removeEventListener('click', onCancel);
    }

    zoomInput.addEventListener('input', onZoom);
    document.getElementById('photo-editor-confirm')?.addEventListener('click', onConfirm, { once: true });
    document.getElementById('photo-editor-cancel')?.addEventListener('click', onCancel, { once: true });

    if (!canvas.dataset.panReady) {
      setupPan(canvas);
      canvas.dataset.panReady = '1';
    }
  });
}