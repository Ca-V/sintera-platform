# SINTERA — Wedge Validation · Roteiros de Entrevista por Persona

**Status:** instrumento de **validação comercial** (não é código, não é arquitetura, não é backlog).
**Depende de:** `WEDGE_VALIDATION_FRAMEWORK.md` (hipóteses, wedges, F1–F8, critérios de sinal).
**Sequência:** V1 → homologação → Assessment (✔) → **Wedge Validation** → decisão estratégica → V2 → gap analysis → implementação.
**Regra de ouro:** o objetivo **não** é validar a SINTERA — é **descobrir se o problema existe espontaneamente e se há comportamento de compra**. *"Dez executivos dizendo 'temos exatamente esse problema, custa X, fazemos assim, estamos insatisfeitos' vale muito mais que dez dizendo 'achei a SINTERA interessante'."*

---

## 0. Regras invioláveis (valem para os três roteiros)

1. **Problem-first.** Nas primeiras entrevistas, **não mencionar a SINTERA** e não descrever solução até o Bloco 6.
2. **Nunca perguntar** "você usaria / gostaria / compraria / acha isso útil?". Perguntar sobre **passado e presente** (o que já fazem, gastam, compraram), nunca sobre futuro hipotético.
3. **Falsificar.** Cada bloco tenta **derrubar** a hipótese. Um "não" bem entendido vale mais que um "interessante".
4. **Quantificar sempre** (tempo, custo, volume, retrabalho, perdas, indicadores, orçamento, impacto financeiro). Sem número, o problema não está provado.
5. **Testar o substituto** explicitamente (EHR/HIS, build interno, fornecedor de interop, OpenCare/RNDS, IA, combinação).
6. **Evidência = comportamento**, não sentimento.
7. **Sem backlog.** Nenhuma resposta vira requisito de produto antes da decisão estratégica.

### Como ler cada bloco
Cada bloco traz: **Hipótese testada · Critério de decisão · Perguntas principais · Perguntas de aprofundamento · Evidência esperada · Sinal de validação · Sinal de falsificação.** Tags inline: `→[Fx]` procura ativamente uma razão de rejeição; `→[FORTE]` marca a pergunta que, se respondida com número/compromisso, gera sinal forte.

### Logística
25–45 min, com **comprador/decisor real** (não usuário final). Gravar com consentimento. Registrar **uma linha por sinal** (forte/intermediário/fraco) e **cada F confirmada**. Meta: 8–12 entrevistas por wedge; contar **sinais fortes**, não entrevistas.

### Hipóteses sob teste (todas a FALSIFICAR)
- **H-CENTRAL:** *uma organização pagará para oferecer ao seu paciente/beneficiário uma camada independente de continuidade da informação que ela própria não consegue construir/controlar integralmente.*
- **H-A / H-B / H-C:** o job econômico específico de cada wedge (abaixo).
- **F1** já resolvemos internamente · **F2** paciente não valoriza · **F3** não temos acesso ao dado · **F4** sem orçamento · **F5** ROI insuficiente · **F6** LGPD/regulação impede · **F7** fácil construir/comprar do incumbente · **F8** não queremos mais uma camada.

### Classificação obrigatória ao fim de CADA entrevista
- **FRACO:** interesse · elogio · curiosidade · "seria interessante". **(descartar — não é evidência)**
- **INTERMEDIÁRIO:** problema reconhecido · solução atual insuficiente · orçamento potencial · interesse em avaliar piloto · indicação de outros decisores.
- **FORTE:** problema economicamente mensurável · comprador identificado · orçamento existente · solução atual insuficiente · disposição a fornecer dados · disposição a definir piloto · compromisso concreto com próxima etapa · (ideal) disposição a discutir contratação/pagamento.

### Critérios de encerramento da entrevista (quando parar)
- **Encerrar com "avançar"** quando houver ≥1 sinal forte + próximo passo concreto agendado.
- **Encerrar como "falsificado"** quando ≥2 razões F confirmadas com convicção (ex.: F4 sem orçamento + F7 EHR já faz).
- **Encerrar como "fora de perfil"** quando o entrevistado não é decisor nem dono de orçamento → pedir indicação de quem é (sinal intermediário) e encerrar.

---

# ROTEIRO 1 — OPERADORAS (saúde suplementar)

**H-A (a falsificar):** a operadora tem um problema econômico mensurável de **duplicidade de exames / internações evitáveis / coordenação fragmentada / churn**, cuja solução atual é insuficiente, e existe orçamento para uma camada de continuidade da informação do beneficiário.
**Perfil do entrevistado:** diretor(a) de saúde populacional / gestão de saúde / VBC / medical economics.

### Bloco 0 — Contexto e mapeamento de papéis
- **Hipótese:** identificar comprador ≠ usuário ≠ decisor ≠ dono do orçamento ≠ beneficiário.
- **Critério de decisão:** se o entrevistado não decide nem controla orçamento → fora de perfil (pedir indicação).
- **Principais:** Qual é a sua responsabilidade sobre custo assistencial / gestão de saúde da população? Quem, na operadora, responde por sinistralidade? E por experiência do beneficiário?
- **Aprofundamento:** Quem aprova investimento em programas de gestão de saúde? Quem é dono desse orçamento? →[FORTE se nomear o dono do orçamento]
- **Evidência esperada:** organograma de decisão. **Validação:** entrevistado é/decide o orçamento. **Falsificação:** →[F4] "isso é de outra área que não tem verba".

### Bloco 1 — Problema e comportamento atual (SEM citar SINTERA)
- **Hipótese:** H-A existe **espontaneamente**.
- **Critério:** o problema surge sem indução e com processo/dono definidos.
- **Principais:** Quando um beneficiário passa por vários prestadores, como vocês enxergam o histórico clínico completo dele hoje? Como lidam com **exames repetidos** que já foram feitos em outro prestador? Como coordenam o cuidado de um crônico entre médicos/instituições diferentes?
- **Aprofundamento:** Com que **frequência** isso acontece? Quem executa a coordenação hoje — que time, quantas pessoas? Que **sistemas** usam (core/TISS, BI de claims, gestão de crônicos, app do beneficiário)?
- **Evidência esperada:** descrição de processo manual/parcial. **Validação:** reconhecem o problema com dono e processo. **Falsificação:** →[F1] "nosso sistema de claims já resolve isso" / →[F2] "não é um problema relevante para nós".

### Bloco 2 — Quantificação
- **Hipótese:** o problema tem **impacto financeiro mensurável**.
- **Critério:** sem número → no máximo sinal intermediário.
- **Principais:** Quanto vocês estimam gastar com **exames duplicados** por ano? Qual a taxa de **internações evitáveis** / reinternações? Qual o **custo** do time de coordenação? Qual o churn de beneficiários e o que o influencia? →[FORTE se der R$/%/volume]
- **Aprofundamento:** Isso entra em algum indicador que vocês acompanham (sinistralidade, MLR, NPS)? Já tentaram medir a perda?
- **Evidência esperada:** números ou faixas. **Validação:** cita R$/% concretos. **Falsificação:** →[F2/F5] "não medimos porque é pequeno".

### Bloco 3 — Soluções já compradas ou construídas
- **Hipótese:** já investiram e a solução atual é **insuficiente**.
- **Critério:** compra/insatisfação prévia = sinal de mercado.
- **Principais:** Já compraram ou construíram algo para isso (gestão de crônicos, navegação/APS, app próprio, integração)? Quanto pagaram/investiram? Funcionou? Por que **não** é suficiente?
- **Aprofundamento:** O que faltou? Renovariam o contrato? →[F7] "preferimos construir internamente" — por quê?
- **Evidência esperada:** histórico de compra + gaps. **Validação:** insatisfação com solução paga. **Falsificação:** →[F1/F7] "já resolvido / construímos e resolve".

### Bloco 4 — Teste dos substitutos (ANTES da SINTERA)
- **Hipótese:** o problema **não** é bem resolvido pelas alternativas óbvias (conecta ao Substitute Stack).
- **Critério:** se um substituto resolve bem → wedge enfraquece.
- **Principais:** Por que vocês não resolveriam isso com: os **dados de claims + BI** que já têm? Um módulo do **HIS/fornecedor atual**? **RNDS/OpenCare** / interoperabilidade pública? Uma solução de **interoperabilidade + IA**? **Desenvolvimento interno**?
- **Aprofundamento:** Qual desses seria o "default" se decidissem atacar o problema amanhã? O que impede? →[F3] "não temos acesso ao dado clínico, só ao claim".
- **Evidência esperada:** o substituto default do próprio comprador. **Validação:** reconhecem que nenhum resolve o clínico longitudinal. **Falsificação:** →[F1/F7] nomeiam um substituto que resolve.

### Bloco 5 — Orçamento e processo de compra
- **Hipótese:** existe **orçamento** e caminho de decisão.
- **Critério:** sem orçamento identificável → não é sinal forte.
- **Principais:** Existe uma linha de orçamento para gestão de saúde/coordenação/experiência do beneficiário? De qual ordem de grandeza? Como é o processo de compra (quem aprova, prazo, jurídico/DPO)? →[FORTE se confirmar linha + valor]
- **Falsificação:** →[F4] "não há verba para isso agora".

### Bloco 6 — SÓ AGORA: hipótese da camada independente (conceito, não pitch)
- **Hipótese:** H-CENTRAL — a operadora **pagaria** por uma camada independente de continuidade para o beneficiário.
- **Critério:** mede-se por **mudança de comportamento** (topar próxima etapa concreta), não por elogio.
- **Como apresentar (neutro):** "Imagine uma camada, controlada pelo próprio beneficiário, que reúne a história dele dentro e fora da sua rede (SUS + privado + documentos), que a operadora **não precisa construir nem hospedar**, e que pode reduzir duplicidade e melhorar coordenação."
- **Principais:** Isso mudaria **como** vocês gastam aquele orçamento que você mencionou? O que precisaria ser verdade para valer a pena? Vocês topariam **um piloto medido** numa coorte? →[FORTE se topar piloto/coorte/próxima reunião com o decisor]
- **Proibido:** "vocês usariam a SINTERA?" / pitch de features.
- **Evidência esperada:** disposição (ou não) a um passo concreto. **Validação:** compromisso com próxima etapa. **Falsificação:** →[F2/F5/F8] "interessante, mas...".

### Bloco 7 — Falsificação explícita (reasons to reject)
- **Hipótese:** derrubar H-A/H-CENTRAL.
- **Principais (perguntar direto):** O que faria vocês **não** avançarem com algo assim? →[F1..F8] "já resolvemos" · "o EHR/claims já faz" · "não há orçamento" · "não é relevante" · "o beneficiário não valoriza" · "não conseguimos fornecer/obter os dados" · "preferimos construir" · "não queremos mais uma camada/fornecedor" · "o ROI não justificaria".
- **Registrar** qual(is) F o entrevistado sustenta com convicção.

### Bloco 8 — Encerramento e compromisso
- **Principais:** Qual seria o **próximo passo concreto** do seu lado? Quem mais precisaria estar na conversa? Você toparia agendar isso agora? →[FORTE se agenda passo com data/decisor]
- **Classificar** a entrevista (fraco/intermediário/forte) + F confirmadas.

---

# ROTEIRO 2 — HOSPITAIS / SISTEMAS DE SAÚDE

**H-B (a falsificar):** o hospital tem um problema econômico mensurável de **descontinuidade pós-alta (readmissão evitável) / baixa fidelização-aquisição (LTV) / retrabalho de reconstrução de histórico**, cuja solução atual é insuficiente, e existe orçamento para uma camada de continuidade centrada no paciente.
**Perfil do entrevistado:** diretor(a) de experiência do paciente / relacionamento / estratégia digital / marketing médico. **Gatekeeper crítico:** TI/fornecedor de HIS (MV/Tasy/InterSystems).

### Bloco 0 — Contexto e papéis
- **Hipótese:** mapear decisor × dono do orçamento × TI/HIS (gatekeeper) × paciente (beneficiário).
- **Critério:** se TI/HIS tem poder de veto, isso muda a viabilidade (F7/F8).
- **Principais:** Você responde por qual parte da jornada do paciente? Quem decide investimento em experiência/relacionamento? Qual o papel da TI e do fornecedor de HIS nessas decisões?
- **Falsificação:** →[F7] "isso passaria pela TI e eles empurram para o HIS".

### Bloco 1 — Problema e comportamento atual (SEM citar SINTERA)
- **Hipótese:** H-B existe espontaneamente.
- **Principais:** Depois que o paciente recebe **alta**, como vocês mantêm a relação e a continuidade do cuidado? Quando um paciente volta, quanto do histórico vocês **reconstroem manualmente**? Como sabem o que aconteceu com ele **fora** do hospital?
- **Aprofundamento:** Frequência? Quem faz o follow-up pós-alta (time, ligações)? Que sistemas (HIS — MV/Tasy, portal/app próprio, CRM)?
- **Evidência esperada:** processo de follow-up manual e histórico fragmentado. **Validação:** reconhecem descontinuidade/retrabalho. **Falsificação:** →[F1] "nosso portal/HIS já cuida disso".

### Bloco 2 — Quantificação
- **Hipótese:** impacto financeiro mensurável (readmissão, LTV, retrabalho).
- **Principais:** Qual a taxa de **readmissão evitável**? Quanto vale um paciente que **retorna** vs. um que se perde (LTV)? Quanto tempo clínico/administrativo se gasta **reconstruindo histórico**? →[FORTE se der número]
- **Aprofundamento:** Isso está em algum indicador (readmissão 30d, NPS, taxa de retorno)?
- **Falsificação:** →[F2/F5] "não medimos / é irrelevante".

### Bloco 3 — Soluções compradas/construídas
- **Principais:** Já compraram/construíram app do paciente, CRM de saúde, programa de continuidade? Quanto? Funciona? Por que é insuficiente? →[F7] "temos app próprio via HIS".
- **Validação:** insatisfação com o que já têm. **Falsificação:** →[F1/F7] o HIS/app próprio resolve.

### Bloco 4 — Teste dos substitutos
- **Hipótese:** os substitutos (sobretudo o HIS incumbente) **não** resolvem a parte **source-agnostic / fora do hospital**.
- **Critério (crítico neste wedge):** o HIS (MV Personal Health / InterSystems Personal Community) é o substituto mais forte — testar de frente.
- **Principais:** Por que não resolveriam com: o **próprio HIS (MV/Tasy)** e seu app de paciente? **InterSystems/Personal Community**? App/CRM **próprio**? **RNDS/OpenCare**? **IA sobre o prontuário**? Build interno?
- **Aprofundamento:** O HIS consegue trazer o histórico do paciente **de fora** da sua rede? Vocês confiariam nele para isso? →[F7] "o MV/Tasy pode fazer" / →[F8] "não queremos outro fornecedor além do HIS".
- **Evidência esperada:** admitem (ou não) que o HIS não cobre o extramuros. **Falsificação forte esperada aqui** — registrar com rigor.

### Bloco 5 — Orçamento e processo
- **Principais:** Existe verba de experiência do paciente / transformação digital? Ordem de grandeza? A compra passa pela TI? Qual o peso do fornecedor de HIS na decisão? →[FORTE se confirmar verba e caminho sem veto do HIS]
- **Falsificação:** →[F4/F7] "sem verba" / "a TI direciona ao HIS".

### Bloco 6 — SÓ AGORA: hipótese da camada independente
- **Hipótese:** H-CENTRAL no hospital.
- **Como apresentar (neutro):** "Uma camada **controlada pelo paciente**, que segue com ele **para além do episódio e para fora do hospital** (inclusive dados de outras instituições e do SUS), que o hospital oferece mas **não precisa construir nem controlar** — melhorando continuidade pós-alta e retorno."
- **Principais:** Isso muda como vocês investem em relacionamento/pós-alta? O fato de ser **independente do hospital** (o paciente leva com ele) é vantagem ou desconforto para vocês? Topariam um **piloto de continuidade pós-alta** medido? →[FORTE se topar piloto]
- **Falsificação:** →[F8] "preferimos que o dado fique no nosso ecossistema" (tensão real: hospital pode **não querer** que o dado seja independente).

### Bloco 7 — Falsificação explícita
- **Principais:** O que faria isto **não** avançar? →[F1..F8], com atenção especial a **F7 (o HIS faz)** e **F8 (não queremos camada independente / queremos o dado dentro de casa)**.

### Bloco 8 — Encerramento e compromisso
- **Principais:** Próximo passo concreto? Precisa envolver a TI/HIS? Agenda? →[FORTE se compromisso concreto].
- **Classificar** + registrar F.

---

# ROTEIRO 3 — PHARMA / RWD / JORNADA DO PACIENTE

**H-C (a falsificar):** a farma/CRO tem um problema econômico mensurável de **custo/lentidão para obter RWD/RWE longitudinal consentido / recrutamento para estudos / adesão em PSP**, cuja solução atual é insuficiente, e existe orçamento para dados clínicos longitudinais consentidos do paciente.
**Perfil do entrevistado:** head de **RWE / Medical Affairs / Market Access / Patient Support**. **Gatekeeper forte:** compliance/jurídico/DPO.

### Bloco 0 — Contexto e papéis
- **Hipótese:** mapear comprador (RWE/Medical/PSP) × decisor médico × compliance/DPO × paciente.
- **Principais:** Você responde por RWE/estudos/PSP/market access? Quem aprova orçamento de dados/estudos? Qual o papel do compliance/DPO?
- **Falsificação:** →[F6] "compliance não deixaria".

### Bloco 1 — Problema e comportamento atual (SEM citar SINTERA)
- **Hipótese:** H-C existe espontaneamente.
- **Principais:** Como vocês obtêm hoje **dados de mundo real** longitudinais de pacientes (para RWE, market access, PSP)? Como recrutam pacientes para estudos observacionais? Como acompanham a **jornada/adesão** em programas de suporte?
- **Aprofundamento:** Frequência/volume de estudos? Quem executa (CRO, interno)? Que fontes (dispensação, prontuário via CRO, registros)? Que sistemas?
- **Evidência esperada:** processo caro/lento via CRO/coleta manual. **Validação:** reconhecem custo/lentidão do dado. **Falsificação:** →[F3] "não conseguimos o dado do paciente de qualquer jeito".

### Bloco 2 — Quantificação
- **Principais:** Quanto custa hoje obter RWD para um estudo (por paciente / por estudo)? Quanto **tempo** leva o recrutamento? Qual a **taxa de adesão/abandono** em PSP e o custo disso? →[FORTE se número]
- **Falsificação:** →[F5] "o custo atual é aceitável".

### Bloco 3 — Soluções compradas/construídas
- **Principais:** Já contrataram CRO/plataformas de RWD/registros? Quanto pagam? Onde falham (qualidade, consentimento, longitudinalidade, velocidade)? →[F7] "fazemos via CRO e resolve".
- **Validação:** insatisfação com custo/qualidade/velocidade.

### Bloco 4 — Teste dos substitutos
- **Principais:** Por que não resolvem com: **CROs**; redes de **RWD** (Datavant-like); **dados de dispensação**; **prontuário via parceria hospitalar**; **RNDS/OpenCare**; build interno?
- **Aprofundamento:** O que falta em cada um (consentimento específico, longitudinalidade cross-fonte, LGPD)? →[F3/F6].
- **Evidência esperada:** o substituto default e seus limites.

### Bloco 5 — Orçamento, regulação e processo
- **Hipótese:** há orçamento recorrente (RWE/PSP) — **mas LGPD é gate**.
- **Principais:** Existe orçamento de RWE/estudos/PSP? Ordem de grandeza? Como o **compliance/DPO** trata dado de paciente consentido para uso secundário? O que a LGPD/ANPD permite hoje no seu entendimento? →[FORTE se orçamento] / →[F6 se compliance barra].
- **Falsificação:** →[F6] "uso secundário de dado de paciente é proibido/arriscado demais".

### Bloco 6 — SÓ AGORA: hipótese da camada consentida (conceito, não pitch)
- **Hipótese:** H-CENTRAL em pharma (com a tensão patient-owned × monetização de dado).
- **Como apresentar (neutro):** "Uma camada em que o **próprio paciente consente** o uso da sua história longitudinal para fins de pesquisa/PSP, com proveniência e finalidade auditáveis — reduzindo custo/tempo de obter RWD **dentro da LGPD**."
- **Principais:** Isso mudaria como vocês orçam RWD/recrutamento? O modelo **consentido pelo paciente** resolve ou complica o seu compliance? Topariam um **piloto** (uma coorte/um estudo)? →[FORTE se topar piloto]
- **Falsificação:** →[F6] "mesmo consentido, não passa no compliance" / tensão de marca (patient-owned × monetizar dado).

### Bloco 7 — Falsificação explícita
- **Principais:** O que impediria? →[F1..F8], com foco em **F6 (LGPD/compliance)** e **F3 (acesso ao dado consentido em escala)**.

### Bloco 8 — Encerramento e compromisso
- **Principais:** Próximo passo? Precisa do compliance na próxima conversa? Agenda? →[FORTE se compromisso].
- **Classificar** + registrar F.

---

## Consolidação (após as entrevistas de cada wedge)

Ao fim de cada wedge, produzir **evidência agregada** (não backlog):
- contagem de **sinais fortes** (não de entrevistas);
- **orçamentos citados** (linha + ordem de grandeza);
- **substituto default** que cada comprador nomeou;
- **F confirmadas** com convicção (padrão de rejeição);
- **próximos passos concretos** agendados.

**Decisão por wedge (do framework):** AVANÇAR (≥~3 orgs com sinal forte) · ITERAR (interesse sem prova econômica/acesso) · ABANDONAR (predomínio de F1–F8 ou só sinais fracos).

**Matriz final → decisão estratégica:** ≥1 wedge FORTE = Cenário A (definir V2 para aquele wedge) · promissor-sem-prova = Cenário B (novo teste) · nenhum sobrevive = Cenário C (reavaliar a tese).

> **Lembrete final:** estes roteiros existem para **descobrir se alguém tem o problema e pagaria** — não para vender a SINTERA. Resultado negativo, obtido cedo e barato, é tão valioso quanto um positivo: evita investir meses de V2 (FHIR/MPI/conectores/IA) num wedge que não existe. **Nenhuma resposta vira requisito de produto antes da decisão estratégica.**
