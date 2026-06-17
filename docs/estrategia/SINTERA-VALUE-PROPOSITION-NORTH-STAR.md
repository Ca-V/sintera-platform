# SINTERA — Value Proposition & North Star

**Versão:** v1.1 (rascunho de produto).
**Status:** **HIPÓTESES para ratificação da fundadora e validação de mercado** — não são
fatos decididos. Diferente dos documentos de arquitetura/governança (estrutura), aqui há
suposições de mercado que precisam ser testadas com clientes reais (empresas, operadoras,
usuárias).
**Data:** 2026-06-16
**Escopo:** os quatro pontos que faltavam ao modelo (problema, valor percebido, North Star,
aquisição de dados). Complementa `MODELO-GOVERNANCA-OPERACIONAL.md` (o "como governar") com
o "por que alguém usa/paga".

---

## 1. Problema que resolvemos

Hoje quase ninguém — nem a pessoa, nem o médico, nem a empresa, nem a operadora — consegue
responder com confiança:

> **"Estou em dia com tudo que é aplicável ao meu perfil de saúde?"**

Os dados de saúde estão **dispersos** (laudos em PDF, consultas, vacinas, procedimentos),
**sem continuidade** e **sem rastreabilidade**. Não falta informação clínica no mundo —
falta **governança e continuidade** sobre a jornada individual.

A SINTERA resolve isso **sem diagnosticar**: organiza a jornada, aplica protocolos
preventivos governados (de fontes científicas reconhecidas) e mostra a **aderência** —
sempre encaminhando à avaliação médica.

---

## 2. Proposta de valor / valor percebido

**O que a usuária sente:** *tranquilidade rastreável* — "estou cuidando do que importa, e
tenho como provar". Não é dopamina diária; é **confiança e continuidade**.

**Modelo de engajamento (afiação crítica):** prevenção é **naturalmente de baixa
frequência**. Forçar uso "toda semana" leva a gamificação artificial. A SINTERA não disputa
frequência diária — ela quer ser **o lar confiável da jornada de saúde**, indispensável
**nos momentos que importam**:

- novo exame/laudo → entra na timeline automaticamente;
- item preventivo aplicável **pendente** → lembrete na hora certa (Modelo B, sem conduta);
- consulta/vacina/procedimento → registro e atualização;
- mudança de fase da vida → o protocolo aplicável se ajusta.

**Valor por público:**
- **Usuária (B2C):** histórico consolidado + "estou em dia?" + lembretes confiáveis.
- **Empresa (B2B):** visão de cobertura preventiva da população (NR-1, saúde ocupacional).
- **Operadora (B2B2C):** adesão preventiva → menos eventos evitáveis, em escala.

---

## 3. North Star Metric

**Health Continuity Rate (HCR)** — *proporção de usuários ativos cuja jornada de saúde
possui rastreabilidade adequada, eventos relevantes registrados com proveniência conhecida
e cobertura compatível com os protocolos governados aplicáveis.*

> A formulação evita a expressão "em dia" (intuitiva, mas clínica/juridicamente ambígua) —
> mede rastreabilidade e cobertura documental, **não** um juízo de saúde.

**Continuidade × Adesão × Saúde (o que o HCR mede — e o que NÃO mede):**

| Conceito | Significado |
|---|---|
| **Continuidade** | Existência de jornada rastreável ao longo do tempo |
| **Adesão** | Grau de cobertura dos itens previstos no protocolo |
| **Saúde** | **NÃO medida pela SINTERA** |

A SINTERA mede **continuidade e adesão documental** — não mede saúde, risco nem prognóstico.

**Por que esta, e não outras:**
- Liga as três coisas que importam: **valor** (estar em dia), **retenção** (manter a
  jornada) e o **produto** (a resposta a "estou em dia?").
- **Não é vaidade** (≠ usuárias ativas / eventos brutos).
- Evita a armadilha do **% de compliance puro** como métrica-mãe: compliance isolado colide
  com "compliance ≠ saúde" e pune o início (todo mundo começa fora). O HCR mede *manutenção
  da jornada*, não um juízo de saúde.

**Espelho no B2B (métrica do comprador):** *evolução da cobertura preventiva da população
ao longo do tempo* — é o que a empresa/operadora paga para ver subir.

**Insumos do HCR (factual, com proveniência):** itens de protocolo aplicáveis × itens
rastreados/atualizados, por usuária ativa, ponderados pela confiança do dado (§5).

**Anti-métricas (não perseguir):** % compliance como meta isolada; engajamento diário;
"score de saúde" proprietário.

> **Hipótese a validar:** que o HCR correlaciona com retenção e com disposição a pagar
> (B2C) e com valor percebido pelo comprador (B2B). Precisa de teste com usuárias/clientes.

---

## 4. Flywheel — por que o negócio se fortalece sozinho

**B2C:**
```
mais eventos registrados → timeline mais completa → maior continuidade da jornada
→ maior confiança do usuário → maior retenção → mais eventos registrados
```

**B2B:**
```
mais cobertura preventiva → mais dados estruturados → melhor governança
→ maior valor para o empregador → renovação e expansão → mais cobertura
```

> **Afiação honesta:** o ciclo só gira a partir do passo "mais eventos registrados" — ou
> seja, **depende da estratégia de aquisição de dados (§5)**. Sem resolver a entrada de
> dados, o flywheel não inicia. Por isso a porta **B2B ocupacional** (que já traz dado) é
> o melhor ponto de ignição.

---

## 5. Estratégia de aquisição de dados

O Compliance/Timeline só valem com dado de entrada. Caminho realista = **combinação, com
proveniência e confiança por evento** (alinhado à arquitetura já construída):

| Fonte | Confiabilidade | Esforço | Papel |
|---|---|---|---|
| **Upload de documentos** (laudos) | Alta (extração já existe) | Médio | Base inicial |
| **Autorrelato** | Baixa (marcar como tal) | Baixo | Preenche lacunas, sinalizado |
| **Integrações** (RNDS/Conecte SUS, labs, clínicas) | Alta | Alto | Evolução |

**Afiação crítica — a porta de GTM resolve a aquisição de dados:** começando por **B2B
saúde ocupacional**, o **próprio empregador/clínica ocupacional vira fonte de dado**
(exames admissionais/periódicos, programas), com consentimento institucional e volume.
**A estratégia comercial e a de dados são a mesma decisão** — reforço adicional para a
sequência:

```
B2B Saúde Ocupacional → B2B2C (operadoras) → B2C
```

> **Hipótese a validar:** que o canal ocupacional gera dado suficiente e de qualidade para
> tornar o HCR significativo desde cedo.

---

## 6. O que a SINTERA NÃO faz

- não realiza diagnóstico;
- não realiza estratificação clínica de risco;
- não substitui avaliação médica;
- não recomenda tratamento;
- não realiza prescrição;
- **não mede estado de saúde** (mede continuidade e adesão documental — ver §3).

Seção propositalmente explícita, para reduzir ambiguidade e reforçar o enquadramento
regulatório (RDC 657/2022).

---

## 7. Riscos e hipóteses a validar (honestidade)

1. **Disposição a pagar:** governança/continuidade são valor *institucional* claro, mas
   *individual* (B2C) tem histórico de baixa conversão — validar B2B primeiro.
2. **Frequência baixa:** o produto precisa ser valioso *sem* uso diário (ver §2).
3. **Aquisição de dados:** sem dado, HCR é vazio — depende da §5.
4. **HCR ↔ retenção/receita:** correlação assumida, não comprovada — instrumentar e medir.
5. **Enquadramento de "pendente":** depende da decisão jurídica (ver governança §9).

---

## 8. Resumo executivo (uma frase)

A SINTERA é **o lar confiável da jornada de saúde**: responde "estou em dia com o que é
aplicável a mim?" de forma rastreável e sem diagnóstico — medindo **Health Continuity
Rate** como sinal central de valor, alimentada primeiro pelo canal **B2B ocupacional**,
que é simultaneamente o motor comercial e a fonte de dados.
