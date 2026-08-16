# MOBILE-034 — Guia de Instalação do APK + Registro de Defeitos (Homologação v1.0)

Companheiro do checklist **MOBILE‑033**. Objetivo: instalar o APK, executar a homologação e **registrar TODOS os
defeitos numa lista única** (sem corrigir durante os testes → correção em um ciclo → nova build → RC1).

## Build sob teste
- **Branch:** `feat/mobile-inc4-perfil` · **HEAD:** `c80ec1be` (pós-release V1 + reconciliação de defeitos)
- **Build/APK (EAS):** `c69186e6-5aa4-4aad-b554-0a45f6cf2a9a` · perfil `preview` · conta `sintera-health-tech`
- **Link de download/instalação:** https://expo.dev/accounts/sintera-health-tech/projects/sintera/builds/c69186e6-5aa4-4aad-b554-0a45f6cf2a9a
- **Gerado em:** 16/08/2026 · aponta para a base de **produção**

> Build anterior (referência histórica): HEAD `13811d2` · EAS `c5104a24-b8b8-472b-be9e-e6e5c8d41635`.

## 1. Instalar o APK no Android (sideload)
1. Baixar o `.apk` do link do build (página do EAS → "Install"/"Download").
2. No celular, permitir **instalar apps de fontes desconhecidas** para o navegador/gerenciador de arquivos usado
   (Configurações → Apps → acesso especial → Instalar apps desconhecidos).
3. Abrir o `.apk` baixado → **Instalar** → **Abrir**.
4. **Antivírus (falso‑positivo conhecido):** alguns AV marcam APK de sideload como `CloudRep [Susp]` — é **falso
   positivo** de app não publicado na loja. Escolher **Ignorar/Permitir**, **nunca "Solucionar/Remover"**.
5. Login com um **usuário real** (Supabase de produção) — o `preview` aponta para a base real.

## 2. Capturar evidência (para cada defeito)
- **Print/vídeo** da tela com o problema.
- Passos exatos para reproduzir.
- Se houver **crash/congelamento**, capturar o log com o cabo USB:
  ```bash
  adb logcat -d > logcat.txt        # despeja o log recente para um arquivo
  ```
  (ou `adb logcat *:E` para ver só erros em tempo real enquanto reproduz).

## 3. Ordem sugerida de teste (crítico primeiro)
Se o tempo for curto, priorizar nesta ordem (o resto do checklist MOBILE‑033 na sequência):
1. **Auth + Navegação** (0.x) — sem isso, nada roda.
2. **Fluxo completo do usuário** (8.1) — login → upload → agenda → histórico → relatório → compartilhar.
3. **Exames** (upload/detalhe/autoanálise) — maior superfície e a ponte /analyze e /api/omics.
4. **Relatórios** (compartilhar + link público) — depende de `EXPO_PUBLIC_WEB_URL`.
5. Demais domínios (Histórico, Minha Saúde, Agenda, Financeiro, Configurações).

## 4. Lista única de defeitos (preencher durante a homologação)
Registrar cada defeito UMA vez, com severidade. **Não corrigir durante** — consolidar tudo aqui.

| # | Módulo · Cenário (MOBILE‑033) | O que aconteceu × esperado | Severidade | Reproduz? | Evidência |
|---|---|---|---|:---:|---|
| 1 | | | P0/P1/P2 | sempre/às vezes | print/vídeo/log |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

**Severidade (guia):** **P0** = impede uso / crash / perda de dado · **P1** = funcionalidade importante quebrada, com
contorno · **P2** = cosmético / menor / enriquecimento.

## 5. Ao final da homologação
1. Fechar a lista única (todos os defeitos, ordenados por severidade).
2. Claude corrige **tudo num único ciclo** (P0/P1 primeiro; P2 conforme decisão).
3. Nova build → **validação rápida** (repetir só os cenários afetados) → **Release Candidate 1**.
4. v1.0 considerada concluída.

> Regra de ouro: durante os testes, **só registrar** — não pedir correção pontual. Isso evita ciclos pequenos de
> correção/teste e o risco de regressão enquanto se valida.
