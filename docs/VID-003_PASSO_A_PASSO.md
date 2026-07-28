# VID-003 — Passo a passo completo da produção do vídeo (do zero ao MP4 final)

> Runbook operacional, plataforma por plataforma, com o **conteúdo exato para colar** em cada uma. Autocontido.
> Base: [VID-001](VID-001_ROTEIRO_VIDEO_INSTITUCIONAL.md) (roteiro) + [VID-002](VID-002_KIT_DE_PRODUCAO.md) (kit).
> Regra permanente: nada que sugira diagnóstico/juízo clínico (REG-001). Formato: **16:9 · ~3 min · 1080p (ou 4K)**.

**Ordem (importante):** Narração → Música → Cenas → Refino → Grafismos de marca → Montagem → Exportar.
*(A narração primeiro porque a duração dela define o tempo de cada ato.)*

## FASE 0 — Preparação (15 min)
1. Junte os **assets de marca**: logotipo (PNG/SVG com fundo transparente), a paleta (acento **aqua #579DA8** sobre neutros claros), as fontes **Fraunces** (títulos) e **Hanken Grotesk** (texto), e a frase‑identidade.
2. Crie pastas: `01_narracao/` · `02_musica/` · `03_cenas/` · `04_grafismos/` · `05_montagem/` · `final/`.
3. Convenção de nome: `ato1_...`, `ato2_...` etc. (facilita alinhar tudo na montagem).

## FASE 1 — Narração · **ElevenLabs** (30–45 min)
**O que fazer:**
1. Entre no ElevenLabs → *Text to Speech*.
2. **Escolha da voz:** teste 2–3 vozes femininas em PT‑BR; critério = timbre **caloroso, institucional, de confiança** (não robótico, não jovem demais).
3. **Configuração:** Stability ~50% · Similarity ~80% · Style baixo · ritmo pausado. Idioma PT‑BR.
4. Gere **um clipe por ato** (5 clipes) — cole cada texto abaixo separadamente. Export **WAV** (ou MP3 320k).
5. **Anote a duração de cada clipe** — é ela que define quantos segundos cada ato terá no vídeo.

**Conteúdo para colar (um por vez):**
- `ato1_vo`: "Hoje, as informações de saúde de uma pessoa vivem dispersas. Exames em um lugar. Consultas em outro. Dispositivos gerando milhares de dados que raramente chegam a quem cuida. Hábitos, medicamentos e histórico da família, espalhados. Ninguém tem a visão completa."
- `ato2_vo`: "A SINTERA organiza toda a jornada de saúde em um único lugar — de forma factual, contínua e ao longo da vida. Não é mais um aplicativo de saúde: é a camada que reúne, organiza e dá contexto ao que já existe."
- `ato3_vo`: "Sua saúde, organizada por fase da vida. Seus exames, num histórico rastreável. Seus medicamentos e rotinas, com lembretes no momento certo. Sua rede de cuidado — profissionais e família — acessando exatamente o que você autoriza. Seus dispositivos, conectados. E os avisos, no seu canal."
- `ato4_vo`: "Dados que hoje vivem separados entram na SINTERA e são organizados numa visão única da pessoa. A plataforma não decide por você: ela reúne, organiza e contextualiza, para que você e os seus profissionais decidam com o quadro completo. Não é compartilhar um PDF — é compartilhar contexto, com segurança e controle."
- `ato5_vo`: "Continuidade do cuidado. Compartilhamento seguro com as pessoas que você autoriza. Acompanhamento ao longo da vida. A SINTERA conecta pessoas, profissionais e dispositivos em uma única jornada de saúde."

**Saída:** `01_narracao/ato1..ato5.wav` + a lista de durações (ex.: ato1 = 28s…).

## FASE 2 — Música · **Suno** (ou Udio) (20 min)
**O que fazer:**
1. Suno → modo **Instrumental** (sem voz).
2. Cole o prompt abaixo → gere 2–3 versões → escolha a que **cresce** (contida no início, esperançosa no fim).
3. Se ficar curta, use *Extend* até ~3 min (a soma das durações da Fase 1 + folga). Export **WAV/MP3**.

**Conteúdo (prompt):**
> *Instrumental, ~3 min. Ambient technology meets healthcare, hopeful and human. Minimal felt piano + warm airy pads + subtle growing light pulse. No heavy drums. Emotional build: intimate and restrained at the start, open and uplifting at the end. Clean, spacious, elegant. Reference feel: Apple / Stripe brand films.*

**Saída:** `02_musica/trilha.wav`.

## FASE 3 — Cenas / atmosfera · **Google Flow (Veo 3)** (1–2 h)
> As cenas AI entram como **fundo/atmosfera**. Grafismos e telas vêm na Fase 5. Clipes de IA são curtos
> (~5–8s) → gere **vários por ato** para cobrir a duração (da Fase 1) e escolha os melhores.

**O que fazer (para CADA ato):**
1. No Flow, cole **o style anchor + o prompt do ato** (abaixo). Formato **16:9**. Gere 3–4 variações.
2. Selecione as melhores; baixe. Revise contra a **fronteira** (nada de laudo/diagnóstico na tela).

**Style anchor (colar no INÍCIO de todo prompt):**
> *Estilo institucional premium e minimalista. Muito espaço em branco e luz suave e natural. Paleta neutra quente com um ÚNICO acento aqua‑turquesa (#579DA8). Movimento fluido, lento, elegante; câmera suave. Sem texto na cena. Referência: Apple Health × Stripe × Notion — limpo, calmo, sofisticado. 16:9, cinematográfico, 4K.*

**Prompts por ato:**
- **Ato 1:** *[anchor] Ambiente doméstico claro, manhã. Elementos de saúde dispersos e desconectados: tablet com um exame, celular com mensagem de consulta, smartwatch pulsando sozinho, papéis sobre mesa de madeira clara. Câmera desliza devagar entre eles; sensação de fragmentação. Sem pessoas em foco.*
- **Ato 2:** *[anchor] Os elementos dispersos deslizam ao centro e se unificam em um único ponto de luz aqua‑turquesa. Transição de caos para ordem. Fundo claro. Movimento fluido e esperançoso; a luz cresce do centro.*
- **Ato 3 (montagem):** *[anchor] Vinhetas curtas e serenas, mesma linguagem: mulher olhando o nascer do sol; tênis e garrafa d'água numa cozinha clara; smartwatch sincronizando dados como partículas de luz; mãos passando um celular para outra pessoa (gesto de confiança). Luz suave, acento aqua, muito espaço.*
- **Ato 4:** *[anchor] Vários fluxos finos de luz (exames, dispositivos, registros, pessoas) convergindo para um núcleo central luminoso — "visão única". Ao redor, silhuetas suaves de pessoas conectadas por linhas de luz finas. Movimento orquestrado, calmo. Fundo claro.*
- **Ato 5:** *[anchor] O núcleo de luz central pulsa; a câmera recua revelando um ciclo contínuo de luz aqua. Fundo branco sereno. Espaço central limpo reservado para o logotipo.*

**Saída:** `03_cenas/ato1_*.mp4 … ato5_*.mp4`.

## FASE 4 — Refino · **Runway Gen‑4** (45 min)
**O que fazer:**
1. Suba as melhores cenas do Veo → use para **estender**, **limpar movimento** e criar **transições** (a convergência é a transição‑mestre entre 1→2 e 4→5).
2. **Opcional — pessoas:** para as tomadas humanas (Ato 3/4), **Kling** costuma dar o movimento mais natural.
3. Exporte os clipes refinados.

**Saída:** `03_cenas/` (versões refinadas).

## FASE 5 — Grafismos de marca (overlays) · **Jitter** (ou Canva/After Effects) (1–2 h)
> Aqui está o segredo do resultado "produto sério": os grafismos com **suas fontes e paleta**, repetidos idênticos.
> Faça sobre **fundo transparente** e exporte com **canal alfa** (MOV ProRes 4444 ou WebM) para sobrepor no DaVinci.

**O que criar:**
1. **Linha da jornada** (barra fina no rodapé que avança por fase): Prevenção → Saúde Feminina → Gestação → Infância → Rotinas → Wearables → Rede de Cuidado → Acompanhamento contínuo.
2. **Convergência** (diagrama: fontes → núcleo "Visão única da pessoa") — para o Ato 2 e o Ato 4.
3. **Cards de módulo** (Ato 3), com o texto (fonte Hanken, título Fraunces, acento aqua):
   - Jornada de Saúde · "Por fase da vida — da mulher, da família."
   - Hábitos de Vida · "Acompanhados, com o contexto que importa."
   - Exames · "Histórico rastreável — original a um clique."
   - Medicamentos · "Organizados, com lembretes de dose."
   - Rotinas · "Programe e seja lembrada no momento certo."
   - Rede de Cuidado · "Compartilhe contexto — com consentimento."
   - Profissionais de Saúde · "Cada um vê só o que foi autorizado."
   - Wearables · "Dispositivos conectados, sinais do dia a dia."
   - Notificações · "No seu canal — e‑mail ou WhatsApp."
4. **Assinatura final** (Ato 5): logotipo + *"SINTERA — inteligência preventiva para a jornada de saúde de cada pessoa, ao longo da vida."*

**Saída:** `04_grafismos/*.mov` (com alfa).

## FASE 6 — Montagem final · **DaVinci Resolve** (grátis) (2–3 h)
**O que fazer:**
1. Novo projeto → *Project Settings*: Timeline **16:9**, 1080p (ou 4K), 24 ou 30 fps.
2. Importe tudo (cenas, narração, música, grafismos).
3. Monte a timeline (a duração de cada ato = a duração da narração da Fase 1):

| Trilha | Conteúdo |
|---|---|
| **V1** | Cenas Veo/Runway na ordem Ato 1→5 |
| **V2** | Overlays de marca (linha da jornada · convergência · cards do Ato 3) |
| **V3** | Assinatura/logotipo (Ato 5) |
| **A1** | Narração (ato1..ato5) |
| **A2** | Música — **com ducking** (abaixa sob a narração; use *Fairlight* ou keyframes de volume) |

4. **Alinhe** cada cena ao seu clipe de narração. **Transições:** convergência (1→2, 4→5) + cross‑dissolve suave entre módulos.
5. **Cor:** no *Color*, iguale as cenas (temperatura/brilho) para um look uniforme e claro.
6. **Legendas** (opcional, PT‑BR): *Subtitles* → gerar/colar → queimar ou exportar `.srt`.
7. **Áudio:** narração ~‑3 dB, música ~‑18 dB sob a voz; normalizar no fim.

**Saída:** timeline pronta.

## FASE 7 — QA + Exportar (30 min)
1. **QA de fronteira (REG‑001):** assista inteiro — nenhuma cena/tela sugere diagnóstico, risco clínico ou conduta. Verbos/mensagens só factuais.
2. Cheque níveis de áudio, cortes, ortografia dos cards.
3. **Deliver (Render):** H.264, 1080p (ou 4K), ~10–20 Mbps → `final/sintera_institucional.mp4`.
4. Exporte também uma versão com **legendas queimadas** (para redes) se precisar.

---
### Resumo do pipeline
| Fase | Plataforma | Entrega |
|---|---|---|
| 1 | ElevenLabs | narração (5 clipes) |
| 2 | Suno/Udio | trilha |
| 3 | Google Flow (Veo 3) | cenas/atmosfera |
| 4 | Runway Gen‑4 (+ Kling p/ pessoas) | cenas refinadas + transições |
| 5 | Jitter/Canva/After Effects | grafismos de marca (alfa) |
| 6 | DaVinci Resolve | montagem |
| 7 | DaVinci Resolve | MP4 final + QA REG‑001 |

**Tempo total estimado:** ~1 a 1,5 dia de trabalho. **Custo:** DaVinci grátis; ElevenLabs/Suno/Flow/Runway em planos pagos (confirmar limites de export em alta resolução).

---
**Conformidade:** ✔ REG-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: VID-001 (roteiro) · VID-002 (kit) · REG-001 (fronteira) · branding (aqua #579DA8, Fraunces/Hanken).*
