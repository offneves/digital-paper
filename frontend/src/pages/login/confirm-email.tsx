import { useEffect, useRef, useState } from "react";
import { CircleCheckIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, verifyEmail } from "@/lib/api";

import { AuthShell } from "./auth-shell";
import { ResendVerificationForm } from "./resend-verification-form";

type Status = "verifying" | "success" | "error";

export default function ConfirmEmailPage() {
    const [params] = useSearchParams();
    const token = params.get("token")?.trim() ?? "";
    const [status, setStatus] = useState<Status>(
        token ? "verifying" : "error",
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const requestedToken = useRef<string | null>(null);

    useEffect(() => {
        if (!token || requestedToken.current === token) return;
        requestedToken.current = token;

        verifyEmail(token)
            .then(() => setStatus("success"))
            .catch((error: unknown) => {
                setErrorMessage(
                    error instanceof ApiError ? error.message : null,
                );
                setStatus("error");
            });
    }, [token]);

    if (!token) {
        return (
            <AuthShell
                eyebrow="Confirmação"
                title="Confirme seu e-mail"
                description="Informe o e-mail do cadastro para receber um novo link de confirmação."
            >
                <ResendVerificationForm />
            </AuthShell>
        );
    }

    if (status === "verifying") {
        return (
            <AuthShell
                eyebrow="Confirmação"
                title="Confirmando…"
                description="Estamos validando o seu link. Só um instante."
            >
                <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                    <Spinner />
                    Verificando e-mail
                </div>
            </AuthShell>
        );
    }

    if (status === "success") {
        return (
            <AuthShell
                eyebrow="Confirmação"
                title="E-mail confirmado"
                description="Sua conta está ativa. Entre com seu login e senha para começar."
            >
                <div className="login-stagger flex flex-col gap-6">
                    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                            <CircleCheckIcon className="size-5" />
                        </span>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Tudo certo. Este endereço agora está vinculado à sua
                            conta.
                        </p>
                    </div>

                    <Button asChild className="h-10 w-full font-medium tracking-wide">
                        <Link to="/login" replace>
                            Ir para o login
                        </Link>
                    </Button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Confirmação"
            title="Link inválido"
            description={
                errorMessage ??
                "Este link de confirmação está incompleto, já foi usado ou expirou. Peça um novo abaixo."
            }
        >
            <ResendVerificationForm />
        </AuthShell>
    );
}
