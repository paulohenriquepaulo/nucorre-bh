import {
  CHALLENGES,
  CHALLENGE_RULES,
  getChallengeById,
  LOGO_PATH,
  resolveAsset,
} from './challenge-config.js';
import {
  computeEndDate,
  computeStats,
  clampKm,
  formatBr,
  classificationClass,
} from './calculations.js';
import {
  loadParticipant,
  saveParticipant,
  deleteParticipant,
} from './database.js';
import {
  generateCertificate,
  canvasToBlob,
  downloadBlob,
} from './certificate.js';
import { openPhotoEditor } from './photo-editor.js';

const app = document.getElementById('app');

let state = {
  view: 'home',
  challengeId: null,
  previewUrl: null,
  previewBlob: null,
  saving: false,
};

let form = {
  name: '',
  startDate: '',
  km: '',
  photoBlob: null,
  photoPreview: null,
};

let saveTimer = null;

function resolvePath() {
  const hash = window.location.hash.replace(/^#\/?/, '') || 'home';
  const parts = hash.split('/');
  if (parts[0] === 'desafio' && parts[1]) {
    const ch = getChallengeById(parts[1]);
    if (ch) {
      if (parts[2] === 'arte') return { view: 'preview', challengeId: parts[1] };
      return { view: 'challenge', challengeId: parts[1] };
    }
  }
  return { view: 'home', challengeId: null };
}

function navigate(hash) {
  window.location.hash = hash;
}

async function initFormFromDb(challengeId) {
  const record = await loadParticipant(challengeId);
  if (!record) {
    form = {
      name: '',
      startDate: '',
      km: '',
      photoBlob: null,
      photoPreview: null,
    };
    return;
  }
  form = {
    name: record.name || '',
    startDate: record.startDate || '',
    km: record.km != null ? String(record.km) : '',
    photoBlob: record.photo || null,
    photoPreview: null,
  };
  if (form.photoBlob) {
    form.photoPreview = URL.createObjectURL(form.photoBlob);
  }
}

function getStats() {
  return computeStats({
    startDate: form.startDate,
    km: form.km,
  });
}

function scheduleAutoSave(challengeId) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(challengeId, true), 600);
}

async function persist(challengeId, silent = false) {
  if (!challengeId || !form.name.trim() || !form.startDate) {
    if (!silent) toast('Preencha nome e data de início para salvar.');
    return;
  }
  state.saving = true;
  render();
  try {
    const endDate = computeEndDate(form.startDate);
    await saveParticipant({
      challengeId,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate,
      km: clampKm(form.km),
      photo: form.photoBlob,
    });
    if (!silent) toast('Informações salvas neste dispositivo.');
  } catch (e) {
    console.error(e);
    toast('Erro ao salvar. Tente novamente.');
  } finally {
    state.saving = false;
    render();
  }
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function validatePhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    toast('Selecione uma imagem válida.');
    return false;
  }
  if (file.size > 12 * 1024 * 1024) {
    toast('Imagem muito grande (máx. 12 MB).');
    return false;
  }
  return true;
}

function applyPhotoBlob(blob, challengeId) {
  if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
  form.photoBlob = blob;
  form.photoPreview = URL.createObjectURL(blob);
  scheduleAutoSave(challengeId);
  render();
}

async function onPhotoFile(file, challengeId) {
  if (!validatePhotoFile(file)) return;
  const blob = await openPhotoEditor(file);
  if (blob) applyPhotoBlob(blob, challengeId);
}

async function adjustCurrentPhoto(challengeId) {
  if (!form.photoBlob) {
    toast('Envie uma foto primeiro.');
    return;
  }
  const blob = await openPhotoEditor(form.photoBlob);
  if (blob) applyPhotoBlob(blob, challengeId);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHome() {
  const cards = CHALLENGES.map(
    (c) => {
      const coverUrl = resolveAsset(c.cover);
      const poster = c.coverMode === 'contain';
      const visualClass = poster
        ? 'challenge-card__visual challenge-card__visual--poster'
        : 'challenge-card__visual';
      const badge = poster
        ? ''
        : `<span class="challenge-card__badge">${CHALLENGE_RULES.totalKm} km · ${CHALLENGE_RULES.totalDays} dias</span>`;
      return `
    <article class="challenge-card" style="--accent:${c.accent}">
      <div class="${visualClass}">
        <img src="${coverUrl}" alt="${escapeHtml(c.name)}" loading="lazy" />
        ${badge}
      </div>
      <div class="challenge-card__body">
        <p class="challenge-card__eyebrow">${escapeHtml(c.subtitle)}</p>
        <h2>${escapeHtml(c.name)}</h2>
        <p class="challenge-card__meta">Meta fixa de ${CHALLENGE_RULES.totalKm} km em ${CHALLENGE_RULES.totalDays} dias</p>
        <button type="button" class="btn btn-primary" data-action="open" data-id="${c.id}">
          Acessar desafio
        </button>
      </div>
    </article>`;
    }
  ).join('');

  return `
    <header class="hero">
      <img class="hero__logo" src="${resolveAsset(LOGO_PATH)}" alt="NUCORRE BH" />
      <h1>Desafios Virtuais de Corrida</h1>
      <p>Escolha um desafio, acompanhe seu progresso e gere artes para compartilhar.</p>
    </header>
    <section class="challenge-grid">${cards}</section>`;
}

function renderStatsPanel(stats) {
  const cls = classificationClass(stats.classification);
  return `
    <section class="stats-panel">
      <h3>Seu progresso</h3>
      <div class="progress-bar" aria-label="Progresso da meta">
        <div class="progress-bar__fill" style="width:${stats.percent}%"></div>
      </div>
      <p class="progress-label">${stats.percent.toFixed(1)}% da meta</p>
      <ul class="stats-grid">
        <li><span>Data final</span><strong>${formatBr(stats.endDate)}</strong></li>
        <li><span>Dias decorridos</span><strong>${stats.daysElapsed}</strong></li>
        <li><span>Dias restantes</span><strong>${stats.daysRemaining}</strong></li>
        <li><span>Km restantes</span><strong>${stats.kmRemaining.toFixed(1)}</strong></li>
        <li><span>Média diária feita</span><strong>${stats.avgDailyDone.toFixed(2)} km</strong></li>
        <li><span>Média necessária</span><strong>${stats.avgDailyNeeded.toFixed(2)} km</strong></li>
        <li><span>Projeção final</span><strong>${stats.projection.toFixed(1)} km</strong></li>
      </ul>
      <p class="classification classification--${cls}">${stats.classification}</p>
    </section>`;
}

function renderChallenge(challenge) {
  const stats = getStats();
  const endDisplay = form.startDate
    ? formatBr(stats.endDate)
    : 'Informe a data de início';

  const photoBlock = form.photoPreview
    ? `<img src="${form.photoPreview}" alt="Sua foto" class="photo-preview" />`
    : `<div class="photo-preview photo-preview--empty">Nenhuma foto selecionada</div>`;

  return `
    <header class="page-header">
      <button type="button" class="btn btn-ghost" data-action="home">← Voltar aos desafios</button>
      <div class="page-header__title">
        <img src="${resolveAsset(challenge.cover)}" alt="" class="page-header__thumb${challenge.coverMode === 'contain' ? ' page-header__thumb--poster' : ''}" />
        <div>
          <p class="eyebrow">${escapeHtml(challenge.subtitle)}</p>
          <h1>${escapeHtml(challenge.name)}</h1>
          <p class="muted">Meta: ${CHALLENGE_RULES.totalKm} km · Prazo: ${CHALLENGE_RULES.totalDays} dias</p>
        </div>
      </div>
    </header>

    <div class="layout-two-col">
      <form class="form-card" id="participant-form" novalidate>
        <h2>Seus dados</h2>
        <label class="field">
          <span>Nome completo</span>
          <input type="text" name="name" required maxlength="80" value="${escapeHtml(form.name)}" autocomplete="name" />
        </label>
        <label class="field">
          <span>Data de início</span>
          <input type="date" name="startDate" required value="${escapeHtml(form.startDate)}" />
        </label>
        <label class="field field--readonly">
          <span>Data final (calculada)</span>
          <output>${endDisplay}</output>
        </label>
        <label class="field">
          <span>Quilômetros já percorridos</span>
          <input type="number" name="km" min="0" step="0.1" inputmode="decimal" value="${escapeHtml(form.km)}" />
        </label>
        <div class="field">
          <span>Foto do participante</span>
          ${photoBlock}
          <input type="file" name="photo" accept="image/*" class="file-input" />
          <button
            type="button"
            class="btn btn-secondary btn-compact"
            data-action="adjust-photo"
            ${form.photoPreview ? '' : 'disabled'}
          >
            Ajustar foto
          </button>
          <p class="hint">Após escolher a imagem, ajuste o enquadramento antes de salvar.</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" data-action="save">${state.saving ? 'Salvando…' : 'Salvar informações'}</button>
          <button type="button" class="btn btn-secondary" data-action="update">Atualizar dados</button>
          <button type="button" class="btn btn-accent" data-action="generate">Gerar arte</button>
        </div>
        <button type="button" class="btn btn-danger-ghost" data-action="delete">Excluir cadastro deste desafio</button>
      </form>
      ${renderStatsPanel(stats)}
    </div>`;
}

function renderPreview(challenge) {
  const img = state.previewUrl
    ? `<img src="${state.previewUrl}" alt="Arte gerada" class="art-preview" />`
    : `<p class="muted">Nenhuma arte gerada ainda.</p>`;

  return `
    <header class="page-header">
      <button type="button" class="btn btn-ghost" data-action="back-challenge">← Voltar ao desafio</button>
      <h1>Pré-visualização · ${escapeHtml(challenge.name)}</h1>
    </header>
    <section class="preview-panel">
      ${img}
      <div class="actions">
        <button type="button" class="btn btn-primary" data-action="download" ${state.previewBlob ? '' : 'disabled'}>Baixar imagem PNG</button>
        <button type="button" class="btn btn-secondary" data-action="regenerate">Gerar novamente</button>
        <button type="button" class="btn btn-ghost" data-action="edit">Editar informações</button>
      </div>
    </section>`;
}

function bindEvents() {
  app.querySelectorAll('[data-action="open"]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(`#/desafio/${btn.dataset.id}`));
  });

  const homeBtn = app.querySelector('[data-action="home"]');
  homeBtn?.addEventListener('click', () => navigate('#/home'));

  const formEl = document.getElementById('participant-form');
  if (formEl && state.challengeId) {
    const cid = state.challengeId;

    formEl.querySelector('[name="name"]')?.addEventListener('input', (e) => {
      form.name = e.target.value;
      scheduleAutoSave(cid);
      updateStatsOnly();
    });
    formEl.querySelector('[name="startDate"]')?.addEventListener('change', (e) => {
      form.startDate = e.target.value;
      scheduleAutoSave(cid);
      render();
    });
    formEl.querySelector('[name="km"]')?.addEventListener('input', (e) => {
      const v = e.target.value;
      if (v !== '' && Number(v) < 0) e.target.value = '0';
      form.km = e.target.value;
      scheduleAutoSave(cid);
      updateStatsOnly();
    });
    formEl.querySelector('[name="photo"]')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) onPhotoFile(file, cid);
      e.target.value = '';
    });
    app.querySelector('[data-action="adjust-photo"]')?.addEventListener('click', () =>
      adjustCurrentPhoto(cid)
    );

    app.querySelector('[data-action="save"]')?.addEventListener('click', () =>
      persist(cid, false)
    );
    app.querySelector('[data-action="update"]')?.addEventListener('click', () =>
      persist(cid, false)
    );
    app.querySelector('[data-action="generate"]')?.addEventListener('click', () =>
      runGenerate(cid)
    );
    app.querySelector('[data-action="delete"]')?.addEventListener('click', () =>
      runDelete(cid)
    );
  }

  app.querySelector('[data-action="back-challenge"]')?.addEventListener('click', () =>
    navigate(`#/desafio/${state.challengeId}`)
  );
  app.querySelector('[data-action="edit"]')?.addEventListener('click', () =>
    navigate(`#/desafio/${state.challengeId}`)
  );
  app.querySelector('[data-action="regenerate"]')?.addEventListener('click', () =>
    runGenerate(state.challengeId)
  );
  app.querySelector('[data-action="download"]')?.addEventListener('click', () => {
    if (!state.previewBlob) return;
    const ch = getChallengeById(state.challengeId);
    const name = (form.name || 'participante').replace(/\s+/g, '_').toLowerCase();
    downloadBlob(state.previewBlob, `nucorre_${ch?.id || 'desafio'}_${name}.png`);
  });
}

function updateStatsOnly() {
  const panel = app.querySelector('.stats-panel');
  if (panel) {
    panel.outerHTML = renderStatsPanel(getStats());
  }
  const out = app.querySelector('.field--readonly output');
  if (out) {
    const stats = getStats();
    out.textContent = form.startDate
      ? formatBr(stats.endDate)
      : 'Informe a data de início';
  }
}

async function runDelete(challengeId) {
  if (
    !window.confirm(
      'Excluir todos os dados deste desafio neste aparelho? Esta ação não pode ser desfeita.'
    )
  ) {
    return;
  }
  await deleteParticipant(challengeId);
  if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
  form = {
    name: '',
    startDate: '',
    km: '',
    photoBlob: null,
    photoPreview: null,
  };
  toast('Cadastro excluído.');
  render();
}

async function runGenerate(challengeId) {
  const ch = getChallengeById(challengeId);
  if (!ch) return;
  if (!form.name.trim() || !form.startDate) {
    toast('Salve nome e data de início antes de gerar a arte.');
    return;
  }
  await persist(challengeId, true);
  const stats = getStats();
  toast('Gerando arte…');
  try {
    const canvas = await generateCertificate({
      challenge: ch,
      name: form.name.trim(),
      stats,
      photoBlob: form.photoBlob,
    });
    const blob = await canvasToBlob(canvas);
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewBlob = blob;
    state.previewUrl = URL.createObjectURL(blob);
    navigate(`#/desafio/${challengeId}/arte`);
  } catch (e) {
    console.error(e);
    toast('Não foi possível gerar a arte. Verifique as imagens do desafio.');
  }
}

let lastLoadedId = null;

async function render() {
  const route = resolvePath();
  state.view = route.view;
  state.challengeId = route.challengeId;

  if (route.view === 'home') {
    lastLoadedId = null;
    app.innerHTML = renderHome();
    bindEvents();
    return;
  }

  const challenge = getChallengeById(route.challengeId);
  if (!challenge) {
    navigate('#/home');
    return;
  }

  if (lastLoadedId !== route.challengeId) {
    await initFormFromDb(route.challengeId);
    lastLoadedId = route.challengeId;
  }

  if (route.view === 'preview') {
    app.innerHTML = renderPreview(challenge);
  } else {
    app.innerHTML = renderChallenge(challenge);
  }
  bindEvents();
}

window.addEventListener('hashchange', () => render());
window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) navigate('#/home');
  render();
});