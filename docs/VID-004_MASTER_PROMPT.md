# VID-004 — Master Prompt (base fixa de todos os prompts de cena)

> Regras **fixas** derivadas da [Direção de Arte (VID-000)](VID-000_DIRECAO_DE_ARTE.md). **Cada prompt de cena =
> Master Prompt + complemento específico** (só o que acontece na cena). Evita repetir instruções e garante
> consistência entre todas as cenas geradas (Veo/Runway/Kling).

## Master Prompt (colar no INÍCIO de toda geração)

```
[SINTERA — MASTER PROMPT]
Vídeo institucional premium de saúde, humano e esperançoso.
ESTÉTICA: minimalista; muito espaço em branco; luz natural suave de manhã (high-key, claro).
PALETA: neutros claros e quentes (quase branco) com UM único acento aqua-turquesa (#579DA8);
tints claros levemente esverdeados. Nada de escuros pesados.
CÂMERA: lenta; movimentos suaves (push/pan sutil); profundidade de campo rasa; bokeh macio.
FORMA: linhas finas e consistentes; cantos suaves; poucos elementos; muito ar.
DADOS: representados como luz/partículas suaves; gesto-assinatura = convergência elegante para um núcleo.
TOM: calmo, humano, confiável. Referência: Apple Health × Stripe × Notion.
FORMATO: 16:9, cinematográfico, 4K.

PROIBIÇÕES (nunca gerar):
- texto ilegível ou telas fictícias/incoerentes;
- símbolos médicos exagerados (cruzes, ECG dramático, jalecos clichê);
- resultado clínico "interpretado", diagnóstico, alerta de risco, laudo com juízo (REG-001/RDC 657);
- cores fora da paleta; câmera trêmula; cortes bruscos; bounce;
- estética corporativa genérica ou stock clichê.
```

## Como usar
- **Cena =** `[MASTER PROMPT]` + 1–3 frases do que acontece (ver os complementos por ato no [VID-002 §1](VID-002_KIT_DE_PRODUCAO.md) / [VID-003 Fase 3](VID-003_PASSO_A_PASSO.md)).
- **Consistência:** mantenha o Master Prompt **idêntico** em todas as cenas; varie só o complemento.
- **EN (opcional):** se a ferramenta responder melhor em inglês, traduza o bloco mantendo os mesmos termos e proibições.
- **Por tipo de cena:** humanas → Flow/Kling · animações/transições → Runway · grafismos → Jitter · **UI → Figma (telas reais/mockups do DS, não IA)**.

---
**Conformidade:** ✔ REG-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: VID-000 (direção de arte) · VID-001/002/003 · REG-001 (proibições/fronteira).*
