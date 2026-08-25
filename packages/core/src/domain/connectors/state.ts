// @sintera/core — HIP-001 · Conexões: ESTADO de um conector, como fato de domínio. Puro.
//
// POR QUE ESTE ARQUIVO EXISTE: o estado do conector estava declarado DUAS vezes na Web — `ConnectorStateDto`
// no servidor e uma `interface ConnectorState` redigitada dentro da página — e ZERO vezes onde o Mobile
// alcança. Resultado: Conexões só existia na Web, e o Mobile não tinha como mostrar as integrações que são,
// justamente, a porta da Fase 2 (wearables).
//
// Aqui fica o fato: quais estados existem, como se chamam para a pessoa, e o que se pode fazer em cada um.
// Servidor, Web e Mobile leem daqui.

export type ConnectorStatus = 'disconnected' | 'connected' | 'expired' | 'revoked' | 'error'

/** Estado de UMA fonte de dados para uma pessoa. Espelha o DTO do servidor (mesmos nomes, de propósito). */
export interface ConnectorState {
  source: string
  label: string
  domain: string
  status: ConnectorStatus
  lastSyncAt: string | null
  lastSyncStatus: string | null
  lastError: string | null
}

/** Como o estado é DITO à pessoa. Uma redação só — não "Desconectado" numa tela e "Não conectado" noutra. */
const STATUS_LABEL: Record<ConnectorStatus, string> = {
  disconnected: 'Desconectado',
  connected:    'Conectado',
  expired:      'Precisa reconectar',
  revoked:      'Acesso revogado',
  error:        'Com erro',
}
export function connectorStatusLabel(s: ConnectorStatus): string {
  return STATUS_LABEL[s] ?? STATUS_LABEL.disconnected
}

/** Tom do selo — separa a cor semântica da regra, para as duas pontas pintarem igual. */
export type ConnectorTone = 'neutral' | 'success' | 'attention' | 'error'
const STATUS_TONE: Record<ConnectorStatus, ConnectorTone> = {
  disconnected: 'neutral',
  connected:    'success',
  expired:      'attention',
  revoked:      'attention',
  error:        'error',
}
export function connectorStatusTone(s: ConnectorStatus): ConnectorTone {
  return STATUS_TONE[s] ?? 'neutral'
}

/** Está ligado e funcionando? (o que habilita sincronizar e desconectar) */
export function isConnectorActive(s: ConnectorStatus): boolean {
  return s === 'connected'
}

/**
 * O rótulo do botão de ligar. "Reconectar" quando o acesso existiu e caiu — dizer "Conectar" nesse caso
 * esconde da pessoa que ela JÁ tinha ligado e que algo se perdeu.
 */
export function connectorPrimaryAction(s: ConnectorStatus): string {
  return s === 'expired' || s === 'revoked' || s === 'error' ? 'Reconectar' : 'Conectar'
}
