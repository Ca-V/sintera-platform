# Contratos de fluxo da usuária (Etapa 1) — harness

Estes arquivos são **contratos de integração** dos fluxos críticos da jornada de saúde.
São **documentação executável** (Frente B / preparação da Etapa 1) — escritos ANTES da
implementação, derivados da `MATRIZ_FLUXOS_CRITICOS.md` e do Modelo Canônico.

## Estado atual
Cada caso é um `it.todo(...)` — **pendente**: não executa e **não quebra o gate** (`vitest run`
os reporta como *todo*). Cada arquivo contém: cenário · entrada · comportamento esperado ·
projeções esperadas · critério de aceite · checklist de dependências.

## Ciclo de ativação (não inventar outro padrão)
```
describe / it.todo            (hoje — contrato escrito)
        ↓
Estado 2 (arquitetura congelada após o monitoramento)
        ↓
implementação do fluxo
        ↓
remover `.todo`  →  teste verde
        ↓
fluxo HOMOLOGADO  →  o Quadro de Fluxos Críticos vira ✅
```
**Regra:** todo novo fluxo de integração segue ESTE formato e mora aqui. Não escrever
testes de integração de fluxo em outro padrão/local (evita divergência).

## Mapa fluxo ↔ contrato
| Fluxo (Quadro) | Contrato |
|---|---|
| Aquisição de medicamento/suplemento | `acquisition-medication.contract.test.ts` |
| Aquisição de dispositivo | `acquisition-device.contract.test.ts` |
| Operacional (início/suspensão/troca/manutenção/encerramento) | `operational-event.contract.test.ts` |
| Renovação | `renew-prescription.contract.test.ts` |

Regras que estes contratos verificam: ver `IMPLEMENTATION_RULES.md`.
