// @sintera/core — leitura da pressão arterial escrita à mão. Fonte ÚNICA Web + Mobile.
//
// O CASO REAL (homologação de 27/08): a fundadora digitou "12/8", que é como se fala em português —
// "doze por oito". A plataforma gravou "12/8 mmHg", e isso tem duas consequências:
//
//   1. O GRÁFICO usa o primeiro número. "12/8" vira 12 e "120/80" vira 120. Registrar das duas formas ao
//      longo do tempo mistura 12 e 120 na mesma linha, e ela deixa de significar qualquer coisa.
//   2. `12 mmHg` é FISICAMENTE IMPOSSÍVEL. Um médico entende que é "doze por oito", mas o dado gravado está
//      errado como medida — e é ele que vai para relatório, para a RNDS, para o histórico.
//
// O QUE ESTE MÓDULO NÃO FAZ: converter sozinho. Trocar 12/8 por 120/80 seria interpretar o que a pessoa quis
// dizer, e a plataforma não interpreta (ADR-000 · RDC 657). Ela NOTA e PERGUNTA — a mesma disciplina do aviso
// de divergência de documento: diz o que percebeu, e quem decide é quem registrou.

export interface BloodPressureReading {
  sistolica: number | null
  diastolica: number | null
  /** Os dois valores estão em faixa possível para mmHg? */
  plausivel: boolean
  /** Quando parece a forma falada, o que provavelmente se quis dizer. `null` fora desse caso. */
  sugestao: string | null
}

const VAZIA: BloodPressureReading = { sistolica: null, diastolica: null, plausivel: false, sugestao: null }

// Faixas em mmHg. Largas de propósito: o objetivo é separar "medida" de "erro de unidade", não julgar se a
// pressão está boa — julgar seria conteúdo clínico.
const SIS_MIN = 50, SIS_MAX = 300
const DIA_MIN = 20, DIA_MAX = 200

// Faixa da forma FALADA ("doze por oito" = 12/8). É a mesma medida em centímetros de mercúrio.
const FALADA_SIS_MIN = 5, FALADA_SIS_MAX = 30
const FALADA_DIA_MIN = 2, FALADA_DIA_MAX = 20

/**
 * Lê "120/80", "12/8", "120 / 80", "12x8". Devolve os números e o que se percebeu deles.
 * Nunca lança; texto que não é pressão devolve leitura vazia.
 */
export function readBloodPressure(texto: string | null | undefined): BloodPressureReading {
  const t = (texto ?? '').trim()
  if (!t) return VAZIA

  // Aceita "/" e "x" como separador — as duas formas aparecem escritas à mão.
  const m = /^(\d{1,3})(?:[.,](\d+))?\s*[/x×]\s*(\d{1,3})(?:[.,](\d+))?$/i.exec(t)
  if (!m) return VAZIA

  const sis = Number(m[1])
  const dia = Number(m[3])
  if (!Number.isFinite(sis) || !Number.isFinite(dia)) return VAZIA

  const plausivel = sis >= SIS_MIN && sis <= SIS_MAX && dia >= DIA_MIN && dia <= DIA_MAX

  const pareceFalada =
    !plausivel &&
    sis >= FALADA_SIS_MIN && sis <= FALADA_SIS_MAX &&
    dia >= FALADA_DIA_MIN && dia <= FALADA_DIA_MAX &&
    sis > dia   // sistólica sempre maior que diastólica; sem isso, não é leitura de pressão

  return {
    sistolica: sis,
    diastolica: dia,
    plausivel,
    sugestao: pareceFalada ? `${sis * 10}/${dia * 10}` : null,
  }
}

/**
 * A frase que a pessoa lê enquanto digita. `null` quando não há nada a dizer.
 *
 * DIZ, e só. Não corrige, não bloqueia o salvamento, não muda o campo — quem registrou decide. É a mesma
 * disciplina do aviso de divergência de documento.
 */
export function bloodPressureHint(texto: string | null | undefined): string | null {
  const r = readBloodPressure(texto)
  if (r.sugestao) {
    return `"${(texto ?? '').trim()}" costuma significar ${r.sugestao} mmHg. Registrar assim mantém a comparação ao longo do tempo.`
  }
  return null
}
