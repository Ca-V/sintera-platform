# HOMOLOG-CICLO4 — Homologação Mobile (Android), 28 a 30/08/2026

**Documento vivo.** Registra o que a fundadora encontrou testando o aplicativo num aparelho real, a causa de
cada achado e o estado da correção. Existe no repositório, e não só na conversa, porque o projeto será
transferido a outra equipe: um defeito sem a sua causa registrada volta a acontecer.

**Aparelho da homologação:** Samsung, **Android 9** — o piso do que o Health Connect suporta. Comportamento
estranho nesse aparelho pode ser limitação da versão, não defeito da plataforma.

---

## Ordem de correção, e o critério

O critério não é a ordem em que os achados chegaram, e sim **o que a pessoa perde enquanto o defeito existe**:

1. **Dado errado com aparência de certo** — o pior de todos. Um número que parece transcrito e não é vai para um
   relatório levado ao médico.
2. **Capacidade que não funciona** — a pessoa tenta e não consegue.
3. **A plataforma sabe algo e não diz** — funciona, mas a pessoa não descobre. Foi a causa mais frequente
   desta semana.
4. **Cosmético** — incomoda, não impede.

---

## Achados

| # | Achado | Causa | Estado |
|---|---|---|---|
| 1 | Busca não achava "dermatologista", que está em 3 eventos | Nomes de coluna errados (`type`/`date` em vez de `event_type`/`event_date`), e mais 2 iguais. O Supabase não lança nesse caso — devolve vazio, e eu ignorava o campo de erro. **3 de 12 domínios estavam mortos em silêncio** | ✅ Corrigido |
| 2 | "Editar" numa receita já salva não fazia nada | Funcionava; era **invisível**. O formulário abre acima da lista e abria fora da tela | ✅ Corrigido **na segunda tentativa** — a primeira declarou a `ref` e nunca a usou (ver o fim deste documento) |
| 3 | No atestado apareceu a **clínica** em vez do médico | O classificador tinha de **escolher** entre profissional e instituição, e escolheu a instituição | ✅ Corrigido — passou a transcrever os **dois**, e quem decide qual vem na frente é a plataforma |
| 4 | Health Connect dizia "não disponível" e parava aí | Mensagem certa e inútil: não dizia como resolver | ✅ Corrigido — motivo + botão que abre a Play Store no app certo |
| 5 | Não achou o app: procurou "Health Connect", encontrou "Saúde Connect" | O Google traduz o nome; nós só dizíamos o nome em inglês | ✅ Corrigido — os dois nomes na tela |
| 6 | Autorizar não trazia nada, sem explicação | Autorizar a SINTERA é metade; a outra é dentro do Strava/Whoop/Oura | ✅ Corrigido — passo a passo por app, com destaque quando volta vazio |
| 7 | Tocar na aba abria a última tela, não o menu da categoria | Comportamento padrão do navegador preserva o histórico da aba | ✅ Corrigido |
| 8 | **Nome do medicamento não aparece na receita** — "o item mais importante" | A leitura transcrevia só emissor e data, e não havia onde guardar | ✅ Corrigido — o item vem PRIMEIRO no cartão |
| 9 | Adicionou a mesma receita da semana passada e nada avisou | O detector existia no núcleo desde 28/08 e **não tinha um único consumidor** | ✅ Corrigido — avisa antes de gravar, com três saídas |
| 10 | Médico e clínica deveriam ser campos separados | Um campo só (`issuer`) obrigava a **escolher**, e quem escolhia era o classificador | ✅ Corrigido — dois campos; a leitura transcreve os dois e a plataforma decide qual vem na frente |
| 11 | Receitas não geram entrada em Medicamentos | Não existia o fluxo | ✅ Corrigido — proposta de um toque, com destino trocável |
| 12 | Recuo de "Minha Saúde" é sutil demais | — | 🔵 Cosmético, adiado por escolha dela |
| 13 | "Apertei autorizar e sincronizar, nada aconteceu" — **relatado duas vezes**, a segunda já com a permissão do Samsung Health concedida | A resposta era desenhada **no fim do cartão**, depois dos seis cartões de fonte que o passo a passo acrescentou — fora da tela. E um dos caminhos (aparelho não responde) limpava a mensagem e voltava, sem dizer nada | ✅ Corrigido — resultado colado no botão, e nenhum caminho termina em silêncio |
| 14 | "Nada novo" continuou depois de tudo autorizado | O cofre está **genuinamente vazio** — a fundadora abriu o Health Connect e TODAS as categorias diziam "Não há dados". Causa: o **Samsung Health exige Android 10** e o aparelho tem 9, então nunca escreveria; e o Strava só envia atividades gravadas DEPOIS de ligado | ✅ Explicado — Samsung Health sai do guia abaixo do Android 10, e a tela passa a dizer como testar sem esperar |
| 15 | **A ingestão funcionou** — 12 atividades do Strava entraram pelo Health Connect até a nuvem. Todas como "Outra atividade", sem distância, sem calorias e sem data na tela | `exerciseType` chega como **número** (79 = caminhada) e a leitura só aceitava texto → degradava para 'outro'. Distância e energia são **registros separados**, e nós líamos um campo dentro da sessão que nunca existiu | ✅ Corrigido |
| 16 | O que já entrou errado continuaria errado | A ingestão pula o que já existe. Correção de leitura não alcançava o passado | ✅ Corrigido — completa o vazio e corrige o palpite, nunca sobrescreve |

---

## O marco: a primeira ingestão real

Em 30/08 o caminho **Strava → Health Connect → aparelho → nuvem** funcionou de ponta a ponta pela primeira
vez. Doze atividades reais, com proveniência, sem duplicar. Isso vale registrar tanto quanto os defeitos: era
a capacidade central da fase, e nunca tinha sido verificada fora de teste.

O que ela revelou, e é a lição que fica para quem continuar:

> **Um caminho de degradação silencioso esconde ERRO DE LEITURA tão bem quanto esconde dado desconhecido.**

Os dois defeitos do achado 15 estavam protegidos pelo mesmo mecanismo que existe para ser gentil com o
desconhecido. `exerciseType` numérico virava `null`, `null` virava `'outro'`, e `'outro'` é um valor legítimo —
nada nunca reclamou. Um comentário no código *afirmava* que a biblioteca resolvia o código para nome. Não
resolve, e a afirmação nunca foi verificada contra um dado real.

Onde há degradação silenciosa, é preciso um teste com o formato REAL da fonte — não com o formato que se
supõe que ela use.

---

## O limite do aparelho de homologação

O Samsung Galaxy com **Android 9** consegue instalar o Health Connect (que exige Android 9), mas **não consegue
alimentá-lo com o Samsung Health** (que exige Android 10). Nesse aparelho, a única fonte que escreve é o
**Strava**, e só a partir da próxima atividade gravada.

Isso não é defeito da plataforma, e é preciso não confundir os dois: um aparelho no piso do suportado prova
que a SINTERA **degrada corretamente**, mas não prova que a ingestão funciona. Para provar a ingestão é preciso
uma fonte que efetivamente escreva.

**Como testar sem esperar:** gravar uma atividade de dois minutos no Strava e salvar. É a única forma de gerar
dado novo por vontade própria — estas fontes enviam o que acontece depois de ligadas, quase nunca o que já era
antigo. A tela passa a dizer isso quando a sincronização volta vazia.

---

## O padrão que se repetiu — resposta longe da ação

Os achados **2** e **13** são o mesmo defeito com roupas diferentes: a pessoa toca num lugar e a plataforma
responde noutro, fora da tela. Nos dois casos ela relatou "não funciona", e nos dois casos funcionava.

É um defeito que os testes não pegam — o estado muda, a asserção passa, e ninguém vê nada. E é traiçoeiro
porque **nasce depois**: os dois lugares estavam próximos quando foram escritos, e afastaram-se quando algo foi
inserido no meio (a lista de documentos no primeiro caso, os seis cartões do passo a passo no segundo).

**Regra para quem continuar:** o resultado de uma ação pertence ao lado dela. Ao inserir qualquer bloco entre um
controle e a sua resposta, mover a resposta faz parte da alteração — não é acabamento. Longe demais equivale a
não existir.

---

## Migração 151 — aplicada em 30/08, autorizada explicitamente

Os itens **8, 9, 10 e 11** dependiam de três colunas em `patient_documents`. A fundadora autorizou com a
condição de ser **só aditiva**: "não desestruture ou altere outras coisas da plataforma".

| Coluna | Para quê |
|---|---|
| `prescribed_items` | Os medicamentos transcritos da receita |
| `professional_name` | O médico, separado da instituição |
| `institution_name` | A clínica, separada do médico |
| `document_sha256` | **Já existia** — o detector agora também compara por emissor e data |

Conferido antes e depois: os 4 documentos existentes ficaram idênticos. `issuer` permanece com o conteúdo que
tinha — dividi-lo automaticamente entre profissional e instituição exigiria adivinhar qual dos dois está
escrito ali, e adivinhar sobre um registro de saúde já existente é o que a plataforma não faz.

---

## Decisão de produto (item 11) — resolvida em 30/08

**Autorizada pela fundadora**, com o refinamento dela: a receita direciona para o que ela prescreve —
medicamento, suplemento ou dispositivo.

**Como ficou:** ao salvar uma receita com itens transcritos, aparece a lista **já marcada** e com o destino
**já escolhido**. Confirmar é um toque; o destino é um botão que se troca. "Agora não" não perde nada.

**Por que não salva sozinha:** criar registro clínico a partir de leitura automática é a plataforma
*produzindo* conteúdo, não organizando (ADR-000 · RDC 657). E um erro de transcrição ("50mg" lido como "5mg")
viraria um registro que ninguém conferiu e que vai num relatório ao médico. O toque custa um segundo e é o que
separa transcrever de prescrever.

**Onde cada coisa vai:** medicamento e suplemento para `medications` (por `kind`); dispositivo e produto para
**Recursos de Saúde**, que é o domínio deles. Forçá-los para Medicamentos criaria um dispositivo que não
aparece onde a pessoa vai procurá-lo.

---

## Dois consertos que nunca foram ligados

Achados em 30/08, ao passar o linter nos arquivos alterados:

- **O scroll do "Editar" no Mobile.** A `ref` e o comentário explicando a correção existiam; as duas linhas que
  fazem o trabalho, não. **Eu declarei o achado 2 corrigido e ele não estava.**
- **"Editar" não existia na Web.** `Pencil`, `updateDocument` e `editando` estavam todos importados e nenhum
  era usado.

São o mesmo padrão do `padrao_especificado_nunca_ligado`, cometido aqui dentro. A pergunta que os pegaria é a
mesma de sempre: **quem CHAMA isto?** Um símbolo declarado e nunca referenciado é a assinatura do defeito — e o
linter a reconhece de graça.

---

## O que a homologação PROVOU funcionando

Vale registrar tanto quanto os defeitos, porque foram capacidades que nunca tinham sido verificadas:

- **Leitura assistida da receita** — funcionou pela primeira vez. Leu emissor e data, e usou a data escrita no
  papel (setembro/2025) em vez da data do arquivo (agosto/2026). A regra de transcrição fazendo o que promete.
- **Degradação do Health Connect** — o aparelho sem o app mostrou "não disponível" e o resto da tela continuou
  de pé, em vez de quebrar. Princípio de disponibilidade universal, verificado.
- **Editar e Excluir** nos cartões de documento.
- **Busca** encontrando registros da pessoa e seções, com agrupamento por natureza.
