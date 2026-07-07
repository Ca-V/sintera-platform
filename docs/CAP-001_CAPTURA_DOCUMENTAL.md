# CAP-001 — Padronização da Captura Documental (Camada de Captura)

**Status:** Especificação aprovada pela fundadora (2026-07-07). Iniciativa própria —
**não** faz parte da REL-001. Implementação em branch dedicada, após o merge da REL-001.
**Herda:** [[UX-001]] (§1.10 e §10, emendados nesta data), [[DS-001]].

---

## 0. Problema

Hoje coexistem **dois modelos mentais** de entrada de documento que deveriam convergir:
1. **Centro de Captura (Home)** — ponto único que classifica e roteia um documento.
2. **Entrada por módulo** — cada módulo tem seus próprios botões, com **cobertura desigual**
   de meios de entrada. O sintoma relatado: em Medicamentos, "Escanear documento" abre
   **apenas a câmera** (não aceita PDF/arquivo existente).

O objetivo é um **fluxo único e previsível** de captura em toda a plataforma: o usuário
aprende uma vez e reencontra o mesmo padrão em qualquer módulo.

## 1. Estado atual (mapeado no código — fatos)

| Área | Meios de entrada hoje | Arquivo:linha |
|---|---|---|
| **Centro de Captura** | 4 tipos: Exame · **Receita de medicamento** · Receita de óculos · Exame ômico | `src/lib/capture/registry.ts:15-20`, `intake/CaptureCenter.tsx:172` |
| **Exames** | ✅ arquivo (PDF/JPG/PNG) + ✅ drag-and-drop + ✅ foto (câmera) — *referência* | `src/app/dashboard/exams/page.tsx:272,278,302` |
| **Medicamentos** | ✅ manual + 📷 foto **(image/\*, `capture=environment` → só câmera no mobile, sem PDF)** + 🎤 voz | `src/app/dashboard/medicamentos/page.tsx:479-487` |
| **Recursos de Saúde** | ✅ manual + 📷 foto (image/\*, IA de grau) + 🎤 voz — **sem PDF/arquivo/drag** | `src/app/dashboard/recursos/page.tsx:335-336` |
| **Componente único de upload** | ❌ inexistente — cada módulo repete seu `<input type=file>` | — |
| **Voz (reutilizável)** | ✅ `VoiceInput` compartilhado | `src/components/VoiceInput.tsx` |
| **Centro reutilizável** | ✅ `DocumentIntakeHub`/`CaptureCenter` (drag+preview+classificação+rota) | `src/lib/capture/intake/CaptureCenter.tsx` |

## 1.1 Fase 0 — Auditoria arquitetural (concluída · causa raiz confirmada)

Auditoria instrumentada dos fluxos de captura (não suposição). Respostas:

**(a) Uma ou duas implementações do Centro de Captura?** — **Um** componente de captura:
`src/lib/capture/intake/CaptureCenter.tsx`. O antigo `DocumentIntakeHub.tsx` foi **deletado**
(substituído — commit cf53884). **Porém há DUAS Homes** atrás do flag `NEXT_PUBLIC_DASHBOARD_V2`
(`dashboard/page.tsx:56`): **V1 legado** (`dashboard/page.tsx`) fia o CaptureCenter no modal
"Adicionar documento" (`:337`); **V2** (`DashboardNew` → `DashboardPriority`) tem um botão
"Adicionar documento" **sem `onClick`** (`DashboardPriority.tsx:112`) — botão morto.

**(b) Quais módulos usam o mesmo componente?** — Apenas a Home V1 (modal) usa o CaptureCenter.
**Nenhuma página de módulo o reutiliza.**

**(c) Quais têm implementação própria?** — Exames, Medicamentos, Recursos, Ômica, Medidas,
Agenda: cada um com seu `<input type=file>` inline.

**(d) O que cada fluxo oferece?** — ver tabela §1. CaptureCenter: arquivo+drag+câmera, aceita
PDF/JPG/PNG, mas **não** oferece manual/voz. Módulos: manual+câmera+voz; Medicamentos/Recursos
**sem PDF/arquivo/drag**.

### ✅ Causa raiz do relato "só 3 opções, sem medicamento" (CONFIRMADA)
`CaptureCenter.tsx:56` → `validKinds = file ? processorsAccepting(file.type) : CAPTURE_PROCESSORS`:
as opções de tipo são **filtradas pelo MIME do arquivo**. E `processors/medication.ts:12` →
`accepts: ['image/jpeg','image/png']` — **não inclui `application/pdf`** (exam/eyeglass/omics
incluem). Logo, ao enviar um **PDF**, a lista mostra só `[Exame, Receita de óculos, Exame ômico]`
— medicamento **filtrado**. Receita de medicamento é quase sempre PDF → o usuário não consegue
classificá-la. **Não** é build defasado nem duas UIs de captura: é **defeito de dados** (`accepts`)
+ **decisão de UX** (esconder destino por MIME).

### Divergências a eliminar
1. `medication.accepts` sem `application/pdf` → causa do relato. (Trivial, mas é implementação CAP-001.)
2. **Duas Homes**; a V2 (`DashboardPriority`) tem "Adicionar documento"/"Exame"/"Medicamento" sem `onClick`. Decidir Home canônica e remover/fiar a morta.
3. Filtro silencioso por MIME esconde destinos — preferir mostrar todos e validar no envio.
4. Sem componente único — unificar módulos + Home no `<DocumentCapture>`.

## 2. Estado-alvo

### 2.1 Centro de Captura — lista de tipos e roteamento

| Tipo do documento | Rótulo | Destino |
|---|---|---|
| Exame | Exame | Exames (`/dashboard/exams`) |
| Exame ômico | Exame ômico | Exames Ômicos (`/dashboard/omics`) |
| Receita de medicamento/suplemento | Receita de medicamento ou suplemento | Medicamentos e Suplementos (`/dashboard/medicamentos`) |
| Receita de recurso de saúde | Receita de recurso de saúde (óculos, lentes, próteses, órteses, dispositivos…) | Recursos de Saúde (`/dashboard/recursos`) |
| Outro | Outro documento de saúde | Caixa de revisão / classificação manual |

Mudanças vs. hoje: **ampliar** "Receita de óculos" → "Receita de recurso de saúde"
(coerente com os sub-tipos do Anexo A do UX-001) e **acrescentar** "Outro documento de
saúde" (catch-all com revisão manual). Os demais já existem.

### 2.2 Padrão único de meios de entrada (todo módulo que aceita documento)

Os **meios oficiais**, sempre os mesmos, na mesma ordem:

1. **Digitar manualmente** — formulário.
2. **Tirar foto** — câmera (`capture=environment`).
3. **Enviar ou arrastar arquivo** — file picker + drag-and-drop; aceita **PDF, JPG, PNG, HEIC**.
4. **Importar do Centro de Captura** — quando aplicável.
5. **Falar** — captura por voz (`VoiceInput`).

Nenhum módulo oferece apenas um subconjunto sem justificativa técnica registrada.
O envio de arquivo **não pode** existir só no Centro de Captura.

### 2.3 Componente compartilhado

Extrair um **`<DocumentCapture>`** reutilizável (evolução do `DocumentIntakeHub`): cada
módulo **declara** `accepts` (MIME) + o processador de destino; o componente entrega os
meios 2–5 de forma idêntica. Exames é a implementação de referência (já tem 3, 4).
Elimina os `<input type=file>` duplicados por módulo.

## 3. Auditoria de conformidade e lacunas

| Módulo | Manual | Foto | Arquivo+Drag (PDF) | Centro de Captura | Voz | Lacuna a corrigir |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Exames | ✅ | ✅ | ✅ | ➖ | ❌ | (opcional) voz |
| Medicamentos | ✅ | ✅ | ❌ | ➖ | ✅ | **arquivo/PDF + drag; separar "foto" de "enviar arquivo"** |
| Recursos de Saúde | ✅ | ✅ | ❌ | ➖ | ✅ | **arquivo/PDF + drag** |
| Exames Ômicos | ✅ | ✅ | parcial | ➖ | — | alinhar ao padrão |
| Medidas / Agenda | — | ✅ | parcial | ➖ | — | alinhar ao padrão |

Prioridade do relato: **Medicamentos** (arquivo/PDF+drag) e **Centro de Captura**
(ampliar tipos). Depois, propagar o `<DocumentCapture>` aos demais.

## 4. Não-metas / conformidade

- **RDC 657/2022:** captura organiza documentos; não interpreta nem diagnostica.
- "Voz" reusa o `VoiceInput` existente — não é um novo motor de IA.
- Nenhum link de documento fictício; proveniência ([[REL-001]]/`@/lib/provenance`) consome
  o arquivo por referência quando armazenado.

## 5. Princípio permanente (emendado no UX-001)

> **Todo módulo que aceite documentos oferece os mesmos meios de entrada: digitar
> manualmente · tirar foto · enviar/arrastar arquivo · importar do Centro de Captura ·
> falar.** O Centro de Captura é canal **adicional**, nunca o único local de envio de
> arquivo. O usuário não reaprende a inserir informação a cada tela. (UX-001 §1.10 e §10.)
