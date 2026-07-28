# SID-001 — Conteúdo explicativo da Sidebar (descrição contextual por módulo)

> Item #5 da visão expandida. Padroniza o **texto** de cada módulo para o card contextual que **já existe**
> (`src/components/ui/ContextualDescription.tsx` — hover/foco, reutilizável). É **conteúdo/copy**, não mecanismo.
> Aplicar na Web passa pelo **gate de paridade** (é mudança Web) — aqui produzimos a **fonte da verdade** da copy.

## 1. Estrutura padrão (4 partes) + derivação para o card atual

Cada módulo tem uma ficha padrão (fundadora):

- **Objetivo** — para que serve.
- **O que acompanha** — que informação reúne.
- **Como funciona** — como a informação entra/é organizada.
- **Benefício** — o ganho para a pessoa.
- **Frequência** — com que ritmo a informação se atualiza (ver tabela §2.1).

> **Card atual** = 1 frase (máx. 2 linhas, começa com verbo, benefício antes da função — voz única já definida
> em `ContextualDescription`). Deriva-se do **Objetivo + Benefício**. Quando o card evoluir (Web+DS), mostra as 4
> partes. Regra de voz mantida: factual, sem promessa clínica (RDC 657).

### 2.1 Frequência de atualização por módulo

| Módulo | Frequência |
|---|---|
| Início / Painel | a cada acesso (reflete os demais) |
| Exames | a cada novo documento adicionado |
| Agenda / Histórico | a cada evento/recorrência |
| Composição Corporal | a cada registro (manual ou dispositivo) |
| Monitoramento / Wearables | **contínua** (sincronização dos dispositivos) |
| Medicamentos · Suplementos | a cada dose/registro |
| Condições · Recursos | quando você registra |
| Jornada de Saúde | reflete os fatos da fase (contínua/por evento) |
| Rotinas | conforme a recorrência programada |
| Rede de Cuidado | a cada acesso/alteração de permissão |
| Despesas · Relatórios | a cada fato com valor / sob demanda |
| Central de Notificações | quando você ajusta preferências |

## 2. Fichas por módulo (fonte da copy)

### Início / Painel
- **Objetivo:** dar uma visão do que precisa de atenção hoje. · **Acompanha:** próximos eventos, novidades e destaques dos seus dados. · **Como funciona:** reúne o que já existe nos seus módulos. · **Benefício:** você começa sabendo por onde seguir.
- *Card:* "Comece pelo que importa hoje: seus próximos passos e novidades, reunidos num só lugar."

### Exames (Documentos)
- **Objetivo:** guardar e organizar seus exames. · **Acompanha:** laudos, imagens e resultados ao longo do tempo. · **Como funciona:** você adiciona o documento; a SINTERA organiza e mantém o original acessível. · **Benefício:** seu histórico completo, sempre à mão e rastreável.
- *Card:* "Reúna seus exames num histórico organizado e rastreável — com o documento original sempre a um clique."

### Agenda / Histórico (Acompanhamento)
- **Objetivo:** organizar consultas, procedimentos e retornos no tempo. · **Acompanha:** eventos assistenciais, com recorrência e lembretes. · **Como funciona:** cada evento vira um ponto na sua linha do tempo. · **Benefício:** nada importante passa despercebido.
- *Card:* "Acompanhe consultas e procedimentos no tempo — com lembretes para não perder nenhum passo."

### Composição Corporal / Medidas
- **Objetivo:** acompanhar medidas ao longo do tempo. · **Acompanha:** peso, medidas e composição, com origem e rastreabilidade. · **Como funciona:** registro manual ou vindo de dispositivos. · **Benefício:** você vê a evolução, sem juízo — quem interpreta é você e seu profissional.
- *Card:* "Acompanhe a evolução das suas medidas ao longo do tempo, com origem rastreável."

### Monitoramento / Wearables
- **Objetivo:** trazer os sinais contínuos dos seus dispositivos. · **Acompanha:** sono, atividade, frequência cardíaca e outros sinais. · **Como funciona:** conecta seus dispositivos com sua autorização; sincroniza de forma contínua. · **Benefício:** os dados do dia a dia entram no contexto da sua jornada.
- *Card:* "Conecte seus dispositivos e traga os sinais do dia a dia para o contexto da sua saúde."

### Medicamentos · Suplementos
- **Objetivo:** organizar o que você usa e quando. · **Acompanha:** medicamentos/suplementos, doses e horários. · **Como funciona:** você registra; lembretes vêm da Central de Notificações. · **Benefício:** uso em dia, com lembretes no seu canal.
- *Card:* "Organize seus medicamentos e receba lembretes no canal que você preferir."

### Condições de Saúde · Recursos de Saúde
- **Objetivo:** registrar condições e recursos de apoio. · **Acompanha:** condições cadastradas e recursos (planos, serviços). · **Como funciona:** registro objetivo, sem interpretação. · **Benefício:** contexto completo para você e sua rede de cuidado.
- *Card:* "Registre suas condições e recursos de apoio — contexto que acompanha toda a sua jornada."

### Jornada de Saúde (novo — JOR-001)
- **Objetivo:** organizar sua saúde por **fase da vida**. · **Acompanha:** Saúde Feminina, Saúde Infantil e Saúde Preventiva — da pessoa e de quem ela cuida. · **Como funciona:** reúne exames, eventos e sinais na fase a que pertencem (sem duplicar). · **Benefício:** a saúde certa para cada momento — inclusive dos seus dependentes.
- *Card:* "Acompanhe sua saúde por fase da vida — sua e de quem você cuida."
- **Sub-áreas:** *Saúde Feminina* — "Do ciclo à menopausa, cada fase acompanhada."; *Saúde Infantil* — "Vacinas, crescimento e cuidado dos seus filhos, organizados."; *Saúde Preventiva* — "Check-ups e rastreamentos, no tempo certo."

### Rede de Cuidado (CARE-001/002)
- **Objetivo:** decidir quem participa do seu cuidado e vê o quê. · **Acompanha:** profissionais, familiares e cuidadores autorizados; permissões e histórico de acessos. · **Como funciona:** você concede e revoga acesso por escopo e prazo, com auditoria. · **Benefício:** colaboração com controle total e privacidade.
- *Card:* "Escolha quem participa do seu cuidado e veja exatamente o que cada um acessa — com controle total."

### Rotinas (ROT-001)
- **Objetivo:** programar suas atividades recorrentes. · **Acompanha:** treino, terapias, hidratação, vitaminas e outras rotinas. · **Como funciona:** você define a recorrência; os lembretes vêm da Central. · **Benefício:** sua rotina em dia, no seu canal.
- *Card:* "Programe suas rotinas — de treino a hidratação — e receba lembretes no seu canal."

### Despesas · Relatórios · Configurações
- *Cards:* Despesas — "Acompanhe os custos ligados aos seus cuidados de saúde, sem duplicar registros."; Relatórios — "Gere relatórios que espelham seus dados, prontos para compartilhar."; Configurações — "Ajuste conta, privacidade e como você quer ser notificada."

## 3. Regras de manutenção

- Voz única (verbo primeiro · benefício antes da função · factual · sem promessa clínica — REG-001).
- **Taxonomia RATIFICADA** (D-JOR/D-MUL congeladas — [ARC-000 §6](ARC-000_ARQUITETURA_DE_PRODUTO.md)); a copy dos
  módulos da Jornada/Rede/Rotinas está estável. A **organização visual** da Sidebar é **"Estável para MVP"**
  (revisável por UX — não exige ADR).
- Quando o card evoluir para as 4 partes + Frequência, o mesmo texto-fonte alimenta a versão completa (nada se reescreve).

---
**Conformidade:** ✔ REG-001 · ✔ ADR-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: ContextualDescription (mecanismo existente) · Sidebar SSOT · JOR-001 · CARE-002 · ROT-001 · NOTIF-001 · gate de paridade (aplicação na Web) · RDC 657.*
