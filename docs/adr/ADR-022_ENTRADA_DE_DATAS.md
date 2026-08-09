# ADR-022 — Entrada de datas: componentes nativos por plataforma sob contrato único

**Status:** Aceito (2026-08-09) — decisão da fundadora.
**Relaciona-se com:** [[ADR-011]] (componentes cross-platform), [[ADR-001]] (SSOT), DATE-001 (infra temporal única), Fase C · bloco C-4.

## Contexto

A entrada de datas estava divergente entre as plataformas:

- **Web:** `<input type="date">` nativo (~23 pontos) — calendário do navegador, localizado, acessível, zero dependência.
- **Mobile:** campo de texto `<Input>` "AAAA-MM-DD" (~10 telas) — digitação manual, propensa a erro, sem calendário. Lacuna de paridade funcional.

React Native (core) e Expo SDK 54 **não** fornecem um date picker nativo. A regra de datas já é fonte única em `@/lib/date` (DATE-001).

## Decisão

**A entrada de datas utiliza o componente NATIVO de cada plataforma, consumido por um CONTRATO ÚNICO compartilhado, mantendo toda a lógica temporal centralizada em `@/lib/date`.**

Concretamente:

1. **Contrato único** — existe um componente de plataforma `DatePicker` com o MESMO contrato nas duas plataformas: `value`/`onChange` em **ISO (YYYY-MM-DD)**, `min`, `max`, `disabled`, `aria-label`. O restante da aplicação não conhece a diferença de implementação.
2. **Implementação por plataforma:**
   - Web → envolve `<input type="date">` (nativo do navegador).
   - Mobile → envolve `@react-native-community/datetimepicker` (padrão de facto, versionado e suportado pelo Expo).
3. **Nenhuma tela importa a biblioteca diretamente.** As telas consomem **apenas** o `DatePicker` da plataforma. O único ponto que conhece `DateTimePicker` é o primitivo `DatePicker` do Mobile.
4. **Lógica temporal permanece em `@/lib/date`** (DATE-001). O `DatePicker` é só apresentação/entrada; não reimplementa regra de data.
5. **Contrato extensível** — preparado para evoluções futuras do MESMO contrato, sem que as telas mudem: data mínima/máxima (já previstas), intervalo, bloqueio de datas, seleção de período.

## Justificativa (avaliação objetiva da dependência)

- **Componente nativo já no stack?** Não — RN core e Expo SDK 54 não trazem date picker; o único recurso zero-dep era o texto mascarado (a própria lacuna).
- **Uso em 1 caso ou vários?** Vários — ~10 telas Mobile. Justifica base de plataforma, não solução pontual.
- **Manutida/estável?** `@react-native-community/datetimepicker` é o padrão de facto, mantido pela comunidade RN, versionado e suportado pelo Expo (`expo install`), incluído no Expo Go. Alta estabilidade.
- **Benefício × manutenção?** Benefício alto e amplo (calendário nativo acessível/localizado × digitação manual); ônus real é operacional (rebuild EAS para validar), não arquitetural. Coerente com a Web, que já usa o calendário nativo do navegador.

## Consequências

- **Positivas:** experiência de data consistente e nativa nas duas plataformas; fim da digitação "AAAA-MM-DD"; ponto único de evolução; nomenclatura e formato (ISO) unificados; lógica temporal intacta em `@/lib/date`.
- **Custos:** 1 módulo nativo + 1 entrada de config-plugin no Mobile; a validação da experiência (abrir/selecionar/cancelar/Android×iOS/persistência/a11y/localização) ocorre **em device** (não no sandbox), na homologação da Fase D.

## Alternativas consideradas

- **DatePicker próprio, zero-dependência** (calendário/seletores a partir dos primitivos): evita a dependência, mas reinventa um calendário (mais código e bugs próprios) e não entrega o calendário nativo do SO. Rejeitada.
- **Manter texto mascarado + validação:** não fecha a lacuna de paridade (continua digitação). Rejeitada como padrão oficial.

## Orientação para o futuro

Esta decisão passa a orientar **todas** as futuras implementações de entrada de data: usar o `DatePicker` da plataforma, nunca a biblioteca diretamente; qualquer novo recurso de data evolui o **contrato único**, não a tela.
