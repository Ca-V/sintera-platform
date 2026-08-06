# MOBILE-037 — Defeitos da Homologação v1.0 (lista única para o ciclo de correção)

Lista **consolidada** dos defeitos/ajustes de **paridade e estabilidade** encontrados na homologação em device.
Regra: **registrar tudo → corrigir em UM ciclo → nova build → validação rápida → RC1**. Roadmap (evolução) fica em
`MOBILE-038`. Build homologado: `3aa2825e` (HEAD `29578bf`+).

| ID | Severidade | Módulo | Descrição | Correção planejada | Status |
|---|---|---|---|---|---|
| D‑00 | P0 | Histórico de Saúde | 401 + blank total ao abrir (ponte ômica derrubava a tela) | Fontes auxiliares (ômica/contracepção) não‑fatais — carrega com eventos+exames | ✅ **corrigido** — validar na próxima build |
| D‑01 | P1 | Exames · Compartilhar | Compartilhar por e‑mail/WhatsApp traz **só os dados**, não o **documento original** | Incluir no Share o **link seguro do documento** (ou o próprio arquivo, quando adequado) — via e‑mail/WhatsApp/Share nativo. Simples e equivalente à expectativa de "Compartilhar exame". | ⏳ **ciclo único** |
| D‑02 | P1 | Ômica | "Falha ao carregar ômica (401)" — tela inacessível | **Deploy do Bearer** (`omicsAuth → getAuthedSupabase`) na **Web de produção** → re‑homologar. Código **já commitado** e backward‑compatible (cookie+bearer). **Deploy pode ser PREPARADO; execução só com autorização** da fundadora (produção); fluxo de publicação a confirmar. | ⏳ **aguardando autorização de deploy** |
| D‑03 | P1 | Histórico de Exames | "Parede de chips" com nomes de biomarcadores no topo → excesso de informação, difícil navegar | Alinhar à Web: **remover a parede de chips**; usar **seletores compactos (dropdown)** para tipo e data; **manter busca**; manter filtros tipo/data | ⏳ **ciclo único** |
| D‑04 | P1 | Histórico de Saúde | Falta busca/filtros; só agrupa por mês | Alinhar à Web: **busca** + **filtro por tipo** + **filtro por data** (Por data / Por tipo) + organização equivalente | ⏳ **ciclo único** |

> **Estratégia confirmada (fundadora):** registrar TODOS os achados aqui durante a homologação → **um único ciclo**
> de correção ao final (D‑01/D‑03/D‑04 + demais) → **uma build** de validação → RC1. **D‑02:** o Bearer já está pronto
> na branch; deploy em produção só **após autorização** e confirmação do fluxo de publicação — a homologação do resto
> do app segue normalmente, deixando só a ômica pendente dessa etapa.

## Critérios de aceite (por item)
- **D‑01:** ao "Compartilhar exame", o destinatário recebe **acesso ao documento original** (link seguro clicável ou o arquivo), não apenas os dados extraídos; funciona por e‑mail, WhatsApp e Share nativo.
- **D‑02:** a tela de Ômica **carrega** os painéis no device (após o deploy do Bearer em produção).
- **D‑03:** o topo do Histórico de Exames fica **limpo** (sem parede de chips); tipo e data via **dropdown**; busca preservada; comportamento equivalente à Web.
- **D‑04:** o Histórico de Saúde tem **busca + Por data/Por tipo**, consistente com a Web.

## Fluxo
1. Continuar a homologação e **acrescentar novos achados** a esta tabela.
2. Ao concluir, **corrigir toda a lista em um ciclo** (D‑02 depende do deploy de produção).
3. Nova build (rápida — Starter) → **validação rápida** dos itens afetados → **RC1**.

> Itens de EVOLUÇÃO (captura por câmera/OCR, voz, ingestão IA de laudos, integrações Fase 2/wearables, backlog
> P2/P3, IA/navegação) **não** entram aqui — ver `MOBILE-038_ROADMAP_EVOLUCAO.md`.
