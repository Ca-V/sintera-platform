# Capacidades da plataforma — visão de PRODUTO/usuário (documento vivo)

> Fundadora (13/07/2026): além do quadro técnico (`EXECUCAO_MILESTONES.md`), acompanhar a SINTERA pela
> perspectiva do **usuário e do negócio** — o que a pessoa consegue fazer e confiar. Atualizado a cada
> entrega. **Legenda:** ✅ funcionando · 🔄 parcial/em consolidação · ⬜ em construção.

## Confiança (o diferencial da SINTERA)
| Capacidade (na voz do usuário) | Estado | Nota |
|---|---|---|
| "Os dados batem com o documento — nada é inventado" | ✅ | verificação de não-invenção rodada |
| "O nome do exame é fiel ao documento" | ✅ | corrigido (imagem, laboratório) |
| "Reextrair não muda meus dados" | ✅ | representação certificada (imutável) |
| "Nunca vejo um exame incompleto como se fosse completo" | 🔄 | cobertura ligada (conservadora) |
| "A data do exame está correta" | ✅ | datas semânticas (coleta/realização) |
| "Posso sempre abrir o documento original" | ✅ | rastreabilidade documental |
| "Um laudo é preservado inteiro, não fragmentado" | ✅ | laudo → documento (não força campos) |

## Organização
| Capacidade | Estado | Nota |
|---|---|---|
| "Envio PDF, foto ou várias fotos de um exame" | ✅ | captura multipágina |
| "Meus exames aparecem organizados no tempo" | ✅ | timeline por ano |
| "Cada exame do documento vira um registro separado" | 🔄 | **split (M3) ligado** no backend (1 upload→N registros, cada um só com suas páginas); falta a **UX de confirmar/revisar** a divisão (decisão de produto) |
| "Exames de laboratório: resultados estruturados" | ✅ | caminho maduro |
| "Exames estruturados por modalidade (achados/parâmetros)" | 🔄 | CPE ligado; **1º processador: Pentacam** (parâmetros por olho). Ver `COBERTURA_CLINICA.md` |

## Uso e compartilhamento
| Capacidade | Estado | Nota |
|---|---|---|
| "Gero um relatório e compartilho com meu médico" | ✅ | REL-001 |
| "Recebo lembretes / agenda de saúde" | ✅ | agenda + WhatsApp/e-mail |
| "Guardo receitas, medicamentos, condições, vacinas" | ✅ | módulos existentes |

## Domínio — Evento Assistencial (requisitos registrados 13/07; implementar na consolidação)
| Capacidade | Estado | Nota |
|---|---|---|
| "Vejo 'Resultados estruturados' ou 'Documento disponível' (nunca 'parcial')" | ⬜ registrado | fim da estruturação parcial na UI (`EVENTO_ASSISTENCIAL.md` §1) |
| "Guardo valor pago, nota fiscal, recibo e comprovantes no evento" | ⬜ registrado | admin vinculado ao Evento, separado do clínico (§2) |
| "Registro recorrência/retorno (repetir em 6m, revisão anual…)" | ⬜ registrado | recorrência genérica; Timeline com futuro (§3) |
| "Vejo o solicitante no card do exame" | ⬜ registrado | título + emissor + médico solicitante (§4) |
| "A plataforma me avisa se o documento já existe" | ⬜ registrado | detecção de duplicados por fingerprint+evidências (§5) |

## Futuro (visão)
| Capacidade | Estado | Nota |
|---|---|---|
| "Importo as imagens do exame (laudo + imagens)" | ⬜ | captura de evidência completa (M7) |
| "Comparo mamografias/OCTs ao longo do tempo" | ⬜ | camada cognitiva (evidência longitudinal) |
| "Reembolso / IR / gestão de despesas em saúde" | ⬜ | habilitado pela camada administrativa do Evento |
| "Importo de FHIR/DICOM/HL7/hospital automaticamente" | ⬜ | conectores de aquisição |

---

**Ligação com o técnico:** cada capacidade acima é entregue por milestones em `EXECUCAO_MILESTONES.md`.
Ex.: "nunca vejo incompleto como completo" ← M2 (Cobertura); "cada exame vira um registro" ← M3 (split
de CDUs); "exame estruturado por modalidade" ← M5/Clinical Processing Engine + **capacidades clínicas**.

**3 painéis:** técnico (`EXECUCAO_MILESTONES.md`) · produto (este) · **clínico**
(`COBERTURA_CLINICA.md` — % de modalidades médicas compreendidas de ponta a ponta).
