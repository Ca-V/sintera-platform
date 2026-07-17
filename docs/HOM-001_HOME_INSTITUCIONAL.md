# HOM-001 — Home Institucional (ESPECIFICAÇÃO para validação)

**Status:** 🟡 **proposta — aguarda aprovação da fundadora** (antes de qualquer código) · **Versão:** 0.1 (17/07/2026).
**Objetivo:** reposicionar a Home para **apresentar a proposta de valor** da SINTERA — o que é, propósito, missão/
visão, como funciona, o que faz e o que **não** faz, módulos/benefícios, acompanhamento longitudinal·organização·
governança·rastreabilidade, e um **vídeo institucional**. **Fontes canônicas** (não reinventar): Narrativa
Estratégica, Estratégia-Mestre, One-Pager, North Star, [[GOVERNANCA]] (RDC 657), Branding Van Gogh. Segue [[ARCH-000]].

> **Regra de conformidade (transversal a TODA a copy):** linguagem **factual** — organiza·preserva·acompanha.
> **Nunca** sugerir diagnóstico, interpretação clínica, score de risco ou tomada de decisão (RDC 657/2022; LGPD
> Art. 11). Sempre encaminhar à avaliação médica quando pertinente. Vocabulário de marca: "história de saúde",
> "documento", "jornada", "continuidade", "rastreabilidade".

---

## 0. Decisão de posicionamento a validar (a ÚNICA que depende de você antes do desenho fino)
**Onde vive a Home Institucional?** Recomendação: **página institucional pública** (porta de entrada, ex.: `/` ou
`/sobre`), **distinta** do **Painel Inicial operacional** (logado, `/dashboard`, que continua sendo a tela de uso
diário). Motivo: o conteúdo (o que é/missão/visão/vídeo/o que não faz) é **institucional e de primeira impressão**;
o Painel logado é **operacional**. **Confirmar:** (a) landing pública nova · (b) ou reformular o Painel logado ·
(c) ou ambos (institucional pública + um resumo institucional no topo do logado para quem já entrou). *(Também
preciso saber a **fonte do vídeo** institucional — arquivo/URL — que é insumo seu, BETA-10.)*

## 1. Posicionamento institucional (mensagens-chave)
- **Uma frase:** *"O lar confiável da sua história de saúde."*
- **Proposta de valor:** *Todo o seu histórico de saúde, de todas as fontes, organizado, estruturado e num só
  lugar — preservando a evolução do seu cuidado ao longo do tempo.*
- **O que É:** uma plataforma para **organizar, registrar e acompanhar** as informações de saúde ao longo do
  tempo, preservando **histórico** e **rastreabilidade** de cada registro.
- **O que NÃO é:** não é telemedicina · não é prontuário · não é IA diagnóstica · não é score de risco · **não
  substitui o médico**. Não interpreta nem decide — **organiza e preserva**.
- **Diferencial:** **governança** (rastreável, auditável, versionada) e **continuidade** (a jornada, não o
  documento isolado).

## 2. Arquitetura da página (seções, ordem e fluxo)
Fluxo do mais externo (*por que existo*) ao mais concreto (*como uso*), terminando em ação:

1. **Hero** — proposta de valor + CTA principal.
2. **O que é a SINTERA** (+ "o que não é").
3. **O problema que resolvemos.**
4. **Como funciona** (3–4 passos).
5. **Vídeo institucional** ("Veja a SINTERA em ação").
6. **Módulos & benefícios.**
7. **Acompanhamento longitudinal · Organização · Governança · Rastreabilidade** (o diferencial).
8. **Propósito · Missão · Visão** (bloco institucional).
9. **O que a plataforma faz e não faz** (conformidade, explícito).
10. **CTA final** (começar/entrar).
11. **Rodapé** (Privacidade · LGPD · Termos · contato).

## 3. Detalhe por seção — objetivo + conteúdo sugerido

**① Hero.** *Objetivo:* primeira impressão; dizer em 1 frase o que é + o valor, e convidar à ação.
*Conteúdo:* Título **"O lar confiável da sua história de saúde."** · Subtítulo: *"Reúna exames, consultas,
medicamentos e mais — de todas as fontes — organizados e num só lugar, preservando a evolução do seu cuidado ao
longo do tempo."* · CTA primário **"Começar"** (→ cadastro/login) · CTA secundário **"Ver como funciona"**
(âncora ao vídeo). Nota discreta: *"A SINTERA organiza e preserva suas informações — não faz diagnóstico."*

**② O que é a SINTERA.** *Objetivo:* definição objetiva + delimitar o escopo (o que não é), gerando confiança.
*Conteúdo:* parágrafo de definição (item 1) + faixa **"O que a SINTERA não é"** com os 5 nãos (telemedicina·
prontuário·IA diagnóstica·score·substituto do médico).

**③ O problema que resolvemos.** *Objetivo:* gerar identificação. *Conteúdo:* *"Seus dados de saúde vivem
espalhados — laudos em PDF, consultas, vacinas, procedimentos — sem continuidade e sem rastreabilidade. Não falta
informação; falta organização e continuidade sobre a sua jornada."*

**④ Como funciona (passos).** *Objetivo:* mostrar a mecânica simples. *Conteúdo (4 passos, ícones):*
1. **Capture** — envie documentos de qualquer fonte (foto, arquivo, PDF) ou registre manualmente.
2. **Organize** — a SINTERA **lê, transcreve e estrutura** os dados (sem interpretar).
3. **Acompanhe** — tudo entra na sua **linha do tempo** e na **evolução** por exame/indicador.
4. **Compartilhe** — gere relatórios e compartilhe com quem cuida de você, com rastreabilidade ao original.

**⑤ Vídeo institucional.** *Objetivo:* explicar a plataforma e **demonstrar o uso** (reduz fricção de entrada).
*Local:* seção dedicada logo após "Como funciona" (a explicação textual prepara o vídeo). *Forma:* player
**responsivo** com **imagem de capa (poster)**, **legendas**, **sem autoplay** (respeita `prefers-reduced-motion`
e dados móveis); título *"Veja a SINTERA em ação"* + 1 linha de contexto. Fonte do vídeo = insumo da fundadora
(arquivo/URL). Fallback enquanto não houver vídeo: um placeholder elegante "em breve" ou um tour em imagens.

**⑥ Módulos & benefícios.** *Objetivo:* mostrar amplitude sem sobrecarregar. *Conteúdo (grade, benefício factual):*
- **Registros de Saúde** — sua linha do tempo (consultas, exames, vacinas, procedimentos).
- **Histórico de Exames** — cada exame ao longo do tempo, com biomarcadores rastreáveis ao laudo.
- **Composição Corporal** — evolução do corpo de múltiplas fontes (bioimpedância, DEXA), com origem e confiabilidade.
- **Monitoramento** — sinais e atividades ao longo do tempo (e, adiante, dispositivos).
- **Medicamentos e Suplementos** — o que você usa, com lembretes.
- **Agenda** — consultas, exames e lembretes.
- **Relatórios** — compartilhamento organizado com profissionais.
- **Despesas** — a visão financeira dos seus cuidados (projeção, não fonte).

**⑦ Longitudinal · Governança · Rastreabilidade (diferencial).** *Objetivo:* comunicar o moat de forma simples.
*Conteúdo:* três pilares: **Acompanhamento longitudinal** (o valor está na trajetória, não no valor isolado) ·
**Organização & governança** (informação estruturada, com origem e proveniência) · **Rastreabilidade** (cada dado
volta ao laudo/registro original — nada fica "solto").

**⑧ Propósito · Missão · Visão.** *Objetivo:* âncora institucional. *Conteúdo (canônico):*
- **Propósito:** dar às pessoas o controle e a continuidade da própria história de saúde.
- **Missão:** construir a **história longitudinal — completa, confiável, interoperável e governada** — da saúde de
  cada pessoa, preservando a **continuidade do cuidado** ao longo da vida.
- **Visão:** transformar a saúde preventiva de **eventos isolados** em uma **jornada contínua, rastreável e
  governada**.

**⑨ O que faz e o que não faz (conformidade).** *Objetivo:* transparência regulatória explícita. *Conteúdo:* duas
colunas — **Faz:** organiza·transcreve·preserva·acompanha·compartilha·lembra. **Não faz:** diagnóstico·
interpretação clínica·prescrição·score de risco·decisão médica. Fecho: *"A SINTERA apoia — quem cuida é você e
sua equipe de saúde."*

**⑩ CTA final.** *Objetivo:* conversão. *Conteúdo:* *"Comece sua história de saúde."* + botão Começar/Entrar.

**⑪ Rodapé.** Links institucionais/legais (Privacidade · LGPD · Termos · contato) + assinatura de marca.

## 4. Jornada do usuário (ao percorrer a Home)
1. **Chega** → Hero responde "o que é e por que me importa" em 5 segundos.
2. **Entende o escopo** → "o que é / o que não é" gera confiança (sem promessa clínica).
3. **Se identifica** → o problema (dados dispersos) espelha a dor real.
4. **Vê a mecânica** → 4 passos simples desarmam a percepção de complexidade.
5. **Assiste** → o vídeo demonstra o uso e reduz a fricção de começar.
6. **Explora o valor** → módulos + diferencial (longitudinal/governança/rastreabilidade).
7. **Confia** → propósito/missão/visão + conformidade explícita.
8. **Age** → CTA final. *(Usuário logado: CTA leva ao Painel; novo: ao cadastro.)*

## 5. Conformidade & guardrails de copy
Toda a página passa pelo Compliance Gate ([[COMPLIANCE-001]]): sem verbos de diagnóstico/interpretação; disclaimer
factual visível; nenhuma promessa de resultado clínico; termos de marca coerentes com o [[posicionamento_marca]].

## 6. Implementação (SÓ após aprovação desta spec)
Componentes reutilizáveis do DS (Card/Section/PageHeader/gradiente Van Gogh); responsivo e acessível (AUD-001);
vídeo com lazy-load; SEO/meta institucional; i18n pronto (pt-BR agora); CTAs conscientes de sessão (logado vs
novo). **Nada é implementado antes do seu aval** nas decisões do §0 e no conteúdo dos §1–§3.
