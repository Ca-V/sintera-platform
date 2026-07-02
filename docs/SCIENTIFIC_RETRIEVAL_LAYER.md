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

## 11. Roadmap
Inserir a fase **"Scientific Retrieval" entre o Scientific Catalog v2 e a IA avançada**. Entregas: índice científico · busca semântica · recuperação de literatura/diretrizes/protocolos · resumos científicos · **referências rastreáveis**.

---
**Sequência (inalterada pela estabilização):** homologação (cutover/cadastro/Sprint UX) → Catalog v2 (Domain Model→Spec→Migration→impl) → **Scientific Retrieval Layer** → IA avançada. Nada aqui se implementa antes do Catalog v2.
