import { useState, type FormEvent } from "react";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, resetPassword } from "@/lib/api";
import { isPasswordValid } from "@/lib/password";

import { PasswordRequirements } from "./password-requirements";

type ResetPasswordFormProps = {
    token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [invalid, setInvalid] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!isPasswordValid(password)) {
            setInvalid(true);
            toast.error("A senha não atende aos requisitos.");
            return;
        }

        if (password !== confirm) {
            setInvalid(true);
            toast.error("As senhas não coincidem.");
            return;
        }

        setInvalid(false);
        setLoading(true);

        try {
            await resetPassword(token, password);
            toast.success("Senha atualizada. Entre com a nova senha.");
            navigate("/login", { replace: true });
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível redefinir a senha.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="login-stagger flex w-full flex-col gap-6"
            noValidate
        >
            <FieldGroup className="gap-4">
                <Field data-invalid={invalid || undefined}>
                    <FieldLabel
                        htmlFor="new-password"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        Nova senha
                    </FieldLabel>
                    <InputGroup className="h-10">
                        <InputGroupInput
                            id="new-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            disabled={loading}
                            aria-invalid={invalid || undefined}
                            autoFocus
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton
                                type="button"
                                size="icon-xs"
                                aria-label={
                                    showPassword
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                                aria-pressed={showPassword}
                                onClick={() =>
                                    setShowPassword((current) => !current)
                                }
                            >
                                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </Field>

                <Field data-invalid={invalid || undefined}>
                    <FieldLabel
                        htmlFor="confirm-password"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        Confirmar senha
                    </FieldLabel>
                    <InputGroup className="h-10">
                        <InputGroupInput
                            id="confirm-password"
                            name="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={confirm}
                            disabled={loading}
                            aria-invalid={invalid || undefined}
                            onChange={(event) => setConfirm(event.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton
                                type="button"
                                size="icon-xs"
                                aria-label={
                                    showConfirm
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                                aria-pressed={showConfirm}
                                onClick={() =>
                                    setShowConfirm((current) => !current)
                                }
                            >
                                {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </Field>

                <PasswordRequirements password={password} />
            </FieldGroup>

            <div className="flex flex-col gap-3">
                <Button
                    type="submit"
                    className="h-10 w-full font-medium tracking-wide"
                    disabled={loading || !isPasswordValid(password)}
                >
                    {loading ? <Spinner data-icon="inline-start" /> : null}
                    {loading ? "Salvando…" : "Redefinir senha"}
                </Button>

                <Button asChild variant="ghost" className="h-9 w-full">
                    <Link to="/login">
                        <ArrowLeftIcon data-icon="inline-start" />
                        Voltar ao login
                    </Link>
                </Button>
            </div>
        </form>
    );
}
