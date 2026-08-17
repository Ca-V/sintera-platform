# DEV-001 — Protocolo de Não-Regressão, Baseline e Regression Gate

**Status:** ATIVO (fundadora, 17/08/2026). Modelo operacional obrigatório para toda alteração a partir desta data.
Complementa `PROCESSO_HOMOLOGACAO.md` e `HOMOLOGATION_PLAN_v1.md`.

## Princípio central
> **Nenhuma implementação é "concluída" se introduzir regressão em funcionalidade anteriormente concluída ou homologada.**
> "Homologado" não é "funciona hoje" — é **referência protegida** para as próximas implementações.
> "Parece funcionar" e "o código compilou" **não** são critério de conclusão.

## 1. Protocolo obrigatório — antes de QUALQUER alteração significativa
Declarar explicitamente:
- **ESCOPO** — o que será alterado (problema · arquivos · comportamento).
- **FORA DO ESCOPO** — o que deliberadamente **não** será tocado.
- **ÁREAS PROTEGIDAS** — funcionalidades/rotas/componentes/contratos/arquitetura homologados que não podem mudar incidentalmente.
- **CAUSA** (quando bug) — reprodução → causa raiz → arquivo responsável → fluxo afetado → por que a implementação anterior falha. **Nunca corrigir por hipótese.**
- **CORREÇÃO MÍNIMA** — só o necessário para eliminar a causa. Proibido aproveitar o bug para refatorar, mudar UX/nav/nomenclatura/arquitetura ou criar abstrações. Melhorias → tarefas independentes no backlog.

## 2. Regra de baseline
Um conjunto `implementado → testado → corrigido → homologado` vira **baseline protegido**. Não é reaberto a cada nova implementação. Alteração posterior que possa afetá-lo deve: identificar impacto · declarar risco de regressão · rodar os testes correspondentes · só então incorporar.

## 3. Matriz de regressão (fluxos críticos — cresce a cada homologação)
| Área | Fluxo crítico |
|---|---|
| Autenticação | login / sessão / logout |
| Home | carregamento do Painel Inicial |
| Minha Saúde | entrada no menu (subcategorias) |
| Exames | lista / detalhe / autoanálise |
| Medicamentos · Suplementos | lista / detalhe |
| Recursos de Saúde | lista / detalhe |
| Histórico (Exames · Saúde) | navegação / busca / filtros |
| Agenda | visualização / registro / lembrete |
| Rede de Cuidado | acesso |
| Relatórios | geração / abertura / compartilhar |
| Configurações | dados da conta / contato |
| Notificações | preferências |
| Web | Sidebar / navegação |
| Mobile | bottom navigation / stacks |
| Dados | persistência / leitura (RLS) |
| Segurança | autenticação / autorização |

## 4. Três níveis de teste (antes de "concluído")
1. **Da alteração** — o problema/funcionalidade específico resolvido.
2. **Regressão da área** — fluxos diretamente relacionados (ex.: mexeu em Minha Saúde → menu · Exames · Medicamentos · Suplementos · Recursos · Histórico · retorno à Home).
3. **Smoke test da plataforma** — principais fluxos Web e Mobile.

## 5. Definição de "DONE"
implementação · causa identificada (se correção) · teste específico · regressão da área · TSC/build sem erros · suíte automatizada verde · navegação afetada validada · doc/plano atualizado · commit identificável · branch/preview correspondente · critério de aceite atendido.

## 6. Regression Gate (obrigatório antes de merge de alteração relevante)
☐ causa identificada · ☐ escopo declarado · ☐ áreas protegidas declaradas · ☐ implementação mínima · ☐ teste específico · ☐ regressão da área · ☐ smoke test · ☐ TSC/build · ☐ suíte · ☐ Web validada quando afetada · ☐ Mobile validado quando afetado · ☐ doc atualizada · ☐ commit identificado · ☐ impacto sobre baseline avaliado.
Falhou item crítico → **não** concluído.

## 7. Alterações transversais — ampliar regressão automaticamente
Áreas de alto risco de regressão: **navegação · autenticação · sessão · api-client · banco/schema · design system · componentes compartilhados · routing · estado global · notificações · modelos de domínio.** Ao tocar qualquer uma, ampliar o conjunto de regressão **proativamente** (não esperar o usuário achar a regressão).

## 8. Feature Freeze POR ÁREA (não da plataforma inteira)
Área homologada → baseline protegido. Outras áreas continuam evoluindo. Mas mexer em **componente compartilhado** que afeta uma área homologada **aciona automaticamente** o Regression Gate daquela área. Isso dá velocidade máxima com risco controlado (evita o ciclo "termina A → quebra B → volta em A").

## 8b. Database / Release Gate (origem: incidente H-05, 17/08)
**Nenhum código que dependa de alteração de schema é "pronto" enquanto a migração correspondente não estiver CONFIRMADA no ambiente-alvo.**
O incidente H-05 provou o risco: código atualizado (api-client seleciona `prescription_url`) → migração existente no repo (`136`) → **não aplicada em produção** → o Mobile passou a depender de uma coluna inexistente → **quatro** funcionalidades aparentemente independentes (Medicamentos · Suplementos · Composição · Relatório) quebraram, com o erro real **mascarado** por `asError` ("Erro desconhecido").

Regra permanente:
1. Toda mudança de código que referencie coluna/tabela/tipo nova declara a **migração dependente** no escopo.
2. Antes de considerar pronta: **confirmar no ambiente-alvo** que o schema tem o objeto (não só que a migração existe no repo).
3. **Divergência repo↔produção deve ser detectada por CI/CD** (comparar migrações do repo com o schema aplicado), não descoberta na homologação.
4. `asError`/mensagens genéricas **não podem esconder** erros de query — preservar a origem (ex.: instrumentação `tag()` no Relatório: `<fonte> → <erro real>`).

## 9. Regra de deploy
`Implementação → Preview (branch) → Teste → Regressão → Homologação → Freeze → Merge (main) → próxima evolução.` Não fazer merge para `main`/produção antes da homologação/congelamento. O **preview (branch)** é o ambiente de validação.

## 10. Ordem de execução (fases)
1. **Fechamento da homologação atual** — concluir H-05 + bugs reproduzidos; sem novas features; regressão; relatório consolidado.
2. **Baseline** — consolidar estado homologado; proteger decisões; registrar matriz de regressão; baseline Web+Mobile.
3. **Arquitetura** — domínio; **FHIR R4**; **RNDS** (spec oficial); **adapters**; identidade; consentimento; provenance; auditoria; segurança. *(UCDA = modelo interno; FHIR = camada de interoperabilidade/mapeamento — sem virar FHIR Server nem "RNDS por aproximação".)*
4. **Produto** — evolução funcional Web+Mobile; maior valor ao usuário; reduzir diferenças desnecessárias; paridade progressiva.
5. **Interoperabilidade e escala** — integrações; import/export; compartilhamento; notificações + deep-links; ecossistema de profissionais; relatórios; capacidades comerciais.

## 11. Convergência Web + Mobile (não duplicação)
**Princípio:** **mesma informação · mesma lógica de negócio · mesma hierarquia de importância** entre Web e Mobile — **apresentação adaptada** ao contexto (não cópia visual, não pixels iguais). O caso do detalhe do Exame (**H-03**) é o exemplo: o defeito não é "as telas estão diferentes", é a **prioridade da informação estar diferente** — o exame e seu conteúdo clínico devem vir **antes** de pedido, financeiro e ações administrativas.

Maximizar compartilhado: domínio · contratos · tipos · api-client · regras · modelos · auth/authz · design system · nomenclaturas · analytics · testes de contrato. Diferenciar só o que precisa (desktop×mobile).

## 12. Continuidade autônoma
Após fechar os bugs e estabilizar o baseline, **retomar o roadmap automaticamente** (sem aguardar nova ordem para cada etapa), sempre sob: baseline protegido + escopo controlado + causa identificada + regressão + nenhuma reabertura de decisão homologada sem necessidade explícita. Velocidade vem de **previsibilidade**, não de acumular features sem controle de regressão.

## Princípio de produto (invariante)
A SINTERA **organiza, integra e contextualiza** informações de diferentes fontes para apoiar a continuidade do cuidado e a decisão por pessoas e profissionais autorizados. **Não** diagnostica, **não** substitui avaliação clínica, **não** produz recomendação terapêutica. Isso orienta produto, UX, IA e comunicação.
