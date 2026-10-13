export type PasswordRuleId =
    "minLength" | "lowercase" | "uppercase" | "number" | "symbol";

export type PasswordRule = {
    id: PasswordRuleId;
    label: string;
    test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
    {
        id: "minLength",
        label: "Mínimo de 8 caracteres",
        test: (password) => password.length >= 8,
    },
    {
        id: "lowercase",
        label: "Uma letra minúscula",
        test: (password) => /[a-z]/.test(password),
    },
    {
        id: "uppercase",
        label: "Uma letra maiúscula",
        test: (password) => /[A-Z]/.test(password),
    },
    {
        id: "number",
        label: "Um número",
        test: (password) => /\d/.test(password),
    },
    {
        id: "symbol",
        label: "Um símbolo (ex.: !@#$%)",
        test: (password) => /[^A-Za-z0-9]/.test(password),
    },
];

/** Regex alinhada às regras acima (para o backend também). */
export const PASSWORD_PATTERN =
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";

export function getPasswordChecks(password: string) {
    return PASSWORD_RULES.map((rule) => ({
        id: rule.id,
        label: rule.label,
        met: rule.test(password),
    }));
}

export function isPasswordValid(password: string): boolean {
    return PASSWORD_RULES.every((rule) => rule.test(password));
}
