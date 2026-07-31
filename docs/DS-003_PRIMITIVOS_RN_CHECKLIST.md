# DS-003 — Primitivos RN: gate de promoção + registro de uso

> Complementa (não altera) o [DS-002 congelado](./DS-002_FREEZE.md). O DS-002 fixa a **identidade e a
> arquitetura** (recipes headless + adaptadores); este doc governa a **promoção de novos primitivos RN** e
> registra o uso. A evolução do DS é motivada pelo produto: uma tela revela a lacuna → o **DS evolui antes**
> ([[principio_ds_promovido_antes_da_aplicacao]]).

## Checklist de novo componente (gate — fundadora, 2026‑07‑27)

Um componente só entra no DS quando responde **sim** a todos:

- [ ] **Existe recipe?** (função headless `recipe(theme,props)→VisualSpec`, 100% derivada dos papéis do tema)
- [ ] **Existe primitivo RN?** (adaptador fino que consome a recipe; sem cor/tamanho hardcoded)
- [ ] **Existe teste de contrato?** (recipe: derivação do tema + acessibilidade; primitivo: consome a recipe)
- [ ] **Existe documentação de uso?** (doc‑comment com exemplo + registro abaixo)
- [ ] **Não contém regra de negócio?** (sem validação/máscara/API/DTO/domínio — infra pura)
- [ ] **É reutilizável fora do incremento atual?** (serve outros formulários/telas)

> Princípio de fronteira: quanto mais "burro" o componente, maior a reutilização. Ele orquestra papéis e
> estados visuais; **a tela** injeta dados, validação e comportamento.

## Registro de primitivos RN

| Primitivo | Recipe | Papel | Desde |
|---|---|---|---|
| `Box` | — (adaptador de caixa) | Superfície/estrutura | Inc 1 |
| `Text` | `text`/`heading` | Texto por papel tipográfico | Inc 1 |
| `Button` | `button` | Ação (gradiente de ação; estado loading) | Inc 1 |
| `Input` | `input` | Campo de texto (caixa/foco/erro) | Inc 1 |
| `Switch` | `toggle` | Liga/desliga (preferências) | 2026‑07‑27 |
| `Avatar` | `avatar` | Imagem (uri) ou iniciais | 2026‑07‑27 |
| `FieldRow` | `field` | Linha de formulário (rótulo + controle + ajuda/erro) | 2026‑07‑27 |

> Recipes com primitivo RN ainda pendente (promover quando um incremento precisar): `badge`, `card`, `chip`,
> `divider`, `icon`, `surface`.

## Uso — componentes recentes

**Switch** (preferências liga/desliga):
```tsx
<Switch value={ativo} onValueChange={setAtivo} disabled={salvando} />
```

**Avatar** (exibição — imagem ou iniciais):
```tsx
<Avatar uri={perfil.avatar_url} name={perfil.name} size="lg" />
```

**FieldRow** (linha de formulário — o controle vem por composição; o FieldRow não o conhece):
```tsx
<FieldRow label="Nome" required helperText="Como devemos te chamar" errorText={erro}>
  <Input value={nome} onChangeText={setNome} error={!!erro} />
</FieldRow>
```
Estados suportados pelo `FieldRow`: **obrigatório** (`required` → "*") · **opcional** (sem marcador) ·
**helper** (`helperText`) · **erro** (`errorText`, substitui a ajuda; cor de feedback + anúncio a11y) ·
**disabled** (esmaece o conjunto). Acessibilidade: rótulo↔controle via `nativeID`/`accessibilityLabelledBy`.
Fora de escopo (por disciplina): validação, máscara, loading do campo, conhecimento de API/DTO.

---
*Referências: DS‑002 (freeze) · ADR‑011 (recipes cross‑platform) · MOBILE‑018 (readiness que revelou o FieldRow).*
