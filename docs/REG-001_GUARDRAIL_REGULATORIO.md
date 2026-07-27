# REG-001 — Guardrail regulatório (linguagem factual · não-SaMD)

> **Princípio-guardrail (fundadora, 2026-07-27) — governa TODO documento, copy, alerta e descrição da plataforma:**
>
> **A SINTERA organiza, integra e contextualiza informações provenientes de diferentes fontes para apoiar a
> continuidade do cuidado e a tomada de decisão por pessoas e profissionais autorizados. Ela NÃO realiza
> diagnóstico, NÃO substitui avaliação clínica e NÃO produz recomendações terapêuticas.**
>
> Ancora em [ADR-000](ADR-000_PRINCIPIOS_ARQUITETURAIS.md) (não-SaMD · human-in-the-loop · não produz conteúdo
> clínico) · RDC 657/2022 · [CARE-001](CARE-001_ESPACO_COLABORATIVO.md) (o profissional é quem interpreta).

## 1. Escopo

Vale para **tudo** que a plataforma exibe ou documenta: docs de arquitetura, copy de UI, textos da Sidebar,
mensagens de alerta/notificação, roteiro do vídeo, onboarding. Ao **ampliar** o produto (Jornada, Rede,
Rotinas, Wearables, IA), o guardrail impede que o enriquecimento extrapole o posicionamento regulatório.

## 2. Verbos e frases — PROIBIDO → SEGURO

| ❌ Proibido (induz diagnóstico/conduta) | ✅ Seguro (compatível com a arquitetura) |
|---|---|
| interpretar exame · sugerir diagnóstico · detectar doença | organizar · registrar · transcrever · apresentar |
| risco clínico · provável condição · justificar alteração | correlacionar dados · conectar sinais · destacar informações |
| recomendar tratamento · orientar conduta · "considere antecipar avaliação" | priorizar atenção · lembrar · contextualizar |
| "houve melhora/piora" · "controle inadequado" | mostrar a série no tempo (o profissional analisa) |
| a IA "interpreta"/"avalia" clinicamente | a IA **identifica relações · organiza · prioriza · conecta** |

**Ação, não conselho:** onde caberia um conselho clínico, a plataforma oferece uma **ação real** — *registrar*,
*compartilhar com a Rede de Cuidado*, *agendar* — deixando a decisão com a pessoa e o profissional.

## 3. Regras invariantes

1. **Nada de diagnóstico, prognóstico ou conduta** gerado pela plataforma.
2. **O documento original é a fonte da verdade**; a estrutura organiza, não substitui (Rastreabilidade Documental).
3. **Séries e correlações são visualizações estruturais** (valores no tempo), nunca afirmações clínicas.
4. **Human-in-the-loop:** quem interpreta é a pessoa e/ou o profissional autorizado (CARE-001).
5. **Origem e autoria sempre citadas** em conteúdo de referência (ex.: calendário vacinal = fonte pública, não recomendação da SINTERA).

## 4. Como aplicar

- Todo doc da visão expandida **referencia REG-001** e usa a coluna "Seguro" da §2.
- **Checklist de revisão** (Prioridade 10): varrer os docs por qualquer termo da coluna "Proibido" e substituir.
- Em caso de dúvida: se a frase **decide algo clínico pela pessoa**, é proibida; se **organiza/apresenta o fato
  para a pessoa decidir**, é permitida.

## 5. Verbos OFICIAIS da IA (lista fechada)

A IA da SINTERA descreve-se **apenas** com estes verbos. Qualquer verbo fora desta lista **precisa de
justificativa explícita** (e provavelmente indica violação da fronteira):

1. **Organizar** informações.
2. **Contextualizar** informações.
3. **Correlacionar** informações.
4. **Priorizar** informações para atenção.
5. **Lembrar** eventos, rotinas e acompanhamentos.
6. **Facilitar o compartilhamento** com a Rede de Cuidado.

> **Proibidos sem exceção:** interpretar · avaliar (clinicamente) · diagnosticar · prever/predizer risco ·
> recomendar conduta · concluir. "Conectar/destacar" são aceitos como sinônimos de organizar/correlacionar.

## 6. Status normativo

**REG-001 é documento NORMATIVO e obrigatório.** Todo novo artefato (doc, copy, alerta) **deve** observá-lo, e
toda revisão verifica a conformidade. A auditoria de linguagem (§4) roda a cada lote de docs novos.

## 7. Seção de Conformidade (padrão — incluir em todo documento)

Todo documento passa a trazer, ao final, a linha:

> **Conformidade:** ✔ REG-001 · ✔ LGPD · ✔ ADR-001 · ✔ RDC 657 *(+ outros princípios aplicáveis)*

Marca rapidamente, em qualquer revisão futura, quais princípios aquele documento já observa.

---
**Conformidade:** ✔ REG-001 (este) · ✔ LGPD · ✔ ADR-001 · ✔ RDC 657 · ✔ ADR-000

*Relaciona: ADR-000 · RDC 657 · CARE-001/002 · JOR-001 · ROT-001 · VID-001 · MUL-001 · WEA-002 · MOD-001 · MAP-001 · SID-001.*
