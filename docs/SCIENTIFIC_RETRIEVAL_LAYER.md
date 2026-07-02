# SINTERA — Scientific Retrieval Layer (SRL) — Atualização Científica v1.2

**Status:** decisão nova registrada via **ADR-016** (fundadora, 02/07/2026). Origem: `SINTERA_Especificacao_Arquitetura_Plano_Maturidade_v1.2_Atualizacao_Cientifica.docx`.
**Governança:** registrado durante o período de estabilização por ser **decisão realmente nova** (exceção prevista no congelamento). **Planejado — NÃO implementar agora.** Entra no roadmap **após o Scientific Catalog v2**.
**Princípio:** Governança Científica — organiza/recupera/contextualiza conhecimento; **não interpreta, não diagnostica, não recomenda** (RDC 657).

---

## 1. Nova camada arquitetural — Scientific Retrieval Layer
Componente **independente** do Knowledge Layer e do Knowledge Graph (ADR-016). Responsável por:
- Recuperar **literatura científica**.
- Recuperar **diretrizes e protocolos** publicados.
- **Indexar** referências científicas.
- Fornecer **conhecimento estruturado** ao Knowledge Layer.
- Camada **exclusivamente informacional**: não interpreta exames, não diagnostica, não recomenda tratamento.

## 2. Separação Dados Clínicos × Conhecimento Científico
- Separação **absoluta** entre dados clínicos do paciente e conhecimento científico.
- Conhecimento científico **não** é persistido como dado clínico. (Reforça os Bounded Contexts: **Clinical Data** ≠ **Knowledge/SRL**.)

## 3. Papel da IA (atualizado)
Organizar dados · estruturar informações · recuperar conhecimento científico · contextualizar informações. **Proibido** diagnosticar, recomendar tratamento ou substituir julgamento profissional.

## 4. Transparência Científica
Sempre apresentar, quando disponível: **título, autores, periódico, ano, DOI/PMID, organização responsável e versão da diretriz**.

## 5. Busca Científica Semântica
Mecanismo de busca semântica para artigos, diretrizes, protocolos e consensos — retorna **documentos e referências** (não conclusões).

## 6. Scientific Summaries
Módulo para **resumir** artigos/diretrizes/protocolos **preservando as referências** e **identificando o conteúdo como síntese automatizada**.

## 7. Evolução do Knowledge Layer
Curadoria científica · versionamento de diretrizes · indexação de protocolos · integração com a SRL.

## 8. Evolução do Knowledge Graph
Relacionar biomarcadores · eventos · medicamentos · suplementos · dispositivos · diretrizes · protocolos · artigos · revisões sistemáticas · organizações científicas.

## 9. Navegação Contextual
"Documentos relacionados" · "Diretrizes relacionadas" · "Protocolos relacionados" · "Biomarcadores relacionados" · "Artigos relacionados".

## 10. Novo Princípio de Governança (Científica)
- Toda informação científica deve ser **verificável e rastreável à fonte original**.
- A plataforma **organiza e contextualiza** conhecimento, **sem produzir interpretação clínica**.

## 11. Roadmap (ajustado — refinamento fundadora 02/07)
Entregas da SRL: índice científico · busca semântica · recuperação de literatura/diretrizes/protocolos · resumos científicos · **referências rastreáveis**.
**Ordem de implementação (build):** `Catalog v2 → Knowledge Layer v2 → Knowledge Graph v2 → Scientific Retrieval → IA Contextual`. (A SRL depende do catálogo **e** do modelo de conhecimento consolidado — por isso vem após KL v2/KG v2.)

## 12. Refinamentos de governança (v1.2 — aprovados 02/07/2026)
1. **Capacidade transversal, não "mais um módulo".** A SRL é a **porta de entrada do conhecimento externo** da plataforma. **Fluxo de responsabilidade (runtime):** `Scientific Retrieval Layer → Knowledge Layer (organiza) → Knowledge Graph (relaciona) → IA (utiliza)`. (Distinto da ordem de *build* acima.)
2. **Princípio da Proveniência Científica** (futuro `ADR-017`): toda informação científica na plataforma tem **origem rastreável**; nenhuma existe sem indicar **origem · versão · data · organização responsável · identificador da fonte (quando disponível)**.
3. **SRL é OPCIONAL e DESACOPLADA — nunca dependência.** A SINTERA funciona plenamente mesmo que nenhuma API científica esteja disponível ou nenhuma busca externa ocorra. A SRL **enriquece**; jamais é obrigatória para o funcionamento.
4. **Conceito "Fonte de Conhecimento"** (novo, no domínio): diretriz · artigo · consenso · revisão sistemática · protocolo · documento técnico · base governamental · sociedade científica. (Amplia "literatura".)
5. **Scientific Summary** sempre identificado como **síntese automatizada** e apresentando as fontes: rotular "Resumo automatizado baseado nas fontes abaixo"; **nunca** parecer texto autoral.
6. **Busca Semântica RECUPERA, não RESPONDE:** `Pergunta → Recuperação → Documentos → Contexto → Referências`. **Nunca** `Pergunta → Resposta clínica`.
7. **Estabilização mantida:** nenhuma implementação agora — só homologação/QA/correções/testes.

---
**Sequência geral (inalterada pela estabilização):** homologação (cutover/cadastro/Sprint UX) → Catalog v2 → **Knowledge Layer v2 → Knowledge Graph v2 → Scientific Retrieval Layer** → IA Contextual. Nada aqui se implementa antes do Catalog v2.
