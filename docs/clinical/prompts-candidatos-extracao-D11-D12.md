# Prompt `extraction` — Candidato v-próxima: rótulo de olho (OD/OS) em exames oftalmológicos bilaterais (D-11/D-12)

**Status:** candidato técnico (ENG). **NÃO contém limiar clínico nem juízo diagnóstico.**
Exige assinatura do **Responsável Clínico (RC)** para transitar `draft → in_review → approved → active`
no `prompt_registry` (operation=`extraction`). Ver `docs/clinical/GOVERNANCA-PROCESSO.md`.

> **Isolamento regulatório (protocolo):** este documento **propõe**; **não altera nem ativa** nenhuma
> versão de prompt. A versão de extração hoje ativa permanece intocada até a aprovação do RC. Enquanto
> pendente, os itens D-11/D-12 seguem registrados como **dependência regulatória** — o restante da
> plataforma avança normalmente.

## 1. Problema observado na homologação (D-11 e D-12)

Exames **oftalmológicos de equipamento/imagem bilaterais** foram tratados de forma ambígua na extração:

- **D-12 — CEM-530 "Endothelial cells"** (microscopia especular, bilateral): a extração **funcionou**, mas
  **não distingue Direito/Esquerdo**. A mesma métrica aparece duplicada **sem rótulo de olho** — ex.: AVG
  **308** e **303**; CD **3063** e **3127**. Sem o olho, os dois valores ficam **inequívocos apenas no
  documento**, e no Histórico/Relatório parecem repetição sem sentido.
- **D-11 — OCULUS PENTACAM / topografia de córnea** (2 olhos, datas próprias): nomeado só "Exame (foto)",
  classificado como **"Laboratorial"** (é **imagem**), e sem a data de realização.

O valor clínico dessas medidas **só existe se o olho estiver rotulado**. Rotular o olho é **transcrição
factual** — o laudo **imprime** a coluna por olho (OD/OS, Direito/Esquerdo, "OD"/"OS", "D"/"E") — **não é
interpretação** (RDC 657/2022).

## 2. Proposta (aditiva, sem alteração de schema)

A tabela `biomarkers` **não tem coluna de lateralidade** e **não é necessário criar uma**. A abordagem
mais consistente e menos invasiva é **rotular o olho no próprio `name` do biomarcador, exatamente como o
laudo o apresenta** — espelhando a regra factual **já aplicada** ao classificador de documentos
(`src/lib/ai/document-classifier.ts`, `display_name` "incluindo a região/lateralidade").

Assim, para o CEM-530 a extração produziria, por exemplo:

| name (transcrito, com olho) | value | unit |
|---|---|---|
| Contagem endotelial (OD) | 3063 | células/mm² |
| Contagem endotelial (OS) | 3127 | células/mm² |
| Densidade celular média — CD AVG (OD) | 308 | — |
| Densidade celular média — CD AVG (OS) | 303 | — |

**Efeitos:**
- Nenhuma migração de banco; nenhum novo campo; consumidores atuais (agrupamento por nome no Histórico,
  Relatório, evolução do indicador) passam a distinguir OD/OS **naturalmente**, porque o `name` é a chave.
- Modalidade correta: **não** marcar como "laboratory" (ver §4 — parte factual já aplicada).
- Zero mudança em `CLINICAL_RULESET` / limiares / `clinical_flag`.

## 3. Cláusula proposta para o system_prompt de `extraction` (a inserir; texto a validar pelo RC)

```
Exames OFTALMOLÓGICOS de EQUIPAMENTO/IMAGEM bilaterais (microscopia especular/contagem
endotelial CEM-530, topografia/Pentacam, OCT, biometria, campo visual, aparelhos OCULUS):
quando o laudo apresenta o MESMO parâmetro medido para cada olho (colunas ou blocos
rotulados OD/OS, Direito/Esquerdo, "OD"/"OS", "D"/"E"), TRANSCREVA cada medida como um
resultado SEPARADO e inclua o OLHO no nome, exatamente como impresso — ex.: "Contagem
endotelial (OD)" e "Contagem endotelial (OS)". NUNCA colapse os dois olhos num único
valor nem os deixe sem rótulo. Isto é TRANSCRIÇÃO do que está escrito (o laudo já divide
por olho) — não infira nem interprete (RDC 657/2022). Se o laudo não rotular o olho,
transcreva sem rótulo (não adivinhe a lateralidade).
```

**Nota:** cláusula **factual e possibilística-neutra** — não recalcula, não classifica gravidade, não
diagnostica. Só desambigua o que o documento já separa.

## 4. Complemento NÃO-governado já entregue

A correção de **classificação de modalidade** do D-11 (oftalmológico de equipamento **≠** "laboratorial")
já foi aplicada no **classificador de documentos** (`src/lib/ai/document-classifier.ts`), que **não** é
artefato governado (é prompt SYSTEM de leitura/classificação, sem limiar clínico, sem snapshot no
`prompt_registry`). Essa parte **não depende** desta aprovação. O que depende do RC é **apenas** a
cláusula de **rótulo de olho na extração de biomarcadores** (§3), por rodar sob o prompt de extração
governado.

## 5. Registro de aprovação (a preencher pelo RC)

| Artefato | Versão | content_hash | Aprovado por | Data | Validade até |
|---|---|---|---|---|---|
| Prompt `extraction` — cláusula rótulo de olho (D-11/D-12) | a definir | a registrar na ativação | **pendente RC** | — | — |

**Fluxo:** ENG mantém este candidato em `draft`. RC revisa a cláusula (§3) → `in_review` → assina
(`approved_by` + `approved_at`) → ENG ativa a nova versão no `prompt_registry` (o índice único garante 1
ativa por operação; `content_hash` novo é registrado). Só então D-12 sai da lista de dependências.
