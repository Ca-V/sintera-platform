# BACKLOG-CTX-001 — Contexto longitudinal e descoberta de fontes

**Origem:** conversa da fundadora com outro assistente em 01/09/2026, analisada e filtrada.
**Status:** decisões registradas. Uma implementação pequena aprovada para DEPOIS da validação; o resto é
visão de médio prazo, condicionada.
**Relaciona:** ADR-000 (não interpreta) · ADR-CK-001 (Clinical Knowledge) · `report/assemble.ts` ·
OpenCare Interop · RNDS.

---

## O problema real que motivou isto

A medicina é fragmentada por especialidade, e cada profissional recebe uma fatia da história. O psiquiatra
não costuma olhar exame laboratorial; o endocrinologista não vê o registro psiquiátrico; o cardiologista não
sabe da mudança de atividade física. **A paciente é uma pessoa só, e é a única que atravessa todas as portas.**

O exemplo que a fundadora deu, e que é bom porque é concreto: uma queda de vitamina D ao longo do ano, o
início de um medicamento, um diagnóstico psiquiátrico e uma redução de atividade física — quatro fatos
registrados por quatro origens diferentes, que hoje nenhuma tela mostra juntos.

---

## O que JÁ existe (verificado no código, 01/09/2026)

`packages/core/src/domain/report/assemble.ts` já faz a maior parte:

- filtra por período (`Period`, `resolvePeriod`, `inPeriod`)
- **a pessoa escolhe as seções** (`ReportSelection.sections`) — e isso não é detalhe, é a salvaguarda
- compila 14 domínios: exames, medicamentos, suplementos, condições, hábitos, sinais vitais, composição
  corporal, ciclo, ômicas, agenda, despesas, recursos, histórico de exames, histórico de saúde
- o cabeçalho já declara a fronteira da RDC 657/2022

**Conclusão: a "Visão Longitudinal" proposta como novidade está ~80% construída.**

---

## O que FALTA, e é o item aprovado

**O relatório agrupa por DOMÍNIO, não por TEMPO.**

A saída é `ReportModel { groups: [{ title, sections: [{ heading, lines }] }] }` — sectionada. Nunca uma linha
cronológica em que a vitamina D de junho aparece ao lado do medicamento de julho e da consulta de agosto.

### CTX-001 — Intercalação cronológica entre domínios

Uma segunda projeção do MESMO `ReportData`, ordenada por data em vez de por seção:

```
14/06  Laboratório     Vitamina D: 18 ng/mL              Laboratório X
25/06  Medicamento     Início de <medicamento>           Receita de <profissional>
18/07  Consulta        Psiquiatria                       <profissional>
20/07  Atividade       Redução registrada                Strava
15/09  Laboratório     Vitamina D: 27 ng/mL              Laboratório X
```

**Custo baixo:** os dados, o período e a seleção já existem. É uma função pura a mais no núcleo, consumindo
o `ReportData` que já é montado.

**QUANDO:** depois de dez usuárias reais terem montado um dossiê. Não antes — ver a razão em
`docs/` (auditoria de viabilidade) e o risco EX-01.

---

## A FRONTEIRA, e por que ela é o ponto mais importante deste documento

A proposta original trazia três níveis: fato, relação temporal, interpretação clínica — apresentando o
segundo como seguro.

**O segundo nível NÃO é automaticamente seguro.**

> **Escolher quais fatos colocar lado a lado já é um ato interpretativo.**

Se a plataforma decide exibir a queda da vitamina D ao lado do diagnóstico de depressão, ela afirma uma
hipótese sem escrever uma frase. **Justaposição é argumento.**

O relatório atual escapa disso porque **quem escolhe as seções é a pessoa**. Essa propriedade é a diferença
entre ferramenta de consulta e software com finalidade médica, e ela não pode ser perdida.

### A regra, em uma linha

> **A plataforma ordena no tempo. O humano escolhe o que entra.**

### O que fica PROIBIDO sem passar pelo ADR-CK-001

A proposta de um "painel de contexto para o psiquiatra" — exibir vitamina D, B12, ferritina, TSH a um
psiquiatra — **atravessa a linha**. Decidir que esses marcadores são relevantes para saúde mental é uma
afirmação clínica.

É exatamente o que o **Clinical Knowledge Service** (ADR-CK-001, backlog C6) existe para governar: objeto
padronizado, com proveniência por atributo, sob responsável técnico. Enquanto esse serviço não existir, a
plataforma **não seleciona relevância clínica** — nem por especialidade, nem por condição, nem por
"contexto sugerido".

A versão permitida da mesma ideia: o profissional marca "laboratório dos últimos 12 meses" e recebe tudo,
sem a plataforma ter decidido o que importa.

---

## CTX-002 — Descoberta de fontes (Health Data Discovery)

**Visão de médio prazo, condicionada. NÃO é premissa do produto.**

A ideia: em vez de a pessoa trazer os documentos, a plataforma a ajuda a **descobrir onde os dados dela
estão** e a solicitar acesso — CPF ou CNS como identificador de descoberta, dentro do que a infraestrutura e
a base legal permitirem.

### Três fases

1. **Agregação** (hoje) — a pessoa envia; a plataforma organiza e transcreve.
2. **Interoperabilidade** — recepção estruturada via FHIR / OpenCare / RNDS.
3. **Descoberta** — a plataforma consulta fontes EM NOME da titular, com autorização por fonte.

### Duas distinções que não podem se perder

**Parte disso já existe no setor público.** O Meu SUS Digital já mostra ao cidadão o histórico dele,
incluindo resultados de laboratórios privados enviados à RNDS. A pergunta aberta não é "é possível?" — é
**"um terceiro pode fazê-lo em nome do titular, e sob que condições?"**. É a mesma pergunta a ser feita ao
InovaHC.

**Enquadramento jurídico.** Uma plataforma que *procura* dados sobre alguém pelo CPF se parece com
corretagem de dados. Uma plataforma que *recebe* o que a titular autorizou é controladora agindo por
consentimento. Tecnicamente parecido, juridicamente muito diferente — e a redação, inclusive interna,
importa. **Nunca descrever a capacidade como "rastrear informações pelo CPF".**

---

## O que foi REJEITADO, e por quê

**Trocar o posicionamento para "infraestrutura pessoal de contexto de saúde".**

Soa maior e é prematuro. "O dossiê que ela leva à consulta" tem momento, tem dona e se demonstra em trinta
segundos; "infraestrutura de contexto" não tem nenhum dos três. Alargar o posicionamento antes de validar o
estreito é o risco EX-01 da auditoria de viabilidade.

Fica guardado como narrativa para **depois** de as quinze conversas confirmarem o dossiê.

---

## O que NÃO foi verificado

- Se o Meu SUS Digital ou a RNDS expõem API para terceiros autorizados agindo em nome do titular.
  Consultada a documentação pública da RNDS em 01/09/2026, não a especificação de credenciamento.
- Se o OpenCare Interop prevê participante do lado da paciente. **Não há processo público de adesão
  publicado** (verificado nas fontes oficiais em 01/09/2026) — daí a necessidade da pergunta direta.
