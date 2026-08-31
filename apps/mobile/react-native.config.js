// AUTOLINKING — o que cada plataforma compila.
//
// POR QUE ESTE ARQUIVO PASSOU A EXISTIR (31/08). O `@kingstinct/react-native-healthkit` se declara para iOS
// **e para Android** no `react-native.config.js` dele, mas **não tem pasta `android/`** — é código exclusivo do
// HealthKit, que só existe no iPhone.
//
// Sem esta exclusão, o build do Android tentaria vincular um módulo nativo que não tem lado Android. Na melhor
// hipótese seria trabalho perdido; na pior, falha de compilação num build que custa crédito de EAS — e a
// fundadora já gastou 80% dos créditos de um dia em sete builds, o que tornou "não desperdiçar build" uma
// regra do projeto, não uma preferência.
//
// O `react-native-nitro-modules`, do qual ele depende, TEM lado Android e continua vinculado normalmente: é
// infraestrutura, não o HealthKit em si.
//
// Quando o pacote passar a ter suporte Android de verdade (não há sinal disso, e não faria sentido), esta
// exclusão sai. Enquanto isso, ela declara um fato: HealthKit é do iPhone.
module.exports = {
  dependencies: {
    '@kingstinct/react-native-healthkit': {
      platforms: {
        android: null,
      },
    },
  },
}
