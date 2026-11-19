import { LOGO_PATH } from './challenge-config.js';

/** Layout de referência 1080×1920; EXPORT_SCALE define pixels do PNG baixado */
const W = 1080;
const H = 1920;
export const EXPORT_SCALE = 1.5; // 1620×2880 — aumente para 2 (2160×3840) se quiser ainda maior
export const ART_WIDTH = Math.round(W * EXPORT_SCALE);
export const ART_HEIGHT = Math.round(H * EXPORT_SCALE);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
    img.src = src;
  });
}

function coverDraw(ctx, img, dx, dy, dw, dh) {
  const ir = img.width / img.height;
  const dr = dw / dh;
  let sw, sh, sx, sy;
  if (ir > dr) {
    sh = img.height;
    sw = sh * dr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / dr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function fitImageInBox(img, boxW, boxH) {
  const scale = Math.min(boxW / img.width, boxH / img.height);
  return { w: img.width * scale, h: img.height * scale };
}

function drawPhoto(ctx, img, x, y, size, accent) {
  ctx.save();
  roundRect(ctx, x, y, size, size, size * 0.14);
  ctx.clip();
  coverDraw(ctx, img, x, y, size, size);
  ctx.restore();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  roundRect(ctx, x, y, size, size, size * 0.14);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 4, y + 4, size - 8, size - 8, size * 0.12);
  ctx.stroke();
}

/** Faixas verticais fixas — nada se sobrepõe */
const ZONES = {
  titleTop: 32,
  medalTop: 92,
  photoBandTop: 1010,
  photoSize: 188,
  photoMarginX: 48,
  logoBandFill: 0.94,
  panelTop: 1300,
  panelSide: 44,
  panelBottom: 56,
};

function drawBackground(ctx, accent) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#161616');
  grad.addColorStop(0.55, '#0a0a0a');
  grad.addColorStop(1, '#060606');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(56, ZONES.titleTop - 8);
  ctx.lineTo(W - 56, ZONES.titleTop - 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, ZONES.photoBandTop - 16);
  ctx.lineTo(W - 56, ZONES.photoBandTop - 16);
  ctx.stroke();
}

function drawInfoPanel(ctx, {
  challenge,
  name,
  stats,
  accent,
  y,
  h,
}) {
  const x = ZONES.panelSide;
  const w = W - ZONES.panelSide * 2;

  roundRect(ctx, x, y, w, h, 32);
  ctx.fillStyle = 'rgba(12,12,12,0.95)';
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 32);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const px = x + 40;
  const innerW = w - 80;
  let ty = y + 52;
  const line = 54;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Montserrat, sans-serif';
  ctx.fillText(name || 'Participante', px, ty, innerW);

  ty += line + 4;
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Montserrat, sans-serif';
  ctx.fillText(`${challenge.name} · 150K`, px, ty, innerW);

  ty += line;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '600 35px Montserrat, sans-serif';
  const rows = [
    `${stats.kmDone.toFixed(1)} km de ${stats.totalKm} km`,
    `${stats.percent.toFixed(1)}% concluído`,
    `${stats.kmRemaining.toFixed(1)} km restantes`,
    stats.daysRemaining > 0
      ? `${stats.daysRemaining} dias restantes`
      : 'Prazo encerrado',
  ];
  for (const row of rows) {
    ctx.fillText(row, px, ty, innerW);
    ty += line - 6;
  }

  ty += 10;
  const classColors = {
    'ABAIXO DA MÉDIA': '#ff6b6b',
    'NA MÉDIA': '#ffd43b',
    'ACIMA DA MÉDIA': '#51cf66',
  };
  ctx.font = 'bold 40px Montserrat, sans-serif';
  ctx.fillStyle = classColors[stats.classification] || '#ffd43b';
  ctx.fillText(stats.classification, px, ty, innerW);

  ty += line + 12;
  const barH = 36;
  const barW = innerW;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, px, ty, barW, barH, 18);
  ctx.fill();
  ctx.fillStyle = accent;
  const fillW = Math.max(0, Math.min(barW, (stats.percent / 100) * barW));
  if (fillW > 0) {
    roundRect(ctx, px, ty, fillW, barH, 18);
    ctx.fill();
  }

  ty += barH + 36;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '500 28px Montserrat, sans-serif';
  ctx.fillText('NUCORRE BH · Corrida · Saúde · Amizade', px, ty, innerW);
}

/**
 * Gera PNG em alta resolução (ART_WIDTH × ART_HEIGHT).
 */
export async function generateCertificate({
  challenge,
  name,
  stats,
  photoBlob,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = ART_WIDTH;
  canvas.height = ART_HEIGHT;
  const ctx = canvas.getContext('2d');
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  const accent = challenge.accent || '#ff6600';

  const [medalha, logo] = await Promise.all([
    loadImage(challenge.medalha),
    loadImage(LOGO_PATH),
  ]);

  let photoImg = null;
  if (photoBlob) {
    const url = URL.createObjectURL(photoBlob);
    try {
      photoImg = await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  drawBackground(ctx, accent);

  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Montserrat, sans-serif';
  ctx.fillText('DESAFIO VIRTUAL', W / 2, ZONES.titleTop + 38);
  ctx.textAlign = 'left';

  const medalZoneH = ZONES.photoBandTop - ZONES.medalTop - 20;
  const medalBox = fitImageInBox(medalha, W - 32, medalZoneH);
  const medalX = (W - medalBox.w) / 2;
  const medalY = ZONES.medalTop + (medalZoneH - medalBox.h) / 2;
  ctx.drawImage(medalha, medalX, medalY, medalBox.w, medalBox.h);

  const bandH = ZONES.panelTop - ZONES.photoBandTop;
  const photoSize = ZONES.photoSize;
  const photoX = W - ZONES.photoMarginX - photoSize;
  const photoY = ZONES.photoBandTop + (bandH - photoSize) / 2;

  const logoBandMaxW = photoX - ZONES.photoMarginX - 24;
  const logoTargetH = (bandH - 10) * ZONES.logoBandFill;
  let logoBox = fitImageInBox(logo, logoBandMaxW, logoTargetH);
  if (logoBox.h < logoTargetH * 0.85) {
    const boost = logoTargetH / logoBox.h;
    let w = logoBox.w * boost;
    let h = logoBox.h * boost;
    if (w > logoBandMaxW) {
      const fit = logoBandMaxW / w;
      w *= fit;
      h *= fit;
    }
    logoBox = { w, h };
  }
  const logoX = ZONES.photoMarginX;
  const logoY = ZONES.photoBandTop + (bandH - logoBox.h) / 2;
  ctx.drawImage(logo, logoX, logoY, logoBox.w, logoBox.h);

  if (photoImg) {
    drawPhoto(ctx, photoImg, photoX, photoY, photoSize, accent);
  }

  const panelY = ZONES.panelTop;
  const panelH = H - panelY - ZONES.panelBottom;
  drawInfoPanel(ctx, {
    challenge,
    name,
    stats,
    accent,
    y: panelY,
    h: panelH,
  });

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao exportar PNG'))),
      'image/png',
      1
    );
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}