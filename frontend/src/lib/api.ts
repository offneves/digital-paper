import { getToken } from "@/lib/auth";
import {
    messageForErrorCode,
    parseApiErrorBody,
} from "@/lib/error-messages";
import type { RegisterRole, UserRole } from "@/lib/roles";

const AUTH_API_URL =
    import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8081";

export type TokenResponse = {
    token: string;
};

export type RegisterPayload = {
    login: string;
    password: string;
    email: string;
    name: string;
    cpfCnpj: string;
    userRole: RegisterRole;
};

export type Profile = {
    id: number;
    profileName: string;
    active: boolean;
};

export type ProfilePayload = {
    profileName: string;
    active?: boolean;
};

export class ApiError extends Error {
    status: number;
    body: string;
    code?: string;

    constructor(
        message: string,
        status: number,
        body: string,
        code?: string,
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
        this.code = code;
    }
}

function userFacingMessage(
    status: number,
    body: string,
    fallback: string,
): string {
    const apiError = parseApiErrorBody(body);
    const fromCode = messageForErrorCode(apiError?.code);
    if (fromCode) {
        return fromCode;
    }

    if (status === 401 || status === 403) {
        // login/register sem body estruturado (legado) ou 403 genérico
        if (status === 401) {
            return "Login ou senha incorretos.";
        }
        return "Você não tem permissão para esta ação.";
    }

    if (status === 0 || status >= 500) {
        return "Não foi possível conectar ao servidor. Tente novamente.";
    }

    return fallback;
}

function throwApiError(
    status: number,
    body: string,
    fallback: string,
): never {
    const apiError = parseApiErrorBody(body);
    throw new ApiError(
        userFacingMessage(status, body, fallback),
        status,
        body,
        apiError?.code,
    );
}

async function request(path: string, init: RequestInit): Promise<Response> {
    try {
        return await fetch(`${AUTH_API_URL}${path}`, init);
    } catch (error) {
        console.error("Network error", error);
        throw new ApiError(
            "Não foi possível conectar ao servidor. Tente novamente.",
            0,
            error instanceof Error ? error.message : String(error),
        );
    }
}

async function authRequest(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    const token = getToken();
    const headers = new Headers(init.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return request(path, { ...init, headers });
}

async function parseJsonBody<T>(
    response: Response,
    fallback: string,
): Promise<T> {
    const body = await response.text();

    if (!response.ok) {
        throwApiError(response.status, body, fallback);
    }

    if (!body) {
        return undefined as T;
    }

    try {
        return JSON.parse(body) as T;
    } catch (error) {
        console.error("Invalid JSON response", { body, error });
        throw new ApiError(
            "Resposta inválida do servidor.",
            response.status,
            body,
        );
    }
}

export async function login(
    loginName: string,
    password: string,
): Promise<TokenResponse> {
    const response = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginName, password }),
    });

    const body = await response.text();

    if (!response.ok) {
        console.error("Login failed", { status: response.status, body });
        throwApiError(response.status, body, "Não foi possível entrar.");
    }

    try {
        const data = JSON.parse(body) as TokenResponse;
        if (!data.token) throw new Error("Missing token");
        return data;
    } catch (error) {
        console.error("Invalid login response", { body, error });
        throw new ApiError(
            "Resposta inválida do servidor.",
            response.status,
            body,
        );
    }
}

export async function register(payload: RegisterPayload): Promise<void> {
    const response = await request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const body = await response.text();

    if (!response.ok) {
        console.error("Register failed", { status: response.status, body });
        throwApiError(
            response.status,
            body,
            "Não foi possível concluir o cadastro.",
        );
    }
}

export async function forgotPassword(email: string): Promise<void> {
    const response = await request("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const body = await response.text();

    if (!response.ok) {
        throwApiError(
            response.status,
            body,
            "Não foi possível enviar a recuperação.",
        );
    }
}

export async function resetPassword(
    token: string,
    password: string,
): Promise<void> {
    const response = await request("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
    });

    const body = await response.text();

    if (!response.ok) {
        throwApiError(
            response.status,
            body,
            "Não foi possível redefinir a senha.",
        );
    }
}

export async function listProfiles(): Promise<Profile[]> {
    const response = await authRequest("/admin/profile");
    return parseJsonBody<Profile[]>(
        response,
        "Não foi possível carregar os perfis.",
    );
}

export async function createProfile(
    payload: ProfilePayload,
): Promise<Profile> {
    const response = await authRequest("/admin/profile", {
        method: "POST",
        body: JSON.stringify({ profileName: payload.profileName }),
    });
    return parseJsonBody<Profile>(response, "Não foi possível criar o perfil.");
}

export async function updateProfile(
    id: number,
    payload: ProfilePayload,
): Promise<Profile> {
    const response = await authRequest(`/admin/profile/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            profileName: payload.profileName,
            active: payload.active ?? true,
        }),
    });
    return parseJsonBody<Profile>(
        response,
        "Não foi possível atualizar o perfil.",
    );
}

export async function deleteProfile(id: number): Promise<void> {
    const response = await authRequest(`/admin/profile/${id}`, {
        method: "DELETE",
    });
    await parseJsonBody<void>(response, "Não foi possível remover o perfil.");
}

export type UserProfileSummary = {
    id: number;
    profileName: string;
    status: "ACTIVE" | "SUSPENDED" | "PENDING";
};

export type AdminUser = {
    id: number;
    login: string;
    name: string;
    email: string;
    cpfCnpj: string;
    role: UserRole;
    active: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    lastLoginAt: string | null;
    profiles: UserProfileSummary[];
};

export type AdminUserUpdatePayload = {
    name: string;
    email: string;
    cpfCnpj: string;
    role: UserRole;
    active: boolean;
};

export type PageResponse<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

export type ListUsersParams = {
    q?: string;
    role?: UserRole | "";
    page?: number;
    size?: number;
};

export async function listUsers(
    params: ListUsersParams = {},
): Promise<PageResponse<AdminUser>> {
    const search = new URLSearchParams();
    if (params.q?.trim()) search.set("q", params.q.trim());
    if (params.role) search.set("role", params.role);
    search.set("page", String(params.page ?? 0));
    search.set("size", String(params.size ?? 50));

    const response = await authRequest(`/admin/user?${search.toString()}`);
    return parseJsonBody<PageResponse<AdminUser>>(
        response,
        "Não foi possível carregar os usuários.",
    );
}

export async function updateUser(
    id: number,
    payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
    const response = await authRequest(`/admin/user/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    return parseJsonBody<AdminUser>(
        response,
        "Não foi possível atualizar o usuário.",
    );
}
