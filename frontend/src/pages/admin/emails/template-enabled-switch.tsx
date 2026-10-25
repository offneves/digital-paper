import { useState } from "react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ApiError, setEmailTemplateEnabled, type EmailTemplate } from "@/lib/api";

const SYSTEM_DISABLE_IMPACT: Record<string, string> = {
    "account-confirmation":
        "Novos usuários não vão receber o link de confirmação e não vão conseguir entrar no sistema.",
    "password-reset":
        "Quem pedir \"Esqueci minha senha\" não vai receber o link para criar uma nova senha.",
};

type TemplateEnabledSwitchProps = {
    template: EmailTemplate;
    onChange: (updated: EmailTemplate) => void;
    showLabel?: boolean;
};

export function TemplateEnabledSwitch({
    template,
    onChange,
    showLabel = true,
}: TemplateEnabledSwitchProps) {
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    async function persist(enabled: boolean) {
        setSaving(true);
        try {
            const updated = await setEmailTemplateEnabled(template.id, enabled);
            onChange(updated);
            toast.success(enabled ? "Template ativado." : "Template desativado.");
            setConfirmOpen(false);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível alterar o status do template.",
            );
        } finally {
            setSaving(false);
        }
    }

    function handleChange(enabled: boolean) {
        if (!enabled && template.systemTemplate) {
            setConfirmOpen(true);
            return;
        }
        void persist(enabled);
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <Switch
                    checked={template.enabled}
                    disabled={saving}
                    onCheckedChange={handleChange}
                    aria-label={`Ativar ${template.name}`}
                />
                {showLabel ? (
                    <Label className="text-xs text-muted-foreground">
                        {template.enabled ? "Ligado" : "Desligado"}
                    </Label>
                ) : null}
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desativar template do sistema?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-pretty">
                            <span className="block">
                                <span className="font-medium text-foreground">
                                    {template.name}
                                </span>{" "}
                                é enviado automaticamente pelo sistema.
                            </span>
                            <span className="mt-2 block">
                                {SYSTEM_DISABLE_IMPACT[template.templateKey] ??
                                    "Os e-mails deste tipo deixarão de ser enviados."}
                            </span>
                            <span className="mt-2 block">
                                Os envios ignorados ficam registrados no histórico
                                como “Ignorado”.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Manter ativo</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={saving}
                            onClick={(event) => {
                                event.preventDefault();
                                void persist(false);
                            }}
                        >
                            {saving ? <Spinner data-icon="inline-start" /> : null}
                            Desativar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
