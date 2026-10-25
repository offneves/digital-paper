import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
    ApiError,
    previewEmailTemplate,
    sendEmailTemplateTest,
    type EmailTemplate,
} from "@/lib/api";
import { isValidEmail } from "@/lib/email";

import { EMAIL_STATUS_LABELS } from "./email-utils";

type SendTestDialogProps = {
    template: EmailTemplate | null;
    onOpenChange: (open: boolean) => void;
};

export function SendTestDialog({ template, onOpenChange }: SendTestDialogProps) {
    const [to, setTo] = useState("");
    const [toInvalid, setToInvalid] = useState(false);
    const [values, setValues] = useState<Record<string, string> | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!template) return;
        let cancelled = false;

        previewEmailTemplate({ templateId: template.id })
            .then((preview) => {
                if (!cancelled) setValues(preview.sampleValues);
            })
            .catch(() => {
                if (!cancelled) setValues({});
            });

        return () => {
            cancelled = true;
            setValues(null);
            setToInvalid(false);
        };
    }, [template]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!template) return;

        const trimmed = to.trim();
        if (!isValidEmail(trimmed)) {
            setToInvalid(true);
            toast.error("Informe um e-mail válido.");
            return;
        }

        setToInvalid(false);
        setSending(true);
        try {
            const result = await sendEmailTemplateTest(
                template.id,
                trimmed,
                values ?? {},
            );
            if (result.status === "SENT") {
                toast.success(`Teste enviado para ${trimmed}.`);
            } else {
                toast.warning(
                    `Teste registrado como “${EMAIL_STATUS_LABELS[result.status]}”.`,
                    { description: result.lastError ?? undefined },
                );
            }
            onOpenChange(false);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível enviar o teste.",
            );
        } finally {
            setSending(false);
        }
    }

    const variableNames = values ? Object.keys(values) : [];

    return (
        <Dialog open={Boolean(template)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>Enviar teste</DialogTitle>
                        <DialogDescription className="text-pretty">
                            Envia{" "}
                            <span className="font-medium text-foreground">
                                {template?.name}
                            </span>{" "}
                            com valores de exemplo, mesmo que o template esteja
                            desativado. O envio aparece no histórico.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field data-invalid={toInvalid || undefined}>
                            <FieldLabel htmlFor="test-to">Destinatário</FieldLabel>
                            <Input
                                id="test-to"
                                type="email"
                                placeholder="voce@empresa.com"
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                                aria-invalid={toInvalid || undefined}
                                autoFocus
                            />
                        </Field>

                        {values === null ? (
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : variableNames.length > 0 ? (
                            <FieldSet>
                                <FieldLegend variant="label">Valores de teste</FieldLegend>
                                <FieldDescription>
                                    Substituem as variáveis do template neste envio.
                                </FieldDescription>
                                <FieldGroup className="gap-3">
                                    {variableNames.map((name) => (
                                        <Field key={name} orientation="horizontal">
                                            <FieldLabel
                                                htmlFor={`test-var-${name}`}
                                                className="w-28 shrink-0 font-mono text-xs"
                                            >
                                                {name}
                                            </FieldLabel>
                                            <Input
                                                id={`test-var-${name}`}
                                                value={values[name] ?? ""}
                                                onChange={(event) =>
                                                    setValues((current) => ({
                                                        ...current,
                                                        [name]: event.target.value,
                                                    }))
                                                }
                                            />
                                        </Field>
                                    ))}
                                </FieldGroup>
                            </FieldSet>
                        ) : null}
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={sending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={sending || values === null}>
                            {sending ? <Spinner data-icon="inline-start" /> : null}
                            Enviar teste
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
