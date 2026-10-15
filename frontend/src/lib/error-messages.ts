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
    PROFILE_NOT_FOUND: "Perfil não encontrado.",
    PROFILE_NAME_EXISTS: "Já existe um perfil com este nome.",
    PROFILE_HAS_LINKED_USERS:
        "Não é possível apagar este perfil porque existem usuários vinculados.",
    PROFILE_USER_EXISTS: "Este usuário já está vinculado a este perfil.",
    USER_NOT_FOUND: "Usuário não encontrado.",
    USER_ADMIN_ROLE_FORBIDDEN:
        "Não é permitido atribuir ou remover o papel de administrador desta forma.",
    USER_INVALID_DOCUMENT:
        "O documento não corresponde ao tipo de usuário selecionado.",
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
