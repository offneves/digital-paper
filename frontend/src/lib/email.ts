/** Validação simples e prática de e-mail (formato). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidEmail(value: string): boolean {
    const email = value.trim();
    if (!email || email.length > 254) return false;
    return EMAIL_PATTERN.test(email);
}
