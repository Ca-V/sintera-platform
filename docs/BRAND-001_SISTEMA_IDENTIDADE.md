# BRAND-001 — Sistema de Identidade da SINTERA

**Objetivo:** definir **quem é** a SINTERA visual e emocionalmente — a identidade da marca — **antes** do Design System.
Orienta o **Design System único** (web + mobile).
**Escopo:** filosofia, referências, linguagem visual, linguagem cromática (direção), tipografia, iconografia, ilustração,
fotografia, movimento, princípios de interface, tom. **Não fixa tokens/cores definitivos** (isso é o 3B — Design System).
**Status:** Approved · **Architectural Baseline** · **Versão:** 1.4 · **Histórico:** v1.0 criação; v1.1 10 princípios +
tipografia diferida a [[BRAND-002]]; v1.2 (2026-07-20) direção cromática **A·E** aprovada ([[COLOR-001]]); v1.3 (2026-07-20)
direção cromática **consolidada** (âncora `#4D8C9D`) + princípio 6 (**validação em densidade** antes de congelar); v1.4
(2026-07-21) **tipografia DECIDIDA** (§5: Fraunces + Hanken Grotesk) + âncora ajustada p/ `#579DA8` — **identidade encerrada**.
**Referência oficial da identidade da SINTERA.**
**Dependências:** [[ARCH-002]] · [[HIP-011]] · [[posicionamento_marca]]. **Impacto:** todo o Design System (3B) implementa
este documento; identidade permanente em todo ponto de contato (web e mobile).

## Decisões já aprovadas pela fundadora (permanentes)
1. **Referência estética principal = obra _Almond Blossom_, de Vincent van Gogh** — como **atmosfera e linguagem**, não
   como cópia da pintura nem extração literal de cores.
2. **A paleta atual da plataforma web é PROVISÓRIA** — não serve de referência. A futura atualização da web usará a
   **mesma identidade** do app.
3. **Identidade e Design System ÚNICOS** (web + mobile); adaptações específicas de plataforma **só quando necessário**.
4. **Nenhuma cor definitiva foi aprovada.** Aprovada apenas a **direção cromática** (§4). Tokens virão no 3B.

## 0. Princípios de identidade (permanentes — fundadora)
1. **Inspirada na arte, não parecer artística.** A referência a _Almond Blossom_ é **conceitual**; a inspiração aparece
   **apenas na linguagem visual**. **Sem** texturas de tinta, pinceladas, fundos ilustrados ou elementos decorativos
   extraídos da obra.
2. **Saúde premium, não hospital** — e também **não** financeira/corporativa. Percepção de **saúde · ciência ·
   organização · elegância · confiança · calma**, sem frieza.
3. **Longitudinalidade** — a interface deve transmitir **continuidade**: a sensação de que a plataforma acompanha a
   história de saúde da pessoa **ao longo dos anos**.
4. **Tecnologia invisível** (o mais importante) — a complexidade **desaparece**; na frente, **simplicidade e
   naturalidade**; por trás, arquitetura sofisticada.
5. **A identidade nasce do CONJUNTO, não de uma cor.** O diferencial é a combinação de **cor · espaço · tipografia ·
   ritmo · contraste · animação · silêncio visual** — nenhuma cor isolada define a marca.
6. **Validação em DENSIDADE antes de congelar.** A Home é a tela mais limpa e não basta como prova. A identidade só é
   congelada após validada sob alta densidade (Timeline longitudinal · exames laboratoriais completos · detalhe de exame ·
   Agenda · Perfil · Configurações · Login) — tem de continuar elegante quando há muito conteúdo. Ver [[COLOR-001]] §7.

## 1. Filosofia da marca
- **Propósito:** dar continuidade ao cuidado — organizar e preservar a **história de saúde** da pessoa ao longo do
  tempo, de forma factual e humana ([[principio_nao_producao_conteudo_clinico]]).
- **Atributos emocionais:** **serenidade · confiança · leveza · sofisticação · natureza · esperança · continuidade ·
  longevidade · acolhimento.**
- **Personalidade:** calma e competente; próxima sem ser informal; cuidadosa, precisa, nunca alarmista.
- **Linguagem:** factual e clara; vocabulário de "história" e "documento"; sem jargão clínico frio ([[posicionamento_marca]]).

## 2. Referências artísticas — _Almond Blossom_ (Van Gogh, 1890)
Pintada por Van Gogh para celebrar o **nascimento** do sobrinho: ramos de amendoeira florescendo contra um céu
azul-esverdeado — símbolo de **vida que começa, renovação, esperança, delicadeza e continuidade**. É exatamente a
atmosfera da SINTERA: **a vida cuidada ao longo do tempo**. Inspira **atmosfera, luz e sensibilidade** — não é para ser
reproduzida.

## 3. Linguagem / diretrizes visuais
- **Atmosfera:** serena, natural, arejada — como respirar. Nada de urgência ou frieza clínica.
- **Princípios estéticos:** sofisticação silenciosa; delicadeza com estrutura; orgânico com precisão.
- **Uso do espaço:** generoso — **respiro** e leveza; o vazio é parte da composição.
- **Equilíbrio:** calmo e assimétrico-orgânico (como os ramos), sem rigidez.
- **Sensação transmitida:** acolhimento e confiança duradoura.

## 4. Linguagem cromática (DIREÇÃO A·E aprovada — tokens no 3B; ver [[COLOR-001]])
Construída **inspirada** na obra, **não extraída** dela; sistema completo de tokens (50–900) no 3B.
- **Primária = direção A·E** (azul-esverdeado suave/dessaturado, entre o Almond original e a variante luminosa) —
  **usada com CONTENÇÃO**: ações, gráficos, elementos ativos, destaques, navegação ativa. **Não** preencher grandes áreas.
- **Neutros (primeiro lugar):** **tons quentes das flores** — off-white, ivory, warm white, cinzas quentes muito suaves;
  **evitar branco puro** predominante. Impactam a percepção premium **mais** que a primária.
- **Secundária/auxiliar:** **verdes acinzentados dos galhos**.
- **Semântica clara:** Informação → primária Almond · **Sucesso → verde sálvia** · **Atenção → âmbar discreto** ·
  **Erro → terracota suave**. Não reusar a institucional para todos os estados.
- **Identidade única** Web + Mobile ([[adr_010_identidade_visual_unica|ADR-010]]); a paleta atual da web é provisória.
- **Regra:** congela-se a **direção**; valores finais de token podem ter ajuste técnico (contraste/acessibilidade/dark).

## 5. Tipografia (DECIDIDA — ver [[BRAND-002]])
**Par oficial da SINTERA: título Fraunces + corpo/interface/dados Hanken Grotesk** (ambas OFL, auto-hospedáveis).
Decidido pela fundadora em 2026-07-21, **por experiência de uso** (conforto de leitura antes de personalidade), no
specimen com telas densas + Mobile.
- **Títulos — Fraunces** (serifa variável, eixo óptico, quente e suave): sofisticação humana alinhada à atmosfera _Almond
  Blossom_, sem parecer artística. Uso comedido no display; peso ~500–560; `text-wrap: balance`.
- **Corpo · interface · dados — Hanken Grotesk** (grotesca humanista, variável): excelente legibilidade em tela e em
  leitura prolongada; **algarismos tabulares** para colunas de valores; cobertura PT-BR completa.
- **Direção geral:** sofisticado, humano, altamente legível em mobile e web, com hierarquia calma. A tipografia deve
  **desaparecer** durante a leitura.
Os tokens tipográficos (escala, pesos, line-height, tabular-nums) são definidos no **Design System (3B)**.

## 6. Iconografia
**Finos · elegantes · consistentes · discretos.** Traço leve; **evitar ícones pesados ou excessivamente preenchidos**;
linguagem natural, alinhada à leveza da marca.

## 7. Ilustrações
**Poucas · minimalistas · sem excesso de informação · sem aparência infantil.** Estilo orgânico e sensível, delicado,
nunca clínico; suporte à narrativa, não decoração.

## 8. Fotografia (caso venha a existir no futuro)
**Pessoas reais · luz natural · diversidade · bem-estar · cotidiano.** **Evitar imagens excessivamente médicas**;
continuidade com a atmosfera da marca.

## 9. Movimento
**Continuidade em tudo:** nada abrupto, nada excessivamente rápido, nada chamativo. A interface deve parecer **fluida,
quase orgânica**; animação a serviço da compreensão, não do espetáculo; respeitar `prefers-reduced-motion`
([[tema_g_acessibilidade]]).

## 10. Princípios de interface
Calma · clareza · acolhimento · factualidade (RDC 657) · acessibilidade desde a base · consistência web↔mobile.

## 11. Tom da marca
Sereno, confiável, humano, não-alarmista, factual. Fala de **história e continuidade**, não de doença.

## Governança
Identidade **única** para todos os pontos de contato. O **Design System (3B)** implementa esta identidade em tokens e
componentes. Alterações estruturais aqui exigem revisão (Architectural Baseline após aprovação).
