# Solicitações da Fundadora — Registro Oficial (log de mudanças)

**Objetivo:** registrar **toda** solicitação/observação da fundadora com **ID, data e status**, para que
**nada se perca** e para **evitar pedidos repetidos**. **Regra:** antes de implementar qualquer item, consultar
este log; ao concluir, atualizar o status com o commit. Subordinado a [[ARCH-000]] (operacional). Status:
`🔴 aberto` · `🟡 em andamento` · `🟢 feito` · `⏸ decisão pendente (fundadora)` · `🔁 repetido` (já pedido antes).

> **Por que existe:** a fundadora observou (17/07) que às vezes repete uma solicitação já feita. Este log é a
> fonte única para checar o que já foi pedido/feito. Cada rodada de validação vira entradas `FB-###`.

---

## Rodada de validação do Preview — 17/07/2026

| ID | Área | Solicitação | Status | Notas |
|---|---|---|---|---|
| **FB-001** | Exames · Financeiro | No detalhe do exame, tornar **acessível** valor pago · tipo de documento (NF/Recibo/Comprovante) · anexo fiscal · recorrência. Sugestão: seção **"Mais detalhes"**. | 🟡 em andamento | **DIAGNÓSTICO:** a função EXISTE — botão "Registrar custo / NF" (`exams/[id]:800`) abre o modal com valor+tipo fiscal+anexo — mas está numa fileira de botões secundários de baixo destaque → não descoberto. **Fix:** promover a uma seção "Mais detalhes/Financeiro" proeminente no detalhe (valor pago · tipo de doc · anexo · recorrência). **Prioridade da fundadora.** |
| **FB-002** | Exames · Card | Card deve mostrar **nome · local (emissor) · médico SOLICITANTE**. No Preview o solicitante não aparece. | 🟢 não é bug | **DIAGNÓSTICO:** o card JÁ mostra local (`page:725`) e "Solicitante: X" (`page:726-727`) — só renderiza quando o campo existe. Nos exames da fundadora `requesting_physician`/`issuer` estão **vazios** (só capturados em extrações após 14/07, quando o documento traz). **Ações:** adicionar solicitante/emissor ao seed demo (feito); exames existentes → re-extrair captura o campo (quando presente no doc). Layout correto. |
| **FB-003** | Medidas · Bioimpedância | Reavaliar CONCEITO: bioimpedância é um **exame** (laudo/clínica/profissional/data/valor/doc fiscal/repetição). Avaliar movê-la ao domínio **Exames**, alimentando indicadores corporais automaticamente. Se ficar em Medidas, permitir valor/NF/recorrência/anexos. | ⏸ decisão pendente | **Decisão arquitetural/produto** (posicionamento de domínio). Precisa de decisão da fundadora — ver recomendação abaixo. |
| **FB-004** | Recursos de Saúde | Ainda há **dois botões** de inclusão (unificar em um só fluxo institucional). Faltam campos: **recorrência · valor · documento fiscal · anexos**. | 🔴 aberto | Corresponde ao item de backlog "Recursos+Outros" (ainda não implementado). Ampliar escopo: + financeiro/recorrência. |
| **FB-005** | Wearables · Nomenclatura | "Sinais Vitais" fica limitado quando os conectores trouxerem atividade/sono/passos/FC/HRV/VO₂/calorias/recuperação/composição corporal. Avaliar **nome mais abrangente** para dados de wearables/integrações. | ⏸ decisão pendente | **Decisão de produto/nomenclatura.** Ver recomendação abaixo. |

### Observação transversal (fundadora)
> A maior parte das alterações desta etapa **ainda não ficou perceptível** no Preview. **Prioridade:** tornar as
> funcionalidades já implementadas **claramente acessíveis na interface ANTES** de evoluir o restante do backlog.
> **Causa raiz (honesta):** muitas funcionalidades são **dirigidas por dados** (só aparecem com exames/eventos que
> tenham os campos) — por isso o **seed demo** é crítico — E há gaps reais de **descoberta/ponto de entrada**
> (FB-001) e possivelmente **regressão** (FB-002). Ambos entram como prioridade.

### Recomendações do Claude p/ os itens de decisão
- **FB-003 (Bioimpedância):** recomendo tratá-la como **exame** (é um laudo com clínica/profissional/data/valor),
  cujo processamento **alimenta automaticamente os indicadores corporais** (Medidas passa a ser a VISÃO dos
  indicadores no tempo, não o ponto de entrada do laudo). Alinha com FIN-001 (valor/NF via Evento) e com o
  Modelo Canônico. Alternativa mínima: manter em Medidas mas adicionar financeiro/recorrência/anexos.
- **FB-005 (nome da seção):** sugestões — **"Dados de Dispositivos"**, **"Monitoramento Contínuo"**, **"Dados de
  Wearables"** ou **"Sinais e Atividades"**. Recomendo **"Monitoramento Contínuo"** (abrange sinais vitais,
  atividade, sono, composição corporal) e é neutro a fabricante (coerente com HIP-001).
