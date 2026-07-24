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
