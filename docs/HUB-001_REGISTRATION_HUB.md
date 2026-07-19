# HUB-001 — Hub de Registro (ponto único de entrada da SINTERA)

**Status:** ✅ Aprovado (fundadora 18/07/2026) · **infraestrutura transversal** · Sob [[ADR-000]]. Absorve o
[[CAP-001]] (Captura Documental) como **um dos mecanismos**, não como o conceito. **Código:**
`src/lib/capture/registrationHub.ts` (taxonomia SSOT) + `src/components/RegistrationHub.tsx` (UI).

## Princípio da plataforma
> **O usuário escolhe O QUE deseja registrar. A SINTERA decide COMO esse registro será capturado.**

A experiência de entrada é orientada pela **intenção do usuário**, nunca pela tecnologia de captura. A pergunta
central é sempre **"O que você deseja registrar?"** — e, a partir da escolha, a própria SINTERA define o melhor
fluxo (documento, formulário rápido, ou escolha entre eles).

## Visão de longo prazo
O Hub é, desde já, concebido como o **ponto único de entrada** da plataforma: no futuro, praticamente **toda nova
informação de saúde** poderá começar por ele. Por isso é **infraestrutura transversal** — não um componente de
upload nem de documentos. O Capture Center ([[CAP-001]]) **continua existindo**, mas passa a ser **apenas um
mecanismo** acionado quando o tipo de informação exige um documento.

## Organização — por NATUREZA da informação (não por mecanismo)
As opções agrupam-se pelo que a informação **é**, desacoplando a experiência do meio de captura:

- **Documentos:** Exame / Laudo · Pedido de exame · Receita médica · Documento clínico · Exame ômico.
- **Tratamentos e recursos:** Medicamento · Suplemento · Recurso de saúde · Óculos / Lentes.
- **Registros de saúde:** Consulta · Condição de saúde · Medida · Hábito · *(quando existir:)* Procedimento ·
  Vacina · Sintoma.

Taxonomia é **SSOT aberta** (`registrationHub.ts`): novos tipos entram por **configuração**, sem alterar a
estrutura — coerente com o crescimento futuro.

## Fluxo — cada intenção decide seu melhor caminho
Cada opção declara um **mecanismo**; o Hub apenas orquestra:
- **`capture`** → abre o **Capture Center** já configurado para aquele tipo de documento (Exame, Pedido, Receita,
  Documento clínico, Óculos).
- **`choice`** → oferece caminhos (ex.: **Medicamento** → "Enviar receita" [capture] ou "Cadastrar manualmente"
  [formulário]).
- **`page`/`form`** → leva ao **formulário** do domínio (Consulta, Medida, Condição, Hábito, Recurso, Suplemento,
  Ômica).

**Regra de ouro (todo formulário rápido):** sempre oferecer **"Abrir página completa"** — o Hub acelera os
registros mais frequentes; os **módulos continuam sendo o ambiente completo** de edição e gerenciamento.

## Fases
- **Fase 1 (implementada):** Hub intenção-primeiro com a taxonomia completa. Documentos → Capture Center
  configurado; Medicamento → escolha; demais → formulário do módulo (a "página completa"). Tipos "quando existir"
  aparecem como **em breve** (roadmap visível, honesto). O Capture Center ganha `initialKind` (pré-seleção), sem
  duplicar fluxo.
- **Fase 2 (evolução prevista):** formulários rápidos **inline** no Hub para os tipos mais frequentes — cada um
  reusando o form do módulo (extraído como componente compartilhado, **sem duplicar** regra), sempre com "Abrir
  página completa".

## Governança
Precedência ADR-000 > HUB-001. **Invariantes:** intenção antes do mecanismo; taxonomia SSOT aberta; zero
duplicação de fluxo/regra (reusa Capture Center + forms dos módulos); todo atalho tem caminho para a página
completa. Relaciona-se a [[ADR-001]] (SSOT/projeção) e ao princípio de propriedade de domínio do [[CTC-001]].
