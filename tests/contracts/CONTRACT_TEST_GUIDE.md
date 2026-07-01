# SINTERA — Guia de Contract Tests

> Documento de **engenharia** (não de produto). Contrato único para todos os contract tests, para que não cresçam de formas divergentes. Curto por desígnio.

## 1. O que caracteriza um contract test na SINTERA?
Um teste que valida **uma jornada completa** da usuária (ponta a ponta), não uma função isolada. Fala a **mesma língua** das Jornadas de UX e da implementação:

> **Jornada de UX → Contract Test → Implementação** descrevem a mesma coisa, na mesma estrutura.

## 2. O que ele PODE validar?
- A sequência de **estados** da experiência (mapa de estados: Vazio · Entrada · Processando · Confirmando · Sucesso · Acompanhamento · Compartilhamento · Erro).
- As **projeções** geradas (Agenda · Histórico · Gastos · Indicadores · Relatório).
- As **automações** disparadas e sua **explicação** ("por que isso aconteceu?").
- **Invariantes** do modelo canônico (ex.: "nenhuma projeção escreve outra projeção").

## 3. O que ele NÃO pode validar?
- Estética/pixels (isso é o protótipo navegável, não o contrato).
- Comportamento de **um componente isolado** (isso é teste unitário, ao lado do código).
- **Decisões de domínio do Estado 2** enquanto congelado — esses passos ficam `it.todo` até liberação.

## 4. Estrutura OBRIGATÓRIA de qualquer contrato
Todo contrato declara, nesta ordem (espelha a Jornada de UX):

1. **Nome da jornada**
2. **Objetivo**
3. **Pré-condições**
4. **Passos**
5. **Estados esperados**
6. **Projeções esperadas**
7. **Automações esperadas**
8. **Critérios de aceite**
9. **Invariantes**
10. **Dependências**

## 4b. Seção FIXA de fechamento — Cobertura do contrato
Todo contrato **termina** com um bloco `COBERTURA` (matriz de QA) — permite ver de relance o que cada jornada exercita e o que segue sem teste:
- ✓ **Componentes** exercitados
- ✓ **Jornadas relacionadas**
- ✓ **Programas** envolvidos
- ✓ **Estados** utilizados
- ✓ **Eventos** produzidos
- ✓ **Projeções** verificadas

## 4c. Convenção de atores *(mini-gate 30/06 — não é campo novo)*
Quando a jornada tem **mais de um ator**, *Pré-condições* nomeia-os no sub-rótulo **"Atores:"**, com quem **escreve/lê** e o **grau de autonomia** (nenhum/parcial/variável). Jornadas de ator único **não** usam o rótulo (não é lacuna). Conceitos *Rede de cuidado · Delegação · Continuidade do cuidado · Mudanças de contexto* permanecem **confirmados** como atributos/cobertura — **não** viram campos. Decisão registrada após Gravidez·Infantil·Idoso: o template de 10 campos é estável.

## 🔒 Template CONGELADO (30/06/2026)
Validado em 7 jornadas (4 eixos + 2 de delegação). Alterações estruturais a partir daqui só por **necessidade concreta** na implementação.

## 5. Três níveis de cada contrato *(ativação gradual)*
Cada contrato se organiza em três níveis, ativáveis **L1 → L2 → L3** conforme a implementação / Estado 2 forem liberados:

| Nível | Valida | Exemplo (Jornada Documento) |
|---|---|---|
| **L1** | Fluxo de UX (telas · estados · navegação) | Central de Entrada → … → Compartilhar |
| **L2** | Regras de domínio (evento · ActionForm · EventLink) | "compra cria Evento" · "troca = suspensão+início" |
| **L3** | Integração (upload · processamento · projeções reais) | upload real · extração · relatório montado |

> Convenção: cada nível é um `describe` aninhado. Passos não implementados são `it.todo`. **`npm test` permanece verde** (todos rodam como pendentes).

## 6. Invariante transversal de TRANSPARÊNCIA *(regra global)*
> **Toda automação relevante deve produzir uma explicação compreensível para a usuária** ("por que isso aconteceu?").

Exemplos: "Foi criado um lembrete **porque** você registrou uma compra." · "Este indicador mudou **porque** um exame foi processado." · "Este relatório foi atualizado **porque** novos eventos foram registrados."
Vive em `_invariants.contract.test.ts` e é referenciado por todo contrato que dispara automação. Conversa diretamente com o princípio de UX congelado (não-caixa-preta). Texto factual, sem juízo clínico (RDC 657).

## 7. Plano de contratos
1. ✅ Guia (este).
2. **Dois contratos de referência** (validam o padrão): `journey-documento-compartilhar` · `journey-interromper-retomar`.
3. Replicar para as jornadas: Diabetes · Ceratocone · Gravidez · Preventiva · Infantil · Idoso · Autoimunes · Saúde Mental — **reutilizando** a infraestrutura dos dois primeiros.
