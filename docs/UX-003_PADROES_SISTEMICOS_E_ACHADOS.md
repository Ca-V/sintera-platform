# UX-003 — Padrões sistêmicos (vinculantes) + achados da homologação

> Origem: homologação da fundadora (06/08). Muitos "erros" são **a mesma família**, repetida em várias páginas.
> Este doc registra **3 padrões sistêmicos** que passam a valer em **TODA a plataforma (Web+Mobile)** — para não
> precisar reportar página por página — e mapeia os achados específicos a eles. Aplicados na **evolução funcional**
> dos módulos (ADR‑021). Complementa UX‑002 · MOBILE‑037 (D‑14/D‑16/D‑19).

## Padrões sistêmicos (aplicar em CADA módulo, sem exceção)

### PS‑1 — Seletor universal (picker) para qualquer campo com opções — [D‑16/D‑19]
Todo campo que ofereça **mais de uma opção** usa o **seletor rolável** (toca → rola → escolhe), **nunca** uma lista
aberta na tela. Vale para **filtros** (status do exame, data/período) **e** para **campos de formulário** (forma
farmacêutica, dia, lembrete, recompra, tipo, frequência, laboratório, médico, categoria, recorrência…). Componente
único do DS: `Select` (Mobile bottom‑sheet / Web dropdown), com busca quando a lista for grande.

### PS‑2 — Protocolo único de entrada (todo "Adicionar") — [D‑14]
Todo **"Adicionar"** abre o **mesmo hub de captura**, com as mesmas opções da Web, **antes** de qualquer formulário:
**selecionar arquivo (PDF/foto) · tirar foto · digitar manualmente · falar (voz)**. **Proibido** ir direto para os
campos de digitação manual (como está hoje em vários módulos do Mobile). Vale para exames, medicamentos, suplementos,
eventos, composição, documentos — qualquer módulo.

### PS‑3 — Nomenclatura / copy / taxonomia idênticas Web↔Mobile
Rótulos de botão, **frases (copy)**, opções e taxonomia **iguais** nas duas plataformas. Fonte da verdade = a Web
(referência), com a lógica/labels no núcleo compartilhado quando possível (SSOT). Nada de "Adicionar" numa ponta e
"Novo X" na outra; nada de frase de estado diferente entre as plataformas.

## Achados específicos desta rodada (todos são instâncias dos padrões acima)

| ID | Módulo · plataforma | Achado | Padrão |
|---|---|---|---|
| H‑1 | **Exames (Mobile)** | Filtros de **status** e **data** aparecem como cards/opções **expostos** no topo (parede) | **PS‑1** — status e data viram seletor rolável |
| H‑2 | **Adicionar exame (Web×Mobile)** | Opções e nomes divergem: Mobile "escolher documento / usar câmera"; Web "selecionar arquivo PDF ou foto / tirar foto" | **PS‑2 + PS‑3** — mesmas opções e nomes do protocolo único |
| H‑3 | **Pedidos de exame (Mobile)** | Mobile **não tem** a aba/seção de **Pedidos de exame** (Web tem) — não é possível inserir pedidos | **Paridade** — adicionar Pedidos ao Mobile |
| H‑4 | **Agenda (Web×Mobile)** | Botão: Web **"Adicionar"** × Mobile **"Novo evento"**; a **frase de Pendências** difere entre as plataformas | **PS‑3** — mesmo rótulo e mesma copy |
| H‑5 | **Medicamentos (Mobile)** | Botão **"Adicionar"** (Web = **"Novo medicamento"**); ao adicionar, **opções expostas** (forma/dia/lembrete/recompra) em vez de seletor; e o "Adicionar" vai **direto para digitação manual** | **PS‑1 + PS‑2 + PS‑3** |

> A fundadora seguirá informando mais achados; todos entram nesta lista e nos padrões acima, para correção no ciclo
> da evolução funcional (módulo a módulo: Agenda → Exames → Minha Saúde…), reusando `Select` (existe) e o novo
> componente de captura (protocolo único). Sem builds soltas — um ciclo, uma build.
