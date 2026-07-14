# Cobertura Clínica — maturidade por modalidade (painel vivo)

> Fundadora (13/07/2026): além do progresso técnico (`EXECUCAO_MILESTONES.md`) e de produto
> (`CAPACIDADES_PRODUTO.md`), acompanhar a **maturidade clínica por modalidade** — não um percentual global,
> e sim **em que ESTÁGIO** cada modalidade está. Indicador estratégico: "quanto da medicina a SINTERA já
> compreende, e com que profundidade".
>
> **Eixo:** cada modalidade nasce **dirigida por um caso do CRC** e evolui pelos 5 estágios. Só é "utilizável"
> quando chega à **Cobertura** com o **CRC verde**. Modelos organizam-se por **modalidade**, não por
> fabricante (Pentacam/Galilei/Orbscan → o mesmo modelo `corneal-tomography`).

## Os 5 estágios de maturidade (cada modalidade percorre esta escada)
1. **Identificação** — o Clinical Identity Registry reconhece a modalidade por ensemble de evidências.
2. **Representação** — existe um **Modelo Clínico** (processador do CPE) que produz o modelo de resultado
   próprio (biomarcador ≠ achado ≠ parâmetro por região).
3. **Validação** — o Representation Validator (CEF, 4 perguntas) confere a representação (sem invenção).
4. **Cobertura** — contador estrutural independente: **descoberto × estruturado** alinhado (sem falsa completude).
5. **UCDA** — a evidência é persistida na arquitetura universal (modelo canônico), pronta para uso longitudinal.

**Legenda:** ✅ pronto · 🔄 em andamento · ⬜ não iniciado.

## Painel de maturidade

| Modalidade | Modelo Clínico | 1·Ident | 2·Repr | 3·Valid | 4·Cobert | 5·UCDA | Estágio atual |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| **Laboratório** | `laboratory` | ✅ | ✅ | 🔄 | ✅ | 🔄 | **Cobertura** (madura) |
| **Tomografia de córnea** | `corneal-tomography` | ✅ | 🔄 | ⬜ | ⬜ | ⬜ | **Representação** (GS-004) |
| **EEG / neurofisiologia** | `eeg` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-003) |
| **Mamografia** | `mammography` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-012) |
| **Ultrassonografia** | `ultrasound` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-013) |
| **Anatomopatológico** | `pathology` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-005) |
| **Ressonância magnética** | `mri` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-006) |
| **Tomografia computadorizada** | `ct` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação |
| **Ecocardiograma** | `echocardiography` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-007) |
| **Eletrocardiograma** | `ecg` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação (GS-009) |
| **Holter 24h** | `holter` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação |
| **OCT (oftalmologia)** | `oct` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação |
| **Densitometria óssea** | `densitometry` | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | Identificação |
| **Espirometria / função pulmonar** | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — (GS-008; falta identificar) |
| **MAPA** | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| **Genética / genômica** | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — (modelo próprio) |

**Leitura:** **13 modalidades no estágio Identificação** (Clinical Identity Registry) · **1 na Representação**
(`corneal-tomography`, GS-004) · Laboratório é a mais madura (Cobertura). A subida de cada linha é o trabalho
do Clinical Processing Engine, agora medido por **profundidade clínica real**, não por percentual.

## Convenção de avanço (o CRC dirige o roadmap)
```
GS-004  → corneal-tomography  → Repr → Valid → Cobert → UCDA → utilizável   (em Representação)
GS-012  → mammography         → percorre os 5 estágios → utilizável
GS-013  → ultrasound          → percorre os 5 estágios → utilizável
GS-003  → eeg                 → percorre os 5 estágios → utilizável
...
```
Cada modalidade só é **utilizável** quando alcança a **Cobertura** com o caso do CRC verde (comparação com o
`expected.json` do documento real — sem juízo humano a cada vez).
