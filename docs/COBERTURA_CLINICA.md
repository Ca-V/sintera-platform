# Cobertura Clínica — maturidade por MODELO CLÍNICO (painel vivo)

> Fundadora (14/07/2026): medir a maturidade **no nível dos Modelos Clínicos (modalidades)**, não das
> **famílias**. "Laboratório" é uma família, não uma modalidade — a evolução fica muito mais precisa
> acompanhando **Hemograma, Perfil Lipídico, Mamografia, Tomografia de Córnea, EEG…** individualmente.
>
> **Modelo Clínico × Processador (14/07):** o **Modelo** descreve a ESTRUTURA clínica da modalidade
> (conhecimento médico — `clinical-processors/models.ts`); o **Processador** só PREENCHE essa estrutura
> (implementação). Conhecimento médico desacoplado de implementação.

## Os 5 estágios de maturidade (cada MODELO percorre esta escada)
1. **Identificação** — o Clinical Identity Registry reconhece a modalidade por ensemble de evidências.
2. **Representação** — há **processador** que preenche o Modelo Clínico (a estrutura já é declarativa).
3. **Validação** — o Representation Validator (CEF, 4 perguntas) confere a representação (sem invenção).
4. **Cobertura** — contador estrutural independente: **descoberto × estruturado** (sem falsa completude).
5. **UCDA** — a evidência é persistida na arquitetura universal (modelo canônico), uso longitudinal.

**Legenda:** ✅ pronto · 🔄 em andamento · ⬜ não iniciado · ▫︎ estrutura declarada (modelo existe, sem processador).

## Painel de maturidade (por Modelo Clínico)

| Modelo Clínico | Família | 1·Ident | 2·Repr | 3·Valid | 4·Cobert | 5·UCDA | Estágio |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| **Tomografia de córnea** `corneal-tomography` | Oftalmologia | ✅ | 🔄 | ⬜ | ⬜ | ⬜ | **Representação** (GS-004) |
| **OCT** `oct` | Oftalmologia | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação |
| **Mamografia** `mammography` | Imagem — mama | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-012) |
| **Ultrassonografia** `ultrasound` | Imagem — ultrassom | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-013) |
| **Ressonância magnética** `mri` | Imagem — RM | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-006) |
| **Tomografia computadorizada** `ct` | Imagem — TC | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação |
| **Densitometria óssea** `densitometry` | Imagem — densitometria | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação |
| **Eletroencefalograma** `eeg` | Neurofisiologia | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-003) |
| **Anatomopatológico** `pathology` | Anatomia patológica | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-005) |
| **Eletrocardiograma** `ecg` | Cardiologia | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-009) |
| **Ecocardiograma** `echocardiography` | Cardiologia | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação (GS-007) |
| **Holter 24h** `holter` | Cardiologia | ✅ | ▫︎ | ⬜ | ⬜ | ⬜ | Identificação |
| **Hemograma** `hemogram` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| **Perfil lipídico** `lipid-panel` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| **Glicemia** `glucose` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| **Função tireoidiana** `thyroid-panel` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| **Função renal** `renal-panel` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| **Função hepática** `hepatic-panel` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| **Vitamina D** `vitamin-d` | Laboratório | ⬜ | ▫︎ | ⬜ | ⬜ | ⬜ | estrutura declarada¹ |
| *Laboratório (genérico, transitório)* `laboratory` | Laboratório | ✅ | 🔄 | 🔄 | 🔄 | ⬜ | rota atual (não distingue painel)² |

¹ O Modelo Clínico (estrutura) já existe; falta **identificar o painel específico** (a identificação de hoje
resolve só a família "Laboratório") e o processador. Ao granularizar a identificação, cada painel sobe.
² `laboratory` é **transitório**: representa a extração laboratorial atual (biomarcadores) enquanto a
identificação não distingue o painel. Será substituído pelos painéis acima conforme cada um amadurece.

**Leitura:** 12 modalidades **identificáveis** · 1 na **Representação** (`corneal-tomography`, GS-004) · 7
painéis laboratoriais com **estrutura declarada** aguardando identificação de painel. Maturidade medida por
**modelo real**, não por família — mostra com precisão onde a plataforma realmente está.

## Convenção de avanço (o CRC dirige o roadmap)
```
GS-004 → corneal-tomography → Repr → Valid → Cobert → UCDA → utilizável   (em Representação)
GS-012 → mammography · GS-013 → ultrasound · GS-003 → eeg · GS-007 → echocardiography …
lab: granularizar a identificação de painel → hemogram / lipid-panel / glucose … sobem individualmente
```
Cada modelo só é **utilizável** ao alcançar a **Cobertura** com o caso do CRC verde (comparação com o
`expected.json` do documento real — sem juízo humano a cada vez).
