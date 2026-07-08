import type { DocumentProcessor } from '../types'
import { captureForwarded } from '../result'
import { scanMedicationImage, PENDING_MED_SCAN_KEY } from '../../medications/scanImage'

// Processador de MEDICAMENTO/SUPLEMENTO. Escaneia a foto (visão) e guarda os itens
// no sessionStorage; a página de Medicamentos lê ao montar e abre a prévia "Detectado"
// para a usuária revisar e salvar. Resultado unificado (captureForwarded).
export const medicationProcessor: DocumentProcessor = {
  kind: 'medication_label',
  label: 'Receita de medicamento ou suplemento',
  icon: 'Pill',
  accepts: ['image/jpeg', 'image/png', 'application/pdf'],
  target: '/dashboard/medicamentos',
  confirmPhrase: 'um rótulo ou receita de medicamento ou suplemento',
  process: async (file) => {
    try {
      const r = await scanMedicationImage(file)
      if (r.ok && r.items.length) sessionStorage.setItem(PENDING_MED_SCAN_KEY, JSON.stringify(r.items))
    } catch { /* segue para a página mesmo sem prévia — a usuária pode escanear lá */ }
    return captureForwarded(medicationProcessor)
  },
}
