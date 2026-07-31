# MOBILE-022 — Template de Evidências de Incremento (auditabilidade)

- **Status:** PADRÃO ADOTADO (fundadora, 2026-07-31). Estrutura fixa de evidências para **todo** incremento
  Mobile — reduz ambiguidade e facilita auditoria. Ratifica auditabilidade/reprodutibilidade ([ADR-012](adr/ADR-012_CONTINUIDADE_OPERACIONAL.md)).

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

## Comando de verificação reproduzível (Mobile)

```bash
git checkout <SHA> && npm run typecheck:mobile && npm run typecheck:packages && npx vitest run tests/mobile tests/packages tests/contracts
```

## Campos mínimos de reprodutibilidade (na homologação)

SHA completo · link do run do Actions · versão Node/npm · id do build EAS · roteiro executado. Ver
[MOBILE-003 §3.1](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md) (runbook) e a [Política de Validação](MOBILE-015_ROADMAP_INCREMENTOS.md#política-de-validação-nuvem-first--2026-07-29).
