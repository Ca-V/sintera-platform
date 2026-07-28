# INC4-PLAYBOOK — Roteiro de execução (código) da integração do Perfil

> Objetivo: na quarta, seguir passo a passo. Snippets **ilustrativos** (a escrever no ambiente Android — não
> são código do app hoje). Consome o que já está pronto: `@sintera/api-client` (profile), `@sintera/validation`,
> DS, `profileMachine`. Ordem/aceite: [INC4-INTEGRATION-PLAN](INC4-INTEGRATION-PLAN.md).

## PASSO 1 — api-client (já instanciado no Inc 1; reusar)

O cliente já existe (auth do Inc 1). Acessar o domínio `profile`:
```ts
// apps/mobile: o ApiClient já é criado (createApiClient) e provido via contexto de sessão.
const { profile } = apiClient   // profile.getProfile / profile.updateProfile (prontos, testados)
```

## PASSO 2 — hook `useProfile` (encapsula o reducer + efeitos)

```ts
import { useReducer, useEffect, useRef, useCallback } from 'react'
import { profileReducer, initialProfileState } from './profileMachine' // pronto
import { useApiClient } from '../../session'                            // provider do Inc 1

export function useProfile() {
  const { profile } = useApiClient()
  const [state, dispatch] = useReducer(profileReducer, initialProfileState)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {                       // carga no mount (com cancelamento)
    const ac = new AbortController(); abort.current = ac
    dispatch({ type: 'LOAD' })
    profile.getProfile(ac.signal)
      .then((dto) => dispatch({ type: 'LOAD_SUCCESS', data: dto }))
      .catch((e) => { if (!ac.signal.aborted) dispatch({ type: 'LOAD_FAILURE', error: String(e?.message ?? e) }) })
    return () => ac.abort()               // logout/unmount cancela (ADR-017)
  }, [profile])

  const save = useCallback(async (patch) => {
    dispatch({ type: 'SAVE' })
    const { error } = await profile.updateProfile(patch)
    dispatch(error ? { type: 'SAVE_FAILURE', error: error.message } : { type: 'SAVE_SUCCESS' })
  }, [profile])

  return { state, save, edit: () => dispatch({ type: 'EDIT' }), retry: () => dispatch({ type: 'RETRY' }) }
}
```

## PASSO 3 — ligar validation (antes de gravar)

```ts
import { validateProfileEditable } from '@sintera/validation' // pronto

function onSave(nameInput: string, phoneInput: string) {
  const v = validateProfileEditable({ name: nameInput, phone: phoneInput })
  if (!v.ok) { setFieldError(v.error); return }   // erro no FieldRow, não grava
  save(v.value)                                   // valores JÁ normalizados
}
```

## PASSO 4 — ligar o Design System (montar `ProfileScreen`)

```tsx
import { FieldRow, Input, Switch, Avatar, Button, Text } from '../primitives' // prontos
// name/phone EDITÁVEIS; age_range/goals/avatar EXIBIÇÃO (D1); notificações FORA (D3)
<Avatar uri={state.data?.avatar_url} name={state.data?.name} size="lg" />
<FieldRow label="Nome" errorText={nameError}>
  <Input value={name} onChangeText={setName} error={!!nameError} />
</FieldRow>
<FieldRow label="Telefone" helperText="Com DDD">
  <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
</FieldRow>
<Button label="Salvar" loading={state.phase === 'saving'} onPress={() => onSave(name, phone)} />
```

## PASSO 5 — persistência (pessimista) + estados

- `state.phase`: `loading` → spinner · `ready` (data null = vazio → defaults) · `saving` → botão loading ·
  `saved` → confirmação · `loadError`/`saveError` → mensagem + `retry()`.
- Só reflete "salvo" após `SAVE_SUCCESS` (backend confirmou). Sem otimista (MOBILE-019 §4).

## PASSO 6 — navegação + teste manual + homologação

- Navegação: registrar `ProfileScreen` no stack da aba **"Mais"** (stacks do Inc 2).
- Teste manual: abrir → editar nome/telefone → Salvar → **reabrir** → persistido; testar erro (offline) e timeout.
- Testes automatizados: estático "sem `supabase`/`createClient` direto" + transições do hook.
- Homologar com a fundadora (fluxo autenticado) → aceite → tag `mobile-inc4-accepted`.

---
*Tudo que os PASSOS 1–5 consomem (`profile`, `validateProfileEditable`, DS, `profileMachine`) está pronto e
testado. O que se escreve na quarta é a cola RN (hook + tela + navegação).*
