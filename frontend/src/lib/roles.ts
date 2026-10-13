export type UserRole =
    "ADMIN" | "ENTERPRISE_USER" | "COMMON_USER" | "PUBLIC_SERVANT";

export type RegisterRole = Exclude<UserRole, "ADMIN">;

export const REGISTER_ROLES: {
    value: RegisterRole;
    label: string;
    description: string;
}[] = [
    {
        value: "COMMON_USER",
        label: "Usuário público",
        description: "Pessoa física em processos comuns.",
    },
    {
        value: "ENTERPRISE_USER",
        label: "Empresa",
        description: "Engenharia, arquitetura e afins.",
    },
    {
        value: "PUBLIC_SERVANT",
        label: "Servidor público",
        description: "Vínculo com órgão ou autarquia.",
    },
];

export function homePathForRole(role: UserRole | null): string {
    if (role === "ADMIN") return "/";
    return "/conta";
}
