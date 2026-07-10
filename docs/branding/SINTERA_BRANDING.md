# SINTERA — Documento de Branding (v1.0)

> Consolidação da identidade de marca da SINTERA. **Totalmente alinhado** à *Constituição Estratégica* (`docs/estrategia/SINTERA_ESTRATEGIA_MASTER.md`). Não introduz novos conceitos — formaliza o que já foi decidido. Paleta e tipografia refletem o **Design System implementado** (`docs/DS-001_DESIGN_SYSTEM.md`) como fonte de verdade.

## 1. Posicionamento
- **Categoria:** plataforma de **continuidade da saúde** (evolução do histórico pessoal de saúde — "entre o Dropbox e o Epic: conecta, não substitui").
- **Ao usuário**, comunicar por **benefício** ("toda a sua vida de saúde organizada"), nunca por sigla ("PHR").
- **O que NÃO somos:** IA médica · prontuário de clínica (EHR) · app de prevenção · interpretação clínica.

## 2. Proposta de valor
**Sua saúde, organizada para toda a vida.**
A SINTERA reúne e organiza automaticamente as **informações e registros de saúde** — à medida que são adicionados — construindo uma visão clara da **evolução do cuidado ao longo da vida**, para revisão, acompanhamento e compartilhamento, preservando a decisão clínica com os profissionais. *("Informações e registros de saúde" é deliberadamente abrangente — comporta exames, laudos, receitas, medicamentos, consultas, vacinas, sinais vitais, hábitos, agenda/lembretes e, no futuro, wearables e integrações — sem reescrever o posicionamento a cada nova capacidade.)*
*(A formulação anterior "Você envia os documentos. A SINTERA faz o resto." foi substituída em 09/07 — decisão da fundadora — por ser subjetiva/vaga; a nova centra continuidade + organização como mecanismo. Ver §12.)*

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
- **Diretriz permanente (regulatório):** sempre que um disclaimer tratar dos **limites de atuação da plataforma**, citar **explicitamente a RDC 657/2022** (ou a norma regulatória vigente que venha a substituí‑la), **integrada ao texto** e com redação juridicamente precisa — *"observando os limites de atuação definidos pela RDC 657/2022"* ou *"em consonância com o enquadramento regulatório… (RDC 657/2022)"*. **Evitar** *"em conformidade com a RDC 657/2022"* como fórmula única/literal: a norma **não prescreve** o texto do aviso; o disclaimer é redação institucional inspirada no enquadramento. Fonte única dos textos: `src/lib/ui/copy.ts` (`DISCLAIMERS`).
- **Base do enquadramento (rastreabilidade):** a plataforma organiza informações **sem finalidade clínica, diagnóstica ou terapêutica** → não atende à definição de dispositivo médico (RDC 657/2022, **Art. 2º, VII**) e recai na exclusão do **Art. 1º, § 2º, IV** (reforçada pelo III) → fora do escopo como SaMD. Enquadramento definitivo = parecer jurídico‑regulatório.

## 7. Arquitetura de comunicação (4 níveis)
| Nível | Responde | Formulação |
|---|---|---|
| **Propósito** | Por que existimos? | História de saúde sempre pronta |
| **Posicionamento** | Que categoria lideramos? | Continuidade da saúde |
| **Promessa** | Que transformação entregamos? | Burocracia recorrente → continuidade automática |
| **Hero** | Como comunicar em segundos? | *Todas as informações da sua saúde, organizadas para você compreender a evolução do seu cuidado ao longo da vida.* |

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
**Hero (primeira dobra — congelada 09/07, decisão da fundadora):** cinco blocos, fonte no componente `src/components/landing/Hero.tsx`:
- **Selo:** *Sua saúde, organizada para toda a vida.*
- **Headline:** *Todas as informações da sua saúde, organizadas para que você compreenda melhor a evolução do seu cuidado ao longo da vida.*
- **Texto principal:** *A SINTERA reúne e organiza as informações da sua saúde à medida que você registra seus dados e adiciona documentos e registros de saúde, construindo uma visão clara da evolução do seu cuidado ao longo da vida.* (Abrangente por design — os documentos específicos e a origem laboratórios/clínicas descem para as camadas 2 e 3.)
- **Frase de impacto:** *Quem compreende melhor sua saúde, cuida melhor dela.*
- **Texto complementar:** *Ao transformar informações dispersas em uma história de saúde organizada e contínua, a SINTERA facilita o acompanhamento da sua saúde e apoia as decisões que você toma junto aos profissionais que participam do seu cuidado.*
- **CTA principal:** "Criar conta gratuitamente" · **CTA secundário:** "Entrar".

*Racional: vende **continuidade do cuidado** (o ativo), com a **organização automática** como mecanismo; objetiva, sem "faz o resto". "Evolução do cuidado ao longo da vida" = formulação leiga de continuidade (mais segura na RDC que "compreender sua saúde", pois refere-se à trajetória organizada). A validar com usuários: se "continuidade/evolução do cuidado" não comunicar, testar linguagem ainda mais intuitiva sem mudar o posicionamento.*

**Narrativa da home (reconstruída 09/07 — a landing conta UMA história, centrada no USUÁRIO, não em funcionalidades).** Princípio de revisão permanente: *toda seção fala mais da SINTERA ou da transformação do usuário? Se da SINTERA, reescrever.* Cada seção responde uma pergunta da jornada mental, nesta ordem:

| # | Pergunta do usuário | Seção | Mensagem |
|---|---|---|---|
| 1 | O que é? Por que preciso? | **Hero** | Sua saúde organizada para toda a vida (5 blocos) |
| 2 | Posso confiar de cara? | **Stats** | Grátis · Privado · Zero digitação · Tudo num lugar |
| 3 | Como me ajuda no dia a dia? | **Funcionalidades** | *"Menos tempo organizando. Mais tempo cuidando de você."* — 6 benefícios (inclui **lembretes por e-mail e WhatsApp**) |
| 4 | Como funciona? | **Como funciona** | Registre e reúna → a SINTERA organiza → compreenda e compartilhe |
| 5 | Como evolui comigo? | **Ecossistema** | *"Cada nova informação torna sua história de saúde mais completa."* (hoje: você/documentos · em breve: labs/wearables) |
| 6 | Por que confiar? | **Confiança** | *"Sua história de saúde, organizada com segurança."* — conteúdo preservado · não diagnostica (RDC 657/2022) · privado · você no controle |
| 7 | Como começo? | **Comece agora** + **CTA final** | *"Comece hoje a construir uma história de saúde organizada para toda a vida."* (fecha o loop com o Hero) |

**Princípios de copy da landing:** (a) perspectiva no **usuário** ("você passa a…", não "a SINTERA faz…"); (b) preferir **"história de saúde"** (concreto) a **"continuidade"** (abstrato); (c) **IA nunca é protagonista** (é meio) — na confiança, foco é conteúdo preservado + controle do usuário; (d) recuperar o diferencial **"menos tempo organizando, mais tempo cuidando"**; (e) só afirmar o que está **live** (integrações labs/wearables ficam explicitamente como "em breve"). **Fonte:** componentes em `src/components/landing/`. Após esta reconstrução: **publicar e evoluir por métricas** (tempo na página · CTA · conversão), não por nova discussão conceitual.

**Slogan de apoio:** *Sua saúde organizada. Seu tempo preservado.*

## 13. Diretrizes de marketing e comunicação
Toda peça de marca, design, UX ou comunicação responde a quatro perguntas:
1. **Reduz o trabalho administrativo** do usuário?
2. Mantém a plataforma **estritamente factual**, sem extrapolar para decisões clínicas?
3. Reforça a percepção de **organização, confiança e simplicidade**?
4. Preserva uma **identidade premium, discreta e consistente**?
Se alguma resposta for "não", a peça não representa a SINTERA.
