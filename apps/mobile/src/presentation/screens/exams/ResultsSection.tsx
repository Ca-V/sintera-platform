// Seção de RESULTADOS do detalhe (paridade Web): resultados estruturados (biomarcadores) agrupados por
// material→exame, com situação/referência (copy única do @sintera/core), índice experimental, rodapé
// regulatório e resultados clínicos não-laboratoriais (UCDA). Estados: processando · document_only · vazio/erro.
// COMPOSIÇÃO de primitivos DS; NENHUMA regra aqui (interpretação vem calculada do backend — REG-001).
import { useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import type { BiomarkerDTO, ExamDetailDTO } from '@sintera/api-client'
import {
  biomarkerStatus, biomarkerStatusLabel, displayValue, formatReference, biomarkerCounts,
  experimentalIndex, groupByMaterialExam, biomarkerSourceLabel, groupUcdaForDisplay,
  type UcdaRepresentation,
} from '@sintera/core'
import { Text, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import { statusColor } from './examDetailFormat'

const REG_NOTE =
  'As faixas de referência, quando disponíveis, são as informadas no documento de origem (laboratório, clínica, '
  + 'profissional de saúde ou outra origem) e podem variar conforme origem, equipamento, método e referência '
  + 'científica. A referência adequada ao seu caso também depende de avaliação médica — a SINTERA organiza seus '
  + 'dados e não substitui a consulta com seu médico.'

export function ResultsSection({ exam, biomarkers, clinical, analyzing }: {
  exam: ExamDetailDTO
  biomarkers: BiomarkerDTO[]
  clinical: UcdaRepresentation | null
  analyzing: boolean
}) {
  const t = useTheme()
  const hasResults = biomarkers.length > 0
  const hasClinical = (clinical?.items.length ?? 0) > 0
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <View style={{ gap: 16 }}>
      {hasResults ? (
        <ResultsCard exam={exam} biomarkers={biomarkers} />
      ) : hasClinical ? null : analyzing || exam.status === 'processing' || exam.status === 'pending' ? (
        <View style={[styles.stateCard, card]}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={styles.center}>Analisando seu exame…</Text>
          <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })} style={styles.center}>
            A SINTERA está estruturando os resultados do documento. Isso leva alguns segundos.
          </Text>
        </View>
      ) : exam.extraction_completeness === 'document_only' && exam.status !== 'error' ? (
        <View style={[styles.stateCard, card]}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={styles.center}>Documento disponível para consulta</Text>
          <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })} style={styles.center}>
            O conteúdo deste exame está no documento original. A estruturação por tipo de exame está em evolução.
          </Text>
        </View>
      ) : (
        <View style={[styles.stateCard, card]}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={styles.center}>Nenhum resultado estruturado</Text>
          <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })} style={styles.center}>
            {exam.status === 'error'
              ? `Última extração falhou (${exam.error_reason ?? 'erro desconhecido'}). Use "Extrair novamente".`
              : 'Use "Extrair novamente" para estruturar os resultados deste exame.'}
          </Text>
        </View>
      )}

      {hasClinical && clinical ? <ClinicalCard rep={clinical} /> : null}
    </View>
  )
}

function ResultsCard({ exam, biomarkers }: { exam: ExamDetailDTO; biomarkers: BiomarkerDTO[] }) {
  const t = useTheme()
  const [tip, setTip] = useState(false)
  const idx = experimentalIndex(biomarkers)
  const counts = biomarkerCounts(biomarkers)
  const groups = groupByMaterialExam(biomarkers)
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <View style={{ gap: 16 }}>
      {idx ? (
        <View style={[styles.card, card]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>PROPORÇÃO DENTRO DA REFERÊNCIA</Text>
            {/* Explicador "?" (paridade Web IndexCard) — mesma copy. */}
            <Pressable onPress={() => setTip(v => !v)} accessibilityRole="button" accessibilityLabel="O que é este índice?"
              style={{ width: 24, height: 24, borderRadius: 999, borderWidth: 1, borderColor: t.color.border.default, alignItems: 'center', justifyContent: 'center' }}>
              <Text spec={text(t, { role: 'caption' })} style={{ fontWeight: '700', color: t.color.text.muted }}>?</Text>
            </Pressable>
          </View>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ color: t.color.identity.primary, fontSize: 28 }}>{idx.pct}%</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
            {idx.numerator} de {idx.denominator} biomarcadores dentro da referência. Métrica informativa — não é
            diagnóstico nem estado de saúde; não substitui avaliação médica.
          </Text>
          {tip ? (
            <View style={{ gap: 8, marginTop: 8, backgroundColor: t.color.surface.app, borderRadius: 12, padding: 12 }}>
              <Text spec={text(t, { role: 'bodySmall' })} style={{ fontWeight: '600' }}>O que é a Proporção dentro da referência?</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                É uma contagem simples: de todos os biomarcadores numéricos com referência impressa neste laudo, quantos estão dentro da faixa informada pelo laboratório.
              </Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                Importante: cada laboratório usa referências próprias. Um mesmo valor pode estar “dentro” em um laudo e “fora” em outro.
              </Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.attention.text, backgroundColor: t.color.badge.attention.soft, borderRadius: 10, padding: 8 }}>
                Esta métrica não representa diagnóstico, risco ou estado geral de saúde. Não substitui avaliação médica.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.card, card, { gap: 12 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Resultados estruturados</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
          {counts.total} {counts.total === 1 ? 'resultado' : 'resultados'}
          {counts.acima > 0 ? ` · ↑ ${counts.acima} acima` : ''}
          {counts.abaixo > 0 ? ` · ↓ ${counts.abaixo} abaixo` : ''}
          {counts.dentro > 0 ? ` · ✓ ${counts.dentro} normais` : ''}
        </Text>

        {groups.map((g, gi) => (
          <View key={`${g.material}-${gi}`} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.material.toUpperCase()}</Text>
            {g.exams.map((ex, ei) => (
              <View key={`${ex.label ?? 'sem'}-${ei}`} style={{ gap: 6 }}>
                {ex.label ? <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>{ex.label}</Text> : null}
                {ex.items.map((b) => {
                  const dv = displayValue(b)
                  const s = biomarkerStatus(b)
                  const ref = formatReference(b.reference_min, b.reference_max)
                  return (
                    <View key={b.id} style={[styles.row, { borderColor: t.color.border.default }]}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text spec={text(t, { role: 'body' })}>{b.name}</Text>
                        <Text spec={text(t, { role: 'caption' })} style={{ color: statusColor(t, s) }}>
                          {biomarkerStatusLabel(b)}
                        </Text>
                        {ref ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Ref.: {ref}{b.unit ? ` ${b.unit}` : ''}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text spec={text(t, { role: 'bodyStrong' })} style={{ color: statusColor(t, s) }}>
                          {dv.main ?? '—'}{dv.unit ? ` ${dv.unit}` : ''}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        ))}

        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
          {counts.total} {counts.total === 1 ? 'resultado estruturado' : 'resultados estruturados'} · {biomarkerSourceLabel(biomarkers[0]?.source)}
        </Text>
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{REG_NOTE}</Text>
      </View>
    </View>
  )
}

function ClinicalCard({ rep }: { rep: UcdaRepresentation }) {
  const t = useTheme()
  const sections = groupUcdaForDisplay(rep)
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  return (
    <View style={[styles.card, card, { gap: 12 }]}>
      <Text spec={text(t, { role: 'bodyStrong' })}>Resultados do documento</Text>
      {sections.map((sec, si) => (
        <View key={`${sec.label ?? 'sem'}-${si}`} style={{ gap: 6 }}>
          {sec.label ? <Text spec={text(t, { role: 'label', tone: 'muted' })}>{sec.label.toUpperCase()}</Text> : null}
          {sec.items.map((it, ii) => (
            <View key={`${it.name}-${ii}`} style={[styles.row, { borderColor: t.color.border.default }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text spec={text(t, { role: 'body' })}>{it.name}{it.region ? ` (${it.region})` : ''}</Text>
                {it.referenceText ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Ref.: {it.referenceText}</Text> : null}
              </View>
              <Text spec={text(t, { role: 'bodyStrong' })}>{it.valueText}{it.unit ? ` ${it.unit}` : ''}</Text>
            </View>
          ))}
        </View>
      ))}
      <Disclaimer variant="laudo" />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  stateCard: { borderWidth: 1, borderRadius: 16, padding: 24, gap: 6, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  center: { textAlign: 'center' },
})
