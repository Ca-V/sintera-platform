# VISÃO — SINTERA como Sistema Cognitivo Clínico (longo prazo)

> **NÃO é documento constitucional. NÃO é frente de implementação atual.** É o **norte de longo
> prazo** — construído por **evidência/execução**, respeitando o freeze e o Princípio da Evidência
> Arquitetural. Autoria: fundadora + revisão cruzada (13/07/2026). Só vira arquitetura/execução
> quando a fundação (RI-001 → HUB-001 → extratores do CEF) amadurecer e a evidência pedir.

## Reformulação do objetivo
O objetivo **não** é "a SINTERA ter um ChatGPT". É a SINTERA ser um **Sistema Cognitivo Clínico**
(tendendo a um **Sistema Operacional Cognitivo para Saúde**). **O LLM é a interface de linguagem,
não o cérebro.**

## Paradigma
- **Comum:** Usuário → pergunta → LLM responde.
- **SINTERA:** Documentos · Wearables · Exames · Ômicas · Medicamentos · Hábitos · Sintomas ·
  Histórico · Literatura → **Knowledge Graph → Motor Cognitivo → Especialistas de IA → Resposta**.

## As 5 camadas da inteligência
1. **Conhecimento** — KG · linha do tempo · proveniência · relações clínicas (memória permanente). *(existe parcial)*
2. **Evidências** — Capture Hub · CEF · UCDA · CRC (documento → conhecimento estruturado). *(em construção)*
3. **Científica** — Scientific Retrieval Layer: "o que a ciência sabe?". *(existe)*
4. **Cognitiva** — "o que tudo isso significa para ESTE paciente?" — **organiza, contextualiza e
   fundamenta**; **NÃO diagnostica nem interpreta clinicamente** (RDC 657). *(futura)*
5. **Conversacional** — o LLM. Conversa, mas **nunca responde sozinho**: consulta KG · SRL · UCDA ·
   histórico do paciente · documentos originais · proveniência. *(futura)*

## O diferencial vs. um chatbot
O ChatGPT pensa a partir do **contexto da conversa**; a SINTERA pensa a partir do **histórico
longitudinal da pessoa**. Ex. — "minha ferritina caiu" → resposta **factual e rastreável**: caiu 28%
vs. o exame anterior · acompanha a melhora do PCR · ocorreu após o medicamento X · há 3 estudos
relevantes (SRL) · documentos utilizados: estes · confiança da análise: alta · partes inferenciais
claramente separadas dos fatos. **Tudo factual/temporal + rastreável — não interpretação clínica.**

## Aprendizado GOVERNADO (não autônomo invisível)
Em saúde, a IA **não** altera seu comportamento sozinha em produção. A "autonomia" da SINTERA é o
**conhecimento da plataforma evoluindo de forma governada** — o mesmo ciclo do CRC:
```
caso novo → resultado observado → avaliação → corpus → nova versão do extrator → testes → validação → produção
```
Aprende continuamente, mas **auditável — nunca invisível**.
- **Pode evoluir sozinho** (baixo risco): classificação documental · OCR · organização · layout ·
  identificação de campos · sugestão de categorias · ranking de literatura · recuperação de contexto.
- **NÃO deve evoluir sozinho** (só por **versões auditáveis**): lógica clínica · regras de inferência
  · protocolos · interpretações · critérios diagnósticos.

## Princípio (futuro)
> **A inteligência da SINTERA é composta por múltiplos motores especializados, coordenados por uma
> camada cognitiva. Nenhum modelo de IA, isoladamente, constitui a inteligência da plataforma.**

Isso evita dependência de um único fornecedor/LLM/tecnologia: troca-se o modelo conversacional,
incorpora-se nova visão computacional ou nova recuperação científica **sem alterar a essência**.

## Coerência com o já construído
Capture Hub **alimenta** · CEF **estrutura** · UCDA **representa** · KG **conecta** a história · SRL
traz a **ciência** · a Camada Cognitiva **integra** e produz análise fundamentada · o LLM **conversa**
(explica, contextualiza, guia). É **resiliente** — não depende de um modelo específico — e mantém
governança, rastreabilidade e segurança (os princípios desde o início).

**Nota do revisor (Claude):** esta visão é a **generalização** do que vocês já fazem — o
"aprendizado autônomo" seguro **é** o aprendizado governado (CRC + versões + gates); a Camada
Cognitiva é factual/rastreável por design (RDC 657), o que a torna um **diferencial de confiança**,
não uma limitação. Ver `docs/UCDA-001…`, `docs/CEF-001…`, `docs/CAP-002…`, `docs/GOVERNANCA.md`.
