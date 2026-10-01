# WashControl WhatsApp Bridge

Serviço pequeno (Node/Express) que roda na sua VPS e liga o WashControl (que
continua no Supabase) à sua instância EvolutionGo/Evolution API. Faz duas coisas:

1. **Cadastro de cliente via WhatsApp** — recebe o webhook de mensagens da
   EvolutionGo, reconhece o comando `cadastrar cliente Nome, Telefone, Carro`
   e grava direto na tabela `clients` do Supabase.
2. **Mensagem de retorno automática** — todo dia (cron configurável) verifica
   quais clientes completaram a janela de dias configurada (`Configurações >
   WhatsApp` no app) desde a última lavagem e manda a mensagem de reativação.

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

## Sobre "carro" no cadastro via WhatsApp

Como o WhatsApp só manda texto livre (sem placa confiável), o carro
informado no comando é salvo nas observações do cliente (`clients.notes`).
Se quiser um veículo "de verdade" (com placa, vinculado pra agendamento),
complete o cadastro no app normalmente.
