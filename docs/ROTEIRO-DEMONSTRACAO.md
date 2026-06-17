# Roteiro de Demonstração — SINTERA

**Para:** apresentar a plataforma rodando de ponta a ponta.
**Data:** 2026-06-16
**Importante:** o que envolve **classificação clínica** ainda não está ativo (aguarda
o Responsável Clínico). O que é **factual e de organização** já funciona. O roteiro
deixa claro, em cada tela, o que é real e o que é demonstração.

---

## 0. Pré-requisitos

- [ ] Estar **logada** (login Google ou e-mail).
- [ ] Ter **pelo menos 1 exame processado** com biomarcadores (senão, comece pelo passo 1).
- [ ] Para o painel de catálogo: acessar com o **e-mail administrativo** (`carinaleite.br@gmail.com`).
- [ ] Mensagem-guarda para repetir na apresentação: *"A SINTERA organiza e explica
  exames — não diagnostica, não prescreve, e sempre encaminha ao médico (RDC 657/2022)."*

---

## 1. Upload de um laudo (a porta de entrada)

- **Caminho:** `/dashboard/exams` → botão de upload.
- **O que fazer:** enviar um PDF de laudo laboratorial.
- **O que esperar:** o exame entra como *processando*; a IA extrai os biomarcadores
  (nome, valor, unidade e a **faixa de referência impressa no laudo**) e o status vai
  para *processado*.
- **Mensagem-chave:** *"A extração lê o laudo automaticamente. Repare que guardamos a
  faixa do próprio laboratório — ela é a nossa referência primária."*

---

## 2. Minha Saúde — visão geral factual

- **Caminho:** `/dashboard/saude`
- **O que mostrar:** os biomarcadores organizados por categoria, com a posição de cada
  valor em relação à faixa do laudo (abaixo / dentro / acima) e a seção **Evolução**
  (quando há mais de um exame, mostra o ritmo de mudança, ex.: "X%/mês").
- **Mensagem-chave:** *"Isto é 100% factual e já funciona: comparamos o número com a
  faixa impressa no laudo — aritmética, não interpretação clínica. A evolução mostra a
  velocidade da mudança no tempo, sem dizer se é 'bom' ou 'ruim'."*

---

## 3. Histórico — evolução temporal

- **Caminho:** `/dashboard/historico`
- **O que mostrar:** a série temporal de um biomarcador ao longo dos exames.
- **Mensagem-chave:** *"O motor longitudinal calcula variação e ritmo de forma factual —
  é o que sustenta o acompanhamento ao longo do tempo."*

---

## 4. Insights (modo demonstração factual)

- **Caminho:** `/dashboard/insights?demo=1`
- **O que fazer:** clicar em **"Gerar demonstração factual dos meus exames"**.
- **O que esperar:** aparecem cartões factuais para os biomarcadores fora da faixa do
  laudo (ex.: *"Ferritina = 8 ng/mL está abaixo da faixa impressa no seu laudo
  (15 a 150 ng/mL). … Converse com seu médico."*), com o banner **"Modo demonstração —
  sem validação clínica"**.
- **Mensagem-chave:** *"Este é o módulo de insights rodando ponta a ponta. Hoje, em
  demonstração, ele só reporta o fato aritmético — sem classificação clínica. Quando o
  Responsável Clínico aprovar as regras, os mesmos cartões passam a trazer a leitura
  clínica validada. A engenharia já está pronta; o que falta é o conteúdo clínico humano."*
- **Contraste honesto:** abrir `/dashboard/insights` (sem `?demo=1`) mostra o **estado
  vazio honesto** — *"é o que a usuária real vê hoje: nada de saúde é classificado até a
  aprovação clínica."*

---

## 5. Painel de governança científica (catálogo)

- **Caminho:** `/admin/catalogo` (e-mail administrativo)
- **O que mostrar:** os 83 biomarcadores, a **cobertura científica** (LOINC / SNOMED /
  Regra), o estágio de cada item (`Draft` hoje) e os indicadores de "experiência completa".
- **Mensagem-chave:** *"Esta é a sala de máquinas da governança. Cada biomarcador tem
  rastreabilidade: identificação (LOINC/SNOMED), fonte, revisor e estágio de aprovação.
  É o que permite escalar para milhares de biomarcadores de forma auditável."*

---

## 6. Planejamento / Agenda (se for mostrar)

- **Caminho:** `/dashboard/agenda`
- **O que mostrar:** eventos e lembretes.
- **Mensagem-chave:** *"Apoia a continuidade do cuidado — exames de acompanhamento,
  lembretes."*

---

## 7. Fechamento — onde estamos e o que falta

Roteiro de fala para encerrar:

1. **O que já funciona:** upload + extração, organização factual (Minha Saúde),
   evolução (Histórico), o motor de insights de ponta a ponta (demonstração), e a
   governança científica completa (catálogo, proveniência, LOINC/SNOMED, ledger).
2. **O que está intencionalmente vazio:** a **classificação clínica** (limiares,
   `clinical_flag`, textos médicos). Não foi preenchida por IA — por segurança e por
   exigência regulatória.
3. **O que destrava o valor clínico:** contratar o **Responsável Clínico (CRM)**, que
   revisa e assina as regras (planilhas já preparadas). A plataforma está pronta para
   "acender" no dia em que isso acontecer.
4. **Frase de efeito:** *"A SINTERA já está tecnicamente pronta e segura. O próximo
   passo não é mais software — é o conhecimento clínico validado."*

---

## Notas de segurança para a apresentação

- O modo demonstração (`?demo=1`) **não é visível** para usuárias reais e os dados são
  marcados como `synthetic`.
- Nada exibido em demonstração constitui diagnóstico ou conduta — é apenas a posição
  aritmética do número frente à faixa do laudo.
- O lançamento ao público só ocorre após a contratação do Responsável Clínico e a
  revisão de todo o conteúdo clínico.
