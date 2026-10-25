import type { EmailStatus } from "@/lib/api";

export function formatDateTime(value: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
    PENDING: "Pendente",
    SENT: "Enviado",
    RETRYING: "Nova tentativa",
    FAILED: "Falhou",
    SKIPPED: "Ignorado",
};

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

export function extractVariables(...values: (string | null | undefined)[]) {
    const found = new Set<string>();
    for (const value of values) {
        if (!value) continue;
        for (const match of value.matchAll(VARIABLE_PATTERN)) {
            found.add(match[1]);
        }
    }
    return [...found];
}

export function slugify(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64);
}

export const TEMPLATE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
