# Protocolo de entrega — o que fazer antes de dizer "pronto"

**Origem:** pedido da fundadora em 31/08/2026, depois de mais uma homologação com vários defeitos:
*"É preciso estabelecer um padrão para que essas implementações sejam executadas de forma correta, sem gerar
tantos erros."*

Este documento não é uma promessa de cuidado. É a lista do que precisa ser **executado**, e as catracas que
tornam o esquecimento impossível.

---

## O diagnóstico: onde os defeitos realmente nascem

Classifiquei os defeitos das homologações de 28 a 31/08. **Duas causas explicam quase todos:**

### 1 · Escrito e nunca ligado

A função existe, está correta, tem teste — e **nada a chama**.

- O "Editar" da receita: `startEdit` escrita, com comentário explicando o defeito que corrigia, nunca chamada
- O mesmo em Monitoramento na Web, e em Documentos na Web
- `destinoDoAchado`: o `id` do achado carregado até a tela e descartado
- O detector de documento repetido: pronto no núcleo por dois dias, sem um consumidor
- O scroll do formulário: a `ref` declarada, a linha que a usa esquecida

### 2 · Campo novo não propagado

O campo é criado e **um consumidor fica para trás**.

- `atualizadas` chegou ao `IngestResult` e não ao diagnóstico → a plataforma se acusou de falhar após acertar
- As fontes (`strava`, `garmin`…) sem rótulo → "Outra origem" apagando a procedência
- `Distance` e `TotalCaloriesBurned` sem nome em português → nome de coluna em inglês na tela
- `prescribed_items` criado e não incluído na busca
- bpm e calorias no formulário e ausentes no salvar

### A lição

**Os testes de unidade verificam PEÇAS, e todos passavam.** Os defeitos moram nas **costuras** — entre a
função e a tela, entre duas telas, entre o dado e o rótulo, entre uma ponta e a outra.

Faltava catraca de costura.

---

## O protocolo

### Antes de qualquer commit

| # | Verificação | Comando |
|---|---|---|
| 1 | Typecheck nos três pacotes | `npx tsc --noEmit` em web, mobile e core |
| 2 | Suíte completa | `npx vitest run` |
| 3 | **Símbolo declarado e não usado** | `npx eslint src apps/mobile/src packages` |
| 4 | **Capacidade do núcleo sem consumidor** | `node scripts/audit-paridade.mjs` |

Os itens **3 e 4 são os que pegam a causa 1**, e eram os que eu não rodava sempre. O 3 revelou quatro defeitos
reais numa única tarde. **A lista de avisos precisa ficar em zero** — com descarte intencional marcado por
sublinhado — senão vira ruído e para de significar defeito.

### Ao acrescentar um CAMPO — a causa 2

Todo campo novo tem uma lista fixa de destinos. **Percorra a lista inteira, sempre:**

- [ ] A migração (se for coluna) — aditiva, com autorização
- [ ] O tipo no núcleo e o construtor da linha
- [ ] O DTO do api-client, as COLUNAS do `select`, o `update`
- [ ] O formulário — **nas duas pontas**
- [ ] O que a tela MOSTRA — **nas duas pontas**
- [ ] O **rótulo em português**, se o campo tem valores nomeados
- [ ] A **busca**, se for texto que a pessoa procuraria
- [ ] O **diagnóstico**, se for contagem que a pessoa lê
- [ ] Os **fixtures de teste** que constroem o tipo

### Ao acrescentar uma FUNÇÃO — a causa 1

Uma pergunta, antes de considerar pronto:

> **Quem CHAMA isto?**

Se a resposta é "ninguém ainda", não está pronto — está começado. E o linter vai dizer.

### Ao mexer numa TELA

- [ ] O resultado da ação fica **ao lado dela**? (dois defeitos desta semana: resposta desenhada fora da tela)
- [ ] O formulário que abre acima da lista **rola até ficar visível**?
- [ ] A tela **recarrega ao ganhar foco**? (telas de aba ficam montadas e mostram estado velho)
- [ ] Todo caminho de saída **diz alguma coisa**? (nenhum `return` mudo)

---

## As catracas que tornam isso executável

Protocolo que depende de memória falha. Estes testes falham a suíte:

| Catraca | O que impede |
|---|---|
| `campo-novo-propagado.ARCH` | Fonte, tipo ou categoria sem rótulo em português; capacidade que existe num cofre e não no outro |
| `acoes-obrigatorias.ARCH` | Tela que remove e não edita, sem exceção declarada |
| `anexo-formatos.ARCH` | Input declarando a própria lista de formatos |
| `base-unica.ARCH` | Regra escrita duas vezes, uma por ponta |
| `ponte-web-configurada` | Endereço de ponte ausente no build |

**`campo-novo-propagado` pegou um defeito real na primeira execução** — os três tipos sem tradução, que a
fundadora estava vendo na tela naquele momento.

---

## O que este protocolo NÃO resolve

Honestidade sobre o limite: **nada aqui substitui a homologação.**

Consigo verificar lógica pura, o que está no banco, e se o código está ligado. **Não consigo** verificar se
aparece na tela, se aparece no lugar certo, nem se a leitura acerta numa foto real.

Foi exatamente nessa fronteira que moraram todos os defeitos desta semana. O protocolo reduz o que chega até
lá — não elimina.

**A regra que fica:** distinguir *"escrito e testado"* de *"verificado"*. Só a segunda é "pronto".
