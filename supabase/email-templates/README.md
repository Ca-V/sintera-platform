# Modelos de e-mail de autenticação

**Fonte da verdade destes textos é este diretório, não o painel do Supabase.** Configuração que vive só no
dashboard é invisível para quem herda o projeto: não aparece em revisão, não tem histórico, e não sobrevive a uma
recriação do projeto. Editar aqui, depois colar no painel.

## Por que existem

Em 26/08/2026 os modelos eram o padrão da Supabase: **em inglês** e sem identidade. Um e-mail de recuperação
chegou com o assunto *"Reset your password"*, remetente SINTERA. Isso importa por duas razões, e nenhuma é
estética:

1. **É o primeiro contato.** Ao ligar a confirmação de e-mail, a primeira coisa que uma pessoa recebe da SINTERA
   passa a ser esse e-mail. Um texto genérico em inglês pedindo para clicar num link é literalmente o que se
   ensina alguém a não fazer. Numa plataforma de saúde, isso custa confiança no primeiro contato.
2. **É segurança.** Um e-mail transacional legível e reconhecível é o que permite à pessoa distinguir o
   verdadeiro de uma tentativa de golpe. Por isso todos dizem, no fim, o que fazer quando **não** foi ela.

## Aplicar

`supabase.com/dashboard` → projeto → **Authentication → Emails → Templates**. Cole o conteúdo no campo
*Message body* do modelo correspondente e salve um por vez.

| Arquivo | Modelo no painel | Assunto sugerido |
|---|---|---|
| `confirmar-cadastro.html` | Confirm signup | `Confirme seu e-mail — SINTERA` |
| `redefinir-senha.html` | Reset password | `Redefinir sua senha — SINTERA` |
| `alterar-email.html` | Change Email Address | `Confirme seu novo e-mail — SINTERA` |
| `link-de-acesso.html` | Magic Link | `Seu link de acesso — SINTERA` |

O assunto é um campo separado do corpo, e também está em inglês por padrão.

## Regras ao editar

- **Vocabulário documental, sem promessa de interpretação clínica** (ver `posicionamento_marca` e a orientação
  de comunicação regulatória). A SINTERA organiza, integra e contextualiza documentos — não interpreta.
- **Toda mensagem diz o que fazer se não foi a pessoa**, e diz que nada acontece sem a ação dela. É o que separa
  um e-mail legítimo de um golpe aos olhos de quem lê.
- **O link aparece também em texto**, para quem usa cliente que bloqueia botões.
- **HTML de e-mail é tabela com estilo inline.** Sem CSS externo, sem flex, sem grid: Outlook e Gmail descartam.
- **Cor-âncora `#579DA8`** como piso escuro com texto branco (COLOR-001). Não usar os tons claros em fundo de
  botão — o contraste do texto branco cai abaixo do aceitável.
- As variáveis `{{ .ConfirmationURL }}`, `{{ .Email }}` e `{{ .NewEmail }}` são do Supabase; preservar exatamente.
