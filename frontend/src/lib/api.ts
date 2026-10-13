const AUTH_API_URL =
    import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8081";

export type TokenResponse = {
    token: string;
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

function userMessageForLogin(status: number, body: string): string {
    if (status === 401) {
        return "Login ou senha incorretos.";
    }

    if (status === 0 || status >= 500) {
        return "Não foi possível conectar ao servidor. Tente novamente.";
    }

    if (
        body &&
        body.length < 120 &&
        !body.includes("\n") &&
        !body.includes("Exception")
    ) {
        return body;
    }

    return "Não foi possível entrar. Tente novamente.";
}

export async function login(
    loginName: string,
    password: string,
): Promise<TokenResponse> {
    let response: Response;

    try {
        response = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                login: loginName,
                password,
            }),
        });
    } catch (error) {
        console.error("Login network error", error);
        throw new ApiError(
            "Não foi possível conectar ao servidor. Tente novamente.",
            0,
            error instanceof Error ? error.message : String(error),
        );
    }

    const body = await response.text();

    if (!response.ok) {
        console.error("Login failed", { status: response.status, body });
        throw new ApiError(
            userMessageForLogin(response.status, body),
            response.status,
            body,
        );
    }

    try {
        const data = JSON.parse(body) as TokenResponse;
        if (!data.token) {
            throw new Error("Missing token in response");
        }
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
