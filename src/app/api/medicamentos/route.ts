// Rota ÚNICA de Medicamentos — Web (cookie) e Mobile (Bearer). Lógica em
// @/lib/medicamentos/service (que delega compra→syncEvent e recompra→syncReminder à Agenda).
//   GET → { meds }
//   POST { name, kind, status, form?, ...campos, id? } → cria/edita (+ eventos)
//   DELETE ?id= → remove (+ limpa eventos)
import { NextResponse } from 'next/server'
import { authed, requiredId } from '@/lib/api/http'
import { listMeds, saveMed, removeMed, type MedInput, type Kind, type MedStatus } from '@/lib/medicamentos/service'

function parseInput(body: unknown): MedInput {
  const b = (body ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : null)
  return {
    id: typeof b.id === 'string' ? b.id : null,
    name: typeof b.name === 'string' ? b.name : '',
    kind: (typeof b.kind === 'string' ? b.kind : 'medicamento') as Kind,
    brand: str(b.brand), dose: str(b.dose), frequency: str(b.frequency),
    startedOn: str(b.startedOn), untilOn: str(b.untilOn), notes: str(b.notes),
    status: (typeof b.status === 'string' ? b.status : 'em_uso') as MedStatus,
    acquiredQty: str(b.acquiredQty), packQty: str(b.packQty), dailyCons: str(b.dailyCons),
    purchasedOn: str(b.purchasedOn), purchaseStatus: str(b.purchaseStatus), amount: str(b.amount),
    repurchase: b.repurchase === true, repurchaseFreq: str(b.repurchaseFreq),
    form: str(b.form), route: str(b.route), packUnit: str(b.packUnit), prescriber: str(b.prescriber),
  }
}

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ meds: await listMeds(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  await saveMed(supabase, userId, parseInput(await request.json()))
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeMed(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
