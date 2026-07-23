// @sintera/design-system — VisualSpec dos componentes (Passo 3B · Etapa 3).
// Descritor NEUTRO de plataforma (ver ADR-011): as recipes retornam intenção visual + acessibilidade,
// e cada adaptador (web/RN) mapeia para o seu sistema de estilo. Todos os valores derivam dos papéis do tema.
import type { TextStyle } from '../tokens/typography'
import type { ElevationLevel, ShadowRole } from '../tokens/elevation'
import type { GradientToken } from '../tokens/gradient'

/** Caixa/superfície: cores, contorno, raio, espaçamento interno, alvo e profundidade. */
export interface BoxSpec {
  backgroundColor: string
  // Preenchimento por GRADIENTE (token do DS, ex.: 'action' no botão primário). Quando presente, o adaptador o prefere
  // sobre `backgroundColor` (que fica como fallback sólido). Web → CSS gradient; RN → expo-linear-gradient. Identidade única.
  backgroundGradient?: GradientToken
  borderColor: string
  borderWidth: number
  radius: number
  paddingX: number
  paddingY: number
  minHeight?: number
  opacity: number
  elevation: ElevationLevel
  // Sombra multi-camada por PAPEL (card/overlay/…). Quando presente, o adaptador rico (Web) a prefere
  // sobre `elevation` (1 camada, base cross-platform que o RN consome). Ver tokens/elevation `shadow`.
  shadowRole?: ShadowRole
}

/** Texto: estilo tipográfico (papel) + cor (papel). */
export interface TextSpec { style: TextStyle; color: string }

export interface ButtonSpec { container: BoxSpec; label: TextSpec }
/** Campo de entrada: caixa + estilo do texto digitado + cor do placeholder (por papel). */
export interface InputSpec { container: BoxSpec; text: TextSpec; placeholderColor: string }
export interface ChipSpec { container: BoxSpec; label: TextSpec }
export interface BadgeSpec { container: BoxSpec; label: TextSpec }
export interface CardSpec { container: BoxSpec }
export interface SurfaceSpec { backgroundColor: string; radius: number; elevation: ElevationLevel }
export interface DividerSpec { color: string; thickness: number }
export interface IconSpec { size: number; color: string }
export interface AvatarSpec { size: number; radius: number; backgroundColor: string; color: string; label: TextStyle }
