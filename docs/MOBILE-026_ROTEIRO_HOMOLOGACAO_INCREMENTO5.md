# MOBILE-026 — Roteiro de Homologação do Incremento 5 (Histórico de Exames)

- **Estado (MOBILE-022):** **Verificado** (typecheck + 193 testes + CI ✅) → falta **Homologado** (este roteiro) → **Aceito**.
- **Binário:** build EAS `b1f7c91b-7e38-4108-acac-9a63975a161d` (perfil `preview`).
- **Sensibilidade:** Exames é mais sensível que Perfil — além do funcional, cobrir **cenários de fronteira** (§3).

## 1. Casos funcionais (fluxo feliz)

| # | Ação | Esperado |
|---|------|----------|
| T1 | Abrir aba **Documentos** | lista **Histórico de Exames** carrega (agrupada por ano, mais recentes primeiro) |
| T2 | Observar um card | título · data · emissor · situação (**sem** resultado interpretado) |
| T3 | **Tocar** um exame | abre o **detalhe** (header "Exame" + voltar) com os campos centrais |
| T4 | Tocar **"Abrir documento original"** | abre o PDF/imagem (`file_url`) no visualizador do sistema |
| T5 | Voltar e passar pelas 5 abas | **sem regressão** dos Inc.1–4 (Home, Perfil, navegação) |

## 2. Fronteira REG-001 (verificar)
Nenhuma tela mostra "resultado interpretado", diagnóstico ou risco — só **lista + documento original**. Rodapé
com a fronteira (RDC 657/2022) presente. (Garantido por CI: `exams-boundary` — sem Supabase direto.)

## 3. Cenários de fronteira (o que revela problemas) — comportamento já codado

| Cenário | Como o código trata | Verificar no aparelho |
|---------|---------------------|-----------------------|
| **Lista vazia** (sem exames) | estado "**Nenhum exame ainda**" | mostra o vazio, não erro |
| **Exame sem `file_url`** | detalhe mostra "**Documento original não disponível**" (sem botão) | ✅ sem crash |
| **Muitos registros** | lista renderiza todos (Inc.5 sem paginação; `listExams` sem limite) | rolar; observar fluidez (paginação = futuro se necessário) |
| **Data ausente/inválida** | `formatDate`→"Sem data"/"—"; grupo "**Sem data**" por último | agrupamento correto |
| **Falha de rede** | hook → `error` → "**Tentar novamente**" (retry recarrega) | desligar dados → abrir → erro + retry funciona |
| **401 (sessão expirada)** | api-client LANÇA → hook mostra erro; `onAuthStateChange` (perda de sessão) leva ao **Login** | erro claro **ou** volta ao Login (sem travar) |
| **404 (registro inexistente / outro usuário — RLS)** | `getExam`→`null` → detalhe "**Exame não encontrado**" | sem crash |
| **500 (erro do backend)** | api-client LANÇA → hook `error` + retry | mensagem acionável, permite novo retry |

## 4. Critério de aprovação
- **T1–T5 PASS** + os cenários de §3 com o comportamento esperado (sem crash; mensagens acionáveis).
- **Sem regressão** dos Inc.1–4 (princípio permanente — MOBILE-022).
- Fronteira REG-001 mantida.

## 5. Evidências ([MOBILE-022](MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md))
Prints: T1 (lista), T3 (detalhe), T4 (documento aberto), + ao menos 1 cenário de fronteira (ex.: sem `file_url`
ou falha de rede). **APK SHA-256** + bloco de rastreabilidade no doc de aceite.

## 6. Após aprovação
Tag `mobile-inc5-accepted`; baseline + matriz + changelog; então **Inc.6 (Upload de Exames)**.
