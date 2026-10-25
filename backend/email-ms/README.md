# email-ms

Envio de e-mails transacionais do Digital Paper (SMTP do Gmail), com templates editáveis pelo admin e histórico completo em Postgres próprio.

Porta `8083` · banco `digitalpaper_email` (`localhost:5435`) · admin em **/admin/email** no frontend.

## Fluxo

```
evento (RabbitMQ) → Listener → EmailMessage(templateKey, variáveis) → EmailService
                                                                        │
          tb_email_template (textos do admin) → EmailRenderer (layout Thymeleaf) → EmailSender (SMTP)
                                                                        │
                                                                        └→ tb_email / tb_email_attempt
```

- **Templates** ficam no banco (`tb_email_template`). O admin edita só o conteúdo (assunto, título, corpo, botão…);
  o visual vem do layout em `templates/email/` e é igual para todos.
- O conteúdo usa uma mini-linguagem: `{{variavel}}`, `**negrito**`, linha em branco = novo parágrafo.
  Ele **nunca** é interpretado pelo Thymeleaf e tudo é escapado (sem risco de injeção). Links de botão só `http(s)`.
- **Templates de sistema** (`account-confirmation`, `password-reset`) são criados na inicialização. O admin pode
  editar os textos, desativar e "restaurar padrão" (textos em `SystemTemplates`), mas não apagar nem mudar chave,
  variáveis ou link do botão.

## Enviando um e-mail de outro serviço (sem mexer no email-ms)

1. Crie o template no admin (ex.: chave `alerta-processo`, usando `{{name}}`, `{{processNumber}}`, `{{actionUrl}}`).
2. Publique no exchange `email.exchange` com routing key `email.send`:

```json
{
  "eventId": "uuid-opcional-para-evitar-duplicidade",
  "templateKey": "alerta-processo",
  "source": "core",
  "recipientUserId": 42,
  "recipientEmail": "ana@exemplo.com",
  "recipientName": "Ana",
  "variables": { "name": "Ana", "processNumber": "2026/0077", "actionUrl": "https://…/processos/77" }
}
```

Variáveis ausentes ficam vazias. Template inexistente → `FAILED`; template desativado → `SKIPPED`.

Para eventos de domínio que já existem (como os do auth-ms), dá para ter um listener + composer dedicados
(`messaging/` e `composer/`) que traduzem o evento em `EmailMessage` — foi assim com confirmação de conta e senha.

## Status

| Status     | Significado                                                                        |
|------------|------------------------------------------------------------------------------------|
| `PENDING`  | Registrado, antes da primeira tentativa                                            |
| `SENT`     | Aceito pelo SMTP                                                                   |
| `RETRYING` | Falhou; o `EmailRetryJob` tenta de novo em `next_attempt_at` (backoff exponencial) |
| `FAILED`   | Esgotou as tentativas ou o template não existe; pode ser reenviado pelo admin      |
| `SKIPPED`  | Template desativado — nada foi enviado                                             |

Templates `sensitive` (links de uso único) têm o HTML apagado após o envio e nunca são exibidos pela API.
Falhas de processamento vão para a DLQ `email.queue.dlq`. O mesmo `eventId` nunca gera dois e-mails.

## API admin (JWT com role `ADMIN`)

| Método | Rota                                         | Uso                                         |
|--------|----------------------------------------------|---------------------------------------------|
| GET    | `/admin/email/template`                     | Lista com envios dos últimos 30 dias        |
| GET    | `/admin/email/template/{id}`                | Detalhe                                     |
| POST   | `/admin/email/template`                     | Cria template                               |
| PUT    | `/admin/email/template/{id}`                | Edita conteúdo                              |
| PATCH  | `/admin/email/template/{id}/enabled`        | Ativa/desativa                              |
| POST   | `/admin/email/template/{id}/restore-default`| Volta aos textos padrão (só sistema)        |
| DELETE | `/admin/email/template/{id}`                | Apaga (só personalizados)                   |
| POST   | `/admin/email/template/preview`             | Renderiza um rascunho com valores de exemplo|
| POST   | `/admin/email/template/{id}/test`           | Envia um teste (ignora "desativado")        |
| GET    | `/admin/email?q=&status=&template=`         | Histórico paginado                          |
| GET    | `/admin/email/{id}`                         | Detalhe + tentativas                        |
| POST   | `/admin/email/{id}/resend`                  | Nova tentativa manual                       |

## Testes de template

`./mvnw test -Dtest=EmailTemplatesTests` — renderiza os templates de sistema (salvos em `target/email-preview/`)
e cobre o escape de conteúdo e o bloqueio de links não-http.

## Configuração (Gmail)

1. Ative a verificação em 2 etapas na conta Google.
2. Gere uma **senha de app** em https://myaccount.google.com/apppasswords.
3. Defina no ambiente (ou no `.env`, **sem commitar**):
   ```
   SPRING_MAIL_USERNAME=sua-conta@gmail.com
   SPRING_MAIL_PASSWORD=<senha de app, sem espaços>
   APP_MAIL_FROM=              # opcional; vazio = SPRING_MAIL_USERNAME
   APP_MAIL_DRY_RUN=false      # true = não envia, só loga os links
   ```
