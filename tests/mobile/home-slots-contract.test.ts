// Testes de CONTRATO dos slots da Home (MOBILE-014 §3.4). Verificação ESTÁTICA (por análise de fonte), pois
// testes de render de componentes React Native exigiriam um harness de teste RN (jsdom/RN preset) que não
// está montado neste projeto — o comportamento em runtime é coberto pela homologação (Fase 3). Estes testes
// protegem o CONTRATO estrutural no CI: composição completa e responsabilidades corretas de cada slot.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const HOME = resolve(process.cwd(), 'apps/mobile/src/presentation/home')
const read = (rel: string) => readFileSync(resolve(HOME, rel), 'utf-8')

describe('Contrato dos slots da Home (MOBILE-014 §3.4 · Home-hub UX-002)', () => {
  it('HomeShell compõe os slots da Home-hub (saudação · adicionar · menu · como usar · rodapé)', () => {
    const shell = read('HomeShell.tsx')
    // Home = HUB de navegação (UX-002). Resumo/Linha do tempo/Insights saíram (pertencem aos módulos).
    for (const slot of ['WelcomeSlot', 'AdicionarRegistroSlot', 'MenuCompletoSlot', 'ComoUsarSlot', 'FooterSlot']) {
      expect(shell, `HomeShell deve compor <${slot} />`).toMatch(new RegExp(`<${slot}[^>]*/>`))
    }
  })

  it('WelcomeSlot é apresentação pura (nome por injeção; sem navegação, sem sessão/rede)', () => {
    const src = read('slots/WelcomeSlot.tsx')
    expect(src, 'Welcome não deve importar navegação').not.toMatch(/useNavigation|@react-navigation/)
    expect(src, 'Welcome não deve carregar dados (useEffect/useState)').not.toMatch(/useEffect|useState/)
  })

  // "Acesso rápido" SAIU (28/08). Seus quatro atalhos passaram a aparecer no menu completo, na mesma tela, com
  // nome e resumo. Dois caminhos para o mesmo lugar obrigavam a pessoa a comparar as duas listas para descobrir
  // se eram a mesma coisa.
  it('MenuCompletoSlot navega e busca, sem carregar dado de domínio', () => {
    const src = read('slots/MenuCompletoSlot.tsx')
    expect(src).toContain('useNavigation')
    expect(src).toMatch(/\.navigate\(/)
    // A busca É estado local de interface, e isso é legítimo. O que não pode é buscar DADO: sem efeito de
    // carregamento e sem cliente de API — o menu navega, não consulta.
    expect(src, 'o menu não carrega dados').not.toMatch(/useEffect/)
    expect(src, 'o menu não fala com o cliente de API').not.toMatch(/apiClient/)
  })

  it('ComoUsarSlot é onboarding por navegação (useNavigation), sem dados de domínio', () => {
    const src = read('slots/ComoUsarSlot.tsx')
    expect(src).toContain('useNavigation')
    expect(src, 'Como usar não deve carregar dados').not.toMatch(/useEffect|useState/)
  })

  it('FooterSlot dispara o logout (useAuth + signOut) com guarda de reentrância', () => {
    const src = read('slots/FooterSlot.tsx')
    expect(src).toContain('useAuth')
    expect(src).toMatch(/signOut\(/)
    expect(src, 'guarda de reentrância (ADR-017)').toMatch(/isSigningOut/)
  })
})
