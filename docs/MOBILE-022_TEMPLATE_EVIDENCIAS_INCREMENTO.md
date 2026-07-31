# MOBILE-022 — Template de Evidências de Incremento (auditabilidade)

- **Status:** PADRÃO ADOTADO (fundadora, 2026-07-31). Estrutura fixa de evidências para **todo** incremento
  Mobile — reduz ambiguidade e facilita auditoria. Ratifica auditabilidade/reprodutibilidade ([ADR-012](adr/ADR-012_CONTINUIDADE_OPERACIONAL.md)).

## Estados formais do incremento (não usar "concluído" ambíguo)

Cada incremento tem **um** estado explícito. "Concluído" é proibido (esconde estados diferentes).

| Estado | Critério | Evidência que sustenta |
|--------|----------|------------------------|
| **Planejado** | Escopo aprovado + **Readiness Review concluída**. | doc de planejamento + readiness |
| **Implementado** | Código concluído e **versionado**. | commit(s) + branch |
| **Verificado** | Typecheck + testes automatizados + **CI aprovados**. | link do run do Actions + saída de tsc/testes |
| **Homologado** | Validado em **dispositivo físico** conforme o roteiro. | prints/gravação + build id + roteiro executado |
| **Aceito** | Homologação concluída + documentação finalizada + **tag** criada. | tag `mobile-incN-accepted` + doc de aceite + bloco de rastreabilidade |

Um estado só é atingido quando **todos** os anteriores foram. Sempre indicar o estado atual do incremento.
"Planejado" ≠ "iniciar": planejar (Readiness) é permitido antes do aceite do anterior; a **implementação
funcional** ("Em Implementação") só começa após o incremento anterior estar **Aceito** + baseline atualizada.

**Critério final de encerramento (pergunta única, além dos estados):** *"Se um dev novo entrar amanhã, ele
consegue **entender, reproduzir, validar e evoluir** este incremento apenas consultando o repositório?"* Se
**sim**, está pronto para ser Aceito. É o teste prático da continuidade (ADR-012) e da auditabilidade.

### Etapa obrigatória APÓS cada Aceito: atualizar a BASELINE do projeto

Ao criar a tag do incremento, atualizar a **baseline** ([BASELINE_PROJETO.md](../BASELINE_PROJETO.md)),
consolidando: roadmap · ADRs · contratos · backlog · **riscos conhecidos** ([RISK_REGISTER.md](../RISK_REGISTER.md)) ·
versão Web · versão Mobile. Facilita auditoria e retomada por qualquer dev. Só então o próximo incremento
muda para **Em Implementação**.

## Princípio: **registro ≠ evidência**

Um documento que *afirma* "typecheck verde / 185 testes / CI success" é **registro**. Vira **evidência**
quando aponta para o **artefato verificável independentemente** (link do commit, link do run do GitHub Actions,
id do build EAS) — que qualquer pessoa abre e confirma **sem depender da palavra do autor**. A prova última é o
**repositório público** + o **GitHub Actions**: `git clone` + `git checkout <SHA>` + rodar o comando de
verificação reproduz o estado.

**Redação precisa (sem super-afirmar):** descrever o comportamento **na configuração atual do projeto**, não
como regra genérica (ex.: *"nesta configuração, `:app:assembleRelease` produz o APK esperado"* — e **não**
"gera um APK único" como afirmação universal). Distinguir **intenção** (ainda não verificada) de **fato**
(verificado por artefato).

## Estrutura fixa (preencher a cada incremento)

```
Incremento N — <nome>

1. Escopo implementado
   - o que entrou; o que ficou de fora (e por quê).

2. Evidências de ENGENHARIA (verificáveis)
   - SHA (completo)
   - Branch
   - Pull Request (quando houver)
   - GitHub Actions: link do run + conclusion
   - Typecheck: comando + resultado
   - Testes: comando + contagem (passados/falhados)
   - Build EAS: id + link + status

3. Evidências FUNCIONAIS
   - Homologação Android (roteiro + resultado por caso)
   - Homologação iOS (quando existir)
   - Prints ou gravação
   - Build ID homologado

4. Pendências (o que falta / riscos abertos / débito registrado no backlog)

5. Critério formal de ACEITE
   - só ACCEPTED com engenharia verde **E** homologação funcional em dispositivo físico sem regressão.
```

## Bloco de RASTREABILIDADE (obrigatório em todo doc de aceite)

Permite reconstruir exatamente o estado do sistema no momento do aceite — inclusive anos depois.

```
Incremento:
Estado:                 (Implementado | Verificado | Homologado | Aceito)
Branch:
Commit(s):              (SHA completo)
Tag:
Pull Request:
GitHub Actions:         (link do run + conclusion)
EAS Build:              (id + link)
APK SHA-256:            (hash do binário homologado)
Versão do aplicativo:   (app version / build number)
Versão do banco:        (migração aplicada / N/A)
Contrato da API:        (versão/commit dos tipos @sintera/api-client relevantes)
Data da homologação:
Responsável pela homologação:
```

> **APK SHA-256:** calcular do binário efetivamente homologado (ex.: `sha256sum <arquivo>.apk`) e registrar —
> garante que o APK testado é o mesmo que se afirma ter testado.

## Comando de verificação reproduzível (Mobile)

```bash
git checkout <SHA> && npm run typecheck:mobile && npm run typecheck:packages && npx vitest run tests/mobile tests/packages tests/contracts
```

## Campos mínimos de reprodutibilidade (na homologação)

SHA completo · link do run do Actions · versão Node/npm · id do build EAS · roteiro executado. Ver
[MOBILE-003 §3.1](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md) (runbook) e a [Política de Validação](MOBILE-015_ROADMAP_INCREMENTOS.md#política-de-validação-nuvem-first--2026-07-29).
