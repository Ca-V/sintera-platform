# MOBILE-033 — Checklist Oficial de Homologação · SINTERA Mobile v1.0

Documento de HOMOLOGAÇÃO (reutilizável em RC1/RC2/v1.1). Marque cada cenário **☐ Aprovado / ☐ Reprovado** e
use **Observações** para registrar o defeito (tela + passos + evidência). **Regra:** registrar TODOS os defeitos e
**NÃO corrigir durante os testes** — a correção é feita em um único ciclo ao final → nova build → validação rápida → RC1.

## Identificação da build sob teste
- **Branch:** `feat/mobile-inc4-perfil` · **HEAD:** `cafaec8`
- **Build/APK (EAS):** `b9cec243-3a0c-4ce3-ba54-9dd7eb724c55` · perfil `preview`
- **Dispositivo:** __________________ · **Android:** ______ · **Data:** ____/____/____ · **Testador:** __________

## Convenções
- ☐ = pendente · ✅ = aprovado · ❌ = reprovado (descrever em Observações).
- "Estados" a verificar em toda tela: **carregando · vazio · erro (com "Tentar novamente") · pull‑to‑refresh**.
- Exceções de plataforma (não são defeito): captura por câmera/OCR, voz, ingestão por IA de laudo, Conexões/wearables (Fase 2).

---

## 0. Auth · Navegação · Perfil (transversal)  — ~15 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 0.1 | Login válido | Abrir app → entrar com e‑mail/senha reais | Acessa a Home (aba Início) | ☐ | |
| 0.2 | Login inválido | Entrar com senha errada | Mensagem de erro clara; não entra | ☐ | |
| 0.3 | Persistência de sessão | Fechar (force‑stop) e reabrir | Reabre já logado, direto no app | ☐ | |
| 0.4 | Navegação por abas | Tocar em Início/Acompanhamento/Documentos/Minha Saúde/Mais | Cada aba abre seu conteúdo, sem travar | ☐ | |
| 0.5 | Perfil | Mais → Perfil → editar nome/telefone → salvar | Salva e reflete os dados | ☐ | |
| 0.6 | Logout | Mais → Configurações → "Sair da conta" | Sai; volta ao login; sessão removida | ☐ | |

## 1. Exames  — ~45 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 1.1 | Lista — Resultados × Pedidos | Documentos → Exames | Resultados e "Pedidos e Solicitações" em seções separadas | ☐ | |
| 1.2 | Filtros | Buscar por nome/tipo/lab; filtrar status (Estruturados/Aguardando/Erro); filtrar por ano | Lista filtra corretamente | ☐ | |
| 1.3 | Duplicado | Ter 2 exames equivalentes | O mais novo mostra selo "Possível duplicado" | ☐ | |
| 1.4 | Upload de PDF | "Adicionar exame" → escolher documento (PDF) | Cria o exame e **abre o detalhe**, iniciando a análise | ☐ | |
| 1.5 | Upload por câmera | "Adicionar exame" → usar a câmera | Envia a foto e abre o detalhe | ☐ | |
| 1.6 | Autoanálise/polling | Após upload, aguardar no detalhe | Estado "processando" evolui para resultados/estruturado | ☐ | |
| 1.7 | Detalhe — resultados | Abrir um exame estruturado | Mostra biomarcadores/resultados fiéis ao laudo (sem interpretação) | ☐ | |
| 1.8 | Detalhe — financeiro | Editar valor pago + tipo de doc fiscal | Salva como atributo do exame; aparece em Despesas | ☐ | |
| 1.9 | Detalhe — recorrência | Definir lembrete de repetição | Cria 1 lembrete na Agenda | ☐ | |
| 1.10 | Detalhe — renomear/data | Long‑press no título/data → editar | Atualiza título/data | ☐ | |
| 1.11 | Detalhe — reprocessar | Acionar "reprocessar/extrair dados" | Dispara nova análise; estados corretos | ☐ | |
| 1.12 | Detalhe — compartilhar | Compartilhar o exame | Abre o compartilhamento nativo | ☐ | |
| 1.13 | Detalhe — excluir | Excluir o exame | Remove; volta à lista | ☐ | |
| 1.14 | Ômica — lista/criar | Exames → "Exames de ômica →" → criar painel (domínio/lab/tecnologia/data) | Cria e abre o painel | ☐ | |
| 1.15 | Ômica — N1–N4 | Abrir painel; expandir categorias → features → histórico | Resumo, categorias, features e histórico corretos | ☐ | |
| 1.16 | Ômica — entrada manual | "Adicionar resultado" → digitar feature → resolver no catálogo → salvar | Resolve identidade; salva o resultado | ☐ | |
| 1.17 | Ômica — excluir | Remover resultado / excluir painel | Remove corretamente | ☐ | |

## 2. Agenda  — ~20 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 2.1 | Novo evento | "Novo evento" → preencher tipo/título/data/hora → salvar | Aparece em Próximos | ☐ | |
| 2.2 | Concluir | Em um evento → Concluir | Sai da Agenda → Histórico (e Despesas se tiver valor) | ☐ | |
| 2.3 | Concluir com falha | Simular falha (offline) ao concluir | Mostra erro ("Não foi possível concluir") — não silencioso | ☐ | |
| 2.4 | Cancelar | Cancelar um evento | Marca cancelado; sai da Agenda | ☐ | |
| 2.5 | Editar | Editar um evento | Abre o formulário com os dados; salva | ☐ | |
| 2.6 | Pendências | Ter evento vencido e aberto | Aparece em "Pendências" | ☐ | |
| 2.7 | Por data / Por tipo | Alternar a visão de "Próximos" | Reagrupa corretamente | ☐ | |
| 2.8 | Sugestão de recência | Ter último exame > 6 meses e sem exame futuro | Card sugere "Registrar lembrete" (factual) | ☐ | |

## 3. Histórico  — ~40 min

### 3a. Histórico de Saúde (Timeline)
| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 3.1 | Só fatos fechados | Ter evento planejado (futuro) e um realizado | O planejado **não** aparece; o realizado sim | ☐ | |
| 3.2 | 4 fontes | Ter exame, evento, ômica e contracepção | Todos aparecem na linha do tempo | ☐ | |
| 3.3 | Densidade | Evento com prioridade/retorno/modalidade/valor/anexo | Chips e linhas de preparo/desfecho aparecem | ☐ | |
| 3.4 | Navegação por domínio | Tocar em exame / ômica / contracepção / evento | Abre detalhe do exame / painel ômica / Ciclo / formulário | ☐ | |

### 3b. Histórico de Exames
| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 3.5 | Laboratoriais | Abrir a tela com exames com biomarcadores | Indicadores com valor recente + tendência + posição na faixa | ☐ | |
| 3.6 | Evolução | Expandir um biomarcador | Sparkline + medições; cada uma abre o laudo | ☐ | |
| 3.7 | Documentais | Ter exame sem biomarcadores (imagem/laudo) | Aparece em "Outros exames (documentos)" por tipo | ☐ | |
| 3.8 | Filtros | Buscar; filtrar tipo/período; ordenar recentes/antigos | Filtra as duas trilhas | ☐ | |

### 3c. Composição Corporal
| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 3.9 | Medida CRUD | Nova medida (peso) → salvar; editar; excluir | Registra/edita/remove; lista atualiza | ☐ | |
| 3.10 | IMC + jornada | Ter peso + altura (perfil) | IMC calculado; jornada de peso (perda/meta) | ☐ | |
| 3.11 | Evolução / A×B / Marcos | Ver evolução, comparar 2 avaliações, ver marcos | Sparkline, comparação (com "Não disponível"), marcos por período | ☐ | |

### 3d. Monitoramento (sinais vitais)
| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 3.12 | Sinal vital CRUD | Adicionar pressão/glicemia → salvar; remover | Agrupa por sinal, com sparkline; remove | ☐ | |

## 4. Minha Saúde  — ~40 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 4.1 | Condições | Adicionar condição própria e familiar (com relative/desde/notas) | Salva; agrupa por escopo | ☐ | |
| 4.2 | Medicamentos | Cadastrar medicamento (dose/frequência/estoque/recompra) | Salva; card mostra situação; lembrete de recompra | ☐ | |
| 4.3 | Suplementos | Abrir Suplementos (mesma tela filtrada) | Lista suplementos (kind) | ☐ | |
| 4.4 | Recursos (óptica) | Cadastrar óculos/lentes (grau OD/OE, DNP/BC/DIA) + despesa inline | Salva atributos + despesa | ☐ | |
| 4.5 | Hábitos | Cadastrar hábito com meta/frequência/lembrete | Salva; prévia de meta; lembrete | ☐ | |
| 4.6 | Ciclo — contracepção | Cadastrar método (com lembrete de troca) | Salva; projeta em Medicamentos (leitura) | ☐ | |
| 4.7 | Ciclo — menstruação | Registrar menstruação | Salva; stats de ciclo atualizam | ☐ | |

## 5. Relatórios  — ~25 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 5.1 | Compilação | Mais → Relatórios | Reúne os domínios com dados | ☐ | |
| 5.2 | Período | Trocar preset; usar intervalo personalizado (de/até) | Recorta os módulos temporais | ☐ | |
| 5.3 | Seleção | "O que incluir": ligar/desligar seções e itens | Reflete no relatório | ☐ | |
| 5.4 | Perfil salvo | Salvar um perfil; aplicar; excluir | Salva/aplica/remove | ☐ | |
| 5.5 | Compartilhar (texto) | "Compartilhar" | Abre o compartilhamento nativo com o texto | ☐ | |
| 5.6 | Link público | "Criar link" → compartilhar; revogar | Cria link 30d; compartilha URL; revoga | ☐ | |

## 6. Financeiro (Despesas)  — ~15 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 6.1 | Projeção | Mais → Despesas | Lista todos os fatos com valor (cada um uma vez); total | ☐ | |
| 6.2 | Por data / Por tipo | Alternar a visão | Reagrupa corretamente | ☐ | |
| 6.3 | Adicionar despesa | "Adicionar despesa" → novo evento/medicamento | Abre o caminho correto (cross‑tab) | ☐ | |
| 6.4 | Editar/Reabrir/Remover | Editar um lançamento; remover valor de exame | Exame mantém‑se, só o valor sai; evento exclui | ☐ | |

## 7. Configurações  — ~20 min

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 7.1 | Alterar e‑mail | Trocar e‑mail | Envia link de confirmação; mensagem clara | ☐ | |
| 7.2 | Redefinir senha | Acionar redefinição | Envia e‑mail de redefinição | ☐ | |
| 7.3 | WhatsApp | DDI + número → salvar | Salva | ☐ | |
| 7.4 | Notificações | Escolher canal por categoria; "Restaurar recomendadas" | Salva preferências | ☐ | |
| 7.5 | Exportar dados | "Exportar meus dados" | Abre o compartilhamento com o JSON | ☐ | |
| 7.6 | Links legais | Abrir LGPD / Privacidade / Termos | Abrem no navegador (sintera.app) | ☐ | |
| 7.7 | Excluir conta | Digitar "EXCLUIR" → confirmar | Exclui conta e dados; faz logout | ☐ | |

## 8. Fluxo completo do usuário (transversal)  — ~20–30 min
Verifica a **continuidade entre módulos** (o que os testes por domínio não capturam):

| # | Cenário | Passos | Resultado esperado | Status | Obs. |
|---|---|---|---|---|---|
| 8.1 | Ponta a ponta | Login → **upload de exame** → abrir detalhe → **registrar consulta** na Agenda → **concluir** → ver no **Histórico** → gerar **Relatório** → **compartilhar** | Cada passo encadeia sem travar; o dado registrado aparece nas telas seguintes | ☐ | |
| 8.2 | Coerência de terminologia | Percorrer as abas | Nomes/rótulos consistentes com a Sidebar | ☐ | |
| 8.3 | Estados transversais | Forçar offline em algumas telas; recarregar | Erros claros + "Tentar novamente"; pull‑to‑refresh funciona | ☐ | |
| 8.4 | Recuperação de sessão | Force‑stop no meio do fluxo e reabrir | Restaura logado, sem perda de navegação básica | ☐ | |

## 9. Registro de defeitos  — ~30–45 min
Para cada ❌, registrar: **módulo · cenário (#) · passos · resultado obtido × esperado · severidade (P0/P1/P2) · evidência (print/vídeo)**. Consolidar numa **lista única** ao final (não corrigir durante).

| # | Módulo/Cenário | Descrição do defeito | Severidade | Evidência |
|---|---|---|---|---|
| | | | | |
| | | | | |

---

### Tempo total estimado
~3h30–4h de testes + 30–45 min de registro. (Referência de planejamento; ajuste ao volume de dados reais.)

### Pré‑produção (fora da homologação interna — registrar, não implementar agora)
- Integrar **crash‑reporting** (Sentry ou Firebase Crashlytics) **antes da publicação a usuários reais**, para capturar exceções/travamentos/stack traces desde o 1º dia. Não é requisito da homologação v1.0.
- Backlog P2/P3 e propostas arquiteturais (§B de `docs/MOBILE-032`) entram na priorização da **v1.1**, após a RC1.

### Fluxo pós‑homologação
APK → este checklist → testes em device → **lista única** de defeitos → correção em **um ciclo** → nova build → validação rápida → **Release Candidate 1** → v1.0 concluída.
