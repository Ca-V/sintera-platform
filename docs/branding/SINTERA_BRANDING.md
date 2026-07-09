# SINTERA — Documento de Branding (v1.0)

> Consolidação da identidade de marca da SINTERA. **Totalmente alinhado** à *Constituição Estratégica* (`docs/estrategia/SINTERA_ESTRATEGIA_MASTER.md`). Não introduz novos conceitos — formaliza o que já foi decidido. Paleta e tipografia refletem o **Design System implementado** (`docs/DS-001_DESIGN_SYSTEM.md`) como fonte de verdade.

## 1. Posicionamento
- **Categoria:** plataforma de **continuidade da saúde** (evolução do histórico pessoal de saúde — "entre o Dropbox e o Epic: conecta, não substitui").
- **Ao usuário**, comunicar por **benefício** ("toda a sua vida de saúde organizada"), nunca por sigla ("PHR").
- **O que NÃO somos:** IA médica · prontuário de clínica (EHR) · app de prevenção · interpretação clínica.

## 2. Proposta de valor
**Você envia os documentos. A SINTERA faz o resto.**
A plataforma recebe, identifica, organiza, estrutura e prepara suas informações de saúde automaticamente — para revisão, acompanhamento e compartilhamento — preservando a decisão clínica com os profissionais.

## 3. Propósito, Missão, Visão e Valores
- **Propósito:** que toda pessoa tenha sua história de saúde **sempre pronta — completa, contínua e a serviço dela** — em qualquer momento da vida.
- **Missão:** eliminar continuamente o **trabalho administrativo** da saúde.
- **Visão:** ser a **infraestrutura pessoal de continuidade da saúde** — usada sempre que alguém precisar organizar, entender, acompanhar ou compartilhar sua história clínica ao longo da vida.
- **Valores:** **Clareza** (informação compreensível) · **Confiança** (toda informação tem origem e rastreabilidade) · **Simplicidade** (menos esforço, menos repetição, menos burocracia) · **Assistência** (a tecnologia trabalha junto da pessoa, nunca no lugar dela) · **Responsabilidade** (organiza informações; as decisões clínicas permanecem humanas).

## 4. Identidade da marca
**Elegância clínica contemporânea** — cruzamento de **medicina + design editorial + hospitalidade premium**. A plataforma deve parecer **calma, organizada e extremamente confiável**. Sensação‑guia: *"tudo está no lugar certo."*

## 5. Personalidade e arquétipos
- **Arquétipo primário — O Sábio:** conhecimento organizado, precisão, segurança.
- **Arquétipo secundário — O Cuidador:** reduz carga, facilita a vida, ajuda sem invadir.
- **Transmite:** serenidade · competência · sofisticação discreta · precisão · acolhimento sem excesso emocional · inteligência silenciosa.
- **Nunca:** futurismo exagerado · linguagem "mágica" · marketing agressivo · **antropomorfização da IA**.

## 6. Tom de voz
- **Deve ser:** claro · elegante · humano · objetivo · **factual**.
- **Deve evitar:** hype · promessas absolutas · jargão tecnológico · exageros ("revolucionário", "o mais inteligente", "nunca mais…").
- **Vocabulário:** "documento" (não "arquivo"), "organiza/prepara/estrutura" (nunca "diagnostica/interpreta/recomenda"). Coerente com a fronteira **RDC 657**.

## 7. Arquitetura de comunicação (4 níveis)
| Nível | Responde | Formulação |
|---|---|---|
| **Propósito** | Por que existimos? | História de saúde sempre pronta |
| **Posicionamento** | Que categoria lideramos? | Continuidade da saúde |
| **Promessa** | Que transformação entregamos? | Burocracia recorrente → continuidade automática |
| **Hero** | Como comunicar em segundos? | *Você envia os documentos. A SINTERA faz o resto.* |

## 8. Identidade visual — direção de design
Muito **espaço em branco** · poucos elementos · **cards grandes** · sombras suaves · bordas arredondadas · **hierarquia editorial**. A interface responde sempre a uma pergunta: *"como reduzir trabalho para esta pessoa?"*

## 9. Paleta de cores (OFICIAL — congelada)
Marca **universal, premium, tecnológica, humana, atemporal e gênero‑neutra.** A primária é uma **violeta profunda** (não rosê) — decisão de identidade decorrente do posicionamento universal.

**Primária institucional — Violeta (Ametista):** `#6A5B91` · claro `#E7E1F0` · escuro `#52447A` · fundo suave `#EFEBF7`
&nbsp;&nbsp;*(tom oficial A2 — leve, sóbrio, atemporal; passa WCAG AA como texto ~5,8:1; gradiente de marca `#6A5B91 → #9485B6`)*
**Apoio — Sálvia:** `#7DAF9E` · claro `#C8E2DB`
**Secundária — Petal (rosê):** `#C2849A` · claro `#EDD5DF` *(apoio visual pontual — não é o rosto da marca)*
**Premium/conquistas — Dourado:** `#C9A97A` *(uso restrito: indicadores, conquistas — nunca textos longos)*
**Fundo/superfície:** Creme `#F7F3F0` · Ivory `#F2EDE8` · Warm `#EEE8E1` · Branco `#FFFFFF`
**Texto:** Onyx (principal) `#1E1820` · Mauve (secundário) `#7A6470` · Bordas `#EAE2E8`
**Superfície escura:** Deep `#12101A` · Onyx `#1E1820` *(sidebar, áreas de destaque)*

> **Nota de implementação:** o token histórico `petal` (primário app‑wide, 530 usos) teve seu **valor** redefinido para a violeta institucional; o **rename** do token (`petal`→`primary`) é higiene técnica agendada — a identidade e o AA já estão corretos. `lavender` passou a carregar o rosê secundário.
>
> **Conformidade WCAG (estado atual):** a **superfície pública** (`/`, `/login`, `/lista-de-espera`, `/termos`) foi validada com axe‑core e está com **0 violações de `color-contrast`**. As **páginas autenticadas herdam os mesmos tokens globais** (a correção é determinística e aplicada em toda a plataforma), mas a **conformidade WCAG AA completa será confirmada na homologação final**, com o harness QA autenticado sobre todas as rotas.

## 10. Tipografia
- **Display — Cormorant Garamond** (`--font-display`): títulos, hero, chamadas editoriais.
- **Corpo — DM Sans** (`--font-body`): interface, formulários, navegação.
- Contraste editorial serifada × sem‑serifa reforça "medicina + design editorial".

## 11. Iconografia e linguagem visual
- **Ícones:** biblioteca **lucide-react** — traço fino, consistente, geométrico e sereno. Ícones decorativos são discretos; nunca competem com o conteúdo.
- **Componentes:** Design System DS-001 — `card-premium`, escala de padding canônica, `Card`/`Section`/`MotionCard`/`ActionCard`. Movimento sutil (Framer Motion), respeitando redução de movimento.
- **Acessibilidade** é parte da identidade (TEMA G): rótulos associados, foco visível, leitura por leitor de tela — "confiável" também significa "acessível".

## 12. Proposta da página principal (landing)
**Hero** — H1: *Você envia os documentos. A SINTERA faz o resto.* · Subtítulo: recebe exames, receitas e outros documentos em um só lugar; identifica, organiza e prepara automaticamente para revisão, acompanhamento e compartilhamento, preservando a decisão clínica com os profissionais. · **CTA principal:** "Enviar meu primeiro documento" · **CTA secundário:** "Conhecer a plataforma".

**Estrutura da home:**
1. **Hero** (promessa + CTA + visual da plataforma)
2. **Como funciona** (envie → organiza automaticamente → revise e compartilhe)
3. **O que a plataforma faz** (capacidades, não módulos: identifica documentos · organiza exames · reúne histórico · acompanha medicamentos · registra medidas · prepara relatórios)
4. **Inteligência transversal** (a mesma inteligência acompanha todos os módulos)
5. **Segurança e responsabilidade** (dados protegidos · rastreabilidade · organização factual · sem diagnóstico automático · sem substituição da avaliação profissional)
6. **Encerramento** ("Menos tempo organizando informações. Mais tempo cuidando da sua saúde.") + CTA final "Começar agora"

**Slogan principal:** *Sua saúde organizada. Seu tempo preservado.*

## 13. Diretrizes de marketing e comunicação
Toda peça de marca, design, UX ou comunicação responde a quatro perguntas:
1. **Reduz o trabalho administrativo** do usuário?
2. Mantém a plataforma **estritamente factual**, sem extrapolar para decisões clínicas?
3. Reforça a percepção de **organização, confiança e simplicidade**?
4. Preserva uma **identidade premium, discreta e consistente**?
Se alguma resposta for "não", a peça não representa a SINTERA.
