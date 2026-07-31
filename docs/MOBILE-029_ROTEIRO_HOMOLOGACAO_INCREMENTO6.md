# MOBILE-029 — Roteiro de Homologação do Incremento 6 (Upload de Exames)

- **Estado (MOBILE-027 §9):** camada pura **Verificada** · integração **Implementada** · homologação **Pendente**.
- **Binário:** build EAS `d9858c74-a799-420e-b202-099a6b5c5589` (perfil `preview`).
- **Por que mais detalhado:** é o **1º incremento que integra várias camadas ao mesmo tempo** — picker nativo,
  permissões, leitura do arquivo, upload, Storage, RLS e atualização do histórico. Cada uma pode falhar sozinha.

## 1. Pré-condições
Instalar o APK (mesmo fluxo nuvem-first; AVG "Ignorar"). Estar **logado**. Ter uma conexão de dados alternável.

## 2. Casos funcionais (📸 = print)
| # | Ação | Esperado |
|---|------|----------|
| U1 📸 | **Documentos → "Adicionar exame" → Escolher documento →** selecionar um **PDF** | Selecionando… → Enviando… → Processando… → **Concluído ✓** → volta ao Histórico; o exame aparece |
| U2 📸 | "Adicionar exame" → **Escolher documento → imagem da galeria** (JPG/PNG) | mesmo fluxo → Concluído |
| U3 📸 | "Adicionar exame" → **Usar a câmera** → autorizar permissão → tirar foto | pede permissão na 1ª vez; após foto → envia → Concluído |
| U4 | Abrir o picker e **cancelar** (voltar sem escolher) | volta ao estado inicial (sem erro, sem envio) |
| U5 📸 | Selecionar um **arquivo inválido** (ex.: `.docx`/`.zip`) | **bloqueia antes de enviar**: "Formato não aceito… Envie: PDF, JPG, PNG, HEIC." |
| U6 | Selecionar um **arquivo grande** (> 20 MB) | "Arquivo acima do limite de 20 MB…" (não envia) |
| U7 📸 | **Sem conexão** (modo avião) → tentar enviar um PDF | erro acionável + **"Tentar novamente"** (não trava) |
| U8 | **Perder conexão durante o envio** (desligar dados no meio) | vai a erro; **"Tentar novamente"** retoma (não duplica o que já subiu) |
| U9 📸 | Após U1, no **Histórico** | o exame novo aparece com situação **"pending"/pendente** |
| U10 📸 | Abrir o exame recém-enviado → **"Abrir documento original"** | abre o **PDF/imagem** que foi enviado |
| U11 | Passar pelas 5 abas; abrir Perfil; ver Home | **sem regressão** dos Inc.1–5 |

## 3. Fronteira REG-001
A tela de upload **envia/organiza o documento** — não mostra resultado interpretado. Rodapé com a fronteira
(RDC 657/2022) presente. O exame fica **"pendente"** (a extração é posterior e server-side — não é do Inc.6).

## 4. Observações de runtime (o que este build valida pela 1ª vez)
Expo Document Picker · Expo Image Picker · **permissão de câmera** · leitura do arquivo (`fetch(file://)` no
Android) · **upload ao Storage** · **RLS** (só a própria pasta) · atualização do Histórico. Se algo falhar,
**anotar o passo + a mensagem** (e print) — provável ajuste pontual (é a 1ª integração nativa/Storage).

## 5. Critério de aprovação
U1–U4 + U9–U11 **PASS**; U5–U8 com o comportamento esperado (bloqueio/erro acionável, sem crash, sem duplicação).
**Sem regressão** dos Inc.1–5. Fronteira REG-001 mantida.

## 6. Após aprovação
Evidências (prints + APK SHA-256 + bloco de rastreabilidade MOBILE-022) → tag `mobile-inc6-accepted` → baseline/
matriz/changelog. Aí sim o Inc.6 passa a **Aceito**.
