export type ApiErrorBody = {
    code?: string;
    message?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: "Login ou senha incorretos.",
    AUTH_USER_NOT_FOUND: "Usuário não encontrado.",
    AUTH_LOGIN_ALREADY_IN_USE: "Este login já está em uso.",
    AUTH_REGISTRY_INTERNAL_ERROR:
        "Erro interno ao processar o cadastro. Tente novamente.",
    AUTH_RESET_TOKEN_INVALID:
        "Este link de redefinição é inválido ou já expirou. Solicite um novo.",
    AUTH_EMAIL_NOT_VERIFIED:
        "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
    AUTH_VERIFICATION_TOKEN_INVALID:
        "Este link de confirmação é inválido, já foi usado ou expirou. Peça um novo abaixo.",
    PROFILE_NOT_FOUND: "Perfil não encontrado.",
    PROFILE_NAME_EXISTS: "Já existe um perfil com este nome.",
    PROFILE_HAS_LINKED_USERS:
        "Não é possível apagar este perfil porque existem usuários vinculados.",
    PROFILE_USER_EXISTS: "Este usuário já está vinculado a este perfil.",
    PROFILE_INACTIVE: "Não é possível vincular um perfil inativo.",
    PROFILE_ROLE_MISMATCH:
        "Este perfil não é permitido para o tipo de usuário selecionado.",
    USER_NOT_FOUND: "Usuário não encontrado.",
    USER_ADMIN_ROLE_FORBIDDEN:
        "Não é permitido atribuir ou remover o papel de administrador desta forma.",
    USER_INVALID_DOCUMENT:
        "O documento não corresponde ao tipo de usuário selecionado.",
    EMAIL_NOT_FOUND: "E-mail não encontrado no histórico.",
    EMAIL_ALREADY_SENT: "Este e-mail já foi enviado.",
    EMAIL_CONTENT_UNAVAILABLE:
        "O conteúdo deste e-mail não está mais disponível para reenvio.",
    TEMPLATE_NOT_FOUND: "Template não encontrado.",
    TEMPLATE_KEY_INVALID:
        "A chave deve ter apenas letras minúsculas, números e hífens.",
    TEMPLATE_KEY_EXISTS: "Já existe um template com esta chave.",
    TEMPLATE_SYSTEM_PROTECTED:
        "Templates do sistema não podem ser apagados. Desative-o se necessário.",
    TEMPLATE_NO_DEFAULT: "Só templates do sistema têm um padrão para restaurar.",
    TEMPLATE_BUTTON_INVALID:
        "O botão precisa de um texto e de um link http(s) ou de uma variável, como {{actionUrl}}.",
    VALIDATION_ERROR: "Verifique os dados informados.",
    INTERNAL_ERROR: "Erro interno. Tente novamente.",
};

export function messageForErrorCode(code: string | undefined): string | null {
    if (!code) return null;
    return ERROR_MESSAGES[code] ?? null;
}

export function parseApiErrorBody(body: string): ApiErrorBody | null {
    const trimmed = body.trim();
    if (!trimmed.startsWith("{")) return null;

    try {
        const parsed = JSON.parse(trimmed) as ApiErrorBody;
        if (typeof parsed !== "object" || parsed === null) return null;
        return parsed;
    } catch {
        return null;
    }
}
