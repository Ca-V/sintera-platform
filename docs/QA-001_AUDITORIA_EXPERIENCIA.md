# QA-001 — Auditoria de Experiência da Plataforma (Metodologia Permanente)

**Status:** 🔒 **DOCUMENTO CONSTITUCIONAL** (aprovado 07/07/2026) — processo oficial e permanente de auditoria e homologação da SINTERA. Toda homologação futura segue este processo.
**Documentos constitucionais (governança oficial):** Plano de Maturidade · UX-001 · DS-001 · REL-001 · KG v2 · Roadmap por Ondas · **QA-001**.
**Natureza:** 🟪 Infraestrutura (QA) — desenvolvida em **paralelo**, **não bloqueia** a evolução funcional (Onda 0.5 / REL-001 seguem prioritárias).
**Integração:** a auditoria automatizada integra o **Definition of Done** de todas as ondas — a cada release o harness executa automaticamente (desktop · mobile · console · screenshots · overflow · falhas de rede · responsividade · consistência dos componentes) **antes de publicar**.
**Herda:** [[UX-001]] · [[DS-001]] · [[REL-001]] · Roadmap por Ondas ([[roadmap_ondas_core]]) · [[sintera_mission_vision]] · RDC 657.

---

## 1. Princípio

A qualidade da plataforma deixa de depender de **observações pontuais** e passa a seguir um **roteiro fixo e reprodutível**. Uma auditoria não produz "uma lista de bugs" — produz uma **leitura completa de produto** (problemas + oportunidades), priorizada dentro do Roadmap por Ondas.

> ### ⭐ Critério central do QA-001
> Durante **toda** a auditoria, a pergunta mais importante — o **principal critério de avaliação de produto** — é:
> **"Esta funcionalidade aproxima a SINTERA do objetivo de ser a melhor plataforma de organização, continuidade e compartilhamento das informações de saúde do usuário?"**
> Se a resposta for **negativa**, a funcionalidade deve ser **simplificada, revista ou removida**. O produto evolui por **valor**, não pela mera adição de funcionalidades.

## 2. Fonte oficial de evidências — harness Playwright único

Um **único harness** (agente-neutro) é a fonte oficial das evidências. Ele roda **uma vez** por auditoria e produz artefatos padronizados que **todos os revisores consomem** (Claude Code · ChatGPT · fundadora) — garantindo pareceres **comparáveis** sobre a mesma base factual.

**Não** se deve dar login de produção a múltiplos agentes. Coleta única → revisão múltipla.

### 2.1 Verificações automáticas (determinísticas — falham o build)
Por rota, em **desktop (1280)** e **mobile (375)**:
- Scroll horizontal (`scrollWidth > clientWidth`), overflow, texto estourando o container.
- Erros de **console** e requisições de rede falhas.
- Elemento-âncora ausente / página que não montou.
- **Screenshot** full-page (desktop + mobile) de cada página.

*(Esta camada teria detectado sozinha o bug do cabeçalho do exame.)*

### 2.2 Artefatos
`audit-artifacts/` → `screenshots/<rota>.<viewport>.png` · `console-errors.log` · `overflow-report.json` · `report.md` (legível).

## 3. Análise por página (5 dimensões — revisão humana + IA sobre os artefatos)

| Dimensão | O que avaliar |
|---|---|
| **Produto** | propósito da tela · valor entregue · clareza da proposta · utilidade real |
| **UX** | facilidade de entendimento · nº de cliques · carga cognitiva · organização · hierarquia visual |
| **Design** | consistência visual · uso correto do DS-001 · equilíbrio de espaços · contraste · legibilidade |
| **Arquitetura** | aderência ao UX-001 · coerência entre módulos · organização do menu · navegação |
| **Regulatório** | aderência ao posicionamento oficial e à RDC 657 · nenhuma tela pode sugerir diagnóstico · interpretação clínica · recomendação terapêutica · estratificação de risco · parecer médico (havendo dúvida, propor alternativa compatível) |
| **Consistência** | nomenclaturas · mensagens · botões · títulos · ícones · breadcrumbs · componentes · comportamento — nenhuma tela pode parecer de outro sistema |
| **Comunicação** | tom · linguagem · microcopy · mensagens de ajuda · Empty States · confirmações · erros |
| **Identidade do produto** | transmite organização · confiança · continuidade · autonomia da pessoa · rastreabilidade · segurança · simplicidade? |
| **Performance percebida** | tempo de leitura · excesso de informação · densidade visual · organização |

### 3.1 Proposta de valor por tela (complemento estratégico — obrigatório)
Para **cada página**, responder objetivamente:
1. Qual é o **objetivo** desta tela?
2. O usuário entende esse objetivo em **até 5 segundos**?
3. Existe algum elemento que **não contribui** para esse objetivo?
4. Existe algo importante que **está faltando**?
5. **Esta página reforça a proposta de valor da SINTERA?** — concretamente: faz a SINTERA parecer um *"organizador de documentos"* ou uma *"plataforma de continuidade do cuidado"*?

Sempre que possível, **propor simplificações** (funcionalidade redundante/desnecessária · excesso de informação · excesso de cliques).

A pergunta 5 é a mais importante. O diferencial da SINTERA **não** é armazenar documentos — é **organizar, relacionar e tornar as informações de saúde utilizáveis ao longo do tempo, com rastreabilidade, sem substituir o julgamento clínico**. A auditoria verifica se essa proposta de valor está **evidente em toda a experiência**.

### 3.2 Lente permanente — retenção
Ao longo de **toda** a auditoria, responder continuamente: **"Por que alguém continuaria usando a SINTERA daqui a um ano?"** Se uma tela não contribui para essa resposta, propor melhorias.

## 4. Auditoria específica da Home (posicionamento de produto)

A Home recebe auditoria própria. Não é "uma tela inicial" — deve **transmitir imediatamente o propósito da SINTERA** e, em poucos segundos, responder:
- Por que esta plataforma **existe**?
- Por que vale a pena usá-la **diariamente**?
- Qual **problema** resolve?
- Qual **benefício concreto** entrega?

Deve incentivar o uso contínuo **sem mensagens alarmistas**. Deve carregar, quando fizer sentido, a **história, direção, valores e visão** da SINTERA — o que é fundamental para o sucesso do produto (herda [[sintera_mission_vision]]).

Entregável: **proposta completa de evolução da Home** — não apenas visual, mas **revisão de posicionamento de produto** — contemplando:
- **proposta de valor** · **posicionamento** · **percepção de confiança** · **retenção** · **diferenciação** · **organização visual** · **incentivo ao uso recorrente**.

Quando o usuário vê a Home, deve **compreender imediatamente por que vale a pena usar a SINTERA continuamente** e **sentir a necessidade** de tê-la (necessidade de uso, praticidade, ganho real para a vida) — **sem alarmismo**.

## 5. Documento-resultado (não é lista de bugs)

Um documento único com seis eixos:
1. Problemas encontrados
2. Oportunidades de melhoria
3. Oportunidades de simplificação
4. Oportunidades de aumento de **valor percebido**
5. Oportunidades de evolução da **arquitetura**
6. Oportunidades de evolução do **produto**

**Cada recomendação carrega (obrigatório — nenhuma aparece só como "observação"):** `criticidade · impacto para o usuário · esforço estimado · dependências · **natureza** (Produto · UX · Arquitetura · Infraestrutura · Regulatório) · prioridade/onda no Roadmap por Ondas`.

**Regra: nada é implementado durante a auditoria.** Primeiro consolida-se **todo** o diagnóstico (os três pareceres); só depois as melhorias são priorizadas e posicionadas nas ondas do roadmap. Nada é presumido como correto só porque "funciona" — cada elemento é questionado sob a ótica de produto. *(A REL-001 e demais itens já aprovados do roadmap não são achados de auditoria e seguem normalmente.)*

## 6. Três pareceres → consolidação

Sobre os **mesmos** artefatos: **Parecer Claude Code** + **Parecer ChatGPT** + **Parecer da fundadora** → consolidação numa lista única priorizada. Itens aprovados **entram no roadmap oficial**, posicionados em suas ondas e respeitando os gates (regra "nenhuma exceção ao roadmap").

## 7. Sequência de execução (permanente)

1. Continuar a implementação da **REL-001** (prioridade da Onda 0.5).
2. Desenvolver o **harness** em paralelo (infra QA, não bloqueia).
3. Executar a **primeira auditoria completa**.
4. Consolidar os **três pareceres**.
5. Gerar/atualizar este **QA-001** com os achados.
6. Incorporar as melhorias aprovadas ao **roadmap oficial**.

A partir da conclusão do harness, **toda homologação futura o executa automaticamente antes da publicação** (parte do DoD).

## 8. Setup para acesso automático (uma vez)

- **Usuário de teste** com alguns registros por módulo (telas não vazias).
- Credenciais em **variável de ambiente** (`AUDIT_EMAIL` / `AUDIT_PASSWORD`) — o script lê de `process.env`; a senha **nunca** aparece em texto no chat nem é digitada manualmente.
- **Alvo:** preview (recomendado — não toca dados reais) ou produção.
- Harness em `tests/audit/` (Playwright), executável via `npx playwright test`.

## 9. Governança

QA-001 é **tooling de engenharia/qualidade**, não funcionalidade de produto — cabe sem tocar no congelamento da arquitetura. Desenvolvido em paralelo à Onda 0.5. Torna-se **mecanismo permanente** para elevar a qualidade das próximas ondas.
