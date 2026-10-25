import { useState, type FormEvent } from "react";
import { ArrowLeftIcon, MailCheckIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, resendVerification } from "@/lib/api";
import { isValidEmail } from "@/lib/email";

export function ResendVerificationForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [invalid, setInvalid] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmed = email.trim();
        if (!trimmed || !isValidEmail(trimmed)) {
            setInvalid(true);
            toast.error("Informe um e-mail válido.");
            return;
        }

        setInvalid(false);
        setLoading(true);

        try {
            await resendVerification(trimmed);
            setSent(true);
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível reenviar a confirmação.");
            }
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-5">
                    <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
                        <MailCheckIcon className="size-5" />
                    </span>
                    <div className="flex flex-col gap-1.5">
                        <p className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
                            Verifique seu e-mail
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Se existir uma conta pendente de confirmação para{" "}
                            <span className="font-medium text-foreground">
                                {email.trim()}
                            </span>
                            , você receberá um novo link. O link expira em 24
                            horas.
                        </p>
                    </div>
                </div>

                <Button asChild variant="outline" className="h-10 w-full">
                    <Link to="/login">
                        <ArrowLeftIcon data-icon="inline-start" />
                        Voltar ao login
                    </Link>
                </Button>
            </div>
        );
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
                        htmlFor="verification-email"
                        className="text-[11px] tracking-[0.14em] uppercase"
                    >
                        E-mail
                    </FieldLabel>
                    <Input
                        id="verification-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="voce@empresa.com"
                        className="h-10"
                        value={email}
                        disabled={loading}
                        aria-invalid={invalid || undefined}
                        autoFocus
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <FieldDescription>
                        Use o mesmo e-mail informado no cadastro.
                    </FieldDescription>
                </Field>
            </FieldGroup>

            <div className="flex flex-col gap-3">
                <Button
                    type="submit"
                    className="h-10 w-full font-medium tracking-wide"
                    disabled={loading}
                >
                    {loading ? <Spinner data-icon="inline-start" /> : null}
                    {loading ? "Enviando…" : "Reenviar link"}
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
