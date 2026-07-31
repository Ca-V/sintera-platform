# MOBILE-028 — Incremento 5 (Histórico de Exames): ACEITE

- **Estado (MOBILE-022):** **Aceito** (Planejado→Implementado→Verificado→Homologado→**Aceito**).
- **Homologação:** dispositivo Android físico (nuvem-first), **"passou tudo"** confirmado pela fundadora em 2026-07-31.

## 1. Resultado da homologação (roteiro [MOBILE-026](MOBILE-026_ROTEIRO_HOMOLOGACAO_INCREMENTO5.md))

### Fluxo principal
| # | Ação | Resultado |
|---|------|-----------|
| T1 | Abrir aba **Documentos** → **Histórico de Exames** (agrupado por ano) | ✅ |
| T2 | Card: título · data · emissor · situação (**sem** resultado interpretado) | ✅ |
| T3 | **Tocar** um exame → **detalhe** com os campos | ✅ |
| T4 | **"Abrir documento original"** → PDF/imagem | ✅ |
| T5 | Passar pelas 5 abas → **sem regressão** dos Inc.1–4 | ✅ |

### Cenários de fronteira
| Cenário | Resultado |
|---|---|
| Lista vazia / muitos registros / datas ausentes ("Sem data") | ✅ sem crash |
| Exame **sem `file_url`** → "Documento original não disponível" | ✅ |
| **Falha de rede** → erro + "Tentar novamente" | ✅ |
| Detalhe inexistente (404) → "Exame não encontrado" | ✅ |

**Fronteira REG-001** mantida (só lista + documento original; sem resultado interpretado) — garantida por CI
(`exams-boundary`: nenhuma tela acessa Supabase direto). **Sem regressão** dos Inc.1–4 (princípio permanente).

> **Nota de escopo (paridade, MOBILE-027 §7.2.1):** o Inc.5 é **leitura** do histórico existente. A extração/
> análise de exames é server-side, disparada no detalhe da Web, e está **fora** do Inc.5 e do Inc.6 (capacidade
> futura). Não afeta este aceite.

## 2. Bloco de RASTREABILIDADE ([MOBILE-022](MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md))

```
Incremento:               Inc5 — Histórico de Exames
Estado:                   Aceito
Branch:                   feat/mobile-inc4-perfil
Commit (código homolog.): 29c4615  (código funcional do Inc5; commits posteriores = preparação do Inc6,
                          apenas ARQUIVOS NOVOS — não alteram o Inc5, logo o binário homologado corresponde)
Tag:                      mobile-inc5-accepted
Pull Request:             — (integração ao ramo principal ao fim da Onda 1)
GitHub Actions:           run 30639209179 (29c4615, success) — verificado no estado "Verificado" do Inc5
                          (obs.: gh CLI com credencial expirada nesta data; run não re-verificado agora)
EAS Build:                b1f7c91b-7e38-4108-acac-9a63975a161d (perfil preview) — FINISHED
APK SHA-256:              2abe21e648effff08e00ecab39787bb423ed3b70d8a735ddc6ed532051a752d0
Versão do aplicativo:     0.0.0 (build 1)
Versão do banco:          sem migrations (tabela `exams` já existia; RLS reusada)
Contrato da API:          exams v1 (leitura) — docs/API_CONTRACTS.md
Toolchain:                Node v22.23.1 · npm 10.9.8 · eas-cli 21.4.0 · Expo SDK 54
Data da homologação:      2026-07-31
Responsável homolog.:     Carina (fundadora)
```

## 3. Escopo entregue
Histórico de Exames (lista agrupada por ano, mais recentes primeiro) + detalhe (campos centrais) + abertura do
documento original + navegação da aba Documentos. Leitura via `apiClient.exams` (ponto único, Inc.1). Estados:
carga · vazio · erro+retry · 404. **Sem** produção de conteúdo clínico (REG-001).

## 4. Liberação do próximo incremento
- **Gate liberado:** Inc.6 (Upload de Exames) pode passar a **Em Implementação** (Inc.5 Aceito + baseline
  atualizada). A camada pura do Inc.6 já está pronta (MOBILE-027 §6); a integração segue o **checklist §7.3**.
- Marco: tag `mobile-inc5-accepted` (base do Inc.6).
