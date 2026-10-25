package com.digitalpaper.email.template;

import java.util.List;
import java.util.Optional;
import com.digitalpaper.email.entity.EmailTemplate;


public final class SystemTemplates {

    public static final String ACCOUNT_CONFIRMATION = "account-confirmation";
    public static final String PASSWORD_RESET = "password-reset";

    public static final List<EmailTemplate> DEFAULTS = List.of(
        EmailTemplate.builder()
            .templateKey(ACCOUNT_CONFIRMATION)
            .name("Confirmação de conta")
            .description("Enviado após o cadastro com o link de confirmação do e-mail. Sem ele, o usuário não consegue entrar.")
            .sensitive(true)
            .subject("Confirme seu e-mail — Digital Paper")
            .preheader("Sua conta foi criada. Confirme seu e-mail para começar a usar o Digital Paper.")
            .eyebrow("Confirmação de e-mail")
            .heading("Confirme seu e-mail")
            .body("""
                Olá, **{{name}}**.

                Sua conta no Digital Paper foi criada com o login **{{login}}**. Para ativá-la, confirme que este endereço de e-mail é seu.""")
            .buttonLabel("Confirmar e-mail")
            .buttonUrl("{{actionUrl}}")
            .notice("O link expira em **{{expiresIn}}**. Se ele expirar, peça um novo na tela de login.")
            .footerNote("Se você não criou esta conta, ignore este e-mail — nenhum acesso será liberado.")
            .variables("name,login,actionUrl,expiresIn")
            .build(),

        EmailTemplate.builder()
            .templateKey(PASSWORD_RESET)
            .name("Redefinição de senha")
            .description("Enviado quando o usuário pede para redefinir a senha em \"Esqueci minha senha\".")
            .sensitive(true)
            .subject("Redefinição de senha — Digital Paper")
            .preheader("Recebemos um pedido para redefinir sua senha. O link expira em {{expiresIn}}.")
            .eyebrow("Recuperação")
            .heading("Nova senha")
            .body("""
                Olá, **{{name}}**.

                Recebemos um pedido para redefinir a senha da conta **{{login}}**. Clique no botão abaixo para definir uma nova senha.""")
            .buttonLabel("Redefinir senha")
            .buttonUrl("{{actionUrl}}")
            .notice("O link expira em **{{expiresIn}}** e só pode ser usado uma vez.")
            .footerNote("Se você não pediu a redefinição, ignore este e-mail. Sua senha atual continua valendo.")
            .variables("name,login,actionUrl,expiresIn")
            .build()
    );

    private SystemTemplates() {}

    public static Optional<EmailTemplate> defaultFor(String templateKey) {
        return DEFAULTS.stream()
            .filter(template -> template.getTemplateKey().equals(templateKey))
            .findFirst();
    }

}
