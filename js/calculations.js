import { CHALLENGE_RULES } from './challenge-config.js';

const { totalKm, totalDays } = CHALLENGE_RULES;
const MS_DAY = 86400000;
const TOLERANCE = 0.12; // 12% tolerância na classificação

function parseDateOnly(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function computeEndDate(startIso) {
  const start = parseDateOnly(startIso);
  if (!start) return '';
  const end = new Date(start.getTime() + (totalDays - 1) * MS_DAY);
  return formatIso(end);
}

export function formatIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatBr(iso) {
  const d = parseDateOnly(iso);
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR');
}

export function clampKm(km) {
  const n = Number(km);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * @param {{ startDate: string, km: number }} params
 * @param {Date} [now]
 */
export function computeStats({ startDate, km }, now = new Date()) {
  const kmDone = clampKm(km);
  const start = parseDateOnly(startDate);
  const today = startOfDay(now);

  const empty = {
    totalKm,
    totalDays,
    kmDone,
    kmRemaining: Math.max(0, totalKm - kmDone),
    percent: Math.min(100, (kmDone / totalKm) * 100),
    daysElapsed: 0,
    daysRemaining: totalDays,
    avgDailyDone: 0,
    avgDailyNeeded: totalKm / totalDays,
    projection: 0,
    classification: 'NA MÉDIA',
    status: 'not_started',
    endDate: startDate ? computeEndDate(startDate) : '',
  };

  if (!start) {
    return { ...empty, status: 'invalid_date' };
  }

  const end = new Date(start.getTime() + (totalDays - 1) * MS_DAY);
  const endIso = formatIso(end);

  if (today < start) {
    return {
      ...empty,
      endDate: endIso,
      daysRemaining: totalDays,
      avgDailyNeeded: totalKm / totalDays,
      status: 'not_started',
      classification: classify(kmDone, 0, totalDays),
    };
  }

  const daysElapsed = Math.min(
    totalDays,
    Math.floor((today - start) / MS_DAY) + 1
  );
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const challengeEnded = today > end;
  const goalReached = kmDone >= totalKm;

  let avgDailyDone = 0;
  if (daysElapsed > 0 && kmDone > 0) {
    avgDailyDone = kmDone / daysElapsed;
  }

  let projection = 0;
  if (daysElapsed > 0) {
    projection = avgDailyDone * totalDays;
  }

  let avgDailyNeeded = 0;
  const kmRem = Math.max(0, totalKm - kmDone);
  if (daysRemaining > 0 && !goalReached) {
    avgDailyNeeded = kmRem / daysRemaining;
  } else if (goalReached) {
    avgDailyNeeded = 0;
  } else if (challengeEnded && kmRem > 0) {
    avgDailyNeeded = kmRem;
  }

  let status = 'in_progress';
  if (goalReached) status = 'completed';
  else if (challengeEnded) status = 'expired';
  else if (daysElapsed === 1 && kmDone === 0) status = 'first_day';

  const expectedKm = (totalKm / totalDays) * daysElapsed;

  return {
    totalKm,
    totalDays,
    kmDone,
    kmRemaining: kmRem,
    percent: Math.min(100, (kmDone / totalKm) * 100),
    daysElapsed,
    daysRemaining,
    avgDailyDone,
    avgDailyNeeded,
    projection,
    classification: classify(kmDone, expectedKm, daysElapsed),
    status,
    endDate: endIso,
    expectedKm,
  };
}

export function classify(kmDone, expectedKm, daysElapsed) {
  if (daysElapsed <= 0) return 'NA MÉDIA';
  if (expectedKm <= 0) return 'NA MÉDIA';

  const ratio = kmDone / expectedKm;
  if (ratio < 1 - TOLERANCE) return 'ABAIXO DA MÉDIA';
  if (ratio > 1 + TOLERANCE) return 'ACIMA DA MÉDIA';
  return 'NA MÉDIA';
}

export function classificationClass(label) {
  if (label === 'ABAIXO DA MÉDIA') return 'below';
  if (label === 'ACIMA DA MÉDIA') return 'above';
  return 'on-track';
}