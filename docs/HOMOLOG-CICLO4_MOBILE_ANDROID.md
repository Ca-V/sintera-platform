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
| 2 | "Editar" numa receita já salva não fazia nada | Funcionava; era **invisível**. O formulário abre acima da lista e abria fora da tela | ✅ Corrigido |
| 3 | No atestado apareceu a **clínica** em vez do médico | O prompt tratava profissional e instituição como equivalentes | ✅ Corrigido — receita/atestado/relatório → profissional; laudo/pedido → laboratório |
| 4 | Health Connect dizia "não disponível" e parava aí | Mensagem certa e inútil: não dizia como resolver | ✅ Corrigido — motivo + botão que abre a Play Store no app certo |
| 5 | Não achou o app: procurou "Health Connect", encontrou "Saúde Connect" | O Google traduz o nome; nós só dizíamos o nome em inglês | ✅ Corrigido — os dois nomes na tela |
| 6 | Autorizar não trazia nada, sem explicação | Autorizar a SINTERA é metade; a outra é dentro do Strava/Whoop/Oura | ✅ Corrigido — passo a passo por app, com destaque quando volta vazio |
| 7 | Tocar na aba abria a última tela, não o menu da categoria | Comportamento padrão do navegador preserva o histórico da aba | ✅ Corrigido |
| 8 | **Nome do medicamento não aparece na receita** — "o item mais importante" | A leitura transcrevia só emissor e data | 🟡 Transcrição pronta; **falta coluna no banco** |
| 9 | Adicionou a mesma receita da semana passada e nada avisou | `document_sha256` existe e **nunca é preenchida**; não havia detector para documentos | 🟡 Detector pronto; **falta coluna e fiação** |
| 10 | Médico e clínica deveriam ser campos separados; em exame vale o **solicitante**, não quem laudou | O modelo tem um campo só (`issuer`) | 🟡 Analisado; **falta coluna** |
| 11 | Receitas não geram entrada em Medicamentos | Não existe o fluxo | 🔴 Decisão de produto pendente |
| 12 | Recuo de "Minha Saúde" é sutil demais | — | 🔵 Cosmético, adiado por escolha dela |
| 13 | "Apertei autorizar e sincronizar, nada aconteceu" — **relatado duas vezes**, a segunda já com a permissão do Samsung Health concedida | A resposta era desenhada **no fim do cartão**, depois dos seis cartões de fonte que o passo a passo acrescentou — fora da tela. E um dos caminhos (aparelho não responde) limpava a mensagem e voltava, sem dizer nada | ✅ Corrigido — resultado colado no botão, e nenhum caminho termina em silêncio |

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

## Bloqueado por autorização

Os itens **8, 9 e 10** dependem de **uma migração aditiva** em `patient_documents`:

| Coluna | Para quê |
|---|---|
| `prescribed_items` | Os medicamentos transcritos da receita |
| `professional_name` | O médico, separado da instituição |
| `document_sha256` | **Já existe** — falta passar a preenchê-la |

Aditiva: acrescenta colunas vazias, não altera nem apaga nada. Os documentos existentes seguem intactos.

---

## Decisão de produto pendente (item 11)

Ao ler uma receita e encontrar "Losartana 50mg", a plataforma deveria **oferecer** criar o medicamento em
Medicamentos, já vinculado à receita?

A favor: fecha o ciclo que a fundadora desenhou, e a informação já foi transcrita — não registrar obriga a
digitar de novo o que está na tela.

Contra: cria registro clínico a partir de leitura automática. Mesmo perguntando antes, é mais intrusivo do que
tudo o que a plataforma faz hoje.

**Recomendação:** oferecer, nunca criar sozinho — e mostrar o texto transcrito ao lado, para a pessoa conferir
contra o papel antes de aceitar.

---

## O que a homologação PROVOU funcionando

Vale registrar tanto quanto os defeitos, porque foram capacidades que nunca tinham sido verificadas:

- **Leitura assistida da receita** — funcionou pela primeira vez. Leu emissor e data, e usou a data escrita no
  papel (setembro/2025) em vez da data do arquivo (agosto/2026). A regra de transcrição fazendo o que promete.
- **Degradação do Health Connect** — o aparelho sem o app mostrou "não disponível" e o resto da tela continuou
  de pé, em vez de quebrar. Princípio de disponibilidade universal, verificado.
- **Editar e Excluir** nos cartões de documento.
- **Busca** encontrando registros da pessoa e seções, com agrupamento por natureza.
