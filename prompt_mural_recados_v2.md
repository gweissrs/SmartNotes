# PROMPT — CLAUDE CODE
# Projeto: Mural Interativo de Recados (Post-it 3D)
# Versão: 2.0 — Revisado e corrigido
# Audience: Claude Code CLI

---

## ⛔ PROIBIÇÕES ABSOLUTAS — LEIA ANTES DE QUALQUER COISA

Estas regras têm prioridade sobre qualquer outra instrução deste prompt.
Violá-las invalida a entrega.

1. **NUNCA** usar `innerHTML` com dados digitados pelo usuário (vetor de XSS).
   Usar exclusivamente `textContent`, `createElement` e `appendChild`.
2. **NUNCA** usar `setTimeout` para aguardar o fim de animações CSS.
   Usar exclusivamente o evento `animationend` com fallback explícito.
3. **NUNCA** usar CSS Grid ou Flexbox para posicionar os post-its no board.
   Usar exclusivamente `position: absolute` com coordenadas calculadas.
4. **NUNCA** adicionar bibliotecas JavaScript externas (jQuery, Lodash, etc.).
   Google Fonts via `<link>` é a única CDN permitida.
5. **NUNCA** usar `Date.now() + Math.random()` como ID único.
   Usar exclusivamente `crypto.randomUUID()`.
6. **NUNCA** misturar `click` e `dblclick` sem debounce de 250ms.
   Ver seção "Conflito click/dblclick" para a implementação obrigatória.
7. **NUNCA** aplicar glassmorphism, gradientes neon ou estética flat moderna.
   O design é 100% skeuomorphic — físico, texturizado, analógico.
8. **NUNCA** usar `position: fixed` no cork board.
9. **NUNCA** armazenar referências a elementos DOM dentro do array `notes`.
   O array guarda apenas dados puros: `{ id, text, color, rotation, x, y }`.
10. **NUNCA** esquecer o bloco `@media (prefers-reduced-motion: reduce)`.

---

## 1. CONTEXTO E OBJETIVO

Você é um engenheiro frontend sênior especializado em interfaces skeuomorphic
e manipulação avançada de DOM. Sua tarefa é construir uma aplicação web chamada
**Mural Interativo de Recados** — um quadro físico de cortiça com post-its 3D
reais, onde usuários adicionam, interagem e removem recados via eventos JavaScript.

**Entrega:** um único arquivo `index.html` (HTML + CSS + JS inline).
Sem frameworks. Sem build tools. Abre diretamente no navegador.

---

## 2. STACK E COMPATIBILIDADE

- HTML5 semântico e acessível
- CSS3: custom properties, transform3d, perspective, keyframes, transitions
- JavaScript ES6+ puro (sem TypeScript, sem transpilação)
- Compatível com: Google Chrome, Microsoft Edge, Mozilla Firefox (versões atuais)
- Fontes: Google Fonts via CDN (única CDN permitida)
- Funcional sem servidor local — protocolo `file://`

---

## 3. LINGUAGEM DE DESIGN: SKEUOMORPHISM FÍSICO COMPLETO

**Conceito:** O usuário não está usando um app — está olhando para uma parede real.
Tudo deve parecer material, físico, tátil. Sem exceções.

**Proibido neste projeto:** glassmorphism, neumorphism, flat design, gradientes
neon, bordas arredondadas excessivas, sombras suaves simétricas, fontes sem serifa
modernas (Inter, Roboto, system-ui).

### 3.1 Fundo da Página
```css
body {
  background-color: #2c1810;
  background-image:
    repeating-linear-gradient(
      90deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    ),
    repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
  /* Sensação de parede escura, madeira ou concreto pintado */
}
```

### 3.2 Cork Board (elemento #cork-board)
```css
#cork-board {
  background-color: #c8a87a;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='rgba(100,60,20,0.12)'/%3E%3Ccircle cx='3' cy='3' r='0.6' fill='rgba(140,80,30,0.1)'/%3E%3C/svg%3E");
  /* Moldura: borda física de madeira */
  border: 18px solid #5c3a1e;
  border-image: linear-gradient(
    135deg, #7a4e2d, #3d2010, #7a4e2d, #3d2010
  ) 1;
  box-shadow:
    inset 0 2px 8px rgba(0,0,0,0.4),
    0 8px 32px rgba(0,0,0,0.6),
    0 2px 4px rgba(0,0,0,0.8);
  position: relative; /* Contexto para os post-its absolutos */
  width: 90vw;
  max-width: 1200px;
  min-height: 600px;
  height: 70vh;
  overflow: hidden; /* Notas não vazam para fora do board */
}
```

**Tachinhas nos cantos** — pseudo-elementos no elemento pai do board:
Quatro tachinhas metálicas posicionadas absolutamente nos quatro cantos
do cork board. Círculos de 16px com gradiente radial metálico
(branco brilhante → cinza → escuro) e sombra pontual.

### 3.3 Post-its — Anatomia Visual Obrigatória

Cada post-it é composto por:

**Elemento principal `.note`:**
```css
.note {
  position: absolute; /* Posicionamento livre no board */
  width: 180px;
  min-height: 160px;
  padding: 28px 14px 14px 14px;
  font-family: 'Caveat', cursive; /* Google Fonts — caligrafia */
  font-size: 16px;
  line-height: 1.5;
  color: #2a1a08;
  cursor: pointer;
  /* Sombra 3D em 3 camadas: espessura física + projeção no cork */
  box-shadow:
    2px 2px 0px rgba(0,0,0,0.25),   /* lateral direita — espessura */
    4px 4px 0px rgba(0,0,0,0.15),   /* segunda camada de espessura */
    6px 10px 20px rgba(0,0,0,0.45); /* sombra projetada no cork */
  transform: rotate(var(--rotation)) translateZ(0);
  transform-origin: center center;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s ease,
              filter 0.25s ease;
  will-change: transform, box-shadow;
  /* Textura de papel */
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 24px,
    rgba(0,0,0,0.04) 24px,
    rgba(0,0,0,0.04) 25px
  );
  word-wrap: break-word;
  user-select: none;
  z-index: 1;
}
```

**`::before` — Fita adesiva no topo:**
```css
.note::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: rgba(220, 200, 150, 0.55);
  border: 1px solid rgba(180,150,80,0.3);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  /* Leve rotação aleatória definida inline via style */
}
```

**`::after` — Dobra no canto inferior direito:**
```css
.note::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 24px 24px;
  border-color: transparent transparent rgba(0,0,0,0.2) transparent;
  filter: drop-shadow(-2px -2px 2px rgba(0,0,0,0.15));
}
```

### 3.4 Efeito 3D Real com Perspective (DIFERENCIAL OBRIGATÓRIO)

O cork board deve ter `perspective: 1200px` no CSS.

Cada post-it deve ter um `mousemove` listener para **parallax tilt 3D**:

```javascript
note.addEventListener('mousemove', (e) => {
  if (note.classList.contains('selected')) return;
  const rect = note.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / (rect.width / 2);   // -1 a +1
  const dy = (e.clientY - cy) / (rect.height / 2);  // -1 a +1
  const rotX = dy * -8;   // graus em X
  const rotY = dx * 8;    // graus em Y
  note.style.transform =
    `rotate(var(--rotation)) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(12px)`;
});

note.addEventListener('mouseleave', () => {
  if (note.classList.contains('selected')) return;
  note.style.transform = ''; // Volta ao estado CSS padrão
});
```

Este é o efeito que diferencia "sombra 2.5D" de "3D real".

### 3.5 Paleta de Cores dos Post-its

Seis cores. Distribuição aleatória, sem repetição consecutiva:

```javascript
const NOTE_COLORS = [
  { bg: '#FFF176', shadow: '#F9A825' }, // amarelo clássico
  { bg: '#EF9A9A', shadow: '#C62828' }, // vermelho coral
  { bg: '#80DEEA', shadow: '#00838F' }, // ciano
  { bg: '#C5E1A5', shadow: '#558B2F' }, // verde
  { bg: '#CE93D8', shadow: '#6A1B9A' }, // lilás
  { bg: '#FFCC80', shadow: '#E65100' }, // laranja
];
```

Cada cor tem sua própria sombra lateral correspondente (propriedade `shadow`)
para que a espessura 3D do post-it seja cromaticamente coerente com a face.

---

## 4. LAYOUT DA PÁGINA

```
┌─────────────────────────────────────────────┐
│            HEADER (skeuomorphic)            │
│   Placa de madeira escura com texto gravado │
│   "📌 Mural de Recados"  [contador: X]      │
├─────────────────────────────────────────────┤
│         INPUT PANEL (papel + madeira)       │
│  [ campo de texto com linhas de caderno ]   │
│  [        botão "Fixar Recado" 📌         ] │
│  [ mensagem de erro se campo vazio         ]│
├─────────────────────────────────────────────┤
│                                             │
│         CORK BOARD (cortiça + moldura)      │
│                                             │
│    [post-it]      [post-it]   [post-it]     │
│          [post-it]     [post-it]            │
│                                             │
│    empty state quando vazio (centralizado)  │
└─────────────────────────────────────────────┘
│         FOOTER (legenda de controles)       │
└─────────────────────────────────────────────┘
```

**Header:** Fonte display serifada (ex: `Playfair Display` ou `Libre Baskerville`).
Fundo escuro texturizado. Texto com `text-shadow` para efeito de gravação.
Badge contador com visual de etiqueta pregada com tachinha.

**Input Panel:** Visual de folha de papel com linhas de caderno.
Borda superior como régua de madeira. Campo de texto sem borda visível —
a linha inferior animated ao focar. Botão com visual de carimbo/selo.

---

## 5. POSICIONAMENTO DOS POST-ITS NO BOARD (ALGORITMO OBRIGATÓRIO)

**Não usar Grid. Não usar Flexbox. Position absolute com scatter controlado.**

```javascript
function calculatePosition(boardEl) {
  const boardW = boardEl.clientWidth;
  const boardH = boardEl.clientHeight;
  const noteW = 180;
  const noteH = 180;
  const margin = 20;

  // Zona segura: evita bordas do board
  const x = margin + Math.random() * (boardW - noteW - margin * 2);
  const y = margin + Math.random() * (boardH - noteH - margin * 2);

  return { x: Math.round(x), y: Math.round(y) };
}
```

Cada nota recebe `style.left` e `style.top` com os valores calculados.
A rotação aleatória é armazenada como CSS custom property no elemento:

```javascript
const rotation = (Math.random() * 16 - 8).toFixed(1); // -8 a +8 graus
note.style.setProperty('--rotation', `${rotation}deg`);
```

---

## 6. CONFLITO click/dblclick — IMPLEMENTAÇÃO OBRIGATÓRIA

O navegador dispara `click` duas vezes ANTES de `dblclick`. Sem debounce,
`selectNote()` é chamado antes de `removeNote()`, causando comportamento errático.

**Padrão correto — implementar exatamente assim:**

```javascript
function attachNoteEvents(noteEl, id) {
  let clickTimer = null;

  noteEl.addEventListener('click', (e) => {
    e.stopPropagation(); // Não propaga para o board
    if (clickTimer !== null) return; // Aguarda resolução do dblclick

    clickTimer = setTimeout(() => {
      clickTimer = null;
      NoteManager.selectNote(id); // Só executa se não foi dblclick
    }, 250);
  });

  noteEl.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (clickTimer !== null) {
      clearTimeout(clickTimer); // Cancela o click pendente
      clickTimer = null;
    }
    NoteManager.removeNote(id, noteEl); // Executa remoção
  });

  // Efeito 3D tilt (ver seção 3.4)
  noteEl.addEventListener('mousemove', (e) => { /* ... */ });
  noteEl.addEventListener('mouseleave', () => { /* ... */ });
}
```

O board (`#cork-board`) deve ter um listener `click` no próprio elemento
para **deselecionar** a nota ativa quando o usuário clicar em área vazia:

```javascript
boardEl.addEventListener('click', () => NoteManager.clearSelection());
```

---

## 7. ARQUITETURA DO CÓDIGO JAVASCRIPT

### NoteManager — Objeto Literal Principal

```javascript
const NoteManager = {
  // Estado puro — NUNCA guardar referências DOM aqui
  notes: [],        // Array de { id, text, color, rotation, x, y }
  selectedId: null, // ID da nota atualmente selecionada

  init()              // DOMContentLoaded: registra eventos do input e botão
  addNote(text)       // Valida → cria dado → cria DOM → scatter → registra eventos
  removeNote(id, el)  // Animação de saída → animationend → removeChild → splice
  selectNote(id)      // Toggle seleção individual (RN02)
  clearSelection()    // Remove 'selected' de todas as notas
  createNoteElement(note) // Retorna elemento DOM completo (sem innerHTML com dados)
  validateInput(text) // Retorna { valid: bool, message: string }
  getRandomColor()    // Retorna item aleatório de NOTE_COLORS
  getRandomRotation() // Retorna float entre -8 e +8
  updateCounter()     // Atualiza o badge no header
  showError(msg)      // Exibe erro por 3s, shake animation no input
  hideError()         // Oculta mensagem de erro
  showEmptyState()    // Controla visibilidade do empty state
}
```

### Implementação de `removeNote` (com fallback obrigatório)

```javascript
removeNote(id, el) {
  // Guard: evita dupla remoção em animação em andamento
  if (el.classList.contains('removing')) return;

  el.classList.add('removing');

  // Listener principal via evento CSS
  const onAnimEnd = () => {
    el.removeEventListener('animationend', onAnimEnd);
    if (el.parentNode) el.parentNode.removeChild(el);
    this.notes = this.notes.filter(n => n.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.updateCounter();
    this.showEmptyState();
  };

  el.addEventListener('animationend', onAnimEnd, { once: true });

  // FALLBACK: se prefers-reduced-motion desativar animações,
  // animationend nunca dispara — remove após 350ms de segurança
  setTimeout(() => {
    if (el.classList.contains('removing') && el.parentNode) {
      onAnimEnd();
    }
  }, 350);
},
```

### Implementação de `addNote` (fluxo completo)

```javascript
addNote(text) {
  const validation = this.validateInput(text);
  if (!validation.valid) {
    this.showError(validation.message);
    return; // Nenhum elemento criado no DOM (Fluxo A)
  }

  const color = this.getRandomColor();
  const rotation = this.getRandomRotation();
  const { x, y } = calculatePosition(boardEl);

  const note = {
    id: crypto.randomUUID(),
    text: text.trim(),
    color,
    rotation,
    x,
    y,
  };

  this.notes.push(note);

  const el = this.createNoteElement(note);
  boardEl.appendChild(el);
  attachNoteEvents(el, note.id); // Registra click/dblclick/mousemove (RN04)

  inputEl.value = '';
  inputEl.focus();
  this.updateCounter();
  this.showEmptyState();
},
```

### Implementação de `validateInput`

```javascript
validateInput(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: 'Digite um recado antes de fixar.' };
  }
  return { valid: true, message: '' };
},
```

### Implementação de `selectNote` (RN02 — isolamento individual)

```javascript
selectNote(id) {
  // Se já estava selecionado: deseleciona (toggle)
  if (this.selectedId === id) {
    this.clearSelection();
    return;
  }

  // Remove seleção de TODOS antes de aplicar na nova
  this.clearSelection();

  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  el.classList.add('selected');
  this.selectedId = id;
},

clearSelection() {
  document.querySelectorAll('.note.selected')
    .forEach(el => el.classList.remove('selected'));
  this.selectedId = null;
},
```

---

## 8. ESTADOS CSS DAS NOTAS

```css
/* Estado: hover — levanta sutilmente */
.note:hover {
  transform: rotate(calc(var(--rotation) / 2)) translateZ(8px) translateY(-4px);
  z-index: 10;
}

/* Estado: selecionado (1 clique) — RF06 */
.note.selected {
  transform: rotate(0deg) translateZ(30px) translateY(-12px) scale(1.06);
  box-shadow:
    0 0 0 3px rgba(255,255,255,0.85),
    0 25px 50px rgba(0,0,0,0.55);
  filter: brightness(1.12) saturate(1.15);
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease,
              filter 0.3s ease;
}

/* Animação: entrada no board */
@keyframes noteEntry {
  0%   { transform: rotate(var(--rotation)) scale(0) translateY(-40px); opacity: 0; }
  70%  { transform: rotate(var(--rotation)) scale(1.08) translateY(4px); opacity: 1; }
  100% { transform: rotate(var(--rotation)) scale(1) translateY(0); opacity: 1; }
}
.note { animation: noteEntry 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

/* Animação: remoção (duplo clique) */
@keyframes noteExit {
  0%   { transform: rotate(var(--rotation)) scale(1); opacity: 1; }
  30%  { transform: rotate(calc(var(--rotation) + 8deg)) scale(1.15); opacity: 1; }
  100% { transform: rotate(calc(var(--rotation) + 20deg)) scale(0); opacity: 0; }
}
.note.removing {
  animation: noteExit 0.3s ease-in forwards;
  pointer-events: none; /* Impede interações durante remoção */
}

/* Animação: shake no input (campo vazio) */
@keyframes inputShake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
.input-error { animation: inputShake 0.4s ease; }
```

---

## 9. ACESSIBILIDADE E PREFERÊNCIAS DO SISTEMA

```css
/* Usuários com vestibular/epilepsia/preferência de sistema */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```html
<!-- Atributos ARIA obrigatórios -->
<input aria-label="Campo de texto do recado" aria-required="true">
<button type="button" aria-label="Fixar recado no mural">Fixar Recado</button>
<div id="error-msg" role="alert" aria-live="polite" aria-atomic="true"></div>
<main id="cork-board" role="region" aria-label="Mural de recados">
<div id="empty-state" aria-live="polite"></div>
```

**Foco gerenciado:** após adicionar nota com sucesso, `inputEl.focus()`.
**Enter no input** aciona `addNote()` (via `keydown` com `e.key === 'Enter'`).

---

## 10. ESTRUTURA HTML COMPLETA

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mural de Recados</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Playfair+Display:wght@700&family=Libre+Baskerville:ital@1&display=swap" rel="stylesheet">
  <style>/* CSS aqui — ver seções 3, 5, 8 */</style>
</head>
<body>

  <header class="app-header">
    <h1>📌 Mural de Recados</h1>
    <span class="counter-badge" id="counter">0 recados</span>
  </header>

  <section class="input-section" aria-label="Adicionar novo recado">
    <div class="paper-area">
      <input
        type="text"
        id="note-input"
        placeholder="O que você quer anotar?"
        aria-label="Campo de texto do recado"
        aria-required="true"
        autocomplete="off"
      >
      <button type="button" id="btn-add" aria-label="Fixar recado no mural">
        📌 Fixar Recado
      </button>
    </div>
    <div id="error-msg" role="alert" aria-live="polite" aria-atomic="true"></div>
  </section>

  <div class="board-wrapper">
    <!-- Tachinhas decorativas dos cantos via CSS no .board-wrapper -->
    <main id="cork-board" role="region" aria-label="Mural de recados">
      <div id="empty-state" aria-live="polite">
        <span>📋</span>
        <p>Nenhum recado ainda.<br>Adicione o primeiro! 👆</p>
      </div>
    </main>
  </div>

  <footer class="app-footer">
    <span>🖱️ Clique para selecionar</span>
    <span>·</span>
    <span>🖱️🖱️ Duplo clique para remover</span>
  </footer>

  <script>/* JS aqui — ver seções 6 e 7 */</script>
</body>
</html>
```

---

## 11. REQUISITOS FUNCIONAIS — CHECKLIST DE CONFORMIDADE

| ID    | Descrição                              | Implementação verificável                        |
|-------|----------------------------------------|--------------------------------------------------|
| RF01  | Inserir recado via campo de texto      | `<input id="note-input">` com `keydown Enter`   |
| RF02  | Adicionar ao mural via botão           | `btn-add` → `NoteManager.addNote()`             |
| RF03  | Exibir recados na área do board        | `appendChild` no `#cork-board`                  |
| RF04  | Criar elementos dinamicamente via DOM  | `createElement` — ZERO innerHTML com dados       |
| RF05  | Evento de clique                       | `attachNoteEvents` → `click` com debounce       |
| RF06  | Alterar aparência ao clicar            | Classe `.selected` com transform + shadow       |
| RF07  | Evento de duplo clique                 | `attachNoteEvents` → `dblclick` limpa timer     |
| RF08  | Remover ao duplo clicar                | `removeNote` → animação → `animationend`        |
| RF09  | Comportamento individual               | `selectedId` global + `clearSelection()` total  |
| RF10  | Validar entrada vazia                  | `validateInput`: `trim().length === 0` → bloqueia|

## 12. REGRAS DE NEGÓCIO — VERIFICAÇÃO LINHA A LINHA

| RN    | Regra                                  | Onde verificar no código                         |
|-------|----------------------------------------|--------------------------------------------------|
| RN01  | Campo obrigatório (sem espaços)        | `text.trim().length === 0` em `validateInput`   |
| RN02  | Clique afeta apenas a nota clicada     | `clearSelection()` antes de aplicar `.selected` |
| RN03  | Duplo clique remove apenas a clicada   | `removeNote(id, el)` — só o `el` recebe `.removing` |
| RN04  | Eventos automáticos em notas novas     | `attachNoteEvents` chamado dentro de `addNote`  |
| RN05  | Sem limite de recados                  | Ausência de qualquer verificação de máximo       |

---

## 13. FLUXOS ALTERNATIVOS — TESTE MANUAL APÓS IMPLEMENTAR

**Fluxo A — Campo Vazio:**
1. Clicar "Fixar Recado" ou pressionar Enter com campo vazio ou só espaços
2. Esperado: input recebe `.input-error` (shake) → mensagem de erro aparece 3s
3. Esperado: NENHUM elemento criado no DOM do board
4. Esperado: foco volta ao input automaticamente

**Fluxo B — Remoção:**
1. Dar duplo clique em qualquer nota existente
2. Esperado: nota recebe `.removing` → animação de saída → some do DOM
3. Esperado: TODAS as outras notas permanecem exatamente iguais
4. Esperado: remoção imediata, sem dialog de confirmação
5. Teste adicional: duplo clique rápido na mesma nota → não deve dar erro (guard clause)

---

## 14. ORGANIZAÇÃO DO CSS (SEÇÕES COMENTADAS OBRIGATÓRIAS)

```css
/* ================================================
   1. CSS CUSTOM PROPERTIES (VARIÁVEIS)
   ================================================ */

/* ================================================
   2. RESET E BASE
   ================================================ */

/* ================================================
   3. LAYOUT GERAL
   ================================================ */

/* ================================================
   4. HEADER — PLACA DE MADEIRA
   ================================================ */

/* ================================================
   5. INPUT PANEL — PAPEL DE CADERNO
   ================================================ */

/* ================================================
   6. CORK BOARD — MOLDURA E CORTIÇA
   ================================================ */

/* ================================================
   7. POST-ITS — COMPONENTE PRINCIPAL
   ================================================ */

/* ================================================
   8. ESTADOS: HOVER, SELECTED, REMOVING
   ================================================ */

/* ================================================
   9. ANIMAÇÕES (KEYFRAMES)
   ================================================ */

/* ================================================
   10. EMPTY STATE
   ================================================ */

/* ================================================
   11. FOOTER
   ================================================ */

/* ================================================
   12. RESPONSIVO — BREAKPOINTS
   ================================================ */

/* ================================================
   13. PREFERS-REDUCED-MOTION — ACESSIBILIDADE
   ================================================ */
```

---

## 15. CRITÉRIOS DE ACEITE FINAL

Antes de considerar a entrega concluída, verificar:

- [ ] Abre no navegador via `file://` sem erros no console
- [ ] Campo vazio → erro → sem nota criada (Fluxo A)
- [ ] Campo com texto → nota aparece com animação de entrada
- [ ] 1 clique em nota → visual muda (selecionada), outras inalteradas
- [ ] 1 clique na mesma nota → deseleciona
- [ ] Clicar em área vazia do board → deseleciona nota ativa
- [ ] Duplo clique → animação de saída → nota some → contador atualiza
- [ ] Duplo clique rápido repetido não causa erro JS
- [ ] Efeito 3D tilt com mouse sobre cada nota
- [ ] Post-its em posições absolutas variadas (não em grid)
- [ ] Rotações diferentes em cada nota
- [ ] Empty state aparece quando não há notas
- [ ] Counter no header atualiza em tempo real
- [ ] Pressionar Enter no input adiciona nota
- [ ] Design 100% skeuomorphic (sem glassmorphism, sem flat)
- [ ] Chrome DevTools → Console: zero erros, zero warnings

---

## 16. ENTREGA

Um único arquivo: `index.html`

Não inclua explicações, comentários fora do código, ou markdown após o arquivo.
Entregue apenas o código completo e funcional.
