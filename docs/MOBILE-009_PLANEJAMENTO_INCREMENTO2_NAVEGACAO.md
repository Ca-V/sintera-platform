# MOBILE-009 — Planejamento do Incremento 2 (Navegação)

- **Status:** **APPROVED** (fundadora, 2026-07-23) — planejamento aprovado, com os 4 comentários de revisão incorporados (§2 responsabilidade do AppNavigator · §3.2 estratégia de crescimento · §4.1 Fora de decisão · critério de aceite 11). Nenhuma implementação neste documento. Início da codificação **gated** na sequência de integração (§9).
- **Onda:** 1 · **Incremento:** 2 (Navegação)
- **Pré-condição:** Incremento 1 [ACCEPTED](MOBILE-008_INCREMENTO1_ACEITE.md) e **congelado**. A implementação do Incremento 2 só começa **após a integração (merge) da branch atual** — este documento é a atividade administrativa autorizada nesse intervalo.
- **Relaciona-se com:** [MOBILE-001](MOBILE-001_PLANO_EXECUTIVO_RN.md) (ordem fixa dos incrementos) · [ADR-010](adr/ADR-010_IDENTIDADE_VISUAL_UNICA.md) · [ADR-011](adr/ADR-011_ARQUITETURA_COMPONENTES_CROSSPLATFORM.md) · [ADR-016](adr/ADR-016_INSTANCIA_UNICA_REACT.md) · `src/components/layout/Sidebar.tsx` (SSOT de taxonomia)

## 0. Registro de execução (2026-07-24)

Implementação em **5 etapas isoladas e reversíveis** (uma mudança estrutural por commit, ordem refinada
pela fundadora): E1 `ae03b5e` NavigationContainer+SafeAreaProvider · E2 `8fa138a` gate→AuthStack|AppNavigator ·
E3 `72515a5` navegadores reais (native-stack) · E4 `d686f7f` Bottom Tabs projetando o SSOT · E5 `ec4c3bc`
native-stack interno por tab.

**Nota metodológica — preview temporário (para rastreabilidade).** Como as telas autenticadas só aparecem
com sessão (que exige senha, fora do alcance do agente), a validação visual das tabs foi feita por um
**preview temporário** — forçar `return <AppNavigator/>` no gate. **Regras seguidas, e por isso nenhum commit
publicado depende do artifício:** (a) o preview **nunca foi commitado**; (b) foi **sempre revertido** logo
após a captura; (c) antes de cada commit verificou-se `git diff` **limpo** no `App.tsx` (idêntico ao estado
commitado da etapa anterior). Os commits E1–E5 contêm apenas o gate correto (`session ? <AppNavigator/> :
<AuthStack/>`).

**Homologação funcional CONCLUÍDA (2026-07-24) — Incremento 2 ACCEPTED.** A fundadora exercitou no emulador o
ciclo completo: Login → Home → navegação por todas as abas → Logout → Login (sessão removida) → novo Login →
**force-stop** → **restauração direta no AppNavigator** (não no Login). Critério 11 e restauração de sessão
validados em app real. Registro de aceite: [MOBILE-013](MOBILE-013_INCREMENTO2_ACEITE.md); tag
`mobile-inc2-accepted`.

## 1. Decisões arquiteturais (fundadora, 2026-07-23)

| # | Decisão | Valor |
|---|---------|-------|
| D1 | Biblioteca de navegação | **React Navigation** |
| D2 | Modelo estrutural | `NavigationContainer` → **`AuthStack`** (não autenticado) + **`AppNavigator`** (autenticado) |
| D3 | Fonte da verdade da taxonomia | **Taxonomia SSOT compartilhada com a Web** (`Sidebar.tsx`) — a nav mobile PROJETA, não cria taxonomia própria |
| D4 | Escopo | **Somente infraestrutura de navegação** + telas placeholder |
| D5 | Este documento | Planejamento apenas — nenhuma linha de código |
| D6 | Padrão de navegação | **Bottom Tabs + Stacks internos** (Opção A) |
| D7 | Natureza da projeção | A navegação é **projeção**, não representação literal, do SSOT (ver §3.1) |

### Decisão de arquitetura — projeção não literal (D7)

> **A navegação é uma projeção da taxonomia SSOT, não sua representação literal. A arquitetura de
> informação permanece única; a organização visual pode variar conforme a plataforma para respeitar as
> convenções de uso.**

Consequência prática da separação de responsabilidades:

- **SSOT → define O QUE existe** (a organização conceitual do domínio, compartilhada por Web e Mobile).
- **Mobile UX → define COMO isso é acessado** (a apresentação, que pode seguir convenções da plataforma).

Essas responsabilidades **não precisam ser idênticas**. Web e Mobile compartilham a mesma **arquitetura
conceitual**; não são obrigados a compartilhar a mesma **estrutura visual**. Isto evita a conclusão
equivocada de que a interface mobile deva copiar 1:1 o Sidebar Web.

### Fundamentação de D1 (React Navigation × Expo Router)

Escolhido React Navigation por consistência com os princípios já estabilizados: arquitetura **explícita**,
separação domínio/infra, transição **incremental** sem alterar o entrypoint. O Expo Router inverteria a
relação (a estrutura de diretórios passaria a definir parte da navegação; o entrypoint mudaria; regras
futuras dependeriam da convenção do Router) — uma variável arquitetural ainda não necessária. O principal
argumento do Expo Router (deep linking/URLs) **não é decisivo agora**: o React Navigation oferece suporte
maduro a deep linking quando Care Space/notificações/compartilhamento entrarem no roadmap. Não se otimiza
hoje para um requisito ainda não utilizado.

## 2. Arquitetura-alvo

Evolução **incremental** do gate atual (`App → AuthProvider → Gate → {Login | Home}`):

```
App
 └── AuthProvider                     (SSOT de sessão — INALTERADO; getSession + onAuthStateChange)
      └── NavigationContainer         (React Navigation)
           ├── AuthStack              (renderizado quando session == null)
           │     └── LoginScreen      (já existente, DS-002)
           │
           └── AppNavigator           (renderizado quando session != null)
                 ├── HomePlaceholder  (já existente)
                 └── …placeholders navegáveis projetando a taxonomia SSOT
```

- O **gate de sessão** deixa de escolher `Login | Home` diretamente e passa a escolher **`AuthStack | AppNavigator`**. O `AuthProvider` permanece o ponto único de verdade da sessão — **nenhuma mudança na camada de auth do Incremento 1**.
- O **entrypoint (`index.ts` → `App`) não muda**. `NavigationContainer` entra **dentro** do `AuthProvider`, abaixo do gate de carregamento de fontes/sessão já existente.
- **Responsabilidade do `AppNavigator` (orquestração apenas).** O `AppNavigator` é um componente de **orquestração de navegação**. Ele **não contém regras de negócio, lógica de autorização ou conhecimento de domínio**, limitando-se à composição e coordenação dos fluxos de navegação. Espelha o mesmo princípio do `AuthProvider` (ponto único de sessão, sem lógica de domínio) e evita que o Navigator se torne, no futuro, um ponto de concentração de lógica.

## 3. Projeção da taxonomia SSOT (D3)

Fonte única = `Sidebar.tsx` (Web). Estrutura atual a ser projetada no mobile:

| Grupo (SSOT) | Itens (SSOT) |
|--------------|--------------|
| *(topo)* | Painel Inicial |
| Acompanhamento | Agenda · Histórico de Saúde · Histórico de Exames · Composição Corporal · Monitoramento |
| Documentos | Exames |
| Minha Saúde | Condições de Saúde · Medicamentos · Suplementos · Recursos de Saúde · Hábitos · Ciclo e Contracepção |
| Organização | Despesas · Relatórios |
| Configurações | Configurações |

**Princípio:** a navegação mobile reflete a **mesma organização conceitual** da Web (SSOT → taxonomia → {Web, Mobile}), nunca uma taxonomia "mobile" paralela. Divergência de taxonomia entre plataformas é um anti-objetivo explícito.

<a id="secao-3-1"></a>
### 3.1 Padrão de navegação — DECIDIDO: Bottom Tabs + Stacks internos (Opção A)

O Sidebar Web é uma **lista agrupada** (5 grupos, ~15 itens). A decisão (fundadora, 2026-07-23) é
**Bottom Tabs + Stacks internos**:

- **Opção A (ADOTADA):** **bottom tabs** para os grupos de topo (projetando os grupos como destinos primários) + stacks internos por grupo.
- Opção B (descartada): drawer espelhando o Sidebar Web 1:1 (fidelidade visual máxima, menos idiomático em mobile).

Motivação: é o padrão esperado pelos usuários em mobile; reduz profundidade de navegação; favorece a
memória espacial; e mantém a taxonomia SSOT por **correspondência conceitual**, não visual (ver D7, §3.1
acima). Rótulos e ordem dos grupos derivam do SSOT; a apresentação segue a convenção da plataforma.

### 3.2 Estratégia de crescimento (estabilidade da navegação ao longo das ondas)

> **Novos módulos deverão ser incorporados à navegação preservando a taxonomia SSOT e sem alterar a
> estrutura dos fluxos já estabilizados, salvo decisão arquitetural documentada em ADR.**

Isto protege a estabilidade da navegação nas próximas ondas: a incorporação de um novo domínio é uma
adição dentro do grupo correspondente do SSOT, não uma reorganização dos fluxos existentes. Reestruturações
de fluxo exigem ADR próprio.

## 4. Escopo

### Dentro do escopo
- Escolha e instalação da biblioteca (React Navigation + dependências nativas).
- `NavigationContainer`.
- `AuthStack` (envolvendo a `LoginScreen` existente).
- `AppNavigator` (shell de navegação autenticada projetando os grupos da taxonomia SSOT).
- Transição do gate atual (`{Login|Home}` → `{AuthStack|AppNavigator}`).
- Telas **placeholder** navegáveis (uma por destino de topo; sem conteúdo de domínio).
- Preservação da sessão e integração com o `AuthProvider` (inclusive logout retornando ao `AuthStack`).
- Identidade DS-002 aplicada aos elementos de navegação (cores/tipografia via tokens do DS).

### Fora do escopo
Implementação dos domínios · Upload · Histórico · formulários · regras clínicas · deep linking · notificações · analytics · qualquer tela de conteúdo real (apenas placeholders).

### 4.1 Fora de decisão (não revisitar durante a implementação)

Temas explicitamente **fora deste incremento** — decididos como ausentes para reduzir o risco de expansão
de escopo durante a codificação. Reintroduzir qualquer um exige incremento/ADR próprios:

- Deep Linking
- Universal Links
- Push Notifications
- Analytics de navegação
- Persistência de estado da navegação
- Feature Flags

## 5. Critérios de aceite (mesma disciplina do Incremento 1)

1. **Build** nativo verde (react-navigation traz deps **nativas** — ver Risco R1 — exigindo *rebuild*).
2. **tsc(mobile)** verde; suíte/contratos existentes inalterados e verdes.
3. **Topologia de dependências íntegra** após as novas deps (autolinking encontra os módulos nativos; contagem de módulos verificada — [ARCH-001](ARCH-001_ARQUITETURA_DEPENDENCIAS_WORKSPACE.md)/INV-DEP-001).
4. **Gate:** sem sessão → `AuthStack`/Login; com sessão → `AppNavigator`.
5. **Navegação:** placeholders de topo alcançáveis; rótulos/ordem **derivados do SSOT** (`Sidebar.tsx`).
6. **Sessão preservada:** `force-stop` + reabertura autenticada → retorna ao `AppNavigator` (não ao Login).
7. **Logout** de dentro do `AppNavigator` → retorna ao `AuthStack` (comportamento do Incremento 1 preservado, incluindo a guarda de reentrância).
8. **Auditoria arquitetural:** taxonomia derivada do SSOT (sem taxonomia mobile paralela); zero acesso direto ao SDK Supabase em `apps/mobile`; identidade DS-002 preservada.
9. **Relatório executivo** objetivo (funcionalidade · contratos evoluídos · impactos web · impactos mobile · evidências · riscos).
10. **Navegação sem conhecimento de domínio.** A estrutura de navegação **não contém conhecimento de domínio** — apenas orquestra a navegação entre módulos definidos pela taxonomia SSOT. Nenhuma regra de negócio, consulta de dados ou lógica clínica na camada de navegação (preserva a separação de responsabilidades e evita que a navegação acumule lógica de negócio).
11. **Sem regressão de autenticação (critério técnico — principal risco da migração do gate).** Após a introdução da infraestrutura de navegação, **não há regressão na autenticação nem na restauração de sessão**. Concretamente, os fluxos aceitos do Incremento 1 continuam válidos: login válido → `AppNavigator`; login inválido → erro no `AuthStack`; `force-stop` + reabertura autenticada → `AppNavigator` (sessão restaurada); logout → `AuthStack`; guarda de reentrância do logout preservada.

## 6. Riscos e pontos de atenção

- **R1 — Dependências nativas / *rebuild*.** `react-native-screens` e `react-native-safe-area-context` são **nativos**. Adicioná-los exige *build* nativo novo + verificação de topologia (mesma diligência aplicada a `expo-linear-gradient`/`expo-secure-store` no Incremento 1). Fluxo: `expo install` → checar autolinking → `expo run:android`.
- **R2 — Congelamento da stack (Onda 1).** Adicionar bibliotecas de **feature** (react-navigation) **não** viola a regra de congelamento — que proíbe *upgrade* de Expo/RN e `expo install --fix` de rotina, não a adição de dependências de produto. Registrar explicitamente para não confundir *rebuild* nativo com mudança de stack.
- **R3 — Instância única de React já protegida.** Os pacotes do React Navigation importam `react`. O guard do [ADR-016](adr/ADR-016_INSTANCIA_UNICA_REACT.md) já força todo `react`/`react/*` para a cópia do mobile — cobre esses pacotes sem ação adicional. Validar a topologia após a instalação confirma isso.
- **R4 — Mapeamento taxonomia agrupada → padrão mobile.** Padrão **decidido** (Bottom Tabs + Stacks, §3.1). Atenção residual: a projeção dos ~15 itens em tabs+stacks deve preservar a taxonomia SSOT por correspondência conceitual (D7), sem recriá-la nem embutir lógica de domínio (critério 10).
- **R5 — SafeArea / status bar.** A navegação introduz *headers*/*tab bars*; tratar *insets* de área segura (hoje o `LoginScreen` usa padding fixo). Incluir `react-native-safe-area-context` (já dependência do React Navigation) e revisar o `StatusBar`.
- **R6 — Desenvolvimento em Windows (pré-requisito de ambiente).** Em ambientes Windows, a implementação da
  New Architecture do React Native pode gerar caminhos de arquivos superiores ao limite padrão do sistema
  operacional (260 caracteres). É **pré-requisito** habilitar `LongPathsEnabled` (+ `git config core.longpaths true`)
  **antes** da compilação. **Confirmado na prática (2026-07-23):** o `buildCMakeDebug` falha com
  *"Filename longer than 260 characters"* (object file de 378 chars) ao compilar
  `react-native-screens`/`react-native-safe-area-context`. **Decisão (fundadora):** resolver no **ambiente/cadeia
  de ferramentas**, **não** desabilitar a New Architecture.
  **✅ RESOLVIDO (mesma data) — [MOBILE-010](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md) Encerrado/Validado.**
  Habilitar `LongPathsEnabled` (+ reboot) é **necessário, mas NÃO suficiente** (hipótese rejeitada por
  experimento controlado). Causa raiz: combinação da **toolchain padrão (CMake 3.22.1 / Ninja 1.10.2)** com a
  geração de código da New Architecture em projeto **Expo CNG**. Solução: **CMake 4.1.2 / Ninja 1.12.1**,
  persistida via **Config Plugin versionado** (`plugins/withAndroidCmakeVersion.js`). Baseline oficial em
  [MOBILE-003](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md). Este risco **não bloqueia mais** o Incremento 2.

## 7. Sequência de implementação proposta (para execução PÓS-merge)

> Registro do plano; **não executar** enquanto a branch estiver congelada / antes do merge.

1. Instalar React Navigation + deps nativas (`expo install`); verificar topologia; *rebuild* nativo.
2. Introduzir `NavigationContainer` dentro do `AuthProvider`; migrar o gate para `{AuthStack | AppNavigator}` (bloco reversível).
3. `AuthStack` envolvendo a `LoginScreen`.
4. `AppNavigator` (Bottom Tabs + Stacks, §3.1) com placeholders projetando os grupos do SSOT.
5. Validar os 10 critérios de aceite (§5) no emulador; relatório executivo; congelar.

## 8. Preparação técnica de dependências (de-risking R1/R3 — fatos verificados 2026-07-23)

> Levantamento **read-only** contra a stack congelada atual (`expo ^54.0.0` · `react-native 0.81.5` ·
> `react 19.1.0`). Nenhuma instalação executada; serve para tornar a execução pós-merge imediata e sem surpresas.

**Conjunto mínimo de dependências (para Bottom Tabs + native-stack, D6):**

| Pacote | Tipo | Versão | Origem da versão |
|--------|------|--------|------------------|
| `@react-navigation/native` | JS | v7 (atual) | npm (compatível com RN 0.81) |
| `@react-navigation/bottom-tabs` | JS | v7 | npm |
| `@react-navigation/native-stack` | JS | v7 | npm |
| `react-native-screens` | **NATIVO** | **~4.16.0** | **fixado pelo Expo SDK 54** (`bundledNativeModules.json`) |
| `react-native-safe-area-context` | **NATIVO** | **~5.6.0** | **fixado pelo Expo SDK 54** |

**Comando de instalação (execução pós-merge):**
```
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```
`expo install` resolve os nativos para as versões fixadas pelo SDK (sem conflito com a stack congelada) e
repassa os JS ao npm.

**Decisão de minimização (escopo nativo):** `react-native-gesture-handler` (~2.28.0) e
`react-native-reanimated` (~4.1.1) **NÃO** são necessários para Bottom Tabs + native-stack e ficam **fora**
do Incremento 2 — evitando o babel-plugin do Reanimated e reduzindo a pegada nativa a **apenas 2 módulos**
(`react-native-screens`, `react-native-safe-area-context`). Reintroduzir só se um incremento futuro exigir
gestos/drawer/animações JS.

**Verificações obrigatórias após instalar (antes de prosseguir):**
1. **Topologia** ([ARCH-001](ARCH-001_ARQUITETURA_DEPENDENCIAS_WORKSPACE.md)/INV-DEP-001): autolinking deve
   listar `react-native-screens` e `react-native-safe-area-context` (contagem de módulos sobe em 2).
2. **React único** ([ADR-016](adr/ADR-016_INSTANCIA_UNICA_REACT.md)): os `@react-navigation/*` importam
   `react`; o guard do Metro já força a cópia do mobile — confirmar ausência de "Invalid hook call" no
   primeiro *bundle*.
3. **Rebuild nativo** (`npx expo run:android`) — os 2 módulos nativos exigem novo binário (não é *hot reload*).

**Confirmação de não-violação do congelamento (R2):** adicionar estas dependências de *feature* + *rebuild*
nativo **não** é *upgrade* de Expo/RN nem `expo install --fix` de rotina; a stack (SDK 54 / RN 0.81.5 /
react 19.1.0) permanece intacta.

## 9. Sequência de integração e início da implementação (governança — fundadora 2026-07-23)

A codificação do Incremento 2 **só começa** após esta sequência, nesta ordem. Cada passo preserva a
governança construída (marco verificável · ramo de planejamento · futura branch de implementação):

1. **Merge do Incremento 1** (estratégia de destino/timing = decisão estratégica da fundadora).
2. **Normalização do histórico** (opcional — *squash* que normaliza, entre outros, os assuntos de commit com o `@`).
3. **Congelamento definitivo** desse marco integrado.
4. **Revisão final do MOBILE-009** — concluída (este documento, APPROVED com os 4 ajustes incorporados).
5. **Criação da branch de implementação** do Incremento 2 (a partir do marco integrado).
6. **Somente então** iniciar a codificação, seguindo a sequência de implementação da §7.

### 9.1 Regra de governança da Onda 1 (fundadora 2026-07-23)

> **Durante a Onda 1, cada incremento aceito constitui um marco verificável (tag) e serve como base para o
> incremento seguinte. A integração ao ramo principal permanece condicionada ao encerramento da Onda 1 e aos
> critérios de integração previamente definidos.**

Decisões consolidadas de integração (fundadora 2026-07-23):

| Tema | Decisão |
|------|---------|
| Merge para `main` | **Não agora** — alvo de integração em aberto até a revisão da estratégia de integração da Onda 1 (conflito histórico `main` × `feat/condicoes-captura` a reconciliar) |
| Gate pós-Onda 1 / REL-001 | **Mantido** |
| Base do Incremento 2 | **`mobile-inc1-accepted` (`0d2a1f3`)** — não `main` |
| Squash / normalização de histórico | **Somente na integração da Onda 1** (dev = histórico completo p/ auditoria/bisect; integração = squash, se seguir a política do repo) |

Hierarquia de branches (escalável; cada incremento nasce do marco anterior, não de `main`):

```
main  (base estável; NÃO recebe merge da Onda 1 até o encerramento dela)
 ⋮
mobile-inc1-accepted  (0d2a1f3 · Incremento 1 ACCEPTED/congelado)
 ├── plan/mobile-inc2-navegacao      (Planejamento do Incremento 2 — APPROVED)
 └── feat/mobile-inc2-navegacao      (Implementação do Incremento 2 — nasce de 0d2a1f3)
        └── (futuro) marco Incremento 2 → base do Incremento 3 …
```
