// Registro de push nativo (Expo). Chamado após o login: pede permissão, obtém o Expo
// push token e registra no backend (POST /api/push/register) para o worker de lembretes
// enviar push. Best-effort e defensivo — em web/simulador ou sem projectId EAS, apenas
// não faz nada (não quebra o app). O envio real exige device + configuração EAS.
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { api } from './api'

export async function registerPushToken(): Promise<void> {
  try {
    // Só faz sentido em dispositivo físico com projectId EAS configurado.
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId
    if (!projectId) return

    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status
    if (status !== 'granted') return

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    if (!token) return
    await api.post('/api/push/register', { token, platform: Platform.OS })
  } catch {
    // silencioso — push é complementar aos lembretes por e-mail/WhatsApp
  }
}
