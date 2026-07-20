# BRAND-001 — Sistema de Identidade da SINTERA

**Objetivo:** definir **quem é** a SINTERA visual e emocionalmente — a identidade da marca — **antes** do Design System.
Orienta o **Design System único** (web + mobile).
**Escopo:** filosofia, referências, linguagem visual, linguagem cromática (direção), tipografia, iconografia, ilustração,
fotografia, movimento, princípios de interface, tom. **Não fixa tokens/cores definitivos** (isso é o 3B — Design System).
**Status:** Draft — aguardando aprovação da fundadora · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20).
**Dependências:** [[ARCH-002]] · [[HIP-011]] · [[posicionamento_marca]]. **Impacto:** referência permanente de identidade
para todo ponto de contato (web e mobile). Ao ser aprovado: Approved · Architectural Baseline · PDF.

## Decisões já aprovadas pela fundadora (permanentes)
1. **Referência estética principal = obra _Almond Blossom_, de Vincent van Gogh** — como **atmosfera e linguagem**, não
   como cópia da pintura nem extração literal de cores.
2. **A paleta atual da plataforma web é PROVISÓRIA** — não serve de referência. A futura atualização da web usará a
   **mesma identidade** do app.
3. **Identidade e Design System ÚNICOS** (web + mobile); adaptações específicas de plataforma **só quando necessário**.
4. **Nenhuma cor definitiva foi aprovada.** Aprovada apenas a **direção cromática** (§4). Tokens virão no 3B.

## 1. Filosofia da marca
- **Propósito:** dar continuidade ao cuidado — organizar e preservar a **história de saúde** da pessoa ao longo do
  tempo, de forma factual e humana ([[principio_nao_producao_conteudo_clinico]]).
- **Atributos emocionais:** **serenidade · confiança · leveza · sofisticação · natureza · continuidade · longevidade ·
  acolhimento.**
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

## 4. Linguagem cromática (DIREÇÃO — sem tokens definitivos)
Construída **inspirada** na obra, **não extraída** dela; será um **sistema completo de tokens (50–900)** no 3B.
- **Primária:** o **azul-esverdeado sereno do fundo** da pintura (teal tranquilo) — cor da marca.
- **Neutros:** **tons quentes das flores** — off-white, ivory, warm white; **evitar branco puro** como predominante.
  Os neutros carregam a leveza e o acolhimento.
- **Secundária/auxiliar:** os **verdes acinzentados dos galhos** — para **estados positivos, indicadores e elementos
  auxiliares**.
- **Semântica** (positivo/atenção/erro) será derivada com a mesma sobriedade, distinta da cor de marca.
- **Provisório:** as cores hoje em `globals.css` são temporárias e **não** referência.

## 5. Tipografia (direção; escolhas finais no 3B)
- **Institucional (display):** com caráter e humanidade — sofisticação sem ostentação.
- **Interface:** altamente legível, neutra-quente, confortável em telas pequenas.
- **Hierarquia:** clara e calma; escala consistente; respiro entre blocos.

## 6. Iconografia
Traço suave e consistente; cantos levemente arredondados; linguagem **natural e delicada**, alinhada à leveza da marca.

## 7. Ilustrações
Estilo **orgânico e sensível** (inspiração botânica/atmosférica), delicado, nunca infantil nem clínico. Suporte à
narrativa, não decoração.

## 8. Fotografia (caso venha a existir)
Luz **natural e suave**, humana e real; sem estética clínica fria; continuidade com a atmosfera da marca.

## 9. Movimento
Transições **calmas e orgânicas** (nada abrupto/alarmante); animação a serviço da compreensão, não do espetáculo;
respeitar `prefers-reduced-motion` ([[tema_g_acessibilidade]]).

## 10. Princípios de interface
Calma · clareza · acolhimento · factualidade (RDC 657) · acessibilidade desde a base · consistência web↔mobile.

## 11. Tom da marca
Sereno, confiável, humano, não-alarmista, factual. Fala de **história e continuidade**, não de doença.

## Governança
Identidade **única** para todos os pontos de contato. O **Design System (3B)** implementa esta identidade em tokens e
componentes. Alterações estruturais aqui exigem revisão (Architectural Baseline após aprovação).
