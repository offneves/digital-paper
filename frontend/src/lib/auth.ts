import type { UserRole } from "@/lib/roles";

const TOKEN_KEY = "dp_auth_token";

export type AuthClaims = {
    sub?: string;
    id?: number;
    role?: UserRole;
    name?: string;
    exp?: number;
};

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;

    const claims = getClaims();
    if (!claims) return false;

    if (claims.exp && claims.exp * 1000 < Date.now()) {
        clearToken();
        return false;
    }

    return true;
}

export function getClaims(): AuthClaims | null {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(normalized);
        return JSON.parse(json) as AuthClaims;
    } catch (error) {
        console.error("Invalid JWT payload", error);
        return null;
    }
}

export function getRole(): UserRole | null {
    return getClaims()?.role ?? null;
}

export function getUserName(): string | null {
    return getClaims()?.name ?? getClaims()?.sub ?? null;
}
