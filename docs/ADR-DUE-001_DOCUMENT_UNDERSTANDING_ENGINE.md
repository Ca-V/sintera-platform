# ADR-DUE-001 — Document Understanding Engine (DUE)

**Status:** em implementação (Fase 1 — caminho de IMAGEM). Origem: homologação Web 13/08 (fundadora).
**Contexto:** a ingestão de documentos estava fragmentada — parsers separados de OCR, título, data, paciente,
modalidade, laboratório e um leitor multimodal, cada um decidindo por conta própria. Para **imagem** (sem OCR),
os parsers de TEXTO falhavam juntos → um único ponto produzia 3+ sintomas (modalidade errada · nome errado ·
data ausente · extração indevida).

## Decisão

Introduzir um componente ÚNICO de **compreensão do documento** que recebe QUALQUER documento (PDF pesquisável ·
PDF escaneado · JPG/PNG · foto de celular · export de equipamento) e devolve **sempre a mesma estrutura** ANTES de
qualquer extração clínica:

```
Documento → [Document Understanding Engine] → Metadata → [Clinical Extraction Engine] → Representation → Persistence → Rendering
```

**Contrato (`DocumentUnderstanding`):** `documentType · originalTitle · examName · device · examCategory ·
examModality · examDate · patientName · issuer · physician · confidence · structuredPossible · documentLanguage`.
Componente: `src/lib/capture/document-understanding.ts`.

## Regras PERMANENTES (travadas em teste)

1. **EQUIPAMENTO ≠ EXAME.** Um mesmo aparelho (ex.: OCULUS Pentacam) faz protocolos diferentes. O equipamento vai
   em `device` e **nunca** é usado como nome do exame.
2. **Nome do exame = Base de Conhecimento (taxonomia), não heurística/IA-livre.** `EXAM_KNOWLEDGE_BASE` mapeia
   equipamento → nome canônico + especialidade + confiança. Conservador: protocolo não claro → nome GENÉRICO +
   confiança menor (ex.: Pentacam → "Exame do segmento anterior (Pentacam)", confiança média), nunca assumir um
   procedimento específico. **É artefato governado** (revisão clínica + expansão; ver backlog C6).
3. **Identidade documental (display), nesta ordem:** nome canônico (KB) → nome explícito no documento → modalidade
   → "Exame de <categoria>". **Nunca** o equipamento nem uma linha interna do laudo. Guardar também `originalTitle`
   (verbatim) para auditoria e `confidence`.
4. **`structuredPossible` por modalidade (determinístico):** imagem/oftalmologia → document_only; laboratorial/
   demais → estruturável. Alimenta o Clinical Extraction Engine (biomarcadores × document_only).
5. **Regra de engenharia:** quando UM componente produz 3+ sintomas, suspende-se a correção de interface e
   resolve-se o COMPONENTE (não as telas).

## Escopo / faseamento

- **Fase 1 (esta):** caminho de IMAGEM roteado pelo DUE (`understandImageDocument`) como fonte autoritativa de
  modalidade + identidade + data + paciente + emissor + solicitante. Caminho de texto/PDF permanece nos parsers
  atuais (que funcionam) e passa a **popular o mesmo contrato** em fase seguinte.
- **Fase 2:** migrar o caminho texto/PDF para produzir `DocumentUnderstanding` (adapter sobre OCR + parsers), e
  persistir `device` / `originalTitle` / `confidence` em colunas próprias (migração aditiva).
- **Base de Conhecimento (C6):** expandir/curar sob revisão clínica; conecta ao "O que é este exame?".

## Consequências

Uma classe inteira de documentos de imagem (oftalmologia, ultrassom, tomografia, ressonância, mamografia,
densitometria, eco…) passa a ser compreendida por um único componente — reduz reaparecimento do mesmo defeito em
outras modalidades e separa claramente **compreender o documento** (fato, RDC-657) de **interpretar o resultado**
(fora de escopo).
