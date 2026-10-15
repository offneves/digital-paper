export type UserRole =
    "ADMIN" | "ENTERPRISE_USER" | "COMMON_USER" | "PUBLIC_SERVANT";

export type RegisterRole = Exclude<UserRole, "ADMIN">;

export const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: "Administrador",
    COMMON_USER: "Usuário público",
    ENTERPRISE_USER: "Empresa",
    PUBLIC_SERVANT: "Servidor público",
};

export const REGISTER_ROLES: {
    value: RegisterRole;
    label: string;
    description: string;
}[] = [
    {
        value: "COMMON_USER",
        label: ROLE_LABELS.COMMON_USER,
        description: "Pessoa física em processos comuns.",
    },
    {
        value: "ENTERPRISE_USER",
        label: ROLE_LABELS.ENTERPRISE_USER,
        description: "Engenharia, arquitetura e afins.",
    },
    {
        value: "PUBLIC_SERVANT",
        label: ROLE_LABELS.PUBLIC_SERVANT,
        description: "Vínculo com órgão ou autarquia.",
    },
];

export const EDITABLE_USER_ROLES: RegisterRole[] = [
    "COMMON_USER",
    "ENTERPRISE_USER",
    "PUBLIC_SERVANT",
];

export function homePathForRole(role: UserRole | null): string {
    if (role === "ADMIN") return "/";
    return "/conta";
}

export function roleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
}
