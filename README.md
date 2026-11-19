# NUCORRE BH — Desafios Virtuais de Corrida

Sistema web estático para acompanhar quatro desafios virtuais de 150 km em 75 dias, com armazenamento local (IndexedDB), cálculos automáticos de progresso e geração de artes em PNG (1080×1920) via Canvas API.

Funciona inteiramente no navegador, sem backend, login ou banco externo. Ideal para **GitHub Pages**.

## Estrutura

```
index.html
css/
js/
  app.js              — interface e fluxo
  challenge-config.js — regras e caminhos dos desafios
  calculations.js     — métricas e classificação
  certificate.js      — composição Canvas
  database.js         — IndexedDB
  storage.js          — preferências simples (localStorage)
assets/
  logo.png
  desafios/
    desafio-1/  arte.jpg, medalha.png, cover.svg
    desafio-2/  arte.svg, medalha.png, cover.svg
    ...
```

## Executar localmente

Módulos ES (`type="module"`) exigem servidor HTTP (não abra o `index.html` direto pelo disco).

```bash
# Python 3
python -m http.server 8080

# ou Node (npx)
npx serve .
```

Acesse: `http://localhost:8080`

## Publicar no GitHub Pages

1. Crie um repositório e envie este projeto.
2. Em **Settings ? Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. Se o site ficar em `https://usuario.github.io/nome-repo/` (subpasta), descomente a tag `<base>` no `index.html`:

```html
<base href="/nome-repo/" />
```

4. Aguarde o deploy e teste os quatro desafios no celular.

## Atualizar artes e medalhas

1. Coloque os arquivos em `assets/desafios/desafio-N/`:
   - `arte.png` ou `arte.jpg` — (opcional/reservado; a arte gerada **não** usa cartaz — só fundo NUCORRE + logo + medalha)
   - `medalha.png` — medalha sem deformar
   - `cover.svg` ou imagem — capa do card na tela inicial
2. Ajuste os caminhos em `js/challenge-config.js` se os nomes forem diferentes.
3. Para o layout da arte, edite posições em `js/certificate.js` (`LAYOUTS` e `certificateLayout` por desafio).

**Desafio 1 (Praça da Estação)** já usa as imagens originais enviadas (cartaz, medalha e logo). Os desafios 2–4 usam capas SVG e medalha provisória — substitua quando tiver os arquivos finais.

## Manutenção

| Tarefa | Arquivo |
|--------|---------|
| Meta / prazo fixos | `js/challenge-config.js` (`CHALLENGE_RULES`) |
| Tolerância da classificação | `js/calculations.js` (`TOLERANCE`) |
| Novo desafio | pasta em `assets/` + entrada em `CHALLENGES` |
| Banco local | `js/database.js` (alterar versão do DB se mudar o schema) |

## Privacidade

Nome, datas, quilometragem e foto ficam **somente no dispositivo** do participante (IndexedDB). Nada é enviado à internet.

## Licença de imagens

Artes, medalhas e logo são propriedade do NUCORRE BH. Use apenas neste projeto autorizado.