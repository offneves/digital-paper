import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, register } from "@/lib/api";
import { isValidEmail } from "@/lib/email";
import { formatCnpj, formatCpf, isCnpjRole, onlyDigits } from "@/lib/masks";
import { isPasswordValid } from "@/lib/password";
import { REGISTER_ROLES, type RegisterRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

import { PasswordRequirements } from "./password-requirements";

type RegisterFormProps = {
    onSuccess: () => void;
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [loginName, setLoginName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [userRole, setUserRole] = useState<RegisterRole>("COMMON_USER");
    const [loading, setLoading] = useState(false);
    const [invalid, setInvalid] = useState(false);
    const [emailInvalid, setEmailInvalid] = useState(false);

    const usesCnpj = isCnpjRole(userRole);
    const documentLabel = usesCnpj ? "CNPJ" : "CPF";
    const documentPlaceholder = usesCnpj
        ? "00.000.000/0000-00"
        : "000.000.000-00";
    const expectedLength = usesCnpj ? 14 : 11;
    const trimmedEmail = email.trim();
    const emailOk = isValidEmail(trimmedEmail);

    function handleRoleChange(value: string) {
        const nextRole = value as RegisterRole;
        const wasCnpj = isCnpjRole(userRole);
        const willBeCnpj = isCnpjRole(nextRole);

        setUserRole(nextRole);
        if (wasCnpj !== willBeCnpj) {
            setDocument("");
        }
    }

    function handleDocumentChange(raw: string) {
        if (usesCnpj) {
            setDocument(formatCnpj(raw));
            return;
        }
        setDocument(formatCpf(raw));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedLogin = loginName.trim();
        const trimmedName = name.trim();
        const documentDigits = onlyDigits(document);

        if (
            !trimmedLogin ||
            !password ||
            !trimmedName ||
            !documentDigits ||
            !trimmedEmail
        ) {
            setInvalid(true);
            setEmailInvalid(!trimmedEmail || !emailOk);
            toast.error("Preencha todos os campos.");
            return;
        }

        if (!emailOk) {
            setInvalid(true);
            setEmailInvalid(true);
            toast.error("Informe um e-mail válido.");
            return;
        }

        if (documentDigits.length !== expectedLength) {
            setInvalid(true);
            toast.error(
                usesCnpj
                    ? "Informe um CNPJ válido com 14 dígitos."
                    : "Informe um CPF válido com 11 dígitos.",
            );
            return;
        }

        if (!isPasswordValid(password)) {
            setInvalid(true);
            toast.error("A senha não atende aos requisitos.");
            return;
        }

        setInvalid(false);
        setEmailInvalid(false);
        setLoading(true);

        try {
            await register({
                login: trimmedLogin,
                password,
                email: trimmedEmail,
                name: trimmedName,
                cpfCnpj: documentDigits,
                userRole,
            });
            toast.success("Cadastro realizado. Faça login para continuar.");
            onSuccess();
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                console.error(error);
                toast.error("Não foi possível concluir o cadastro.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="login-stagger flex w-full flex-col gap-5"
            noValidate
        >
            <FieldGroup className="gap-4">
                <Field>
                    <FieldLabel className="text-[11px] tracking-[0.14em] uppercase">
                        Tipo de conta
                    </FieldLabel>
                    <RadioGroup
                        value={userRole}
                        onValueChange={handleRoleChange}
                        className="gap-2"
                        disabled={loading}
                    >
                        {REGISTER_ROLES.map((role) => (
                            <label
                                key={role.value}
                                className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors",
                                    "hover:bg-muted/50 has-[[data-state=checked]]:border-foreground/40 has-[[data-state=checked]]:bg-muted/40",
                                )}
                            >
                                <RadioGroupItem
                                    value={role.value}
                                    id={`role-${role.value}`}
                                    className="mt-0.5"
                                />
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-foreground">
                                        {role.label}
                                    </span>
                                    <span className="text-xs leading-snug text-muted-foreground">
                                        {role.description}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </RadioGroup>
                </Field>

                <Field data-invalid={invalid || undefined}>
                    <FieldLabel
                        htmlFor="reg-name"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        {usesCnpj ? "Razão social" : "Nome completo"}
                    </FieldLabel>
                    <Input
                        id="reg-name"
                        name="name"
                        autoComplete="name"
                        placeholder={usesCnpj ? "Nome da empresa" : "Seu nome"}
                        className="h-10"
                        value={name}
                        disabled={loading}
                        aria-invalid={invalid || undefined}
                        onChange={(event) => setName(event.target.value)}
                    />
                </Field>

                <Field data-invalid={emailInvalid || undefined}>
                    <FieldLabel
                        htmlFor="reg-email"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        E-mail
                    </FieldLabel>
                    <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="voce@empresa.com"
                        className="h-10"
                        value={email}
                        disabled={loading}
                        aria-invalid={emailInvalid || undefined}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            if (emailInvalid) {
                                setEmailInvalid(
                                    !isValidEmail(event.target.value.trim()),
                                );
                            }
                        }}
                        onBlur={() => {
                            if (trimmedEmail) {
                                setEmailInvalid(!emailOk);
                            }
                        }}
                    />
                    {emailInvalid ? (
                        <FieldDescription className="text-destructive">
                            Informe um e-mail válido.
                        </FieldDescription>
                    ) : null}
                </Field>

                <Field data-invalid={invalid || undefined}>
                    <FieldLabel
                        htmlFor="reg-document"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        {documentLabel}
                    </FieldLabel>
                    <Input
                        id="reg-document"
                        name={usesCnpj ? "cnpj" : "cpf"}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={documentPlaceholder}
                        className="h-10"
                        value={document}
                        disabled={loading}
                        aria-invalid={invalid || undefined}
                        onChange={(event) =>
                            handleDocumentChange(event.target.value)
                        }
                    />
                </Field>

                <Field data-invalid={invalid || undefined}>
                    <FieldLabel
                        htmlFor="reg-login"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        Login
                    </FieldLabel>
                    <Input
                        id="reg-login"
                        name="login"
                        autoComplete="username"
                        placeholder="seu.usuario"
                        className="h-10"
                        value={loginName}
                        disabled={loading}
                        aria-invalid={invalid || undefined}
                        onChange={(event) => setLoginName(event.target.value)}
                    />
                </Field>

                <Field
                    data-invalid={
                        (invalid && !isPasswordValid(password)) || undefined
                    }
                >
                    <FieldLabel
                        htmlFor="reg-password"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        Senha
                    </FieldLabel>
                    <Input
                        id="reg-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="h-10"
                        value={password}
                        disabled={loading}
                        aria-invalid={
                            (invalid && !isPasswordValid(password)) || undefined
                        }
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <FieldDescription className="sr-only">
                        A senha deve ter no mínimo 8 caracteres, com letra
                        maiúscula, minúscula, número e símbolo.
                    </FieldDescription>
                    <PasswordRequirements password={password} />
                </Field>
            </FieldGroup>

            <Button
                type="submit"
                className="h-10 w-full font-medium tracking-wide"
                disabled={loading || !isPasswordValid(password)}
            >
                {loading ? <Spinner data-icon="inline-start" /> : null}
                {loading ? "Cadastrando…" : "Criar conta"}
            </Button>
        </form>
    );
}
