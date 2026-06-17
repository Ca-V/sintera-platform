# SINTERA — Master Strategy & Governance

**O documento-mãe da SINTERA.** Consolida tudo o que ficou definido ao longo da
construção e das rodadas de parecer (Claude Code ↔ ChatGPT, com a fundadora como ponte).
**Versão:** v1 · **Data:** 2026-06-16 · **Branch:** `claude/exciting-brahmagupta-8hsq5c`

> **Natureza dos conteúdos.** Itens de **arquitetura, governança e escopo** estão
> consolidados. Itens de **estratégia de mercado e métrica** são **hipóteses para
> validação**. Itens de **conteúdo clínico** (protocolos, limiares) **não existem ainda** —
> dependem do Responsável Clínico. Cada seção indica seu status.

---

## 1. Identidade

- **Visão.** Transformar a saúde preventiva de **eventos isolados** em uma **jornada
  contínua, rastreável e governada**.
- **Missão.** Ser o **lar confiável da jornada de saúde**: organizar dados dispersos,
  aplicar protocolos preventivos governados e acompanhar a continuidade — **sem
  diagnóstico nem decisão clínica**.
- **Posicionamento.** *Plataforma de governança e continuidade da saúde baseada em
  protocolos científicos governados, auditáveis, rastreáveis e versionados.*

## 2. O que a SINTERA é — e o que NÃO é

| É | NÃO é |
|---|---|
| Plataforma de governança e continuidade da saúde | Prontuário eletrônico |
| Organização e rastreabilidade da jornada | Telemedicina |
| Adesão a protocolos preventivos governados | Plataforma diagnóstica |
| Infraestrutura que custodia protocolos de terceiros | Score de risco clínico / IA diagnóstica |

**Não faz:** diagnóstico · estratificação clínica de risco · substituição da avaliação
médica · recomendação de tratamento · prescrição · medição de estado de saúde.

## 3. Proposta de valor e North Star *(hipótese de mercado)*

- **Valor percebido:** *tranquilidade rastreável* — "estou cuidando do que importa e tenho
  como provar". Engajamento por **momentos que importam** (não frequência diária).
- **North Star — Health Continuity Rate (HCR):** % de usuários com jornada de saúde
  **rastreável** e **cobertura documental compatível** com os protocolos governados
  aplicáveis. Mede **continuidade e adesão documental — não mede saúde**.
- Detalhe em `SINTERA-VALUE-PROPOSITION-NORTH-STAR` v1.1.

## 4. Arquitetura macro

```
Sources → Protocols → Resolution Policies → Provenance → Timeline → Compliance → (Usuário)
```

**Estado atual (consolidado/implementado):**
- Extração de laudos (IA) + catálogo de 83 biomarcadores (Onda 0).
- Motor determinístico de insights **rodando vazio** por segurança (`CLINICAL_RULESET = []`).
- Governança científica dos biomarcadores: proveniência, LOINC/SNOMED, fluxo
  `draft→validado→ativo→rejeitado`, ondas, cache, paginação (escala).
- **Modo demonstração factual** (não-clínico) ponta a ponta.

**Futuro (a construir após validação):** o **Life Course Governance Engine** —
`Protocol Sources`, `Protocol Items`, `Resolution Policies`, `Provenance`, `Compliance
Engine`, `Health Timeline`. Ver `MODELO-GOVERNANCA-OPERACIONAL` v2.

## 5. Protocolos Health Personalizados

**Definição formal (consolidada):** *conjunto versionado de itens derivados de fontes
científicas aprovadas (Nível 1–3), aplicável a uma população específica e ativado por
instância formal de governança clínica.*

**Princípios (consolidados):**
- O protocolo **não pertence à SINTERA** — pertence à fonte científica e ao RC que o adota.
- A personalização é **classificação/filtragem por perfil**, não orientação individual
  (Modelo B).
- Mecanismo (avaliar aplicabilidade) é engenharia; **qual** protocolo se aplica a **qual**
  perfil é **decisão clínica** (RC/Comitê).

**Dimensões de personalização — *PROPOSTA para ratificação* (estrutura, não conteúdo):**

| Dimensão | Natureza | Observação |
|---|---|---|
| Idade (faixa) | Estrutural | — |
| Sexo biológico | Estrutural | — |
| Fase reprodutiva / gestação / menopausa | Estrutural | Relevante à identidade (saúde da mulher) |
| Condições clínicas prévias | Autorrelato/registro | Com proveniência/confiança |
| Fatores de risco (tabagismo, álcool, sedentarismo) | Autorrelato | Com proveniência |
| Histórico familiar | Autorrelato | Dado sensível (LGPD) |
| Ocupação | Estrutural | Relevante p/ B2B saúde ocupacional |

> Estas são as **dimensões** (campos) que o motor poderá usar para aplicabilidade. **Quais
> valores acionam quais protocolos é decisão do RC/Comitê** — não está definido e não é
> autorado por IA.

## 6. Modelo regulatório

- **RDC 657/2022 + CFM:** posicionamento em "organização/gestão de informação em saúde";
  **sem** função diagnóstica/terapêutica.
- **Modelo B (informar aderência, não recomendar conduta).** O exato nível do espectro
  "pendente" (classificatório → obrigação) é **decisão jurídica em aberto**.
- **Compliance ≠ saúde:** enquadramento defensivo obrigatório na exibição.
- **Provenance Viewer:** mostra origem/versão/aprovação de cada item — transparência e
  mitigação regulatória.

## 7. Governança *(modelo consolidado; corpos a instanciar)*

- **Camadas:** Conselho Científico (governança científica) → Comitê Clínico (operacional
  clínica) → Responsável Clínico (aprova/ativa) → Operação SINTERA (custódia).
  **Instanciação faseada** (não exige conselho permanente no dia 1).
- **Cadeia de responsabilidade:** autoria = sociedade/fonte · adoção = RC/Comitê ·
  custódia = SINTERA.
- **Hierarquia de fontes:** Nível 1 (MS, CONITEC, ANVISA, INCA, PNI) → Nível 2 (AMB/CFM
  Projeto Diretrizes) → Nível 3 (sociedades AMB) → benchmark (WHO/NICE/USPSTF).
- **Precedência de fontes** e **cadência de revisão**: processos definidos; decisões a
  cargo do RC/Comitê.
- **Sustentabilidade da curadoria:** expandir **por valor de mercado, não por completude**.
- Detalhe em `MODELO-GOVERNANCA-OPERACIONAL` v2 e `GOVERNANCE-DECISIONS-CHECKLIST`.

## 8. Estado das aprovações *(real, em 2026-06-16)*

| Aprovação | Status |
|---|---|
| 1 — Processo de governança | ☑ **Provisória** (fundadora) · pendente ratificação RC |
| 2 — Prompts (linguagem) | ☑ **Provisória** (fundadora) · pendente ratificação RC · prompts seguem `draft` |
| 3 — Conteúdo clínico | ⏳ Pendente — exige RC + planilhas preenchidas |
| 14 decisões de governança | ⏳ Todas pendentes (ver checklist) |

## 9. Go-to-market *(hipótese)*

`B2B Saúde Ocupacional → B2B2C (Operadoras) → B2C`. O canal ocupacional é
**simultaneamente motor comercial e fonte de dados**. Flywheel: mais eventos → mais
continuidade → mais confiança → mais retenção → mais eventos.

## 10. Escopo

**V1 (alvo):** Protocol Engine governado · Compliance factual · Health Timeline · Registry
de diretrizes · Provenance Viewer · Onda 1 (prevenção universal).
**Fora da V1:** diagnóstico · scores clínicos proprietários · predição · idade biológica ·
saúde mental clínica (começa por bem-estar sem classificação) · apoio à decisão diagnóstica.

## 11. Maior risco

**Mercado.** Visão/posicionamento/arquitetura/governança estão maduros; **modelo comercial
e disposição a pagar não estão validados.** A próxima rodada de aprendizado vem de
**compradores e usuários reais**, não de mais refinamento conceitual.

---

*Documentos relacionados: VALUE-PROPOSITION-NORTH-STAR v1.1 · MODELO-GOVERNANCA-OPERACIONAL
v2 · GOVERNANCE-DECISIONS-CHECKLIST · SINTERA-ONE-PAGER · (clínicos) ONDA-1-GUIA,
TERMO-APROVACAO-RC, loinc-mapping-draft, loinc-approval-ledger.*
