# Evento Assistencial — a entidade central do domínio (requisitos permanentes)

> Fundadora (13/07/2026): definições do **modelo definitivo** da SINTERA, surgidas dos testes. **Não é
> pedido de implementação imediata** — registrar como requisitos permanentes para incorporar no momento
> certo (consolidação do **Clinical Processing Engine** + modelo de **Evento Assistencial**). Se algum item
> impactar a arquitetura em construção agora, considerar já para evitar retrabalho; senão, planejar para a
> etapa imediatamente posterior.
>
> **Camada:** DOMÍNIO (Evento Assistencial), não INGESTÃO (Documento/Bundle/CDU/CPE). Por isso não
> interrompe a espinha do pipeline.

---

## 0. Refinamento arquitetural de alto valor — o Evento Assistencial é o objeto CENTRAL

Hoje a plataforma já tem: **Documento → Bundle → CDU → (evidência estruturada)** na ingestão, e um **modelo
de eventos** no domínio. Este refinamento **não muda nada do que foi construído** — apenas identifica
corretamente a entidade de domínio que conecta todas as capacidades novas:

```
Evento Assistencial            (exame · consulta · cirurgia · medicamento · suplemento · procedimento…)
│
├── Documentos clínicos        (as CDUs / evidências estruturadas do CPE)
├── Documentos administrativos (nota fiscal · recibo · comprovante de pagamento)
├── Valores                    (valor pago · data · forma de pagamento)
├── Reembolsos
├── Recorrências               (próxima data · intervalo · lembrete · situação)
├── Agendamentos
├── Timeline                   (histórico E planejamento futuro do cuidado)
├── Condições relacionadas
├── Medicamentos relacionados
└── Evidências estruturadas
```

**Impacto:** deixa de ser "uma plataforma que organiza exames" e passa a ser "uma plataforma que organiza
**todos os eventos da vida em saúde**". Todas as capacidades administrativas e de acompanhamento vivem no
Evento Assistencial — **nunca replicadas por módulo** (exame/consulta/cirurgia/tratamento compartilham as
MESMAS capacidades). Arquitetura única, consistente, escalável. **A representação clínica permanece
independente da administrativa.**

---

## Requisitos permanentes

### 1. "Estruturação parcial" deixa de existir como estado ao usuário
Só existem **dois estados apresentados**:
- **Resultados estruturados** — o Clinical Processing Engine representa **integralmente** aquela modalidade.
- **Documento disponível** — ainda **não há processador** capaz de representar completamente a modalidade;
  o documento permanece **íntegro e disponível** para consulta.

A plataforma **não** apresenta mais "estrutura parcialmente organizada". As **métricas de cobertura
continuam existindo INTERNAMENTE** (auditoria, evolução dos processadores, reprocessamentos), mas **não
aparecem como estado da interface**. → *toca o trabalho atual: ver §Implementação.*

### 2. Informações administrativas pertencem ao Evento Assistencial (não ao exame)
Cada Evento pode ter, **opcionalmente**: valor pago · data do pagamento · forma de pagamento (opcional) ·
nota fiscal · recibo · comprovante de pagamento · outros documentos administrativos. Ficam **vinculados ao
evento**, mas **separados da representação clínica**. Habilita: reembolso · IR · auditoria financeira ·
prestação de contas · gestão de despesas em saúde.

### 3. Recorrência e acompanhamento — capacidade GENÉRICA do Evento (não só exames)
Qualquer Evento registra acompanhamento futuro: repetir exame em 6 meses · retorno em 30 dias · cirurgia de
revisão · renovar medicamento · novo ciclo de suplemento · revisão anual. Campos: **recorrência · intervalo
· próxima data prevista · lembrete futuro · situação (pendente/realizado/cancelado)**. A **Timeline** passa a
representar histórico **E** planejamento futuro do cuidado.

### 4. Identificação dos exames laboratoriais no card
O card do exame apresenta, sempre que disponível: **título documental · instituição emissora · médico
solicitante**. Ex.: *"Elastase Pancreática — Hermes Pardini — Solicitante: Dr. João Silva"* ou *"Exames
laboratoriais — Hermes Pardini — Solicitante: Dra. Maria Souza"*. (Requer capturar o **solicitante** na
extração.)

### 5. Detecção de documento duplicado (requisito permanente — reforço)
Antes de criar um registro, verificar automaticamente se já existe documento equivalente, por **múltiplas
evidências**: paciente · data · emissor · título documental · **fingerprint do documento**. Alta confiança →
informar que o documento provavelmente já existe e oferecer: **cancelar · substituir · manter ambos ·
comparar**. **Nunca criar duplicidades silenciosamente.**

### 6. Princípio permanente — toda informação ao usuário é rastreável ao pipeline
Tudo que a plataforma apresenta (**Resultados estruturados · Documento disponível · Documento duplicado ·
Próxima recorrência · Valor pago · Instituição · Solicitante**) deve ser **consequência rastreável da
arquitetura**, nunca decisão implícita do modelo de IA. É o que sustenta confiança, auditabilidade e
evolução futura. (Conecta com a Validação entre Camadas e a Identidade Documental.)

---

## Implementação — quando (recomendação de engenharia)

**Registrar agora (feito); implementar na etapa de DOMÍNIO / consolidação do CPE.** Nada aqui exige
interromper a espinha do pipeline em andamento. Sequência sugerida:

- **§1 (fim da parcial)** — *único item que encosta no trabalho atual.* O estado interno `partial` fica para
  auditoria (cobertura); muda apenas o **mapeamento para a UI** → 2 estados (`Resultados estruturados` quando
  a modalidade é integralmente representada pelo CPE; `Documento disponível` caso contrário). Como o sinal
  "modalidade integralmente representada" só existe quando os processadores do CPE rodam, isto acompanha a
  entrega das capacidades clínicas — **sem rework agora**.
- **§2, §3 (admin + recorrência)** — camada de domínio do Evento Assistencial: schema próprio
  (`event_administrative_documents`, `event_recurrences`) + UI, na consolidação do modelo de Evento.
- **§4 (solicitante no card)** — capturar `requesting_physician` na extração + exibir no card.
- **§5 (duplicados)** — usar o `representation_fingerprint` já existente + evidências (paciente/data/emissor)
  no fluxo de upload/criação.
- **§6** — princípio de projeto aplicado a cada campo novo (sem passo isolado).

**Relação com o já construído:** `representation_fingerprint` (Reprodutibilidade) já é a base do §5; a
separação clínica × administrativa preserva a UCDA (evidência clínica) intacta.
