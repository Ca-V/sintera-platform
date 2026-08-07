// HUB-001 — a TAXONOMIA de intenções agora vive em @sintera/core (SSOT ÚNICO Web↔Mobile). Este arquivo apenas
// REEXPORTA, para preservar os import sites existentes da Web. O alvo de navegação (href) é APRESENTAÇÃO e é
// mapeado na UI (components/RegistrationHub.tsx) a partir do `RegistrationDestination` — o Mobile mapeia para telas.
export { INTENT_GROUPS, REGISTRATION_INTENTS, intentsByGroup } from '@sintera/core'
export type { IntentGroup, IntentMechanism, RegistrationIntent, RegistrationDestination } from '@sintera/core'
