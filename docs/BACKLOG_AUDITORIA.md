# Backlog — Auditoria Funcional da Plataforma (QA-001)

> Achados **não-críticos** da auditoria funcional (produção `sinteramais.com.br`, 2026-07-08).
> Nada aqui bloqueia; itens priorizados depois, sem ampliar o lote atual. Ver [[PROCESSO_HOMOLOGACAO]].

## Método
- Crawl automatizado de **22 rotas × desktop+mobile = 44 renders** (usuário de auditoria + dados
  representativos, removidos ao final). Heurísticas: overflow horizontal + erros de console.
- Inspeção visual de amostra representativa (Home, Exames, Medicamentos, Condições, Recursos, Despesas…).

## Resultado automatizado
✅ **44/44 páginas HTTP 200 · 0 overflow horizontal · 0 erros de console** — desktop e mobile.
Sem P0/P1: nenhuma página quebrada, sem regressão de layout, mobile sem degradação.

## Achados (backlog · não-críticos)

### 1. [Consistência — alta prioridade no CAP-001] Padrão de "adicionar registro" fragmentado
O botão/fluxo de criar registro varia entre módulos (4+ variantes):
| Módulo | Hoje |
|---|---|
| Exames · Medicamentos | ✅ "Novo …" → `<CreateRecordMenu>` (padrão oficial) |
| Condições de Saúde | "Adicionar" |
| Recursos de Saúde | "Escanear" + "Adicionar" (dois botões) |
| Despesas | "Adicionar despesa" |
| Medidas · Sinais · Hábitos · Agenda · Ômica | a confirmar |

**Ação (lote futuro do CAP-001):** aplicar `<CreateRecordMenu>` + rótulo "Novo…" a todos os módulos
que criam registros (só declarar `methods`). Já previsto no roadmap do CAP-001. **Não** executar agora.

### 2. [UX — P2] Eyebrow redundante nas páginas de módulo
Toda página repete o nome do módulo como **eyebrow em maiúsculas** (ex.: "CONDIÇÕES DE SAÚDE")
imediatamente acima do **`<h1>`** idêntico ("Condições de Saúde") — redundância só-em-tela (a mesma
que foi removida no cabeçalho do Relatório). Avaliar remover em toda a plataforma **ou** ratificar
como decisão de DS-001.

### 3. [UX — P2] Empty-state do Medicamentos com rótulo antigo
A mensagem de lista vazia diz *"Use o botão **Adicionar**"*, mas o botão agora é
"Novo medicamento ou suplemento". Ajustar o texto.

## Positivos (consistência já sólida)
- Navegação (sidebar) idêntica em todas as páginas; agrupamento Acompanhamento/Minha Saúde/Organização/Configurações correto.
- Padrão de **card** (nome + detalhes + editar/excluir) consistente entre módulos.
- **Empty-states** consistentes (ícone + título + explicação).
- Disclaimers RDC 657 presentes ("organiza, não interpreta/prescreve").
- **0 overflow / 0 erros** e **mobile sem degradação** em toda a amostra.

## Próximos passos da auditoria (se aprofundar)
Revisão visual página a página dos módulos ainda não inspecionados (Medidas, Sinais, Hábitos,
Agenda, Histórico, Ômica, Insights, Saúde, Prevenção, Ciclo, Perfil, Configurações) para
inconsistências finas de layout/microcopy — sob demanda.
