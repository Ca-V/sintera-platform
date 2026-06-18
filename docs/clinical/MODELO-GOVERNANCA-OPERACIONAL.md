# Modelo de Governança Operacional — SINTERA

**Também chamado:** "Constituição Clínica" da SINTERA.
**Versão:** v2 (rascunho de engenharia/processo — **para validação**).
**Status:** documento de **processo e organização**. **NÃO contém conteúdo clínico.**
Define *quem* governa o conteúdo científico, *como* ele é adotado/versionado/auditado
e *quem responde* por ele. O conteúdo em si (protocolos, itens, limiares) é decisão
do Responsável Clínico / Comitê Clínico.
**Data:** 2026-06-16
**Validação pendente:** Responsável Clínico (CRM) · Jurídico/Regulatório · (futuro) Comitê Clínico.

> Este documento é a resposta à pergunta que ficou em aberto na discussão de produto:
> *"quem governa, como governa e quem responde por isso?"*. Ele é pré-requisito para
> ativar qualquer conteúdo no Life Course Governance Engine.

---

## 1. Propósito e escopo

A SINTERA adota conteúdo científico de terceiros (órgãos e sociedades médicas) e o
transforma em **protocolos governados, auditáveis e rastreáveis**. Este documento
define o **modelo operacional** dessa governança. Ele **não** decide nenhum critério
clínico — define o processo pelo qual critérios clínicos de terceiros são adotados,
aprovados, versionados, exibidos e auditados.

**Fora de escopo (por princípio):** diagnóstico, prescrição, conduta individualizada,
scores clínicos proprietários, predição de doença, idade biológica, classificação
clínica de saúde mental. Ver §10.

---

## 2. Princípios não-negociáveis

1. **A SINTERA é infraestrutura/custódia, não autoridade clínica.** O protocolo
   pertence à fonte científica e ao Responsável Clínico que o adota — nunca "à SINTERA".
2. **Mecanismo × conteúdo.** A engenharia constrói o mecanismo (vazio); o conteúdo
   clínico só entra por aprovação humana identificada (CRM).
3. **Sem diagnóstico nem conduta (RDC 657/2022).** A plataforma informa **aderência a
   protocolos**, não recomenda conduta individual (Modelo B — ver §9).
4. **Compliance ≠ saúde.** Estar "em dia" com um protocolo não significa estar saudável;
   o produto deve enquadrar isso explicitamente.
5. **Nada ativo sem assinatura.** Nenhum item de protocolo vai a produção sem aprovação
   registrada (responsável + data + proveniência).
6. **Rastreabilidade total.** Toda decisão de adoção/precedência/ativação é auditável.

---

## 3. Papéis e responsabilidades

| Papel | Responsabilidade | NÃO faz |
|---|---|---|
| **Fonte científica** (MS, INCA, CONITEC, PNI, AMB, sociedades) | Autoria da diretriz/evidência (externa à SINTERA) | — |
| **Conselho Científico** (independente, futuro) | **Governança científica:** valida metodologia, revisa conflitos complexos e posições controversas, emite pareceres, garante independência científica | Não opera o pipeline; não programa |
| **Comitê Clínico** (multidisciplinar) | **Governança operacional clínica:** resolve precedência/conflito de rotina; cobre amplitude de especialidades (oncologia, geriatria, psiquiatria, mastologia…) | Não define metodologia científica |
| **Responsável Clínico (RC)** — CRM | Autoridade clínica que aprova e **ativa** protocolos; assina | Não cria diretriz; não programa |
| **Engenharia (ENG)** | Mecanismo, schema, motor, auditoria | **Nunca** define conteúdo clínico |
| **Produto (PROD)** | Linguagem/UX não-clínica; enquadramento de exibição | Não define critério clínico |
| **Jurídico/Regulatório** | Enquadramento RDC 657 / CFM; decisão sobre "pendente" (§9) | — |
| **DPO / LGPD** | Dados sensíveis, consentimento, minimização, retenção | — |

### 3.1 Governança científica × governança operacional

Não são a mesma coisa, e a confusão entre elas é um erro comum. A SINTERA separa:

```
  Conselho Científico   →  governança científica (metodologia, conflitos complexos, independência)
        ↓
  Comitê Clínico        →  governança operacional clínica (precedência de rotina, amplitude)
        ↓
  Responsável Clínico   →  aprova e ativa protocolos (assinatura)
        ↓
  Operação SINTERA      →  custódia, distribuição, auditoria (infraestrutura)
```

**Instanciação faseada (não-negociável de viabilidade):** a *estrutura* acima é definida
desde já, mas os *corpos* são preenchidos conforme catálogo e mercado crescem. No MVP, o
RC pode acumular funções e o Conselho pode ser pequeno/consultivo; a separação formal
amadurece com a escala. Não se exige um Conselho Científico permanente no dia 1.

---

## 4. Cadeia de responsabilidade em camadas

A responsabilidade é **estratificada** — não há "dono único":

```
  Autoria científica      →  Sociedade / órgão de origem (citado)
  Adoção e curadoria      →  Responsável Clínico / Comitê Clínico (assina a ativação)
  Custódia e distribuição →  SINTERA (infraestrutura; não é dona do conteúdo)
```

Isto é o que torna o ativo defensável: a SINTERA não "opina" clinicamente — ela
**custodia e distribui** um protocolo cuja autoria é de uma sociedade e cuja adoção é
de um clínico responsável.

### 4.1 Definição formal de "Protocolo"

Para impedir que se cadastre opinião médica, artigo isolado, conteúdo comercial ou
recomendação sem aprovação, **protocolo** na SINTERA é definido como:

> **Conjunto versionado de itens derivados de fontes científicas aprovadas (Nível 1–3),
> aplicável a uma população específica e ativado por instância formal de governança
> clínica.**

Decorrências (regras de admissão):
- Todo item **rastreia obrigatoriamente** a uma fonte de Nível 1–3 (benchmark não basta).
- Protocolo **não é motor de recomendação individual** — é um conjunto aplicável a uma
  população, do qual se mede *aderência*.
- Sem ativação assinada (RC/comitê), não é protocolo — é rascunho.

---

## 5. Hierarquia de fontes

| Nível | Fontes | Papel |
|---|---|---|
| **1 — Autoridade regulatória/nacional** | Ministério da Saúde, CONITEC, ANVISA, INCA, PNI | Base obrigatória |
| **2 — Consenso nacional** | AMB / CFM (Projeto Diretrizes) | Consolidação por evidência |
| **3 — Sociedades de especialidade** | Sociedades reconhecidas pela AMB (SBC, SBD, FEBRASGO, SBEM, SBGG, SBD-Derm, CBO, SBP, SBI, mastologia, urologia, etc.) | Especialidade |
| **Benchmark** | WHO, NICE, USPSTF | Referência comparativa — **não** autoridade primária para usuários BR |

> A amplitude multissociedade é intencional (evita viés cardiometabólico), mas exige a
> política de precedência da §6 para funcionar.

---

## 6. Processo de adoção e política de precedência

### 6.1 Workflow de um item de protocolo

```
proposta → em_curadoria → checagem de evidência/proveniência → resolução de precedência
        → aprovação (assinatura RC/comitê) → ativação → publicação → auditoria/revisão
```

Estados (reaproveitam o fluxo já implementado no catálogo):
`draft → em_curadoria → validado → ativo → (rejeitado)`.

### 6.2 Política de precedência (resolução de conflito entre fontes)

Necessária porque fontes divergem (ex. clássico: mamografia — MS/INCA vs. SBM/FEBRASGO).
Regras propostas (a **validar pelo RC/comitê**):

1. **Nível hierárquico mais alto prevalece** (Nível 1 > 2 > 3), salvo decisão explícita
   do comitê em contrário.
2. **Dentro do mesmo nível**, decide o Comitê Clínico, registrando o racional.
3. **Divergência clinicamente relevante** (ex.: faixa etária de rastreio) exige decisão
   **explícita e documentada**; pode-se optar por exibir mais de uma fonte, sempre citada.
4. Toda resolução é **versionada e assinada** (`resolution_policy` com `approved_by`/data).

> A política em si é decisão de governança clínica; a engenharia só **executa** a regra
> de precedência registrada.

---

## 7. Cadência de revisão

- Revisão obrigatória de cada fonte/item a cada **N meses** (definir; sugestão 6–12) ou
  **quando a diretriz de origem mudar**, ou após incidente.
- Cada item carrega **data "as-of"** (versão da fonte consultada) e **validade**.
- Item desatualizado é **`deprecated`/revisado**, nunca silenciosamente mantido.
- Diretriz mais nova entra como `draft`, é comparada à vigente, e só substitui após
  aprovação (não há troca automática).

---

## 8. Responsabilidade pela ativação e auditoria

- **Ativação** (`→ ativo`) exige assinatura do RC/comitê: `approved_by` (CRM), `approved_at`,
  `effective_from`, `content_hash`.
- **Ledger de adoção:** cada ativação/rejeição/precedência vira linha auditável (mesmo
  padrão do `loinc-approval-ledger` e do `audit_purge_log`).
- **Trilha:** o que foi ativado, por quem, com base em qual fonte/versão, quando, e por quê.

---

## 9. Enquadramento de exibição (governança × jurídico)

A SINTERA adota o **Modelo B**: informa **aderência a protocolo**, não recomenda conduta.
O **ponto regulatório em aberto** é onde, no espectro abaixo, a exibição pode ficar — a
ser decidido por **Jurídico + RC**:

| Nível | Exemplo de texto | Natureza |
|---|---|---|
| 1 | "Protocolos ativos aplicáveis: P001, P003" | Classificatório (mais seguro) |
| 2 | "Há um item deste protocolo ainda não registrado" | Sugere ação |
| 3 | "Há um item preventivo **pendente**" | Próximo de obrigação |
| 4 | "Você **deve** realizar o exame X" | Orientação (a **evitar**) |

**Recomendação de engenharia/produto:** operar no **Nível 1–2**, citar sempre a fonte,
e acompanhar de enquadramento defensivo: *"aderência ao protocolo ≠ estado de saúde;
confirme com seu médico"*. A escolha final do nível é decisão jurídica/clínica.

### 9.1 Provenance Viewer (transparência ao usuário)

Para cada item exibido, a usuária pode ver a **rastreabilidade** — sem nenhuma
interpretação clínica:

```
Origem:    INCA
Diretriz:  Rastreamento (exemplo)
Versão:    2026
Aprovado:  Comitê Clínico SINTERA
Data:      03/2026
```

Isto **reforça o posicionamento** (transparência e governança são o produto) e é também
**mitigação regulatória**: ao mostrar a fonte pública, deixa explícito que a SINTERA
*relata uma diretriz*, não dá conselho pessoal — sustentando o Modelo B (§9). É
construível cedo: exibe apenas metadado de proveniência, **zero conteúdo clínico**.

---

## 10. O que fica fora da V1 (decisão de escopo)

Diagnóstico · conduta · recomendação individualizada de tratamento · scores clínicos
proprietários (Framingham/ASCVD etc.) · predição de doença · idade biológica ·
classificação clínica de saúde mental (PHQ-9/GAD-7 com semáforo). Saúde mental, se
entrar, começa por bem-estar/sono/estresse **sem classificação** e só evolui com
protocolo de segurança formal.

---

## 11. Pauta para Jurídico / RC (decisões que destravam a ativação)

1. **Nível do espectro "pendente" (§9)** que a SINTERA pode exibir.
2. **Composição da autoridade clínica:** RC único é suficiente, ou a amplitude exige
   **Comitê Clínico** multidisciplinar?
3. **Dono clínico final** e formalização da cadeia de responsabilidade (§4).
4. **Política de precedência (§6.2)** — aprovação do critério.
5. **Cadência de revisão (§7)** — definir N.
6. **Enquadramento RDC 657:** a "aplicabilidade personalizada" se mantém nas exclusões de
   software de organização/gestão, ou requer enquadramento adicional?
7. **LGPD:** consentimento/minimização/retenção para o escopo ampliado (perfil, jornada).

---

## 11-bis. Sustentabilidade econômica da curadoria (risco crítico)

O maior risco que resta **não é técnico, clínico nem regulatório — é econômico**: a
curadoria pode custar mais do que o valor que gera. A armadilha:

```
50 especialidades → 200 diretrizes → 3.000 protocol items → revisões anuais
= máquina de manutenção permanente
```

**Princípio formal:** expandir o catálogo de protocolos **por valor de mercado, não por
completude científica.** Cada onda precisa de justificativa de valor, não só de existência
de diretriz.

**Mitigações:**
- Começar pelo **Nível 1 (MS / INCA / PNI)** — poucas fontes, **estáveis**, alto valor
  universal — antes da cauda longa de sociedades de especialidade.
- Monitoramento de atualização de diretriz pode ser apoiado por automação; o **juízo**
  de adoção, nunca.
- Custo de curadoria por fonte entra no **modelo financeiro** (não é projeto, é processo).

**Ondas (expansão por valor):**

| Onda | Escopo | Fontes-base |
|---|---|---|
| **1** | Prevenção universal | MS, INCA, PNI |
| **2** | Saúde da mulher (alinha à identidade da SINTERA) | FEBRASGO, INCA |
| **3** | Cardiometabólico | SBC, SBD, SBEM |
| **4** | Demais especialidades | sociedades AMB |

---

## 12. Registro de decisões de governança (a preencher)

| Data | Decisão | Aprovado por (nome + CRM/área) | Onde materializada |
|---|---|---|---|
| — | (nenhuma decisão de governança formalizada até a validação deste documento) | — | — |

---

## Nota de negócio (fora do escopo de governança, registrada)

Sequência de go-to-market recomendada na discussão: **B2B ocupacional (NR-1/saúde
corporativa) → B2B2C (operadoras/corretoras) → B2C**. Decisão comercial; não condiciona
este modelo de governança, mas influencia a prioridade de quais protocolos curar primeiro.
