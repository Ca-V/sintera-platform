# PROCESSO OFICIAL DE HOMOLOGAÇÃO — SINTERA

> Documento de governança de engenharia. Define o procedimento obrigatório
> antes de qualquer merge para produção. Aprovado pela fundadora em 2026-07-07.

## Princípio de autonomia (permanente)

**Tudo o que puder ser decidido e automatizado pela engenharia deve ser decidido e
executado pela engenharia.** A fundadora decide apenas **arquitetura, produto,
posicionamento, domínio e governança**.

Consequência direta e não-negociável: a engenharia **não pergunta** qual ambiente
usar, como executar o harness, ou qual configuração operacional adotar. Essas
decisões são da engenharia. A regra padrão:

> Na ausência de impedimento técnico objetivo, usar sempre o ambiente de **menor
> risco e maior fidelidade** para a auditoria.

A fundadora só é acionada quando existir um **impedimento técnico real** que exija
uma decisão de **arquitetura, segurança, domínio ou governança**. Caso contrário, o
fluxo é executado integralmente de forma autônoma.

## O Tripé de Integridade (obrigatório antes de todo merge para produção)

Uma iniciativa só é considerada **pronta para homologação** quando passar pelas três
verificações complementares:

| # | Verificação | O que cobre | Como se comprova |
|---|-------------|-------------|------------------|
| 1 | **Integridade técnica** | Erros de tipo, lint, testes, build | `tsc --noEmit` = 0 · `eslint` = 0 · `vitest` verde · `next build` OK |
| 2 | **Integridade estrutural** | Regressões entre branches | Auditoria de divergência vs `main`: `git diff --stat origin/main...HEAD`; classificar cada arquivo (isolado × global/compartilhado); provar que arquivos não tocados são byte-idênticos à produção |
| 3 | **Integridade visual e de experiência** | UX, responsividade, DS-001, UX-001, regressões visuais | QA-001 automatizado (harness de screenshots desktop+mobile) **+** revisão crítica da interface |

Este tripé fecha as três classes de problema recorrentes do projeto: bugs
funcionais (1), regressões entre branches (2), problemas de UX/responsividade (3).

## Procedimento QA-001 automatizado (fluxo autônomo padrão)

Antes de toda homologação, na ausência de impedimento técnico objetivo, a engenharia
executa **integralmente e sem solicitar decisão**:

1. **Ambiente** — usar o **preview da branch em homologação** (Vercel). É o de maior
   fidelidade (mesmo build, mesmo backend) e menor risco (isolado da produção do
   ponto de vista de deploy).
2. **Usuário de auditoria** — **provisionar automaticamente** um usuário de auditoria
   com **dados sintéticos** (claramente marcados como sintéticos; nunca dados reais).
3. **Harness** — executar o harness completo: crawl das rotas em **desktop e mobile**,
   captura de artefatos (screenshots + medições instrumentadas).
4. **Artefatos** — gerar e arquivar os artefatos da auditoria.
5. **Auditoria automatizada** — rodar as verificações heurísticas (overflow horizontal,
   quebra letra-a-letra, sobreposição, contraste, aderência a DS-001/UX-001).
6. **Consolidação** — consolidar o **relatório QA-001** com achados priorizados
   (P0 bloqueia · P1 funcional · P2 cosmético).

Somente acionar a fundadora se surgir um impedimento técnico real que exija decisão
de arquitetura, segurança, domínio ou governança.

## Instrumentação, não suposição

Princípio herdado e reafirmado: achados visuais devem ser **instrumentados** (medidos:
bounding box, overflow, viewport), nunca supostos a partir de leitura de código. A
leitura de código serve para escopo e triagem; a comprovação é sempre pela renderização.

## Marco de transição: Arquitetura Congelada → Desenvolvimento Iniciado

**Regra de foco (aprovada pela fundadora 2026-07-07).** Após o **merge da REL-001**, cria-se
no Roadmap o marco formal **"Arquitetura Congelada → Desenvolvimento Iniciado"**. A partir dele:

- **Alterações arquiteturais** só em caso de **erro grave** descoberto **durante a implementação**.
- **Melhorias, ideias e funcionalidades novas** entram no **backlog** e são avaliadas em **outra onda** —
  não reabrem a especificação já congelada.
- O objetivo deixa de ser **"melhorar o documento"** e passa a ser **"entregar software"** funcionando e homologado.

**Por quê:** impede o ciclo infinito de refinamento e distingue, sem ambiguidade, **arquitetura
aprovada** de **funcionalidade entregue**. Documentos constitucionais congelados (UX-001, DS-001,
REL-001, DOC-001, CAP-001, QA-001) só reabrem por **revisão explícita** — não por refinamento contínuo.

**Gate de smoke test pós-deploy.** Antes de abrir a **próxima frente de implementação**, executar
um **smoke test em produção** confirmando que o deploy anterior publicou corretamente e **não
introduziu regressões** (o harness QA-001 aponta para a URL de produção). Só então abrir a nova
branch. Reduz o risco de carregar problemas de uma entrega para a implementação da seguinte.

## Modo de Execução por Lote (a partir do CAP-001)

Após o marco de transição, a execução é orientada por **entregas completas (lotes)**, não por
incrementos pequenos. Cada lote chega **finalizado, testado e auditado**, contendo:

- **implementação completa** do escopo do lote;
- **evidências objetivas** de funcionamento (instrumentadas);
- **TypeScript, ESLint e build limpos**;
- **auditoria QA-001** correspondente (visual desktop+mobile);
- **preview** pronto para homologação.

**Autonomia de engenharia (total durante a implementação):** todas as decisões de engenharia,
componentes, estrutura de código, layout técnico, refatorações e organização interna são tomadas
de forma autônoma. A fundadora é acionada **apenas** para decisões de: **arquitetura · modelo de
domínio · produto · governança · posicionamento · conformidade regulatória.**

**Relatório executivo ao fim de cada lote** (além da entrega técnica):
1. objetivos entregues;
2. itens implementados;
3. problemas encontrados;
4. decisões técnicas tomadas;
5. riscos remanescentes;
6. pendências (se houver);
7. checklist de homologação.

**Lotes do CAP-001 (exemplo):** (1) infraestrutura completa — `DocumentCapture` + Capture Engine +
Routing Engine + config central de formatos + integração DOC-001; (2) migração completa de
Medicamentos; (3) Recursos; (4) Exames; (5) demais módulos.
