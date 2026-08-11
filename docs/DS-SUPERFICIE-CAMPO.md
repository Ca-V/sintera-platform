# Design System — Superfície do Campo de Formulário (`fieldClass`)

**Status:** fundação consolidada. Proprietário: **Design System** (`src/components/ui/`).

## Proprietário e conceito superior
A auditoria perguntou primeiro **"qual domínio é dono deste conceito?"** → o campo de
formulário é um primitivo do **Design System**, não de nenhum domínio de negócio. Os
consumidores violavam essa propriedade reimplementando o estilo do campo em cada página.

Antes de criar componentes por controle (Select/Textarea/DateField), validou-se o
**conceito superior**: acima de "Select"/"Textarea" está a **Superfície de Campo** — a
aparência/comportamento comum (borda, fundo, raio, tipografia, foco, erro, desabilitado).
`<input>`, `<select>`, `<textarea>` e `<input type="date">` são **variações** sobre essa
mesma superfície, não conceitos independentes. Logo, a fundação é **uma** superfície, não
N componentes. Reduz o número de CONCEITOS permanentes, não aumenta o de componentes.

`Input` era uma **implementação específica** (`forwardRef<HTMLInputElement>`, ligado a
`<input>`); não podia representar o conceito sem virar polimórfico e perder coesão. Por
isso a superfície foi **extraída** para `fieldClass`, e o `Input` passou a **reutilizá-la**
(evolução, não novo componente). Nenhum `Field`/`FormField` base foi criado.

## Fundação
```ts
// src/components/ui/field.ts
fieldClass(opts?: { error?: boolean; className?: string }): string
```
- `fieldClass()` = superfície canônica (fiel ao estilo dominante já em uso — estabilidade,
  não redesign).
- **Cobre todos os estados:** normal · foco · **erro** (`opts.error`) · **desabilitado**
  (`disabled:*`). Validado explicitamente ANTES de encerrar (a evolução do estado
  desabilitado entrou na fundação e todos os consumidores herdaram, sem repropagar).
- **Sem comportamento específico de controle:** é só classe; o que é de `input` (ícone,
  ref) permanece no `Input`. Válida para input/select/textarea/date.
- `className` sobrepõe por instância (largura, `bg-white`, padding) via twMerge — sem
  reintroduzir duplicação.

## Propagação
`Input` (DS) + todos os controles de campo do dashboard passam a derivar de `fieldClass`:
medicamentos, medidas, sinais-vitais, ciclo, condicoes, habitos, recursos (inclusive os
consts locais `inputCls`/`gradeCls` que reinventavam a superfície), omics, admin,
relatorio, configuracoes e o `PeriodSelector`.

## Critério de encerramento (por CONCEITO, não por contagem)
O sucesso **não** se mede por "quantas ocorrências foram convertidas". O critério é:
**não existe mais nenhuma implementação paralela da superfície de campo dentro do escopo
desta causa.** Reauditoria: dentro do escopo (superfície de campo do dashboard + controles
do DS), zero implementações paralelas — todo consumidor usa `fieldClass`.

## Fronteira deliberada (decisão de produto registrada)
Existe uma **segunda família de superfície** (auth/perfil): `bg-white px-4 py-3 ring-2
hover:border-petal-light` em `ProfileEditor` e telas de login/onboarding. NÃO é a duplicação
desta causa e convergi-la mudaria a aparência das telas de auth — **decisão de produto**,
não implementada aqui. Se uma auditoria futura comprovar que essa família também está
duplicada, será uma causa própria.

## Preparação para as próximas fases
Novos módulos e clientes (e integrações que exponham formulários) reutilizam `fieldClass`;
qualquer evolução de foco/erro/dark-mode/acessibilidade do campo acontece **num só lugar**.
