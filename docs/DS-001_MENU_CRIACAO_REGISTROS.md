# DS-001 — Menu de Criação de Registros (`<CreateRecordMenu>`)

> Padrão oficial de UI da SINTERA para **criar qualquer registro** na plataforma.
> Aprovado pela fundadora (2026-07-08). Componente: `src/components/ui/CreateRecordMenu.tsx`.
> Herda [[UX-001]] §1.10 (meios padronizados) e §1.11 (orientação por objetivo). Consome [[CAP-001]].

## Conceito

**Não é um menu de upload — é o menu de CRIAÇÃO DE REGISTROS.** O foco deixa de ser
*"como enviar um documento"* e passa a ser **"como você deseja cadastrar este item?"**.
Sempre que a pessoa quiser criar qualquer informação na SINTERA, ela primeiro escolhe **como**;
o sistema faz o resto:

```
Objetivo ("Novo exame")
   ↓
Como deseja cadastrar?
   ↓
Selecionar arquivo · Tirar foto · Digitar manualmente · Falar
   ↓
IA processa
   ↓
Formulário já preenchido
   ↓
A pessoa revisa → Salvar
```

## Regra oficial

Todo botão **"Novo…"**, **"Cadastrar…"** ou **"Adicionar…"** abre **exatamente** este menu,
**sempre na mesma ordem** (memória muscular — quem aprende em Medicamentos já sabe em Exames,
Recursos, Despesas, Consultas):

| Ordem | Ícone | Rótulo |
|---|---|---|
| 1 | 📄 | **Selecionar arquivo (PDF ou foto)** |
| 2 | 📷 | **Tirar foto** |
| 3 | ⌨️ | **Digitar manualmente** |
| 4 | 🎤 | **Falar** |

- **Título fixo:** "Como deseja cadastrar?"
- **Ordem fixa:** arquivo → foto → manual → voz (ordem natural de uso). Um módulo pode **omitir**
  meios que não fazem sentido, mas **nunca reordena** os que exibe.
- **Rótulo do botão** comunica a intenção ("Novo exame", "Novo medicamento ou suplemento"), não o
  mecanismo ("Adicionar documento").

### Exceção — 1 método só
- **2+ métodos disponíveis:** mostra o menu "Como deseja cadastrar?".
- **1 único método:** o clique aciona **direto** aquele método (sem menu).

## Métodos por módulo (referência)

| Módulo | Selecionar arquivo | Tirar foto | Digitar manual | Falar |
|---|:--:|:--:|:--:|:--:|
| Medicamentos e Suplementos | ✅ | ✅ | ✅ | ✅ |
| Exames | ✅ | ✅ | ➖ | ➖ |
| Recursos de Saúde | ✅ | ✅ | ✅ | ✅ |
| Consultas (evento) | ✅ | ✅ | ✅ | ✅ |
| Despesas | ✅ | ✅ | ✅ | ✅ |
| Condições de Saúde | ➖ | ➖ | ✅ | ✅ |

*(Futuro: módulos com OCR/IA documental somam arquivo/foto; módulos puramente autorrelatados ficam
em manual/voz. Condições, por só ter manual+voz, mostra o menu com esses dois.)*

## API do componente (declarativa e desacoplada)

O módulo **declara os métodos** e **recebe qual foi escolhido** (`onSelect`). O componente é
**agnóstico de domínio** — não conhece Medicamentos, Exames nem nada; quem decide o que fazer é o módulo.

```tsx
<CreateRecordMenu
  label="Novo exame"                         // intenção (obrigatório)
  methods={['file', 'camera', 'manual']}     // meios padrão disponíveis (renderizados na ordem canônica)
  onSelect={(method, file) => { … }}         // 'file'|'camera' (com file) · 'manual' · extra.key
  voice={<VoiceInput … />}                    // opcional → "Falar" (elemento interativo)
  extras={[{ key: 'capture-center', label: 'Importar do Centro de Captura', icon: Inbox }]}  // crescimento futuro
  fileAccept=".pdf,.jpg,.jpeg,.png"
  busy={uploading} busyLabel="Enviando…"
/>
```

- **Desacoplado:** `onSelect(method, file?)` devolve **o método escolhido** (`file` presente em
  `file`/`camera`). O módulo decide o resto (extrair, abrir formulário, iniciar voz…). O componente
  **não** executa lógica de domínio.
- **Configurável:** `methods` + `voice` + `extras`. Zero conhecimento de domínio no componente.
- **Extensível por configuração:** novos meios — **Importar do Centro de Captura · Apple Health ·
  Google Health Connect · WhatsApp · E-mail · Scanner/TWAIN · integrações** — entram via `extras`,
  **sem alterar a estrutura** do componente.
- **Visual idêntico** em todo módulo (mesma largura, espaçamento, tipografia, ícones, animação e
  comportamento) — garantido por ser **um só componente**. **Ordem fixa** e **regra 1×2+** embutidas.
- O botão também é **alvo de arrastar** (drop → `onSelect('file', file)`).

Consumidores atuais: **Medicamentos**, **Exames**. Próximos (triviais, só declarar `methods`):
Recursos, Despesas, Consultas, Condições.

## Critério de sucesso (obrigatório)

A partir desta implementação, **qualquer nova funcionalidade que crie um registro** na SINTERA
**deve** usar o `CreateRecordMenu` — **salvo** quando existir **um único método** de cadastro, caso
em que esse método é aberto diretamente (a própria regra 1×2+ do componente). Não se recria este
menu por módulo; ele é o ponto único de criação de registros.
