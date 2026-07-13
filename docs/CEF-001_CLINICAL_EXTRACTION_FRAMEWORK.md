# CEF-001 — Clinical Extraction Framework

> **Nível 1 (Constituição).** Domínio transversal, par do Capture Hub (CAP-002).
> Criado 12/07/2026 a partir de avaliação da fundadora. **Especificação v1.0** — princípios
> a congelar após revisão (ARG). Complementar, não sobreposto:
>
> - **Capture Hub (CAP-002)** resolve **COMO o documento ENTRA** (origens → pipeline → roteamento).
> - **Clinical Extraction Framework (CEF)** resolve **COMO cada tipo de documento é COMPREENDIDO**
>   (estrutura → leitura → resultado estruturado).
>
> São responsabilidades diferentes e complementares — tendem a ser os **dois pilares** da plataforma.

---

## Mudança de paradigma (a tese do CEF)

A plataforma evolui a pergunta que sabe responder:
1. **"Como armazenar um exame?"** — armazenamento (estado anterior).
2. **"Como representar corretamente um documento clínico?"** — modelagem de domínio (nomenclatura/classificação/bundle — em curso).
3. **"Como estruturar corretamente o conteúdo de cada categoria de documento clínico SEM
   extrapolar o que está escrito no laudo?"** — o **CEF**.

O CEF é um diferencial técnico porque **não depende só de IA**: combina **taxonomia clínica +
protocolos por categoria + regras determinísticas de domínio** — resultado mais **consistente e
auditável** que um extrator genérico aplicado indistintamente a todos os tipos.

## 0. Enquadramento regulatório (inviolável)

O CEF **EXTRAI e ESTRUTURA o que está ESCRITO** no documento pelo profissional. **NÃO
interpreta clinicamente, NÃO diagnostica, NÃO infere** (RDC 657/2022; LGPD Art. 11). Campos
como "achados", "impressão diagnóstica" e "conclusão" são **transcrições fiéis** do que o laudo
declara — nunca gerados pela SINTERA. Por isso o nome é *Extraction* (não *Interpretation*).
Vale o [[principio_rastreabilidade_documental]]: havendo documento de origem, ele é a fonte primária.

---

## 1. O problema (modelagem de domínio)

Hoje a plataforma assume implicitamente que **todo exame = conjunto de biomarcadores**. Isso
funciona para laboratório, mas falha para a maior parte da medicina. "Biomarcador" é apenas
**um dos tipos possíveis de resultado clínico**. O EEG tem *achados*; a ressonância tem
*achados radiológicos*; o Pentacam tem *parâmetros tomográficos* — nenhum é biomarcador.

Sintomas observados: nomenclatura "biomarcador" forçada em todos os tipos; data errada (um EEG
lido como "2002" — pegou protocolo/nascimento em vez da realização); um mesmo exame em duas
imagens virando dois registros.

---

## 2. Taxonomia — Documento Clínico → Tipo documental

```
Documento Clínico
        │
        ▼
   Tipo documental
        ├── Laboratorial
        ├── Imagem
        ├── Neurofisiológico
        ├── Oftalmológico
        ├── Anatomopatológico
        ├── Genético
        ├── Ômico
        ├── Funcional
        └── Outros (relatório, pedido, guia, atestado…)
```

Cada categoria possui um **protocolo próprio de leitura** e um **modelo de resultado próprio**.

**Terminologia que escala (fundadora):** o classificador **classifica a CATEGORIA DOCUMENTAL** —
que é distinta de **especialidade**, **modalidade**, **protocolo** e **extractor**. Ex.: categoria
`imaging` → modalidade "ressonância" → especialidade "neurorradiologia" → protocolo/extractor
específicos. Manter esses eixos separados evita acoplamento à medida que o CEF cresce.

---

## 3. Arquitetura — de um extractor único para um registro de leitores

**Hoje (implícito):** `Document → Extractor → Biomarkers`

**CEF:**
```
Document (Bundle)
      ↓
Content Classifier        (identifica o TIPO — já existe no Capture Hub)
      ↓
Document Validator        (qualidade ANTES de extrair — ver §5.1)
      ↓
Exam Type Registry        (resolve o leitor da família do exame)
      ↓
Specific Extractor        (protocolo + terminologia + referência do tipo)
      ↓
Structured Result + Confidence   (resultado próprio do tipo + confiança estrutural — §5.2)
```

Cada **família de exame tem seu próprio extrator**. O laboratorial atual passa a ser **um**
leitor do registro, não o único caminho.

---

## 4. Modelos de resultado por tipo (nomenclatura própria)

O resultado NÃO é sempre "biomarcador". Exemplos (campos = transcrição factual do laudo):

| Tipo | Tipo de resultado | Campos (exemplos) |
|---|---|---|
| **Laboratorial** | Biomarcadores | glicose · HDL · LDL · ferritina (valor, unidade, referência) |
| **Neurofisiológico (EEG)** | Achados | ritmo de base · frequência dominante · assimetrias · descargas epileptiformes · conclusão |
| **Imagem (Ressonância/TC/US)** | Achados radiológicos | localização · estruturas · alterações · impressão diagnóstica |
| **Oftalmológico (Pentacam)** | Parâmetros tomográficos | K1 · K2 · Kmax · espessura mínima · BAD-D · elevação anterior · elevação posterior |
| **Anatomopatológico** | Achados | material · descrição macro/micro · conclusão |
| **Genético/Ômico** | Variantes/marcadores | fluxo próprio (catálogo, versionamento) |
| **Funcional** | Medidas funcionais | ex.: espirometria (VEF1, CVF, VEF1/CVF) |

A UI e o Relatório adaptam a **terminologia** ao tipo (1ª casca já entregue: exames não-lab
deixam de mostrar "biomarcadores" e apontam o laudo).

---

## 5. Semântica de datas (por tipo)

Hoje: "encontre uma data". Deveria ser:
```
1. identifique o TIPO do documento
2. procure o campo "DATA DE REALIZAÇÃO" daquele tipo
3. se houver múltiplas datas, CLASSIFIQUE cada uma:
   realização · assinatura · liberação · coleta · nascimento · protocolo
4. use a de realização (fallback explícito e auditável)
```
Cada tipo documental tem semântica de data diferente — o leitor do tipo sabe qual campo é a
realização e ignora protocolo/nascimento (bug do EEG "2002").

---

## 5.1 Document Validator (estágio antes da extração — fundadora)

Entre o Classifier e o Extractor entra um **Document Validator**, que verifica a QUALIDADE
antes de extrair (evita extrair de material ruim):

- documento completo? · páginas faltando? · orientação correta? · resolução suficiente?
- **datas plausíveis?** · conflito entre páginas? · são múltiplos documentos (não 1 bundle)?

Só depois de validado o extrator específico roda. Melhora muito a qualidade da extração e
alimenta a confiança (§5.2).

**Recoverable × Non-Recoverable** (fundadora): o Validator classifica o defeito.
- **Recoverable** (imagem torta, resolução média, brilho ruim, OCR parcial) → a IA **continua**
  (com confiança rebaixada).
- **Non-Recoverable** (metade da página ausente, PDF corrompido, documento vazio, páginas
  trocadas) → **NÃO extrair** → **solicitar novo documento**. Evita gerar dado de baixa qualidade.

## 5.2 Confiança estrutural (a regra do caso EEG "2002")

O CEF produz não só um resultado, mas um **nível de confiança estrutural** por campo:
`HIGH | MEDIUM | LOW`. **Regra:** um campo de **baixa confiança NÃO substitui automaticamente**
um valor existente — em especial a **data de realização**. Isso teria evitado o EEG virar "2002".
Baixa confiança → mantém o valor anterior e/ou sinaliza para revisão humana (gate).

## 5.3 Desenvolvimento orientado por casos (Gold Standard)

O CEF **nasce a partir de casos reais difíceis**, não de exemplos simples. Ordem:
**reunir os casos difíceis → definir o protocolo de leitura → implementar** (não desenvolver e
depois procurar exemplos). O acervo oficial de regressão está em
`docs/QA/GOLD_STANDARD_CASES.md` (GS-001..GS-009 + casos reais já capturados: EEG e Pentacam =
GS-003/GS-004). Cada leitor do CEF é validado contra o caso GS correspondente.

## 5.4 Metadados de extração + completude RELATIVA AO EXTRATOR (fundadora, 13/07/2026)

Cada extração produz um **bloco de metadados** (não é novo domínio — organiza metadados que
crescerão): `extractor_family` · `extractor_version` · `extraction_completeness` ·
`structural_confidence` · `processed_at` (migration 104).

**Princípio — a completude é relativa ao EXTRATOR, não ao documento.** Evita "FULL" absoluto (nunca
verificável — até um hemograma pode ganhar parâmetros). Estados:
- **`structured`** — tudo o que o extrator suporta HOJE foi estruturado.
- **`partial`** — parte estruturada; o resto está no documento.
- **`document_only`** — nada estruturado com segurança → o documento é a fonte.

O mesmo exame muda de estado conforme o **conhecimento da plataforma** evolui (não o documento):
`Pentacam → document_only/partial (hoje) → structured (extrator oftalmológico v1+)`. Mesma
filosofia do CRC. O `extractor_version` habilita o **reprocessamento automático**: quando um
extrator evolui, os exames processados por versão inferior são candidatos a reprocessar. Hoje o
setter é **heurístico** (cobertura de faixa de referência, type-agnostic); cada extrator
especializado passará a computar completude/confiança **propriamente**.

**UI reage ao ATRIBUTO, não ao tipo** (a interface nada sabe de Pentacam/EEG/hemograma):
`structured` → mostra normal · `partial` → "Resultados estruturados" + nota neutra ("informações
adicionais no documento original") · `document_only` → "Documento disponível para consulta". O
cabeçalho passa de "Biomarcadores extraídos" para **"Resultados estruturados"** (biomarcador é 1 tipo).

**UI-alvo dos extratores (end-state):** **exposição progressiva** — resumo navegável → expandir por
seção/olho/região → documento original sempre acessível. A SINTERA **não reproduz visualmente** o
documento; **estrutura integralmente** a informação preservando a **lógica clínica da modalidade**,
mantendo o documento como **fonte primária de conferência**. Saídas do CEF (§4): **medidas** ·
**achados** · **conclusão documentada** (quando existir — nunca inventada).

**Refinamentos FUTUROS (registrados; NÃO agora — evidência ainda não pede):**
1. **Completude derivada** — no futuro, estudar calcular `extraction_completeness` a partir de
   (extrator atual + resultado atual) em vez de persistir, evitando inconsistência quando um
   extrator evoluir. Otimização futura.
2. **Estado `needs_review`** (4º estado) — extrator estruturou mas NÃO confia (OCR ruim, página
   cortada, conflito entre páginas, datas incompatíveis). Hoje coberto por `structural_confidence`
   → não adicionar agora; deixar registrado.
3. **Fluxo de reprocessamento** — com `extractor_version`, desenhar cedo: novo extrator publicado →
   quais exames em versões anteriores → reprocessar automaticamente ou sugerir. Capacidade poderosa;
   pensar desde já, implementar depois.

## 6. Document Bundle (pertence ao Capture Hub, consumido pelo CEF)

Dois PDFs/imagens podem ser **1 documento com N páginas**, não 2 exames. A captura multipágina
(imagens → 1 PDF) é o **1º passo**, mas o conceito formal é o **Document Bundle** no Capture Hub:
```
Documento (Bundle)
 ├── Página 1
 ├── Página 2
 └── Página N
```
**A extração só ocorre após a montagem do bundle.** Resolve laudos longos, anexos, frente/verso,
gráficos em páginas separadas. Ver CAP-002 §Document Bundle.

---

## 7. O que o Framework define, por categoria

Para CADA tipo de exame, o CEF é a "gramática" da leitura. Define:

1. **Estrutura documental** — como o laudo daquele tipo é organizado.
2. **Protocolo de leitura** — o que ler e em que ordem.
3. **Terminologia** — nomes de resultado próprios (achados, parâmetros, medidas…).
4. **Campos obrigatórios** — o mínimo esperado.
5. **Tipos de resultado** — modelo de dados do resultado.
6. **Validações** — coerência factual (sem juízo clínico).
7. **Referências científicas** — padrões do tipo (via KG v2 / SRL).
8. **Algoritmo de extração** — o extrator específico.
9. **Estratégia de classificação** — como o Content Classifier reconhece o tipo.
10. **Tratamento de múltiplas páginas** — leitura sobre o Bundle.
11. **Resolução de conflitos** — datas/valores/páginas divergentes.

---

## 8. Conexões

- **Content Classifier (CAP-002)** — identifica o tipo; é a porta do Exam Type Registry.
- **KG v2 / Scientific Retrieval Layer** — a base de referência científica por tipo.
- **Capture Hub (CAP-002)** — fornece o Document Bundle; roteia por tipo.
- **Rastreabilidade Documental** — sem dado estruturado, o laudo é a fonte primária.
- **Relatório (REL-001)** — consome o resultado estruturado com a terminologia do tipo.

---

## 9. Sequenciamento (recomendação da fundadora, endossada)

1. **Finalizar o RI-001** (Condições) — NÃO atrasar.
2. **Criar a especificação do CEF** — este documento (feito).
3. **Executar o CEF como a próxima grande iniciativa arquitetural APÓS o HUB-001.**

O CEF será tão estruturante quanto o Capture Hub. **Status atual:** especificação v1.0 (a
congelar após ARG). Implementado até aqui: apenas a 1ª casca (nomenclatura não-laboratorial na
tela de detalhe + reconhecimento de tipos no Content Classifier). O registro de leitores, os
modelos de resultado por tipo, a semântica de datas e o Document Bundle são o corpo do CEF.

## 10. Métricas de maturidade (o sucesso passa a ser medido, não especificado)

A partir daqui, o progresso é medido por indicadores concretos do mecanismo de captura+extração:
- **Tipos documentais suportados** pelo CEF (cobertura).
- **Gold Standard Cases que passam automaticamente** (contra `expected.json`).
- **Taxa de confiança estrutural ALTA**.
- **Redução de correções manuais**.
- **Precisão das datas de realização**.
- **Taxa de documentos corretamente agrupados em bundles**.

**Ciclo Bug → Corpus (permanente):** todo bug real de produção vira caso do CRC + `expected.json`
+ teste de regressão — nunca mais retorna (ver `docs/QA/GOLD_STANDARD_CASES.md` §2.1).

**Painel de qualidade contínua (futuro, na massa crítica — centenas/milhares de casos):**
| Indicador | Ex. |
|---|---|
| Casos no CRC | 412 |
| Especialidades cobertas | 18 |
| Casos passando automaticamente | 96,8% |
| Datas corretamente extraídas | 99,2% |
| Bundles corretamente montados | 98,5% |
| Regressões introduzidas na última versão | 0 |

A partir daí, a evolução deixa de ser guiada por percepção e passa a ser guiada por **evidência mensurável**.

## 11. Encerramento da especificação (fundadora, 12/07/2026)

A fase de especificação está **encerrada**. Capture Hub + CEF + ADL + ARG + RI-001 + Clinical
Reference Corpus + Document Validator formam um conjunto suficiente para orientar a
implementação. **O próximo grande salto NÃO é escrever mais spec** — é fazer o **primeiro
extrator especializado** (provavelmente **neurofisiologia** ou **oftalmologia**) passar
**integralmente GS-003 e GS-004**, provando o CEF na prática. Sequência: **RI-001 → HUB-001 →
1º leitor do CEF validado contra o CRC**.

Ver `docs/CAP-002_CAPTURE_HUB.md`, `docs/GOVERNANCA.md`, `docs/QA/GOLD_STANDARD_CASES.md`, [[modelo_canonico_plataforma]].
