# MOBILE-023 — Roteiro de Homologação do Incremento 4 (Perfil)

- **Estado do incremento (MOBILE-022):** **Verificado** (typecheck + testes + CI ✅, artefatos abaixo) →
  **falta Homologado** (este roteiro, em Android físico) → depois **Aceito** (tag + doc de aceite).
- **Binário a homologar:** build EAS `5b3df1fb-b74b-4412-9b71-770aeffce6ab` (perfil `preview`, commit `8dd0d5b`+).

## 1. Pré-requisitos
- APK do build acima instalado no **Android físico** (nuvem-first — [MOBILE-003 §3.1](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md)).
- Sessão autenticada disponível (Inc.1/2/3 já aceitos).

## 2. Sequência de execução + casos (os 7 pontos definidos pela fundadora)

| # | Caso | Ação | Resultado esperado |
|---|------|------|--------------------|
| T1 | **Abrir Mais → Perfil** | tocar aba **Mais** → item **Perfil** | abre a tela de Perfil (header "Perfil" + voltar) |
| T2 | **Carregar dados** | observar a tela após abrir | e-mail da sessão (RO); nome/telefone carregados (ou vazios se perfil novo); sem erro |
| T3 | **Editar nome** | alterar o campo Nome | campo aceita edição; sem trava |
| T4 | **Editar telefone** | alterar o campo Telefone | idem (teclado numérico) |
| T5 | **Salvar sem erro** | tocar **Salvar** | botão em loading → **"Perfil salvo ✓"** (gravação pessimista, confirmada no backend) |
| T6 | **Persistir após reiniciar** | forçar parada do app → reabrir → Mais → Perfil | os valores salvos **reaparecem** (persistência real, não só memória) |
| T7 | **Sem regressão de navegação** | navegar pelas 5 abas + voltar do Perfil | tudo abre; nenhuma trava; auth/Home intactos (Inc.1–3) |

## 3. Critério de aprovação
- **T1–T7 todos PASS** e o app não fecha sozinho.
- Validação de campo: nome > 120 chars ou telefone < 8 dígitos → **mensagem de erro no campo** (não salva) —
  opcional confirmar.
- Fronteira já garantida por CI (`profile-boundary`): a tela não acessa Supabase direto.

## 4. Evidências a coletar (MOBILE-022 §Evidências funcionais)
- **Prints:** T1 (Mais→Perfil), T2 (dados), T5 (salvo ✓), T6 (persistido após reabrir).
- **APK SHA-256:** registrar o hash do APK instalado.
- Preencher o **bloco de rastreabilidade** ([MOBILE-022](MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md)) no doc de aceite.

## 5. Após aprovação
Registrar o aceite (MOBILE-024-aceite ou similar) + tag `mobile-inc4-accepted`; então o **Incremento 5
(Histórico de Exames)** nasce dessa tag ([MOBILE-024](MOBILE-024_PLANEJAMENTO_INCREMENTO5_EXAMES.md)).

## 6. Se algum caso FALHAR
Não seguir para o aceite. Registrar o caso + evidência, corrigir na causa, revalidar. Sem misturar problema
de infraestrutura com problema do Inc.4.
