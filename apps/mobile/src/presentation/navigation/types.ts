// Tipos de navegação (ParamLists) — módulo de tipos dedicado, para que consumidores (ex.: slots da Home)
// não precisem importar de arquivos de componente (evita acoplamento a `AppNavigator`).

/** Abas de topo do AppNavigator (grupos projetados do SSOT — MOBILE-009 §3.1). */
export type AppTabParamList = {
  Inicio: undefined
  Acompanhamento: undefined
  Documentos: undefined
  MinhaSaude: undefined
  Mais: undefined
}

/** Stack interno da aba "Mais" (Inc.4): menu do grupo + telas de detalhe empilháveis (ex.: Perfil).
 *  Como a Web consolidou (Mais → Perfil) — MOBILE-016 §5. É só navegação (sem regra de negócio). */
export type MaisStackParamList = {
  MaisMenu: undefined
  Perfil: undefined
}
