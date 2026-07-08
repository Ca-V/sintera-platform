'use client'

// Barra de comandos de seleção REUTILIZÁVEL (DS-001). Não é específica do Relatório:
// serve a qualquer seleção em massa / exportação / compartilhamento na plataforma.
// Recebe callbacks e renderiza só os comandos fornecidos — a lógica de estado fica
// no consumidor. Comandos: Selecionar tudo · Limpar · Restaurar padrão ·
// Expandir tudo · Recolher tudo.

export default function SelectionToolbar({
  onSelectAll, onClear, onReset, onExpandAll, onCollapseAll, className = '',
}: {
  onSelectAll?: () => void
  onClear?: () => void
  onReset?: () => void
  onExpandAll?: () => void
  onCollapseAll?: () => void
  className?: string
}) {
  const btn = 'font-body text-xs rounded-full px-3 py-1 border border-border text-mauve bg-ivory hover:border-petal/40 hover:text-petal transition-colors'
  const hasExpand = onExpandAll || onCollapseAll
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {onSelectAll && <button type="button" onClick={onSelectAll} className={btn}>Selecionar tudo</button>}
      {onClear && <button type="button" onClick={onClear} className={btn}>Limpar</button>}
      {onReset && <button type="button" onClick={onReset} className={btn}>Restaurar padrão</button>}
      {hasExpand && <span className="w-px h-4 bg-border mx-0.5" aria-hidden="true" />}
      {onExpandAll && <button type="button" onClick={onExpandAll} className={btn}>Expandir tudo</button>}
      {onCollapseAll && <button type="button" onClick={onCollapseAll} className={btn}>Recolher tudo</button>}
    </div>
  )
}
