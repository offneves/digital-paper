export function onlyDigits(value: string, max?: number): string {
    const digits = value.replace(/\D/g, "");
    return typeof max === "number" ? digits.slice(0, max) : digits;
}

/** 000.000.000-00 */
export function formatCpf(value: string): string {
    const digits = onlyDigits(value, 11);
    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** 00.000.000/0000-00 */
export function formatCnpj(value: string): string {
    const digits = onlyDigits(value, 14);
    return digits
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function isCpfRole(role: string): boolean {
    return role === "COMMON_USER" || role === "PUBLIC_SERVANT";
}

export function isCnpjRole(role: string): boolean {
    return role === "ENTERPRISE_USER";
}
