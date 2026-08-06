# MOBILE-038 — Roadmap de Evolução (pós‑v1.0)

Itens de **evolução do produto** — **NÃO** fazem parte da homologação/RC1 da v1.0. Ficam **formalmente registrados**
para fases futuras, sem ampliar o escopo da versão atual. Índice único; detalhes moram nos docs referenciados.

## 1. Captura inteligente de documentos (recurso de plataforma)
- Captura de exames pela **câmera**; **OCR automático**; correção automática de **perspectiva/qualidade** da imagem.
- Natureza: captura de device + processamento; exceção de plataforma (não existe na Web da mesma forma).

## 2. Entrada por voz
- Registrar informações por **comando de voz**, com transcrição estruturada. (Microfone = recurso de device.)

## 3. Ingestão de laudos por IA
- Processamento inteligente de laudos → **extração automática** das informações e preenchimento estruturado.
- Cuidado regulatório: **factual**, sem interpretação clínica (RDC 657 / [[principio_nao_producao_conteudo_clinico]]).
  Governado (aprendizado sob curadoria) — ver visão `docs/` de Sistema Cognitivo Clínico.

## 4. Integrações (Fase 2 — HIP‑001 / ecossistema de monitoramento)
- **Wearables** e fontes: **Apple Health**, **Google Health Connect**, **Garmin**, **Fitbit**, **Oura**, **Whoop**, e
  demais conexões previstas na arquitetura.
- Governança: **trava de Fase 2** — nenhum código antes das etapas do ecossistema aprovadas (HIP‑003..009). O
  domínio **Conexões** (`/dashboard/conexoes`) já existe na Web e é a porta desse ecossistema.

## 5. Evolução de navegação / arquitetura de informação (Web + Mobile)
- Nova barra inferior (Mobile) + reestruturação da **Sidebar (Web)** espelhada — **`docs/MOBILE-036`**.
  Inclui: Home dashboard, Exames centralizado, Minha Saúde (Dados de Saúde × Histórico), Compartilhamento
  (Relatórios + **Rede de Cuidado** — CARE‑002, oculta até existir), Organização (Despesas), Ajuda.

## 6. Backlog técnico (P2/P3) + dependências arquiteturais + propostas §B
- **P2/P3 + oportunidades de infra compartilhada:** `docs/MOBILE-032` §A.1 (backlog) e §C.
- **Propostas que dependem de decisão (§B):** altura no Perfil (IMC); resumo/síntese de biomarcadores no Relatório;
  convergência do render do Relatório Web→core; enriquecimento da Home (INV‑HOME‑001) — `docs/MOBILE-032` §B.
- **Governança pós‑RC1:** consolidar o ADR de Governança (Arquitetura P1–P4 · Governança G1–G4 · princípio de
  engenharia) **após** o RC1 — memória [[governanca_adr_v1_pos_rc1]].

## Regra
A homologação da v1.0 foca **apenas** paridade + estabilidade (`docs/MOBILE-037`). Estas evoluções entram na
**fase de evolução do produto** (pós‑RC1), priorizadas a partir deste roadmap e sob a Matriz de Paridade + a
Diretriz de Comunicação Regulatória.
