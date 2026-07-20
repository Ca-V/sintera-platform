// Babel do app móvel (Expo). Passo 1 — fundação.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}
