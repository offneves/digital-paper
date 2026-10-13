import type { RegisterRole } from "@/lib/roles";

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

export class ApiError extends Error {
    status: number;
    body: string;

    constructor(message: string, status: number, body: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

function userFacingMessage(
    status: number,
    body: string,
    fallback: string,
): string {
    if (status === 401) {
        return "Login ou senha incorretos.";
    }

    if (status === 0 || status >= 500) {
        return "Não foi possível conectar ao servidor. Tente novamente.";
    }

    if (
        body &&
        body.length < 160 &&
        !body.includes("\n") &&
        !body.includes("Exception")
    ) {
        return body;
    }

    return fallback;
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
        throw new ApiError(
            userFacingMessage(
                response.status,
                body,
                "Não foi possível entrar.",
            ),
            response.status,
            body,
        );
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
        throw new ApiError(
            userFacingMessage(
                response.status,
                body,
                "Não foi possível concluir o cadastro.",
            ),
            response.status,
            body,
        );
    }
}
