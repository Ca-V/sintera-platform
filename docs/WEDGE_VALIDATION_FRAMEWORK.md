# SINTERA — Wedge Validation Framework

**Status:** framework de **validação comercial** (não é código, não é arquitetura, não é backlog).
**Precede:** os roteiros de entrevista (só após aprovação deste framework).
**Sequência:** V1 → homologação → Competitive & Viability Assessment (✔) → **Wedge Validation** → decisão estratégica → V2 → gap analysis → implementação.
**Base:** conclusões de `COMPETITIVE_VIABILITY_ASSESSMENT.md` (moat tecnológico não demonstrado; substituto reproduz 70–90%; comprador provável B2B2C; consumidor não paga; acesso a dado no BR sem on-ramp aberto).

---

## 0. Propósito e regras invioláveis

**Propósito.** Descobrir **UMA** situação (não dez) em que **um comprador identificável paga** para a SINTERA resolver **um problema econômico concreto** que **as alternativas existentes não resolvem bem**. O objetivo **não** é acumular opiniões favoráveis — é encontrar **evidência de comportamento de compra**.

**A pergunta que este framework responde:** *"quem tem um problema econômico grande o suficiente para pagar para que o paciente tenha essa experiência?"* — **não** *"como fazer o melhor produto para o paciente?"*.

**Regras invioláveis (anti-viés):**
1. **Problem-first.** Descobrir como o comprador resolve o problema **hoje** antes de mencionar a SINTERA.
2. **Nunca perguntar "você usaria a SINTERA?"** nem "isso seria útil?". Validação por opinião é **fraca**. Perguntar sobre **passado e presente** (o que já fizeram, gastaram, compraram), não sobre futuro hipotético.
3. **Falsificar, não confirmar.** Cada entrevista tenta **derrubar** a hipótese. Um "não" bem entendido vale mais que um "interessante".
4. **Testar o substituto explicitamente** (EHR/HIS, fornecedor atual, RNDS/OpenCare, interop+IA, build interno) — conecta ao Substitute Stack Analysis.
5. **Evidência = comportamento**, não sentimento: orçamento existente, solução já comprada, dor quantificada, disposição a fornecer dado/entrar em piloto, quem assina o cheque.
6. **Sem backlog.** Nenhum resultado vira requisito técnico antes da decisão estratégica.

---

## 1. Hipóteses (a falsificar, não a confirmar)

**Hipótese central (H-CENTRAL):**
> *"Uma organização pagará para oferecer ao seu paciente/beneficiário uma camada INDEPENDENTE de continuidade da informação que ela própria não consegue construir ou controlar integralmente."*
> Modelo: **B2B2C no pagador · patient-centric/patient-controlled na experiência.**

**Não** assumir que é verdadeira. Descobrir **em que situação** (se alguma) ela é economicamente relevante.

**Hipóteses de falsificação (se qualquer uma se confirmar forte, a H-CENTRAL cai naquele wedge):**
- **F1 — "Já resolvemos/resolvemos internamente"** (ou o fornecedor de EHR/HIS já entrega).
- **F2 — "O paciente não valoriza"** (sem impacto em retenção/NPS/desfecho mensurável).
- **F3 — "Não temos acesso ao dado"** (e a SINTERA também não teria).
- **F4 — "Não há orçamento"** para uma camada independente.
- **F5 — "ROI insuficiente"** vs. alternativas.
- **F6 — "LGPD/regulação impede"** o modelo.
- **F7 — "É fácil construir internamente"** (ou comprar do incumbente).
- **F8 — "Não queremos mais uma camada/fornecedor"** (fadiga de integração).

Cada entrevista deve **procurar ativamente** F1–F8. Se não conseguirmos derrubá-las, é sinal negativo.

---

## 2. Os três wedges (independentes)

> Todo o conteúdo abaixo é **HIPÓTESE a testar**, não afirmação. Confiança dos números de orçamento/ROI: **baixa** (a validar em campo).

### Wedge A — Operadoras (saúde suplementar / ANS)

| Dimensão | Hipótese (a testar) |
|---|---|
| **Problema econômico** | sinistralidade elevada por **duplicidade de exames**, **internações evitáveis**, **coordenação fragmentada** do cuidado; **churn** do beneficiário |
| **Comprador** | diretoria de **saúde populacional / gestão de saúde / VBC / medical economics** |
| **Usuário** | beneficiário (experiência) + equipes de **coordenação/APS/gestão de crônicos** |
| **Decisor** | CMO / diretor de saúde / diretor de operações; **gatekeepers:** TI e **DPO/jurídico** |
| **Orçamento potencial** | linhas de *gestão de saúde populacional · coordenação do cuidado · prevenção · experiência do beneficiário/NPS* |
| **Solução atual** | claims (têm) sem clínico longitudinal; prontuários fragmentados por prestador; programas de crônicos; app próprio (alguns); navegação/APS |
| **Custo/dor atual** | exames duplicados pagos; falta de visão longitudinal; coordenação manual e cara; readmissões |
| **Resultado econômico esperado** | ↓ % duplicidade · ↓ internação evitável · ↑ retenção/NPS |
| **Dados necessários** | histórico clínico do beneficiário (SUS + privado + documentos) — a operadora **tem claims, não o clínico completo** |
| **Barreiras de acesso** | LGPD (dado sensível); consentimento do beneficiário; acesso a dados de prestadores |
| **Dependências regulatórias** | ANS; LGPD/ANPD; RDC-657 **se** houver função clínica |
| **Tempo de implantação** | integração + consentimento → **meses** (a validar) |
| **Hipótese de preço** | **PMPM** (per-member-per-month) por programa **ou** success fee sobre economia gerada |
| **Hipótese de ROI** | se ↓X% duplicidade/internação evitável na população N, valor gerado > custo |
| **Substituto mais forte** | dados de claims + BI próprio; programas de gestão de crônicos de terceiros; **HIS/InterSystems**; build interno |

### Wedge B — Hospitais / sistemas de saúde

| Dimensão | Hipótese (a testar) |
|---|---|
| **Problema econômico** | **descontinuidade pós-alta** (readmissão evitável); **baixa fidelização/aquisição** (LTV do paciente); **retrabalho** de reconstrução de histórico |
| **Comprador** | diretoria de **experiência do paciente / relacionamento / estratégia digital / marketing médico** |
| **Usuário** | paciente pós-alta + equipes de **continuidade/navegação** |
| **Decisor** | superintendência/diretoria; **gatekeeper crítico:** TI/EHR (**MV/Tasy**) — risco de conflito com o HIS incumbente |
| **Orçamento potencial** | *experiência do paciente · aquisição/fidelização · transformação digital* |
| **Solução atual** | portal/app **próprio, preso ao hospital**; follow-up por telefone; nada source-agnostic |
| **Custo/dor atual** | paciente "some" após alta; histórico fragmentado; retrabalho clínico-administrativo |
| **Resultado econômico esperado** | ↓ readmissão evitável · ↑ LTV/retorno do paciente · diferenciação |
| **Dados necessários** | dados do próprio hospital (têm) + **externos (não têm)** |
| **Barreiras de acesso** | o HIS **já pode "fazer isso"** (MV Personal Health); conflito com o fornecedor de EHR; LGPD |
| **Dependências regulatórias** | LGPD/ANPD; CFM (se ato clínico); RDC-657 se função clínica |
| **Tempo de implantação** | integração ao HIS + jornada → **meses** |
| **Hipótese de preço** | por leito / por paciente ativo / licença + serviços |
| **Hipótese de ROI** | readmissão evitável + LTV; difícil de isolar (atribuição) |
| **Substituto mais forte** | **o próprio HIS (MV/Tasy) + InterSystems Personal Community**; app próprio; build interno — **substituto incumbente muito forte aqui** |

### Wedge C — Pharma / RWD / jornada do paciente

| Dimensão | Hipótese (a testar) |
|---|---|
| **Problema econômico** | custo/lentidão de obter **RWD/RWE longitudinal consentido**; **recrutamento** para estudos; **adesão/jornada** em Patient Support Programs (PSP) |
| **Comprador** | **Medical Affairs / RWE / Market Access / Patient Support** |
| **Usuário** | paciente (em PSP) + times de pesquisa/medical |
| **Decisor** | diretor médico/RWE; **gatekeeper forte:** compliance/jurídico/DPO |
| **Orçamento potencial** | *RWE · estudos observacionais · PSP · market access* (orçamentos reais e recorrentes) |
| **Solução atual** | coleta manual/CRO; dados de dispensação; PicnicHealth-like **(EUA, não BR)** |
| **Custo/dor atual** | dado fragmentado, caro e lento; consentimento; qualidade |
| **Resultado econômico esperado** | ↓ custo/tempo de obtenção de RWD; ↑ velocidade de recrutamento; evidência de valor |
| **Dados necessários** | dado clínico longitudinal **consentido** do paciente |
| **Barreiras de acesso** | **LGPD restringe fortemente uso secundário**; consentimento específico; **ANPD 2026–2027 na mira**; anonimização/finalidade |
| **Dependências regulatórias** | LGPD/ANPD (uso secundário); ética em pesquisa (CEP/CONEP); RDC-657 se função clínica |
| **Tempo de implantação** | consentimento + coorte → **meses a trimestres** |
| **Hipótese de preço** | por paciente recrutado / por estudo / licença de dados consentidos |
| **Hipótese de ROI** | custo de aquisição de RWD vs. alternativas; velocidade |
| **Substituto mais forte** | CROs; Datavant/RWD networks (EUA); coleta própria; **conflito com o posicionamento patient-centric** (monetizar dado do paciente) |
| **Nota crítica** | é o **único wedge com pagador historicamente comprovado** (PicnicHealth), **mas** mercado BR menor, LGPD mais restritiva e **tensão com a marca patient-owned** |

---

## 3. ICP e persona por wedge (quem entrevistar)

Para cada wedge, distinguir **comprador ≠ usuário ≠ decisor ≠ gatekeeper**:

| Wedge | ICP (organização) | Persona-comprador | Decisor econômico | Gatekeeper |
|---|---|---|---|---|
| **A Operadora** | operadora média/grande (autogestão, cooperativa, medicina de grupo, seguradora) com população própria e dor de coordenação/custo | diretor de saúde populacional/VBC | CMO/CFO médico | TI + DPO/jurídico |
| **B Hospital** | hospital/rede privada médio/grande com estratégia de relacionamento e pós-alta | diretor de experiência do paciente/estratégia digital | superintendência | **TI/fornecedor de HIS** |
| **C Pharma** | farma de crônico/especialidade; CRO | head de RWE/Medical Affairs/PSP | diretor médico | compliance/DPO |

**Amostra mínima por wedge (a validar):** 8–12 entrevistas de descoberta com **compradores/decisores reais** (não usuários finais). Total inicial ~30. **Não** entrevistar quem não tem orçamento nem poder de decisão.

---

## 4. Instrumento de descoberta (lógica, não roteiro final)

> O roteiro detalhado por persona é o **próximo entregável** (após aprovação). Aqui fica a **lógica** que ele deve seguir.

### Bloco 1 — Problema e comportamento atual (SEM mencionar a SINTERA)
- Como vocês fazem **isso** [o job do wedge] **hoje**? Quem executa?
- Quanto **tempo/custo** isso consome? (buscar número)
- Onde estão as **falhas**? Qual a **consequência econômica** delas? (buscar R$/%, não adjetivos)
- Já **compraram** alguma solução para isso? Qual? Quanto pagaram? Funcionou?
- Por que a solução atual **não é suficiente**?
- Existe **orçamento específico** para esse problema? De quem? Qual ordem de grandeza?
- Quando foi a **última vez** que esse problema custou dinheiro a vocês? O que fizeram?

### Bloco 2 — Teste do substituto (ANTES de apresentar a SINTERA)
Para o problema que você descreveu, **por que não resolveria com**:
- o seu **EHR/HIS atual** (MV/Tasy/InterSystems)?
- o seu **fornecedor atual** / uma consultoria?
- **RNDS/OpenCare** / interoperabilidade pública?
- uma solução de **interoperabilidade + IA** genérica?
- **desenvolvimento interno**?
> (Registrar qual substituto o próprio comprador considera default. Conecta ao Substitute Stack do assessment.)

### Bloco 3 — Só agora, a hipótese SINTERA (como conceito, não pitch)
Apresentar o **conceito da camada independente de continuidade** e medir **reação comportamental**, não opinião:
- Isso mudaria **como** vocês gastam o orçamento que você mencionou?
- Vocês topariam um **piloto pago** / fornecer dados / indicar um dono interno?
- Quem precisaria **aprovar**? Qual seria o **processo/tempo** de compra?

### Bloco 4 — Reasons to reject (elicitar ativamente F1–F8)
Perguntar diretamente o que os faria **não** comprar; registrar qual F se confirma.

---

## 5. Critérios de evidência (comportamento, não opinião)

| Nível | O que caracteriza | Vale? |
|---|---|---|
| **Sinal FRACO** | "achei interessante" · "seria útil" · "gostaria de ter" · elogio genérico | **descartar** — não é evidência |
| **Sinal INTERMEDIÁRIO** | reconhece o problema **com número** · **possui orçamento** · **já usa** solução alternativa · **aceita discutir** piloto | **prosseguir/aprofundar** |
| **Sinal FORTE** | problema com **impacto econômico mensurável** · **comprador identificado** com **orçamento** · solução atual **reconhecidamente insuficiente** · **aceita fornecer dado/entrar em piloto** · **disposição concreta a pagar** (preço, condições) | **wedge candidato** |

**Regra:** contar **sinais fortes**, não entrevistas totais. Opiniões favoráveis (sinal fraco) **não** somam.

---

## 6. Critérios de decisão por wedge (falsificação / avanço / abandono)

Para **cada** wedge, ao fim das entrevistas:

- **AVANÇAR (wedge candidato a piloto)** se, em ≥ ~3 organizações independentes: problema com número + orçamento existente + substituto insuficiente reconhecido + disposição concreta a piloto pago/dado.
- **ITERAR (promissor, não comprovado)** se: problema reconhecido e interesse, **mas** falta prova de orçamento **ou** acesso a dado **ou** disposição a pagar → reformular hipótese/persona e re-testar.
- **ABANDONAR (falsificado)** se: predominam F1–F8 (o substituto/EHR resolve; sem orçamento; ROI insuficiente; LGPD impede; paciente não valoriza; fadiga de camada) **ou** só sinais fracos.

---

## 7. Matriz de decisão (consolidação dos 3 wedges → decisão estratégica)

| Resultado agregado | Leitura | Próximo passo |
|---|---|---|
| **≥1 wedge com sinal FORTE (comprador+orçamento+dado+disposição)** | **Cenário A — Wedge comprovado** | **definir a V2** para aquele wedge (produto mínimo necessário) |
| **wedges promissores, sem prova econômica/acesso** | **Cenário B — promissor não comprovado** | **novo teste** (reposicionar comprador/modelo) antes de V2 |
| **nenhum wedge sobrevive a F1–F8** | **Cenário C — wedge não encontrado** | **reavaliar a tese** (não é fracasso — é informação que evita investir meses em FHIR/MPI/conectores) |

**Ligação com o assessment:** o Cenário C aqui **confirmaria** o risco "mais próximo de C" do assessment como estado real; o Cenário A moveria a SINTERA para tese com propósito econômico concreto — só então a arquitetura da V2 ganha sentido.

---

## 8. Execução (leve, sem sobre-processo)

- **Ordem sugerida:** começar por **A (Operadora)** e **C (Pharma)** — têm orçamento recorrente e pagador identificável; **B (Hospital)** tem o substituto incumbente (HIS) mais forte, testar em paralelo para calibrar o "não".
- **Quem conduz:** fundadora/comercial; entrevistas de descoberta (25–45 min), gravadas com consentimento, com **captura estruturada** (uma linha por sinal forte/fraco/F-confirmada).
- **Anti-pattern a evitar:** transformar a entrevista em demo/pitch; perguntar sobre futuro hipotético; falar com quem não decide orçamento; contar elogios como validação.
- **Saída da fase:** um documento curto de **evidências por wedge** (sinais fortes, orçamentos citados, substitutos default, F confirmadas) + a **decisão A/B/C**. **Sem backlog técnico.**

---

## 9. O que este framework NÃO faz (limites)

- Não desenvolve código, não altera arquitetura, não toca a V1.
- Não produz roteiro de entrevista final (próximo passo, sob aprovação).
- Não converte achado em requisito técnico antes da decisão estratégica.
- Não presume que a H-CENTRAL é verdadeira — **tenta derrubá-la**.

> **Princípio de fechamento:** a SINTERA **não** precisa provar que consegue construir a tecnologia (o assessment mostrou que a tecnologia existe e é reproduzível). Precisa provar que **existe um problema pelo qual alguém pagará e que as alternativas não resolvem bem**. Este framework existe para encontrar esse wedge — ou para descobrir, cedo e barato, que ele não existe.
