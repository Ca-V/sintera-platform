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

## API do componente

```tsx
<CreateRecordMenu
  label="Novo exame"              // intenção (obrigatório)
  onFile={processFile}            // arquivo · foto · arrastar (obrigatório)
  fileAccept=".pdf,.jpg,.jpeg,.png"
  busy={uploading} busyLabel="Enviando…"
  onManual={() => abrirFormulario()}   // opcional → "Digitar manualmente"
  showCamera                            // default true → "Tirar foto"
>
  <VoiceInput … />                       {/* opcional → "Falar" */}
</CreateRecordMenu>
```

O botão também é **alvo de arrastar** (drop → `onFile`). Consumidores atuais: **Medicamentos**,
**Exames**. Próximos (triviais): Recursos, Despesas, Consultas.
