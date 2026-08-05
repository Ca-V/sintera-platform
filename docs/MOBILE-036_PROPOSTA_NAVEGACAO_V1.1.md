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

## Itens a contemplar (checklist da proposta)
- [ ] Nova barra inferior (5 ou 6 abas — decidir em device).
- [ ] Home como dashboard de atalhos.
- [ ] Centralização dos Exames (captura + histórico + busca/filtros).
- [ ] Reorganização de Minha Saúde (Dados de Saúde + seção Histórico).
- [ ] Compartilhamento / Relatórios / Rede de Cuidado (condicionado a CARE‑002).
- [ ] Novo Evento com a lista de tipos.
- [ ] Item Ajuda em Mais.
