# API-001 — API Governance

> Raiz constitucional: **`ADR-000`** (Backward Compatibility · Evolution without Breaking Changes · Security by Design).
> **Decisão da fundadora (15/07/2026):** com integrações externas, a governança de APIs torna-se essencial
> quando múltiplos conectores passam a consumir/alimentar a plataforma. Documento arquitetural referenciado pelo
> Gate de Conformidade (`COMPLIANCE-001`, eixos Segurança · Auditoria · Interoperabilidade · Ecossistema).
> Aplica-se às APIs internas (rotas `src/app/api/*`), às consumidas por conectores (`HIP-001`) e a qualquer API
> pública futura.

## 1. Versionamento
- APIs versionadas explicitamente (ex.: prefixo `/v1/`); nunca quebrar um contrato publicado sem nova versão.
- Versão do payload alinhada ao modelo canônico (`DATA-001`).

## 2. Compatibilidade retroativa
- Mudanças **aditivas por padrão** (campos opcionais novos). Remover/renomear campo ou mudar tipo = nova versão.
- Consumidores antigos permanecem funcionais durante a janela de suporte da versão.

## 3. Descontinuação (deprecation)
- Política pública: anúncio → período de graça → remoção. Header `Deprecation`/`Sunset` quando aplicável.
- Descontinuação registrada e, se algum consumidor ainda depender, via **Exception Register** (`COMPLIANCE-001`).

## 4. Rate limiting
- Limites de taxa por credencial/origem; resposta `429` com `Retry-After`. Protege disponibilidade (COMP-10).

## 5. Autenticação
- Sem segredo em código (COMP-02). Credenciais em cofre; conectores externos via **OAuth 2.0** ou equivalente
  do fornecedor (COMP-13 §9). Tokens com armazenamento seguro, rotação e revogação.

## 6. Autorização
- Toda ação exige perfil explícito (COMP-03) e **menor privilégio**. Negar por padrão; autorização verificada
  no servidor (nunca só no cliente). Testes de autorização obrigatórios (COMP-09).

## 7. Idempotência
- Operações de escrita sensíveis aceitam **chave de idempotência** (evita duplicидade em retry — mesma classe do
  bug NC-0020). Sincronizações de conector são idempotentes por `identificador externo` (DATA-001/COMP-13 §3).

## 8. Auditoria
- Toda operação relevante gera trilha imutável (COMP-04): quem · quando (UTC) · o quê · IP · request id.
  Para conectores: 1ª autorização · renovação · sincronização · falha · revogação · alteração de permissão.

## 9. Padronização de erros
- Formato de erro único e estável: `{ error, code, message }` (mensagem amigável ao usuário, sem vazar
  interno/PII), `code` estável para o cliente, status HTTP correto. Alinha com o padrão já usado nas rotas atuais.

## 10. SLAs
- Metas de disponibilidade/latência por classe de API definidas ao publicar; monitoramento e alertas (COMP-10).
  SLAs de conectores dependem também do fornecedor (registrar na Connector Capability Matrix, COMP-13).

## Estado
Fundação parcial já presente (rotas com auth por segredo, erros padronizados em `{error,code}`, idempotência
introduzida em pontos críticos). Formalizado aqui; itens de rate limiting/SLAs/versionamento público evoluem
com as integrações (`HIP-001`) e o Gate de Conformidade.
