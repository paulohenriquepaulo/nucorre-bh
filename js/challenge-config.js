/**
 * Configuração dos quatro desafios — regras fixas e caminhos de assets.
 * Ajuste nomes e arquivos em assets/desafios/desafio-N/
 */
export const CHALLENGE_RULES = {
  totalKm: 150,
  totalDays: 75,
};

export const CHALLENGES = [
  {
    id: 'desafio-1',
    number: 1,
    name: 'Praça da Estação',
    subtitle: '4º Desafio Virtual',
    cover: 'assets/desafios/desafio-1/cover.svg',
    arte: 'assets/desafios/desafio-1/arte.jpg',
    medalha: 'assets/desafios/desafio-1/medalha.png',
    accent: '#ff6600',
    theme: {
      bg: '#0a0a0a',
      orange: '#ff6600',
      white: '#ffffff',
    },
    certificateLayout: 'praca-estacao',
  },
  {
    id: 'desafio-2',
    number: 2,
    name: 'Lagoa da Pampulha',
    subtitle: 'Pontos Turísticos BH',
    cover: 'assets/desafios/desafio-2/cover.svg',
    arte: 'assets/desafios/desafio-2/arte.svg',
    medalha: 'assets/desafios/desafio-2/medalha.png',
    accent: '#e85d04',
    theme: { bg: '#0d1117', orange: '#e85d04', white: '#f8f9fa' },
    certificateLayout: 'default',
  },
  {
    id: 'desafio-3',
    number: 3,
    name: 'Serra do Curral',
    subtitle: 'Pontos Turísticos BH',
    cover: 'assets/desafios/desafio-3/cover.svg',
    arte: 'assets/desafios/desafio-3/arte.svg',
    medalha: 'assets/desafios/desafio-3/medalha.png',
    accent: '#f48c06',
    theme: { bg: '#0a0a0a', orange: '#f48c06', white: '#ffffff' },
    certificateLayout: 'default',
  },
  {
    id: 'desafio-4',
    number: 4,
    name: 'Mercado Central',
    subtitle: 'Pontos Turísticos BH',
    cover: 'assets/desafios/desafio-4/cover.svg',
    arte: 'assets/desafios/desafio-4/arte.svg',
    medalha: 'assets/desafios/desafio-4/medalha.png',
    accent: '#ff7b00',
    theme: { bg: '#0a0a0a', orange: '#ff7b00', white: '#ffffff' },
    certificateLayout: 'default',
  },
];

export const LOGO_PATH = 'assets/logo.png';

export function getChallengeById(id) {
  return CHALLENGES.find((c) => c.id === id) || null;
}