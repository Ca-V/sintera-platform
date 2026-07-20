# NOV-001 — Infraestrutura de Novidade (permanente · fonte única)

**Status:** APROVADO (20/07) — em implementação. Sob [[ADR-000]]. Nasce da diretriz da fundadora (20/07): o conceito de
"novo" deve ser **infraestrutura reutilizável**, não uma solução pontual; reconhecido **naturalmente ao ver o
conteúdo** (sem botão "dispensar"); **uma só fonte de verdade** para banner, selos "Novo" e futuras notificações.

## Diretrizes de produto (fundadora, na aprovação)
1. **Conceito único de "novo" em TODA a SINTERA.** Nenhum módulo implementa lógica própria de novidade. A plataforma
   inteira responde à mesma pergunta: **"o usuário já tomou conhecimento deste conteúdo?"**
2. **Responsabilidade por superfície:** o **Painel Inicial é apenas resumo** — informa que há novidades, mas **não
   consome nem marca visto**. O **reconhecimento acontece no módulo onde o conteúdo existe** (Composição, Exames,
   Documentos…): ao acessar o domínio, aquele conteúdo passa a ser "visto".
3. **Banner e selos derivam da MESMA fonte.** O Painel apenas reflete o estado; nunca o altera.
4. **Capacidade transversal**, não específica de wearables: serve igualmente a novos exames, documentos, registros
   importados automaticamente e qualquer conteúdo incorporado sem ação direta do usuário.

## Princípio
> **Algo é "novo" enquanto o usuário ainda não VIU. O reconhecimento acontece naturalmente ao abrir a superfície onde
> aquele conteúdo vive — não por uma ação dedicada de "dispensar".**

## Conceitos (fonte única)
- **Fluxo (stream) = DOMÍNIO de novidade:** um domínio da plataforma (alinhado à Sidebar — [[sidebar_ssot_taxonomia]])
  onde conteúdo pode chegar de forma **automática**. Ex.: `body_composition` (Composição Corporal) hoje; no futuro
  `exams` (Exames), `documents` (Documentos), `medications` (Medicamentos), etc. **Não é um tipo técnico de
  integração** (wearable, conector X, upload): o mecanismo pelo qual o conteúdo chegou é detalhe de `countUnseen`,
  nunca a identidade do fluxo. Assim a infraestrutura permanece genérica — novos domínios entram sem redesenho, e um
  mesmo domínio acomoda várias fontes automáticas ao longo do tempo apenas ampliando o filtro de contagem.
- **Marca de "visto" por (usuário × fluxo):** o instante até quando o usuário já viu aquele fluxo. **SSOT** numa única
  tabela `content_seen(user_id, stream, seen_at)`.
- **Não-visto (novidade):** itens do fluxo com **ingestão (`created_at`) posterior** à marca de visto. Deriva-se por
  consulta — nunca duplicado.

## Superfícies
- **Superfície de AVISO** (ex.: Painel Inicial): apenas **reflete** a novidade (lê a contagem). **Não marca visto.** O
  aviso some sozinho quando o usuário vê o conteúdo na superfície de consumo.
- **Superfície de CONSUMO** (ex.: Composição Corporal para dados corporais): mostra os itens com **selo "Novo"** e, ao
  ser aberta, **marca o fluxo como visto** — *depois* de exibir as novidades desta visita (então esta visita destaca; a
  próxima já não). É o "reconhecimento natural durante a navegação".

## Contrato (uma só fonte de verdade)
- **Servidor** `src/lib/novelty/` (registro de fluxos + serviço puro/IO):
  - `NOVELTY_STREAMS`: cada fluxo declara como **contar/listar não-visto** (ex.: `wearable_body` = `body_metrics` com
    `source='wearable'` e `created_at > seen`).
  - `getNovelty(userId)` → `{ [stream]: { count, since } }` (read-only; opcionalmente aciona o refresh das fontes
    automáticas — hoje o sync de conectores, com throttle — para a contagem já incluir o que acabou de chegar).
  - `markSeen(userId, stream)` → upsert `content_seen.seen_at = agora`.
- **API:** `GET /api/novelty` (contagens; read-only) · `POST /api/novelty/seen` `{ stream }` (marca visto).
- **Cliente** `useNovelty()`: no mount, busca as contagens; expõe `{ counts, sinceOf(stream), markSeen(stream) }`.
  - **Banner** (Painel Inicial): `countOf('body_composition') > 0` → "sua história cresceu: N". **Não** marca visto.
  - **Selo "Novo"** (Composição): destaca itens com `created_at > sinceOf('body_composition')`; no mount, `markSeen('body_composition')`.

## Reúso (permanente)
O mesmo mecanismo serve, sem nova lógica, para: **novos dados de wearables · novos exames · novos documentos · novas
sincronizações · qualquer conteúdo incorporado automaticamente.** Adicionar um fluxo = uma entrada em `NOVELTY_STREAMS`
+ apontar sua superfície de consumo (que chama `markSeen`). Banner/selos/futuras notificações leem a MESMA fonte.

## O que muda em relação ao que existe hoje (corrige o bug)
- **Remove** a atualização de "visto" no carregamento de página / em cada sync (a causa do bug: a janela fechava antes
  da percepção). O "visto" passa a avançar **só ao ver a superfície de consumo**.
- **Aposenta** `sessionStorage`/`?novos`/`throttle de sessão` como fonte da novidade — tudo deriva do servidor.
- `profiles.last_seen_at` (migração 131) é **substituído** por `content_seen` (por fluxo). Migração aditiva; 131 pode ser
  deixada inerte ou migrada.

## Hipóteses a validar no Preview (produto)
Explicitadas para o teste — não alteram o comportamento agora; orientam a decisão de encerramento.
1. **Escala do conceito de fluxo.** O fluxo representa um DOMÍNIO de novidade (não um tipo de integração). Validar que
   a taxonomia cresce sem redesenho: adicionar `exams`/`documents`/`medications` deve ser uma entrada em
   `NOVELTY_STREAMS` + apontar a superfície de consumo, sem tocar em `content_seen`, API, hook ou banner.
2. **Critério de "conteúdo reconhecido".** Hoje o reconhecimento é **abrir a superfície de consumo** (Composição).
   Validar se *abrir a página já corresponde à percepção natural de "tomei conhecimento"*, ou se será preciso um
   critério mais refinado (ex.: os pontos novos entrarem no viewport / um breve dwell / rolar até a evolução).
   **Ponto de extensão isolado:** o critério mora num único lugar — *quando/onde* `markSeen(stream)` é chamado. Refiná-lo
   NÃO toca a infraestrutura (`content_seen`, `getNovelty`, streams, banner, selos permanecem intactos). Se a experiência
   se mostrar natural, mantém-se; caso contrário, troca-se só o gatilho do `markSeen`.

## Critério de conclusão
Comportamento observado no **Preview**: (1) com dado novo não-visto, o **Painel Inicial** mostra o aviso e a **Composição**
mostra os selos "Novo"; (2) ao **abrir a Composição** (ver o conteúdo), o aviso do Painel some sozinho na próxima visita e
os selos deixam de marcar aqueles pontos; (3) sem clique de "dispensar". Só então: concluído.
