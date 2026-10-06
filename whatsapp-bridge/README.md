# WashControl WhatsApp Bridge

Serviço pequeno (Node/Express) que roda na sua VPS e liga o WashControl (que
continua no Supabase) à sua instância EvolutionGo/Evolution API.

Com ele ativado, manda uma mensagem pro próprio número do negócio e o
sistema executa na hora:

| Comando | Exemplo |
|---|---|
| Cadastrar cliente | `cadastrar cliente João Silva, 11999998888, Onix Prata` |
| Cadastrar serviço | `cadastrar serviço Lavagem Completa, 80, 60` |
| Agendar (fala natural) | `João agendou lavagem completa pro jetta às 8h valor 80,00` |
| Agendar (formato fixo) | `agendar João, Lavagem Completa, Jetta, 08:00, 80` |
| Vale (adiantamento) | `vale Carlos, 50` |
| Pagamento de funcionário | `pagamento funcionário Carlos, 200` |
| Ajuda | `ajuda` (lista os comandos a qualquer momento) |

Além disso, todo dia (cron configurável) verifica quais clientes completaram
a janela de dias configurada (`Configurações > WhatsApp` no app) desde a
última lavagem e manda a mensagem de reativação automaticamente.

**Sobre o agendamento criado via WhatsApp:** ele entra no sistema com status
"agendado" — aparece na hora no painel/agenda (igual um agendamento feito
pelo app), mas só entra no **Financeiro** quando o atendimento for marcado
como concluído (check-out), exatamente como já funciona hoje pra qualquer
agendamento manual. Isso é intencional: não se conta receita de um serviço
que ainda não foi feito.

Não guarda nenhuma senha de WhatsApp nem dado de cliente localmente — tudo
fica no seu Supabase; a EvolutionGo é quem mantém a sessão do WhatsApp.

## Pré-requisitos

- Sua instância EvolutionGo (ou Evolution API) já rodando e acessível a
  partir desta VPS, com a **API key global** dela em mãos.
- Do seu projeto Supabase (Project Settings → API):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha isso no frontend)
  - `SUPABASE_JWT_SECRET` (em JWT Settings)
- Um domínio/subdomínio com HTTPS apontando pra essa VPS (ex: via Caddy,
  Nginx ou Traefik que você já deve ter na frente da EvolutionGo), pra
  `BRIDGE_PUBLIC_URL`. A EvolutionGo precisa alcançar essa URL pra entregar
  os webhooks.
- Rodar a migration `supabase/migrations/20261001120000_*.sql` no seu
  projeto Supabase (painel SQL Editor, ou `supabase db push` se usar a CLI).

## Deploy

```bash
cd whatsapp-bridge
cp .env.example .env
# edite o .env com suas credenciais

docker compose up -d --build
```

Teste rápido:

```bash
curl https://sua-url-do-bridge/health
# {"ok":true}
```

## Conectando o WhatsApp de cada empresa

O app já tem uma aba **Configurações → WhatsApp** com os botões de conectar
(mostra QR Code), status da conexão e desconectar — eles chamam,
respectivamente:

- `POST /api/whatsapp/connect`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/disconnect`

Todos exigem `Authorization: Bearer <token da sessão Supabase do usuário>` —
o bridge valida esse token com `SUPABASE_JWT_SECRET` e descobre de qual
empresa (`user_id`) se trata, então não há nenhuma chave de API por empresa
pra gerenciar: cada conta recebe automaticamente sua própria instância
EvolutionGo (nome gerado a partir do `user_id`) na primeira vez que clica em
"Conectar".

## Sobre os endpoints da EvolutionGo

O cliente em `src/evolution.ts` usa as rotas no padrão Evolution API
(`/instance/create`, `/instance/connect/:nome`, `/message/sendText/:nome`,
`/webhook/set/:nome`, etc.), que é o padrão que a própria EvolutionGo segue
por ser um fork/reescrita compatível. Se a sua versão específica usar rotas
diferentes, esse é o único arquivo que precisa de ajuste — confira o
Swagger/`/docs` da sua instância.

## Como o sistema reconhece cliente, serviço e funcionário

Pra agendar, dar vale ou registrar pagamento, o bridge procura o nome
informado entre os clientes/serviços/funcionários já cadastrados daquela
empresa (sem diferenciar maiúsculas/acentos, e aceitando nome parcial). Se
não encontrar (ou o serviço/funcionário ainda não existir), ele responde
pedindo pra cadastrar primeiro, em vez de criar algo errado adivinhando.

## Notificações push (instalação do app + avisos pro Super Admin)

O bridge também manda notificações push (Web Push, funciona com o app
instalado como PWA no Android e no iPhone a partir do iOS 16.4):

1. Gere um par de chaves VAPID uma única vez: `npx web-push generate-vapid-keys`.
2. Coloque a chave **pública** em `VITE_VAPID_PUBLIC_KEY` no `.env` do
   frontend (raiz do projeto) e repasse pelo build (já configurado no
   `Dockerfile`).
3. Coloque as duas chaves (`VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`) no
   `.env` deste bridge, junto com `VAPID_CONTACT_EMAIL`.
4. Rode a migration `supabase/migrations/20261006140000_push_notifications.sql`.

Com isso:
- Qualquer usuário pode ativar notificações na Central de Ajuda do app
  (aba que também explica como instalar o PWA no Android/iPhone).
- O bridge verifica a cada 2 minutos (`ADMIN_NOTIFICATIONS_CRON_SCHEDULE`)
  se apareceu **cadastro novo** ou **assinatura nova/ativada**, e manda uma
  notificação push pra todo usuário com papel `admin` (Super Admin) que
  tiver ativado notificações no próprio aparelho.

Sem as chaves VAPID configuradas, essa checagem simplesmente fica desligada
(log avisando isso) — o resto do bridge funciona normalmente.

## Sobre "carro" no cadastro via WhatsApp

Como o WhatsApp só manda texto livre (sem placa confiável), o carro
informado no comando é salvo nas observações do cliente (`clients.notes`).
Se quiser um veículo "de verdade" (com placa, vinculado pra agendamento),
complete o cadastro no app normalmente.
