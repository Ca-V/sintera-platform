# CARE-003 — Vínculo Profissional

> **O que este documento é.** A especificação funcional da camada que falta para o negócio existir: a **conta
> profissional** e o **vínculo contínuo** entre uma pessoa e o profissional que a acompanha. Deriva do Mini
> Business Plan v1.0 (22/09/2026), §19 a §27.
>
> **Estado verificado em 22/09/2026.** Não existe no código. A tela `src/app/dashboard/rede-de-cuidado/page.tsx`
> tem três linhas e duas delas — "Profissionais" e "Compartilhamentos" — estão com `enabled: false` e o rótulo
> "em breve". Não há tabela de vínculo em 173 migrações. `public.practitioners` (migração 139) tem quatro
> colunas — `id`, `user_id`, `name`, timestamps — e é um esqueleto de identidade FHIR, **não** uma conta
> profissional com carteira de pacientes.

---

## 0. Por que este documento existe se já há CARE-001

O CARE-001 especifica o **Care Space**: um espaço criado em torno de um **Evento Assistencial**, com
finalidade, prazo de validade, Snapshot imutável e auditoria própria. É um prontuário colaborativo
**temporário** e **episódico**.

O que o plano de negócios monetiza é outra coisa, e está **abaixo** disso: uma **relação contínua**. A
nutricionista que acompanha a mesma pessoa por oito meses não abre um Care Space por consulta — ela tem um
vínculo que dura, e dentro dele manda plano alimentar, vê a evolução e recebe retorno.

```
Conta profissional
└── Vínculo            ← CARE-003 (esta especificação) — a relação, contínua, sem prazo
    └── Care Space     ← CARE-001 — o episódio, com finalidade, prazo e Snapshot
```

**O vínculo é o substrato sobre o qual o Care Space passa a existir.** Sem ele, o CARE-001 precisa recriar
identidade, autorização e auditoria a cada episódio. Por isso vem antes — não por ser mais importante.

Isto **não cria abstração nova onde uma existente serviria** (ADR-000, Estabilidade Arquitetural): o Care
Space não serve para relação contínua, porque sua semântica é de congelamento datado com expiração. São
lifecycles diferentes.

---

## 1. Três conflitos com o CARE-001, e como se resolvem

Nenhum é aparente à primeira leitura, e todos travariam a implementação se descobertos no meio dela.

### 1.1 "Todo Care Space é iniciado pelo paciente" × o profissional assinante convida

CARE-001 §3.1: *"Paciente é dono do acesso — todo Care Space é iniciado por ele."*
Plano §19.1: depois do plano pago, o profissional **também** pode convidar pacientes.

**Resolução — os dois sobrevivem, porque tratam de coisas diferentes.** Convidar é **pedir**. O vínculo é
**criado pelo aceite**, e o aceite é sempre do paciente. O profissional nunca cria acesso: ele emite uma
solicitação que pode ser recusada, e antes do aceite não vê absolutamente nada.

> **Invariante.** Nenhum vínculo existe sem um ato afirmativo do titular dos dados. Quem inicia a conversa é
> uma questão de produto; quem cria o acesso é sempre o paciente. **Isto não é negociável e não muda por plano.**

### 1.2 "Somente leitura, o profissional nunca altera a base do paciente" × o profissional envia documentos

CARE-001 §3.6 e §3.7: *"Somente leitura"*, *"Nunca alterar dados do paciente"*.
Plano §21: o profissional envia exames, receitas, planos alimentares e de treino, que integram o histórico.

**Resolução — o profissional PROPÕE; o aceite do paciente é o que ESCREVE.** O documento enviado fica numa
**caixa de entrada** (a tela `dashboard/dados-recebidos`, que já existe) e só entra no histórico quando o
paciente aceita. O profissional segue sem poder editar, apagar ou reclassificar nada que já esteja lá.

O CARE-001 já antecipa exatamente este mecanismo em §8: *"Incorporação só por ação explícita do paciente."*
CARE-003 aplica o mesmo princípio ao documento.

> **Invariante.** O profissional nunca tem escrita direta na base do paciente. Toda contribuição dele é uma
> **proposta** com autoria e data, que o paciente aceita ou recusa.

### 1.3 CARE-001 é Fase 4 × o plano põe o vínculo na Fase 1

CARE-001 se sequencia como **Fase 4**, depois da consolidação da representação longitudinal, com o argumento
— correto — de que *"o CARE não compartilha exames, compartilha a história clínica"*, e que compartilhar
história incompleta não tem valor.

O plano de negócios põe a Rede de Cuidado inicial na **Fase 1, de 0 a 3 meses**.

**Resolução — o argumento do CARE-001 vale para o Care Space, não para o vínculo.** O que exige história
consolidada é o **Dossiê**: montar automaticamente o contexto de uma consulta, sugerir por especialidade,
congelar um Snapshot. Nada disso está na Fase 1.

O que a Fase 1 entrega é menor e não depende de consolidação nenhuma:

| Entra na Fase 1 | Continua na Fase 4 (CARE-001) |
|---|---|
| Conta profissional e verificação de conselho | Care Space com finalidade e prazo |
| Vínculo com autorização e revogação | Snapshot Clínico imutável |
| Profissional envia documento; paciente aceita | Dossiê montado automaticamente |
| Profissional vê a evolução do paciente autorizado | Sugestão por especialidade e por profissional |
| — | Comparação entre snapshots, equipe multidisciplinar |

> **Decisão registrada.** O sequenciamento do CARE-001 permanece válido para o Care Space. O vínculo antecipa-se
> para a Fase 1 porque é pré-requisito comercial e porque não carrega as dependências que justificavam o adiamento.

---

## 2. Entidades

### 2.1 Conta profissional

Um perfil **distinto** do perfil pessoal, sobre o mesmo login. A mesma pessoa pode ter os dois: uma
nutricionista que também acompanha a própria saúde.

```
Conta profissional
├── user_id              (o mesmo login; o perfil é que é outro)
├── nome profissional
├── profissão            (medico · nutricionista · educador_fisico · fisioterapeuta · outro)
├── conselho             (CRM · CRN · CREFITO · CREF)
├── numero_registro + uf
├── status_verificacao   (pendente · verificado · recusado · suspenso)
├── verificado_em
├── especialidade        (livre)
└── plano                (acompanhamento · inteligencia · clinica)
```

**`public.practitioners` não serve como está.** Ele existe para identidade FHIR — representar o profissional
que *aparece num documento* (o solicitante de um exame), que na maioria dos casos **não tem conta na
SINTERA**. São dois conceitos diferentes com o mesmo nome, e confundi-los produziria o pior resultado
possível: um médico citado num laudo virando titular de acesso. A conta profissional é entidade nova, e o
vínculo entre ela e um `practitioner` — quando existir — é referência, nunca fusão (ADR-001: projeta,
não duplica).

### 2.2 Vínculo

```
Vínculo
├── paciente_user_id
├── profissional_id
├── status               (convidado · ativo · recusado · revogado · encerrado)
├── iniciado_por         (paciente · profissional)
├── escopo               (quais módulos o profissional enxerga)
├── criado_em · aceito_em · revogado_em
└── revogado_por         (paciente · profissional · sistema)
```

**Sem prazo de expiração.** É o que o distingue do Care Space. Termina por revogação, não por relógio.

### 2.3 Convite

Entidade própria, e não um vínculo em estado `convidado`, por uma razão: o convite pode existir **para quem
ainda não tem conta**. O profissional convida por e-mail ou telefone alguém que talvez nunca tenha entrado na
plataforma.

```
Convite
├── de                   (quem convidou)
├── para_contato         (e-mail ou telefone)
├── para_user_id         (nulo até a pessoa existir)
├── direcao              (paciente_convida_profissional · profissional_convida_paciente)
├── status               (enviado · aceito · recusado · expirado)
├── declaracao_relacao   (obrigatória quando o profissional inicia — §4.2)
└── expira_em
```

**O convite nunca carrega dado de saúde.** Nem no corpo, nem no assunto, nem em pré-visualização de
notificação. Um convite lido por quem não deveria não pode revelar nada além de que uma pessoa quis se
conectar a outra.

### 2.4 Documento proposto

Reusa `patient_documents` e `patient_document_files` (migrações 146 e 147), que já existem. O que falta é a
procedência e o estado de aceite:

```
+ enviado_por_profissional_id   (nulo quando foi a própria pessoa)
+ estado_aceite                 (proposto · aceito · recusado)
```

Nada de tabela paralela. O documento é o mesmo objeto; o que muda é quem o propôs.

---

## 3. Permissões

### 3.1 O que o profissional vê

| Antes do aceite | Depois do aceite |
|---|---|
| **Nada.** Nem o nome, nem se a pessoa tem conta, nem se abriu o convite | O que o escopo do vínculo permitir, sempre como leitura |

A regra de que o profissional não sabe se o convite foi aberto é deliberada: saber transforma a recusa em
constrangimento e o silêncio em cobrança.

### 3.2 Escopo

O escopo é do **paciente**, definido no aceite e alterável a qualquer momento. O padrão proposto para a Fase 1
é o mínimo que torna o vínculo útil: **medidas e composição corporal, exames, documentos e a linha do tempo**.
Fora do padrão por decisão: hábitos, ciclo menstrual, contracepção e saúde da mulher só entram se a pessoa
marcar — são os dados em que a exposição indesejada custa mais caro.

### 3.3 RLS

Toda leitura do profissional passa por uma política que exige vínculo `ativo` **e** o módulo dentro do escopo.
Revogação tem efeito imediato: não há cache de permissão, não há sessão que sobreviva à revogação.

> **Catraca de teste obrigatória.** Um teste que prove que um profissional **sem** vínculo ativo lê zero linhas
> de cada tabela no escopo. Não é teste de feliz caminho — é o teste que impede o vazamento.

---

## 4. Direção do convite

### 4.1 A regra

| Fase | Quem pode iniciar | Por quê |
|---|---|---|
| Lançamento e validação | **Só o paciente** | Resolve a partida a frio. O profissional entra já com alguém dentro, e o esforço de aquisição fica do lado que paga |
| Depois do plano pago | O paciente **e** o profissional assinante | Quem paga já usa a plataforma e tem interesse próprio em trazer a carteira |

**A mecânica é a mesma nos dois casos.** O que muda é uma permissão lida do plano — `pode_convidar_pacientes`
—, não um segundo fluxo. Implementar os dois de uma vez custa pouco; o que se controla é a liberação.

### 4.2 Salvaguardas quando o profissional inicia

1. O convite não contém nenhum dado de saúde.
2. O paciente pode recusar, e a recusa **não aparece ao profissional como pendência** — aparece como encerrada.
3. O paciente entra sempre no plano gratuito. Nada é cobrado por receber de um profissional.
4. O profissional **declara a relação assistencial existente** ao convidar, e a declaração fica registrada.
5. Limite de convites por período, para que a função não vire disparo em massa.

> **Dependência jurídica.** A questão 3 do Briefing Jurídico pergunta se o uso, pelo profissional, do contato
> que ele já detém é finalidade compatível ou exige consentimento novo. **Enquanto não houver resposta, só o
> paciente convida** — o que já é a regra da fase de lançamento, então isto não atrasa nada.

---

## 5. Verificação de registro no conselho

Antes de habilitar **envio de documento** ou **convite a paciente**, o registro tem de estar verificado.

| Profissão | Conselho |
|---|---|
| Médico | CRM |
| Nutricionista | CRN |
| Fisioterapeuta | CREFITO |
| Profissional de educação física | CREF |

O enum `public.identifier_kind` (migração 139) já tem `crm`. Faltam os outros três.

**O que a verificação impede:** que alguém não habilitado envie a um usuário um documento que ele vai ler como
clínico. Esse é o risco concreto, e ele não depende de má-fé — basta uma pessoa bem-intencionada se cadastrar
na categoria errada.

**Modelo aberto (ADR-000).** Profissional sem conselho obrigatório não é bloqueado da plataforma: ele fica com
o perfil sem verificação, **sem** poder enviar documento nem convidar, e o usuário vê essa condição declarada.
O desconhecido degrada, não quebra.

> **Dependência jurídica.** Questão 5 do Briefing: se o dever de verificar é jurídico ou diligência voluntária,
> qual a responsabilidade em caso de falha, e com que periodicidade reverificar. A verificação entra
> independentemente da resposta; o que a resposta define é a periodicidade e o texto exibido.

---

## 6. Planos e limites

| Plano profissional | Preço | Recebe pacientes | Envia documento | Vê evolução individual | Painel da carteira | Convida pacientes |
|---|---|---|---|---|---|---|
| Acompanhamento | Gratuito | **Ilimitado** | Sim | Sim | Não | Não |
| Inteligência da Prática | R$ 79,90/mês | **Ilimitado** | Sim | Sim | Sim | Sim |
| Clínica e equipe | A partir de R$ 249/mês | **Ilimitado** | Sim | Sim | Sim | Sim |

> **Regra que não pode ser violada.** **Receber paciente nunca é limitado por plano.** Se um profissional no
> plano gratuito atingisse um teto, o convite do paciente travaria — e o ciclo que faz a rede crescer morreria
> exatamente no ponto em que funciona. O que se cobra é o painel e o direito de iniciar, nunca a porta de entrada.

**Estado do billing, verificado.** `billing_plans`, `subscriptions`, `subscription_events`, `billing_invoices`
e `payment_methods` existem desde as migrações 116 a 118. Mas o único plano cadastrado é `free` com
`{"features":["*"],"modules":["*"]}` — não restringe nada — e a palavra `entitlement` não aparece em nenhum
lugar fora de `src/lib/billing/`. **Nenhuma tela lê entitlement, nem na Web nem no Mobile.** É a família
"especificado e nunca ligado": a fronteira existe e ninguém a consulta.

---

## 7. O que NÃO entra agora

| Não fazer | Por quê |
|---|---|
| Painel agregado da carteira | Finalidade de tratamento distinta. Questão 1 do Briefing Jurídico. E é um segundo produto para um usuário que ainda não paga, enquanto a hipótese central segue sem teste |
| Comunicação entre profissionais | Questão 2 do Briefing: se integra prontuário, quais obrigações de guarda decorrem |
| Care Space, Snapshot e Dossiê | CARE-001, Fase 4. Dependem da representação longitudinal consolidada |
| Cota de pacientes por plano | Quebraria a regra do §6 |

Quando o painel for construído, ele herda a fronteira do CARE-001 §5.2-B sem exceção: **mostra série, nunca
conclusão**. "Doze pacientes, mediana de -4,2 kg em seis meses" é estrutural. "Bons resultados com GLP-1" é
conteúdo clínico, e a SINTERA não o produz.

---

## 8. Ordem de construção

Cada etapa é verificável sozinha. Nenhuma depende de resposta jurídica, exceto onde marcado.

1. **Conta profissional** — perfil, profissão, conselho, registro. Sem poderes ainda.
2. **Verificação de conselho** — enum ampliado, fluxo de verificação, estados.
3. **Vínculo** — tabela, RLS, catraca de vazamento (§3.3).
4. **Convite do paciente ao profissional** — o fluxo que resolve a partida a frio.
5. **Tela Rede de Cuidado** — ligar "Profissionais", que hoje está `enabled: false`.
6. **Envio de documento pelo profissional** — proposta, caixa de entrada, aceite.
7. **Leitura da evolução pelo profissional** — dentro do escopo, só leitura.
8. **Paridade Mobile** — auditoria campo a campo antes de declarar concluído.
9. **Planos e entitlements** — cadastrar os cinco planos, fazer as telas lerem, aplicar limites.
10. **Permissão de convite pelo profissional** — depende da questão 3 do Briefing.

**Base única.** Tudo isto nasce na base compartilhada. O mecanismo pode divergir entre Web e Mobile; a
**decisão** — limites, opções, ordem, texto — não pode. Toda copy do vínculo mora no core, como já acontece
com o guia do Health Connect, pela mesma razão: escrita duas vezes, divergiria.

---

## 9. O que este documento não resolve

- **Não verifiquei** se a tela `dados-recebidos` comporta documento de terceiro sem reescrita.
- **Não verifiquei** a cobertura de `usage_events` para as métricas do experimento de coortes (§42 do plano).
- **Não defini** o modelo de dados do plano "Clínica e equipe" — vários profissionais sob uma conta é problema
  de tenancy e conversa com TENANT-001. Fica para quando houver demanda real.
- **Não defini** o que acontece com documentos propostos e não respondidos por muito tempo.
- A resposta jurídica pode **derrubar** a permissão de convite pelo profissional. O plano já funciona sem ela.

---

## 10. Referências

`docs/CARE-001_ESPACO_COLABORATIVO.md` · `docs/ADR-000_ARCHITECTURAL_PRINCIPLES.md` ·
`docs/ADR-001_PROJECAO_SEM_DUPLICACAO_SSOT.md` · `docs/BILLING-001_ASSINATURAS.md` ·
`docs/EVENTO_ASSISTENCIAL.md` · `docs/GOVERNANCA.md` · Mini Business Plan v1.0, 22/09/2026 ·
Briefing Jurídico, 22/09/2026, questões 1, 2, 3 e 5.
