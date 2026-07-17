// FB-010 — Suplementos é uma VISÃO do mesmo módulo de Medicamentos (mesmo modelo `medications`,
// filtro por `kind='suplemento'`). Reaproveita a página; o modo é decidido pela rota (usePathname).
// Não duplica lógica: um só componente serve os dois itens de navegação.
import MedicamentosPage from '../medicamentos/page'

export default function SuplementosPage() {
  return <MedicamentosPage />
}
