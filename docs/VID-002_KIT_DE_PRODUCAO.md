# VID-002 — Kit de produção do vídeo institucional

> Transforma o [VID-001](docs/VID-001_ROTEIRO_VIDEO_INSTITUCIONAL.md) (roteiro + storyboard) em **artefatos prontos
> para colar** em cada etapa do pipeline escolhido: **Google Flow/Veo 3 → Runway Gen‑4 → ElevenLabs → Suno/Udio →
> DaVinci Resolve**. Toda a linguagem respeita [REG-001](REG-001_GUARDRAIL_REGULATORIO.md) (organiza/conecta/lembra;
> nunca interpreta/diagnostica). ~3 min · 5 atos · 16:9.

## 0. Style anchor (colar no INÍCIO de TODO prompt de cena)

> *Estilo institucional premium e minimalista. Muito espaço em branco e luz suave e natural. Paleta neutra quente
> com um ÚNICO acento aqua‑turquesa (#579DA8). Movimento fluido, lento e elegante; câmera suave. Sem texto na cena
> (o texto entra na montagem). Referência estética: Apple Health × Stripe × Notion — limpo, calmo, sofisticado, com
> profundidade. Nada de "corporativo genérico". 16:9, cinematográfico, 4K.*

**Regra de fronteira (não gerar):** telas/laudos com resultado clínico "interpretado", diagnósticos, alertas de
risco, números de exame com juízo. Permitido: pessoas, ambiente, dados como luz/partículas, UI neutra sem juízo.

## 1. Prompts de geração de cena (Veo 3 / Flow) — atmosfera; grafismos e UI vão como overlay (§5)

**Ato 1 — O problema (~30s):**
> *[style anchor] Ambiente doméstico claro, manhã. Elementos de saúde DISPERSOS e desconectados: um tablet com um
> exame, um celular com uma mensagem de consulta, um smartwatch pulsando sozinho, papéis sobre uma mesa de madeira
> clara. A câmera desliza devagar entre eles; cada um isolado, sem ligação. Sensação de fragmentação e distância.
> Tom neutro, levemente melancólico. Sem pessoas em foco.*

**Ato 2 — A solução (~25s):**
> *[style anchor] Os elementos dispersos deslizam suavemente em direção ao centro do quadro e se unificam em um
> único ponto de luz aqua‑turquesa. Transição visual de caos para ordem. Fundo claro e minimalista. Movimento
> fluido e esperançoso; a luz cresce do centro.*

**Ato 3 — Módulos (~70s, montagem):** gerar **ambientes/atmosferas** curtos; as **telas/ícones de cada módulo**
ficam melhores como motion graphics (§5). Vinhetas atmosféricas:
> *[style anchor] Série de vinhetas curtas e serenas, mesma linguagem: (a) uma mulher olhando o nascer do sol
> (jornada/fases); (b) tênis e garrafa d'água numa cozinha clara (rotinas); (c) um smartwatch sincronizando dados
> como partículas de luz (wearables); (d) mãos passando um celular para outra pessoa, gesto de confiança (rede de
> cuidado). Luz suave, acento aqua, muito espaço.*

**Ato 4 — Como tudo se conecta (~35s):**
> *[style anchor] Vários fluxos finos de luz (representando exames, dispositivos, registros, pessoas) convergindo
> elegantemente para um NÚCLEO central luminoso — uma "visão única". Ao redor, silhuetas suaves de pessoas (uma
> paciente ao centro; profissionais e familiares) conectadas por linhas de luz finas e discretas. Movimento
> orquestrado, calmo, sofisticado. Fundo claro.*

**Ato 5 — Encerramento (~20s):**
> *[style anchor] O núcleo de luz central pulsa suavemente; a câmera recua revelando um CICLO contínuo de luz aqua
> (acompanhamento ao longo da vida). Fundo branco, sereno. Espaço central limpo reservado para o logotipo.*

> **Refino no Runway Gen‑4:** subir as melhores cenas do Veo para dar consistência, corrigir movimento, criar as
> transições entre atos (a "convergência" é a transição‑mestre). Para as pessoas (Ato 3d/4), **Kling** costuma dar
> o movimento humano mais natural — opcional.

## 2. Narração — ElevenLabs (PT‑BR)

**Direção de voz:** feminina · brasileira · timbre caloroso e institucional · ritmo pausado e confiante
(~140–150 palavras/min) · pausas nos pontos finais · sem urgência. (Sugestão: testar 2–3 vozes e escolher a mais
"cuidado/confiança".) Gerar **um clipe por ato** (facilita o sincronismo na montagem).

- **Ato 1:** "Hoje, as informações de saúde de uma pessoa vivem dispersas. Exames em um lugar. Consultas em outro. Dispositivos gerando milhares de dados que raramente chegam a quem cuida. Hábitos, medicamentos e histórico da família, espalhados. Ninguém tem a visão completa."
- **Ato 2:** "A SINTERA organiza toda a jornada de saúde em um único lugar — de forma factual, contínua e ao longo da vida. Não é mais um aplicativo de saúde: é a camada que reúne, organiza e dá contexto ao que já existe."
- **Ato 3 (sobre a montagem):** "Sua saúde, organizada por fase da vida. Seus exames, num histórico rastreável. Seus medicamentos e rotinas, com lembretes no momento certo. Sua rede de cuidado — profissionais e família — acessando exatamente o que você autoriza. Seus dispositivos, conectados. E os avisos, no seu canal."
- **Ato 4:** "Dados que hoje vivem separados entram na SINTERA e são organizados numa visão única da pessoa. A plataforma não decide por você: ela reúne, organiza e contextualiza, para que você e os seus profissionais decidam com o quadro completo. Não é compartilhar um PDF — é compartilhar contexto, com segurança e controle."
- **Ato 5:** "Continuidade do cuidado. Compartilhamento seguro com as pessoas que você autoriza. Acompanhamento ao longo da vida. A SINTERA conecta pessoas, profissionais e dispositivos em uma única jornada de saúde."

## 3. Música — Suno / Udio (prompt)

> *Instrumental, ~3 min. Ambient technology meets healthcare, hopeful and human. Minimal felt piano + warm airy
> pads + subtle, growing light pulse. No heavy drums. Emotional build: intimate/restrained at the start → open and
> uplifting at the end. Clean, spacious, elegant. Reference feel: Apple / Stripe brand films.*

Gerar 2–3 variações; escolher a que faz o **build** do Ato 1 (contido) ao Ato 5 (esperançoso).

## 4. Montagem final — DaVinci Resolve (plano de timeline)

| Trilha | Conteúdo |
|---|---|
| V1 (base) | Cenas Veo/Runway na ordem dos atos (dur. ~30 / 25 / 70 / 35 / 20 s) |
| V2 (overlay) | **Motivos de marca** compostos: a **linha da jornada** (rodapé, avança por ato) + a **convergência** + os **cards/ícones dos módulos** (Ato 3) — feitos em motion graphics para precisão/consistência |
| V3 | Logotipo/assinatura (Ato 5): *"SINTERA — inteligência preventiva para a jornada de saúde de cada pessoa, ao longo da vida."* |
| A1 | Narração (ElevenLabs), um clipe por ato |
| A2 | Música (Suno/Udio), **abaixada (ducking) sob a narração** |

- **Transições:** a convergência é a transição‑mestre (1→2 e 4→5); cross‑dissolve suave entre módulos.
- **Ritmo:** Ato 1 contido → Ato 3 em cadência (corte a cada ~8s) → Ato 4 pausa (a tese) → Ato 5 respira.
- **Export:** 1080p (ou 4K) · H.264/H.265 · legendas PT‑BR opcionais (queimadas ou .srt).
- **QA de fronteira (REG‑001):** antes de exportar, revisar cada cena — nada que sugira diagnóstico/juízo clínico.

## 5. Onde usar motion graphics (em vez de AI) — para marca precisa
A **linha da jornada**, a **convergência** e os **cards de módulo** (Ato 3) devem ser **desenhados** (Jitter/After
Effects/Canva) com as fontes (Fraunces/Hanken) e a paleta, e **compostos como overlay** no DaVinci. Isso garante
tipografia correta, o mesmo grafismo repetido idêntico entre cenas, e a identidade da marca — algo que Veo/Runway
não entregam de forma consistente. As cenas AI entram como **atmosfera/fundo**; os grafismos, por cima.

---
**Conformidade:** ✔ REG-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: VID-001 (roteiro/storyboard) · REG-001 (fronteira/verbos) · branding (paleta aqua #579DA8, Fraunces/Hanken) · frase-identidade.*
