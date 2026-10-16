import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getRole, isAuthenticated } from "@/lib/auth";
import { homePathForRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

import { AuthShell } from "./auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthMode = "login" | "register" | "forgot";

type LoginLocationState = {
    mode?: AuthMode;
};

const COPY: Record<
    AuthMode,
    { eyebrow: string; title: string; description: string }
> = {
    login: {
        eyebrow: "Acesso",
        title: "Bem-vindo",
        description: "Entre com suas credenciais para continuar.",
    },
    register: {
        eyebrow: "Acesso",
        title: "Criar conta",
        description: "Complete seus dados para acessar o Digital Paper.",
    },
    forgot: {
        eyebrow: "Recuperação",
        title: "Esqueceu a senha?",
        description:
            "Informe o e-mail da conta. Enviaremos um link para criar uma nova senha.",
    },
};

export default function LoginPage() {
    const location = useLocation();
    const initialMode =
        (location.state as LoginLocationState | null)?.mode === "forgot"
            ? "forgot"
            : "login";
    const [mode, setMode] = useState<AuthMode>(initialMode);

    if (isAuthenticated()) {
        return <Navigate to={homePathForRole(getRole())} replace />;
    }

    const copy = COPY[mode];

    return (
        <AuthShell
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
        >
            {mode !== "forgot" ? (
                <div className="mb-6 flex gap-1 rounded-lg border border-border p-1">
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            "h-8 flex-1",
                            mode === "login" &&
                                "bg-muted text-foreground hover:bg-muted",
                        )}
                        onClick={() => setMode("login")}
                    >
                        Entrar
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            "h-8 flex-1",
                            mode === "register" &&
                                "bg-muted text-foreground hover:bg-muted",
                        )}
                        onClick={() => setMode("register")}
                    >
                        Cadastrar
                    </Button>
                </div>
            ) : null}

            <div
                key={mode}
                className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-both"
            >
                {mode === "login" ? (
                    <LoginForm onForgotPassword={() => setMode("forgot")} />
                ) : null}
                {mode === "register" ? (
                    <RegisterForm onSuccess={() => setMode("login")} />
                ) : null}
                {mode === "forgot" ? (
                    <ForgotPasswordForm
                        onBackToLogin={() => setMode("login")}
                    />
                ) : null}
            </div>
        </AuthShell>
    );
}
