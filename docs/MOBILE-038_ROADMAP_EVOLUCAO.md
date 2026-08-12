# MOBILE-038 — Roadmap de Evolução (pós‑v1.0)

Itens de **evolução do produto** — **NÃO** fazem parte da homologação/RC1 da v1.0. Ficam **formalmente registrados**
para fases futuras, sem ampliar o escopo da versão atual. Índice único; detalhes moram nos docs referenciados.

## 1. Captura inteligente de documentos (recurso de plataforma)
- Captura de exames pela **câmera**; **OCR automático**; correção automática de **perspectiva/qualidade** da imagem.
- Natureza: captura de device + processamento; exceção de plataforma (não existe na Web da mesma forma).

## 1b. Captura UNIFICADA em toda a plataforma (Web+Mobile) — CAP‑001/HUB‑001 — origem: homologação D‑14
Toda **entrada de documento/arquivo/imagem** segue **um único protocolo** (o do "Adicionar registro"), com as
formas: **tirar foto/câmera · selecionar arquivo (PDF/foto) · digitar manualmente · falar (voz) · arrastar (drag‑drop)**.
Aplicar em **todas as páginas/categorias/entradas de produto**, nas duas plataformas — apresentando os **mecanismos
por plataforma** (drag‑drop=Web; câmera=Mobile; selecionar/manual=ambos; voz e câmera/OCR = itens 1 e 2 acima). Ref.: MOBILE‑037 D‑14.

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

## 4b. Receita médica (nova capacidade — Web + Mobile) — origem: homologação D‑13
Espelhar o padrão **pedido↔exame** para **receitas**: em **Medicamentos** e **Suplementos**, **anexar a receita**
(objeto separado do produto) e **vincular à compra** do medicamento/suplemento (como o pedido se vincula ao exame
realizado). Inclui consistência do **RegistrationHub** (HUB‑001) entre a home e as páginas respectivas, e o
"Adicionar registro" na **home da Web**. Lógica de vínculo no `@sintera/core` (contrato compartilhado). Ref.: MOBILE‑037 D‑13.

## 5. Evolução de navegação / arquitetura de informação (Web + Mobile)
- Nova barra inferior (Mobile) + reestruturação da **Sidebar (Web)** espelhada — **`docs/MOBILE-036`**.
  Inclui: Home dashboard, Exames centralizado, Minha Saúde (Dados de Saúde × Histórico), Compartilhamento
  (Relatórios + **Rede de Cuidado** — CARE‑002, oculta até existir), Organização (Despesas), Ajuda.

## 5b. Padrão de seletor (`Select`/`Picker`) em toda a plataforma — DS — origem: homologação D‑16
Todo campo de **opção** (nome de exame, tipo, **recorrência de lembrete**, filtros, etc.) usa um **seletor compacto
rolável** — Web = dropdown; Mobile = bottom‑sheet — **em vez de listar tudo aberto**. Componente é **primitivo do
Design System** (DS‑003: sem regra de negócio, reutilizável), com **busca** quando a lista for grande. Aplicar em
**todas as páginas/categorias**, nas duas plataformas. Ref.: MOBILE‑037 D‑16; usar também nos filtros do Relatório (REL‑002).

## 5c. Relatório — filtros e convergência — origem: homologação + REL‑002
Modelo unificado de filtros do Relatório (período aplicado a **todas** as seções, item por nome, filtro por tipo,
busca) **generalizando o mecanismo existente** (`sections`/`excluded`/`period`), e **convergência Web→core**
(`assembleReport`) para eliminar as **3 implementações paralelas** (Web inline · view pública `/r/[token]` · Mobile/core).
Detalhe e decisão de escopo em **`docs/REL-002`**. Bug do período no "Histórico de Exames" pode entrar no ciclo/RC1.

## 5d. Indicador de conteúdo nos accordions (Sidebar/Minha Saúde) — origem: aprovação da IA (06/08)
Quando um grupo/subdivisão estiver **recolhido**, exibir um **contador opcional** (ex.: `▶ Registros 24 · ▶ Saúde 5
· ▶ Histórico 183`) ou indicadores contextuais (exames, medicamentos ativos, eventos). Ajuda a pessoa a perceber
onde há conteúdo sem expandir. **Não é prioridade desta versão** — evolução futura. Dado por INJEÇÃO (contadores
vêm de fora da camada de navegação; a Sidebar/menu só apresenta). Aplicar Web+Mobile (paridade).

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

## Progresso de entrega (log)
Estado **verificado** na branch canônica `feat/mobile-inc4-perfil` (typecheck Web+Mobile · 1156 testes · deploy Vercel READY):
- **§4b / D‑13 — Receita médica (Web+Mobile): ENTREGUE.** Anexo aditivo `medications.prescription_url` (documento
  separado, bucket `exams` + signed URL), UI de anexar/ver a receita em Medicamentos/Suplementos nas duas plataformas,
  e indicador "📎 Receita" no card da lista (sem abrir o formulário). Não toca modelo clínico nem `prompt_registry`.
  Pendente do §4b: vínculo formal receita↔compra como objeto (evolução; o anexo direto já cobre o caso de uso atual).
- **§5b / D‑16 — Select (seletor compacto) nos campos de recorrência: ENTREGUE (paridade Web↔Mobile).** A Web já usava
  `Select` (AgendarModal, medicamentos, recursos, hábitos); o Mobile passou a usar o primitivo `Select` (bottom‑sheet
  rolável com busca) nos quatro pontos de recorrência (recompra, troca, lembrete, evento). Chips inline permanecem só
  em opções curtas (status, binários). Rollout do `Select` a demais campos de opção segue como evolução.
- **D‑03 / D‑18 — Histórico de Exames Mobile: RESOLVIDO por paridade.** A tela usa `Select` para tipo/período + busca
  (sem parede de chips) e cartões colapsados = nome + nº de medições → toque abre o detalhe. O valor/tendência inline
  é **decisão de paridade conceitual com a Web `/dashboard/saude`** (que exibe exatamente o mesmo `ListCard`), critério
  de aceite do próprio D‑18 — remover quebraria a paridade.
- **Dependências regulatórias isoladas (sem código):** D‑11 (estratégia de extração por modalidade) e D‑12 (rótulo de
  olho OD/OS em exames oftalmológicos bilaterais) — alteram artefato clínico governado (`prompt_registry`); aguardam
  aprovação do Responsável Clínico. A correção **factual** de *classificação de modalidade* do D‑11 (oftalmológico ≠
  laboratorial) já foi aplicada no classificador de documentos (não é juízo clínico).
