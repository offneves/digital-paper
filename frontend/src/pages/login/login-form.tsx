import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, login } from "@/lib/api";
import { getRole, setToken } from "@/lib/auth";
import { homePathForRole } from "@/lib/roles";

export function LoginForm() {
    const navigate = useNavigate();
    const [loginName, setLoginName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [invalid, setInvalid] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedLogin = loginName.trim();
        if (!trimmedLogin || !password) {
            setInvalid(true);
            toast.error("Preencha login e senha.");
            return;
        }

        setInvalid(false);
        setLoading(true);

        try {
            const { token } = await login(trimmedLogin, password);
            setToken(token);
            toast.success("Login realizado com sucesso.");
            navigate(homePathForRole(getRole()), { replace: true });
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                console.error(error);
                toast.error("Não foi possível entrar. Tente novamente.");
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
                        htmlFor="login"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        Login
                    </FieldLabel>
                    <Input
                        id="login"
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

                <Field data-invalid={invalid || undefined}>
                    <FieldLabel
                        htmlFor="password"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        Senha
                    </FieldLabel>
                    <InputGroup className="h-10">
                        <InputGroupInput
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            disabled={loading}
                            aria-invalid={invalid || undefined}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
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
            </FieldGroup>

            <Button
                type="submit"
                className="h-10 w-full font-medium tracking-wide"
                disabled={loading}
            >
                {loading ? <Spinner data-icon="inline-start" /> : null}
                {loading ? "Entrando…" : "Entrar"}
            </Button>
        </form>
    );
}
