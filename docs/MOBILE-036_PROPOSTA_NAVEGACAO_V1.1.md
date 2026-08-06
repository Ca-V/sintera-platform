# MOBILE-036 — Proposta de Reorganização da Navegação (v1.1)

> **Fora do ciclo de homologação da v1.0.** Evolução de **arquitetura de informação (UX)** — NÃO é correção de
> paridade. Base para implementação quando iniciar a fase de evolução do produto (pós‑RC1). Origem: testes da
> fundadora no APK v1.0 (2026-08-05).

## 1. Barra inferior
**Preferencial (6 abas, se suportar bem em telas menores):**
`Início · Agenda · Exames · Minha Saúde · Compartilhamento · Mais`

**Alternativa (5 abas — mais segura em telas pequenas):**
`Início · Agenda · Exames · Minha Saúde · Mais`
- Nesse caso, **Compartilhamento** fica como **acesso rápido na Home** e dentro de **Mais**.

> Nota de UX: o padrão maduro costuma ser **5 abas** (6 aperta rótulos/toque). Decidir na implementação, testando em
> device pequeno. A estrutura de conteúdo abaixo independe de 5 ou 6.

## 2. Tela Inicial (Home = dashboard de acessos rápidos)
Apenas os principais atalhos:
`Agenda · Exames · Minha Saúde · Compartilhamento`

**Compartilhamento — avaliar a estrutura:**
- Se englobar as duas funcionalidades:
  - **Compartilhamento** → `Rede de Cuidado` · `Relatórios`
- Se **Relatórios** tiver propósito independente do compartilhamento: manter **dois acessos distintos**
  (`Relatórios` e `Rede de Cuidado`).

> ⚠️ **Dependência:** **Rede de Cuidado ainda NÃO existe como tela** (é visão futura — CARE‑002). Enquanto não for
> construída, "Compartilhamento" contém só **Relatórios**; Rede de Cuidado entra quando o domínio existir.
> (Respeitar INV‑HOME‑001: a Home compõe; dados de domínio entram por injeção, não dentro de `home/`.)

## 3. Agenda
Ao acessar: `Calendário · Próximos eventos`.
No **Novo Evento**, apresentar as opções (tipos):
`Consulta · Exame · Procedimento · Vacina · Plano de Saúde · Outro evento`.

## 4. Exames (centralizar toda a gestão)
`Carregar exame · Fotografar exame · Importar PDF · Histórico de exames · Buscar · Filtros`.
> (Câmera/importação = captura de device; "Histórico de exames" e filtros já existem — consolidar sob Exames.)

## 5. Minha Saúde
**Dados de Saúde:**
`Condições de Saúde · Medicamentos · Suplementos · Recursos de Saúde · Hábitos · Ciclo e Contracepção ·
Composição Corporal · Monitoramento`

**Histórico** (nova seção própria):
`Histórico de Saúde · Histórico de Exames`
> Muda de lugar: hoje Histórico de Saúde/Exames e Composição/Monitoramento vivem em Acompanhamento; a proposta os
> reagrupa sob Minha Saúde. Rever o mapeamento com a Sidebar (SSOT de taxonomia) ao implementar.

## 6. Mais
`Perfil · Configurações · Despesas · Documentos · Ajuda`
> (Novo item: **Ajuda** — a criar. **Documentos** = agrupador de Exames/Ômica? Definir na implementação.)

---

## Impacto e cuidados para a implementação (v1.1)
- **Reflete na Sidebar (Web)?** A taxonomia é SSOT compartilhada — avaliar pela **Matriz de Paridade**
  (`docs/PARIDADE_WEB_MOBILE.md`) se a reorganização vale também para a Web ou é só do Mobile.
- **Rede de Cuidado (CARE‑002)** é pré‑requisito para o agrupamento "Compartilhamento" completo.
- **Ajuda** é uma tela nova (suporte/FAQ) a especificar.
- **INV‑HOME‑001:** a Home continua composição; o dashboard de atalhos consome dados por injeção (ver MOBILE‑032 §B‑4).
- Fazer por **blocos reversíveis** (nav é estrutural) — não um rewrite de uma vez.

## 7. Sidebar Web (contraparte — consistência Web↔Mobile)
Reorganizar a Sidebar da Web espelhando a IA do Mobile. **A Sidebar é SSOT de taxonomia** (notificações,
permissões e filtros reusam sua nomenclatura) → mudança tem efeito em cascata; fazer por blocos reversíveis.

**Estrutura principal:**
`Painel Inicial · Agenda · Exames · Minha Saúde · Compartilhamento · Organização · Configurações`

```
Painel Inicial
Agenda
Exames
Minha Saúde
├── Dados de Saúde
│   ├── Condições de Saúde · Medicamentos · Suplementos · Recursos de Saúde
│   └── Hábitos · Ciclo e Contracepção · Composição Corporal · Monitoramento
└── Histórico
    ├── Histórico de Saúde
    └── Histórico de Exames
Compartilhamento
├── Relatórios
└── Rede de Cuidado            (oculto até CARE-002 existir)
Organização
└── Despesas                   (acomoda futuros módulos admin/financeiros)
Configurações
├── Perfil · Conta · Preferências · Segurança
```

**Notas:**
- **Dados de Saúde × Histórico:** distingue *estado atual* (condições/meds/hábitos…) de *evolução longitudinal*
  (históricos) — recomendado (reduz carga cognitiva). ✅
- **Rede de Cuidado** permanece **oculta** até ser implementada (CARE‑002), preservando a estrutura para o futuro.
- **Organização** isola Despesas (e futuros módulos financeiros/administrativos) sem sobrecarregar Configurações.
- **Configurações** ganha subitens (Perfil/Conta/Preferências/Segurança) — hoje é uma tela; avaliar desdobramento.
- **Paridade:** como Sidebar (Web) e nav (Mobile) passam a espelhar a mesma taxonomia, tratar como mudança
  **compartilhada** na Matriz de Paridade — Web e Mobile evoluem juntas, com a regra de negócio/rotas no core.

## Itens a contemplar (checklist da proposta)
- [ ] Nova barra inferior (5 ou 6 abas — decidir em device).
- [ ] Home como dashboard de atalhos.
- [ ] Centralização dos Exames (captura + histórico + busca/filtros).
- [ ] Reorganização de Minha Saúde (Dados de Saúde + seção Histórico).
- [ ] Compartilhamento / Relatórios / Rede de Cuidado (condicionado a CARE‑002).
- [ ] Novo Evento com a lista de tipos.
- [ ] Item Ajuda em Mais.
