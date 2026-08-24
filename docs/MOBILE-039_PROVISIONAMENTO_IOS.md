# MOBILE-039 — Provisionamento iOS (conta Apple, D-U-N-S, TestFlight)

**Status:** preparação concluída no código · **bloqueado pela conta Apple Developer**
**Ref:** ADR-002 (Mobile-First) · ADR-006 (React Native/Expo) · MOBILE-003 (provisionamento Expo/EAS)

---

## 1. O que já está pronto

A base **não precisa ser portada** — ela já foi construída neutra de plataforma. Medido em 24/08:

```
packages/core · validation · api-client · types · utils · config · design-system
   ZERO arquivos acoplados a react-native, next ou react-dom

apps/mobile
   4 ocorrências de Platform.OS, todas de convenção de plataforma:
     DatePicker    iOS = spinner · Android = default
     LoginScreen   KeyboardAvoidingView
   ZERO arquivos .android.* ou .ios.*
   10 dependências nativas, todas com suporte iOS
```

Nenhuma regra de negócio é condicionada a plataforma. **iOS é compilação, não porte.**

Configurado nesta preparação:

- `app.json` → `ios.infoPlist` com região pt-BR, `NSFaceIDUsageDescription` e
  `ITSAppUsesNonExemptEncryption: false` (evita o questionário de exportação a cada envio ao TestFlight).
- `eas.json` → `ios.simulator: false` nos perfis `preview` e `production`.
- Permissões de câmera e galeria já vinham do plugin `expo-image-picker`.
- O plugin `withAndroidCmakeVersion` é Android-only e não interfere.

**Não precisa de Mac.** O EAS compila iOS na nuvem.

---

## 2. O bloqueio: conta Apple Developer

US$ 99/ano. Sem ela não há build iOS, TestFlight nem App Store.

| Modalidade | Prazo | Consequência |
|---|---|---|
| Individual | ~1 dia | O app aparece sob **nome pessoal** na App Store |
| **Organização** | **dias a semanas** | Aparece como SINTERA; exige **D-U-N-S** |

**Decisão registrada: Organização.** O projeto será transferido a outra equipe (ADR-012); o app precisa pertencer à empresa. Migrar de Individual para Organização depois exige transferência formal entre contas Apple — dívida na hora errada.

---

## 3. Como obter o D-U-N-S (gratuito)

O D-U-N-S é um identificador de empresa emitido pela Dun & Bradstreet. A Apple exige para contas de Organização.

**Peça pelo formulário da própria Apple**, não pelo site comercial da D&B — o caminho da Apple é gratuito e priorizado:

```
developer.apple.com/enroll/duns-lookup
```

**Antes de começar, tenha em mãos:**

- razão social **exatamente** como no registro da empresa (CNPJ)
- endereço da sede, igual ao registro
- telefone da empresa — precisa ser localizável/verificável
- site da empresa
- nome e e-mail de quem responde legalmente

**Passo a passo:**

1. Acesse o link acima e busque pela razão social. Se a empresa **já tiver** D-U-N-S, ele aparece — muitas empresas têm sem saber, e isso pula toda a espera.
2. Não encontrando, preencha o formulário de solicitação.
3. A D&B pode ligar ou enviar e-mail para confirmar os dados.
4. Prazo típico: **5 a 14 dias úteis**. Pode ser mais rápido se a empresa já constar em bases públicas.

**Erro comum:** divergência entre a razão social informada e o registro oficial. Qualquer diferença — abreviação, acento, "LTDA" ausente — devolve o pedido e reinicia o prazo.

**Depois de emitido:**

```
developer.apple.com/programs/enroll
→ escolher "Company / Organization"
→ informar o D-U-N-S
→ Apple verifica (mais alguns dias)
→ pagar US$ 99
```

---

## 4. Depois da conta aprovada

```
+30 min   primeiro build iOS pelo EAS
+1 hora   TestFlight interno → instalável no iPhone
+2 dias   App Store, se for o caso
```

**Caminhos de distribuição:**

| | Alcance | Revisão da Apple |
|---|---|---|
| TestFlight interno | até 100 testadores | **não** |
| TestFlight externo | até 10.000 | leve |
| App Store | público | completa (24–48h) |
| Ad Hoc | 100 aparelhos por UDID | não |

O perfil `preview` (`distribution: internal`) produz build Ad Hoc — exige registrar o UDID de cada aparelho. Para TestFlight, use `production` + `eas submit`.

---

## 5. Pendente de credencial (não dá para preencher antes da conta)

O bloco `submit.production.ios` do `eas.json` precisará de:

```
appleId       e-mail da conta Apple Developer
ascAppId      ID do app no App Store Connect (criado lá)
appleTeamId   ID do time, visível em developer.apple.com
```

Deixado vazio de propósito: preencher com valor inventado quebraria o `eas submit` de forma confusa.

---

## 6. Submissão — o que a Apple vai perguntar

**Política de privacidade e suporte** — duas URLs públicas, obrigatórias.

**Privacy nutrition labels** — o app lida com **dado de saúde**, categoria sensível. Declarar com precisão o que é coletado, para quê, e se é vinculado à identidade. Declaração imprecisa é motivo de rejeição.

**Revisão de app de saúde** — a Apple é mais rigorosa aqui, especialmente quanto à diretriz 1.4.1 (dano físico), que barra apps oferecendo orientação médica.

**A posição da SINTERA ajuda, e deve estar escrita na submissão:** o produto **organiza, integra e contextualiza** documentos com origem e autoria; **não interpreta** e **não é SaMD** (ADR-000, RDC 657). Isso precisa estar nas notas de revisão, não improvisado se houver questionamento.

---

## 7. O que NÃO muda

Nada da arquitetura. Nenhuma tela, nenhum pacote, nenhuma regra. A trilha iOS é conta, credencial e submissão — o código já estava pronto para as duas plataformas desde o ADR-002.
