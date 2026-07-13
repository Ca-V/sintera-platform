# Cobertura Clínica — quão perto a SINTERA está de compreender toda a medicina (painel vivo)

> Fundadora (13/07/2026): além do progresso técnico (`EXECUCAO_MILESTONES.md`) e de produto
> (`CAPACIDADES_PRODUTO.md`), acompanhar a **cobertura clínica** — o **percentual de modalidades médicas**
> que a plataforma compreende de ponta a ponta. Indicador **estratégico** (usuários, parceiros,
> investidores): não "M5 em 20%", e sim "quanto da medicina já é utilizável".
>
> **Eixo de execução (a partir daqui):** cada modalidade nasce **dirigida por um caso do CRC** e só conta
> como entregue quando **utilizável de ponta a ponta**. O CRC dirige o roadmap — não é só regressão.

## Rubrica (como o % é calculado — 10 critérios, 10% cada)
Cada modalidade é medida pelos mesmos critérios de "capacidade completa":

1. Upload (PDF + imagens) · 2. Segmentação (bundle → CDU) · 3. Identificação (Clinical Identity Registry) ·
4. Título fiel (Identidade Documental) · 5. Data correta (datas semânticas, CEF §5) · 6. Emissor ·
7. **Resultado estruturado da modalidade** (processador do CPE) · 8. Documento original acessível ·
9. **Cobertura** (descoberto × estruturado) · 10. **Reprodutibilidade + caso do CRC verde**.

Critérios 1–6, 8 são **infraestrutura compartilhada** (já funcionam para todas as modalidades). O que
distingue cada modalidade é **7, 9 e 10** — o processador especializado, a cobertura alinhada e o CRC.

## Painel de Cobertura Clínica

| Modalidade | Caso CRC | Processador | Cobertura | % | Estado |
|---|---|---|---|---|---|
| **Laboratório** (bioquímica/hemograma) | GS-001/002/011 | structured (maduro) | ligada (conservadora) | **80%** | 🔄 madura |
| **Pentacam / córnea** | **GS-004** | **parametric ✅ (1º processador)** | por parâmetro | **35%** | 🔄 em andamento |
| **EEG / neurofisiologia** | GS-003 | narrative ⬜ | — | **15%** | ⬜ identificável |
| **Mamografia** | GS-012 (a criar) | narrative ⬜ | — | **15%** | ⬜ identificável |
| **Ultrassonografia** | GS-013 (a criar) | narrative ⬜ | — | **15%** | ⬜ identificável |
| **Anatomopatológico** | GS-005 | narrative ⬜ | — | **10%** | ⬜ identificável |
| **Ressonância magnética** | GS-006 | narrative ⬜ | — | **10%** | ⬜ identificável |
| **Tomografia computadorizada** | — | narrative ⬜ | — | **10%** | ⬜ identificável |
| **Ecocardiograma** | GS-007 | parametric ⬜ | — | **10%** | ⬜ identificável |
| **Eletrocardiograma** | GS-009 | parametric ⬜ | — | **10%** | ⬜ identificável |
| **Holter 24h** | — | parametric ⬜ | — | **10%** | ⬜ identificável |
| **OCT (oftalmologia)** | — | parametric ⬜ | — | **10%** | ⬜ identificável |
| **Densitometria óssea** | — | parametric ⬜ | — | **10%** | ⬜ identificável |
| **Espirometria / função pulmonar** | GS-008 | parametric ⬜ | — | **5%** | ⬜ não identificável ainda |
| **MAPA** | — | parametric ⬜ | — | **0%** | ⬜ |
| **Genética / genômica** | — | (modelo próprio) ⬜ | — | **0%** | ⬜ |

**Leitura:** 13 modalidades já **identificáveis** (Clinical Identity Registry); **1 com processador**
(Pentacam, parametric). A subida de cada linha depende de **um processador dirigido por CRC** + ligação na
Cobertura + reprodutibilidade — exatamente o trabalho do Clinical Processing Engine, agora medido por
**valor clínico entregue**, não por componente.

## Convenção de avanço (CRC dirige o roadmap)
```
GS-004  → Pentacam Processor    → testes verdes → capacidade entregue   (em andamento)
GS-012  → Mamografia Processor  → testes verdes → capacidade entregue
GS-013  → Ultrassom Processor   → testes verdes → capacidade entregue
GS-003  → EEG Processor         → testes verdes → capacidade entregue
...
```
Cada modalidade só sobe para **✅ entregue** quando o caso do CRC correspondente passa (comparação com o
`expected.json` do documento real — sem juízo humano a cada vez).
