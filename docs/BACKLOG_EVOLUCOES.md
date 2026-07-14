# Backlog de Evoluções (registro — executar na fase adequada)

> Fundadora (14/07/2026): itens de evolução/UX identificados na revisão da plataforma. **Registrar agora,
> executar na fase mais adequada** — **sem interromper** a prioridade atual (consolidação da arquitetura:
> pipeline · CPE · representação clínica · certificação). Assim as melhorias de interface são construídas
> sobre uma arquitetura já consolidada e certificada, evitando retrabalho.

## Ordem de prioridade (restated pela fundadora)
1. **Consolidação da plataforma** (pipeline · CPE · persistência · certificação) — *atual*.
2. **Estabilização das modalidades clínicas** (uma por vez, CRC).
3. **CARE-001** (Espaço Colaborativo do Cuidado).
4. **Redesign dos módulos e da interface**.
5. **Evoluções listadas abaixo**.

---

## 1. Relatórios
- **1.1 Histórico** — criar **módulo de Histórico** próprio dentro de Relatórios; **separar definitivamente
  Agenda × Histórico** (hoje Histórico está acoplado à Agenda) e permitir acesso independente aos dois.
  *Momento: redesign da navegação / organização dos módulos.*

## 2. Exames
- **2.1 Identificação dos cards** — padronizar todos os cards com: **tipo do exame · laboratório/clínica ·
  médico SOLICITANTE**. O médico executor/assinante do laudo **NÃO** compõe a identificação principal (já
  está no documento original). *Refina [[req_display_card_exame]]. Momento: redesign do módulo Exames.*
- **2.2 Nomenclatura única** — política única de nomenclatura: **identidade documental fiel** + nomenclatura
  **consistente** em toda a UI; evitar variações entre exames equivalentes. *Momento: consolidação da
  Identidade Documental. Conecta [[regra_nomenclatura_documental]] · [[principio_identidade_documental]].*
- **2.3 Política única de extração** *(REGRA PERMANENTE — já constitucional)* — cada exame em **um** estado:
  **extração estruturada completa** OU **documento original disponível**. **Não existe estruturação parcial**;
  se não estruturar completamente, mantém só o documento para consulta. *Já registrado: [[regra_estruturacao_binaria]].*
- **2.4 Quantitativos × Qualitativos** — diferenciar: **Quantitativos** permitem estruturação · comparação
  histórica · evolução temporal · gráficos · indicadores. **Qualitativos** priorizam documento original ·
  consulta ao laudo, **sem** transformar texto clínico em dados quantitativos. *Reforça
  [[principio_nao_producao_conteudo_clinico]]. Momento: redesign do módulo Exames.*
- **2.5 Fluxo único de inclusão** — unificar os dois pontos de entrada atuais ("Novo exame" + upload) num
  **único fluxo** que recebe **PDF · foto · escaneamento · imagem única · múltiplas imagens · multipágina**,
  usando toda a arquitetura **Bundle → CDU → Processamento**. *Conecta [[req_captura_documental]] (CAP-001).
  Momento: redesign do módulo Exames.*
- **2.6 Classificação (ômicas como categorias)** — ômicas deixam de ter fluxo próprio e viram **categorias de
  exame**: Laboratorial · Imagem · Genético · Metabolômica · Proteômica · Transcriptômica · Microbioma · …
  Classificação **aberta e escalável**. *Conecta [[principio_modelo_aberto]] (classes, não listas).*
- **2.7 Informações financeiras** — por exame: **valor pago · upload de NF/recibo**, alimentando
  automaticamente o módulo financeiro/despesas. **Mesmo padrão** para medicamentos/suplementos/cirurgias/
  consultas/demais eventos. *Camada administrativa do [[evento_assistencial_entidade_central]] (§2).*
- **2.8 Agendamento** — **agendar exame · reagendar · recorrência** (mensal/trimestral/semestral/anual/
  intervalo personalizado), sobre a infraestrutura comum de **Eventos Assistenciais**. *[[evento_assistencial_entidade_central]] (§3, recorrência genérica).*

## 3. Sinais Vitais
- **Integração automática com fontes externas** (wearables · smartwatches · smartbands · apps de saúde ·
  plataformas parceiras). Prioridade = **integração automática**, reduzindo lançamento manual. Preparar a
  arquitetura para isso. *Momento: após consolidação do pipeline universal (conecta Ecossistema — Fase 5 do
  [[roadmap_5_fases]]).*

## 4. Medidas Corporais
- Evoluir de "bioimpedância" para **avaliação corporal em geral**: renomear "Escanear Bioimpedância" → algo
  amplo ("Adicionar avaliação corporal"/"Adicionar laudo"); organizar cada avaliação em **cards** (padrão de
  Exames); ao abrir o card, exibir **dados completos · evolução · comparações** (evitar uma avaliação sempre
  aberta na tela principal). Também: **valor pago · NF/recibo · agendamento · reagendamento · recorrência** —
  reutilizando a infra comum de **Eventos Assistenciais**. *[[evento_assistencial_entidade_central]].*

## 5. Design System (redesign visual)
Referência estética: **Almond Blossom, de Vincent van Gogh**. Diretrizes:
- **aqua** como cor institucional principal (entre Verde Tiffany e Azul Turquesa);
- **substituir a sidebar verde escura** pelo novo tom institucional;
- **creme · branco · preto · marrom** como paleta secundária;
- **dourado metálico** apenas como destaque para elementos premium/badges/estados especiais/detalhes.
Intenção: identidade mais **elegante, atemporal e sofisticada**. *Refina/confirma [[branding_paleta_v3_vangogh]].
Momento: redesign visual.*

---

**Natureza:** todos os itens acima são **camada de produto/UI/domínio**, a executar após a consolidação +
certificação da arquitetura. Vários já reutilizam infra registrada (Eventos Assistenciais, Modelo Aberto,
Identidade Documental) — nascerão sobre a base já certificada, sem retrabalho.
