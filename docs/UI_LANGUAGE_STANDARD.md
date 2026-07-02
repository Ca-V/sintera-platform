# SINTERA — Padrão de Linguagem da Interface (UI_LANGUAGE_STANDARD)

**Status:** política de arquitetura (fundadora, 02/07/2026). **Fonte oficial** da linguagem da plataforma.
**Escopo:** Web, Mobile, IA, notificações, e-mails e documentação **herdam** este vocabulário. Toda nova tela/feature deve usá-lo. PRs que introduzirem sinônimos fora desta lista devem ser corrigidos.

> Coerente com o princípio de produto **Governança Científica** (`PLANO_MATURIDADE_PRE_MOBILE.md §0`): a plataforma organiza/descreve fatos, **não interpreta, não conclui, não recomenda** (RDC 657/2022).

---

## 1. Verbos oficiais (ações)
| Ação | Verbo OFICIAL | Nunca usar |
|---|---|---|
| Criar registro | **Adicionar** | Enviar, Novo, Inserir, Criar, Cadastrar |
| Alterar | **Editar** | Modificar, Alterar |
| Excluir | **Remover** | Deletar, Apagar, Excluir |
| Câmera | **Fotografar** | Tirar foto, Capturar, Fotografe |
| Scanner | **Escanear documento** | Escanear (solto), Digitalizar |
| Upload de arquivo | **Selecionar arquivo** | Upload, Fazer upload, Anexar, Enviar |
| Voz | **Gravar por voz** | Falar, Ditar, Gravar (solto) |
| Compartilhar | **Compartilhar** | Enviar, Exportar (quando for compartilhamento) |
| Exportar | **Exportar** | Baixar, Download |
| Buscar | **Pesquisar** | Buscar, Procurar |
| Filtrar | **Filtrar** | — |
| Comparar | **Comparar** | — |

**Regra de composição:** verbo oficial + objeto do contexto quando ajudar (ex.: "Adicionar exame", "Fotografar o laudo"). O **verbo** nunca muda entre telas.

## 2. Substantivos oficiais
**Sempre usar:** Exame · Documento · Biomarcador · Resultado · Evento · Histórico · Linha do Tempo · Agenda · Produto · Medicamento · Suplemento.
**Nunca usar (nestes contextos):**
- **Medição** quando o correto for **Biomarcador**. *(Exceção: "medição" como ponto/leitura de uma série — ex.: "3 medições" = 3 leituras — é aceitável; se for o marcador em si, use "biomarcador".)*
- **Registro** quando o correto for **Exame**.
- **Upload** quando o correto for **Selecionar arquivo**.

## 3. Termos PROIBIDOS (induzem interpretação clínica — RDC 657)
❌ Estável · ❌ Normal · ❌ Alterado · ❌ Melhor · ❌ Pior · ❌ Saudável · ❌ Adequado · ❌ Ideal · ❌ Preocupante · ❌ Excelente · ❌ (e similares: controlado, saudável, risco, sugere).

## 4. Termos PERMITIDOS (descritivos, factuais)
✔ Último resultado · ✔ Resultado anterior · ✔ Valor informado · ✔ Data da coleta · ✔ Intervalo de referência do laboratório · ✔ Diferença em relação ao exame anterior · ✔ Tendência observada · ✔ Histórico disponível · ✔ Dentro/Acima/Abaixo da referência informada pelo laboratório.

---
**Manutenção:** ao adicionar um verbo/substantivo novo, registrar aqui primeiro. Este documento precede a implementação.
