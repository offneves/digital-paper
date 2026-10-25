import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
    ArrowLeftIcon,
    BracesIcon,
    RotateCcwIcon,
    SaveIcon,
    SendIcon,
    ShieldIcon,
    TriangleAlertIcon,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AdminHeader } from "@/layouts/admin-layout";
import {
    ApiError,
    createEmailTemplate,
    getEmailTemplate,
    previewEmailTemplate,
    restoreEmailTemplate,
    updateEmailTemplate,
    type EmailTemplate,
    type EmailTemplatePayload,
    type EmailTemplatePreview,
} from "@/lib/api";

import { SendTestDialog } from "./send-test-dialog";
import { EmailPreviewFrame } from "./email-ui";
import { extractVariables, slugify, TEMPLATE_KEY_PATTERN } from "./email-utils";
import { TemplateEnabledSwitch } from "./template-enabled-switch";

type FieldName = keyof EmailTemplatePayload;
type TextFieldName = Exclude<FieldName, "sensitive">;

const EMPTY: EmailTemplatePayload = {
    templateKey: "",
    name: "",
    description: "",
    sensitive: false,
    subject: "",
    preheader: "",
    eyebrow: "",
    heading: "",
    body: "",
    buttonLabel: "",
    buttonUrl: "",
    notice: "",
    footerNote: "",
};

function toPayload(template: EmailTemplate): EmailTemplatePayload {
    return {
        templateKey: template.templateKey,
        name: template.name,
        description: template.description ?? "",
        sensitive: template.sensitive,
        subject: template.subject,
        preheader: template.preheader ?? "",
        eyebrow: template.eyebrow ?? "",
        heading: template.heading,
        body: template.body,
        buttonLabel: template.buttonLabel ?? "",
        buttonUrl: template.buttonUrl ?? "",
        notice: template.notice ?? "",
        footerNote: template.footerNote ?? "",
    };
}

function validate(
    draft: EmailTemplatePayload,
    isNew: boolean,
    system: boolean,
) {
    const invalid = new Set<FieldName>();
    const messages: string[] = [];

    if (!draft.name.trim()) invalid.add("name");
    if (!draft.subject.trim()) invalid.add("subject");
    if (!draft.heading.trim()) invalid.add("heading");
    if (!draft.body.trim()) invalid.add("body");
    if (invalid.size > 0) messages.push("Preencha os campos obrigatórios.");

    if (isNew && !TEMPLATE_KEY_PATTERN.test(draft.templateKey ?? "")) {
        invalid.add("templateKey");
        messages.push(
            "A chave deve ter apenas letras minúsculas, números e hífens.",
        );
    }

    const label = draft.buttonLabel.trim();
    const url = draft.buttonUrl.trim();
    if (!system && (label || url)) {
        const urlOk = /^(https?:\/\/|\{\{)/.test(url);
        if (!label) invalid.add("buttonLabel");
        if (!urlOk) invalid.add("buttonUrl");
        if (!label || !urlOk) {
            messages.push(
                "O botão precisa de um texto e de um link http(s) ou variável.",
            );
        }
    } else if (system && !label) {
        invalid.add("buttonLabel");
        messages.push("Templates do sistema precisam do texto do botão.");
    }

    return { invalid, message: messages[0] ?? null };
}

export default function EmailTemplateEditorRoute() {
    const { id } = useParams();
    const [params] = useSearchParams();
    return (
        <EmailTemplateEditor
            key={id ?? `novo-${params.get("duplicar") ?? ""}`}
        />
    );
}

function EmailTemplateEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [params] = useSearchParams();
    const templateId = id ? Number(id) : null;
    const duplicateId = params.get("duplicar")
        ? Number(params.get("duplicar"))
        : null;
    const isNew = templateId === null;

    const [template, setTemplate] = useState<EmailTemplate | null>(null);
    const [draft, setDraft] = useState<EmailTemplatePayload>(EMPTY);
    const [initial, setInitial] = useState<EmailTemplatePayload>(EMPTY);
    const [loading, setLoading] = useState(
        templateId !== null || duplicateId !== null,
    );
    const [saving, setSaving] = useState(false);
    const [invalid, setInvalid] = useState<Set<FieldName>>(new Set());
    const [keyTouched, setKeyTouched] = useState(false);
    const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [testing, setTesting] = useState<EmailTemplate | null>(null);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const activeField = useRef<{
        name: TextFieldName;
        element: HTMLInputElement | HTMLTextAreaElement;
    } | null>(null);

    const system = template?.systemTemplate ?? false;
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

    useEffect(() => {
        const sourceId = templateId ?? duplicateId;
        if (sourceId === null) return;
        let cancelled = false;

        getEmailTemplate(sourceId)
            .then((source) => {
                if (cancelled) return;
                if (templateId !== null) {
                    const payload = toPayload(source);
                    setTemplate(source);
                    setDraft(payload);
                    setInitial(payload);
                } else {
                    setDraft({
                        ...toPayload(source),
                        name: `Cópia de ${source.name}`,
                        templateKey: slugify(`${source.templateKey}-copia`),
                    });
                    setKeyTouched(true);
                }
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : "Não foi possível carregar o template.",
                );
                navigate("/admin/email", { replace: true });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [templateId, duplicateId, navigate]);

    useEffect(() => {
        if (loading) return;
        let cancelled = false;

        const timeout = window.setTimeout(() => {
            setPreviewLoading(true);
            previewEmailTemplate({ templateId: template?.id, template: draft })
                .then((result) => {
                    if (!cancelled) setPreview(result);
                })
                .catch(() => {
                })
                .finally(() => {
                    if (!cancelled) setPreviewLoading(false);
                });
        }, 400);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [draft, template?.id, loading]);

    useEffect(() => {
        if (!dirty) return;
        const handler = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const usedVariables = useMemo(
        () =>
            extractVariables(
                draft.subject,
                draft.preheader,
                draft.eyebrow,
                draft.heading,
                draft.body,
                draft.buttonLabel,
                draft.buttonUrl,
                draft.notice,
                draft.footerNote,
            ),
        [draft],
    );

    const availableVariables = system
        ? (template?.variables ?? [])
        : usedVariables;
    const unknownVariables = system
        ? usedVariables.filter((name) => !template?.variables.includes(name))
        : [];

    function update<K extends FieldName>(
        name: K,
        value: EmailTemplatePayload[K],
    ) {
        setDraft((current) => {
            const next = { ...current, [name]: value };
            if (name === "name" && isNew && !keyTouched) {
                next.templateKey = slugify(String(value));
            }
            return next;
        });
        if (invalid.has(name)) {
            setInvalid((current) => {
                const next = new Set(current);
                next.delete(name);
                return next;
            });
        }
    }

    function textProps(name: TextFieldName) {
        return {
            id: `template-${name}`,
            value: (draft[name] as string) ?? "",
            "aria-invalid": invalid.has(name) || undefined,
            onChange: (
                event: React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement
                >,
            ) => update(name, event.target.value),
            onFocus: (
                event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => {
                activeField.current = { name, element: event.currentTarget };
            },
        };
    }

    function insertVariable(variable: string) {
        const token = `{{${variable}}}`;
        const active = activeField.current;

        if (!active || (system && active.name === "buttonUrl")) {
            void navigator.clipboard?.writeText(token);
            toast.info(`${token} copiado. Cole no campo desejado.`);
            return;
        }

        const { name, element } = active;
        const value = (draft[name] as string) ?? "";
        const start = element.selectionStart ?? value.length;
        const end = element.selectionEnd ?? value.length;
        update(name, value.slice(0, start) + token + value.slice(end));

        requestAnimationFrame(() => {
            element.focus();
            element.setSelectionRange(
                start + token.length,
                start + token.length,
            );
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = validate(draft, isNew, system);
        setInvalid(result.invalid);
        if (result.message) {
            toast.error(result.message);
            return;
        }

        setSaving(true);
        try {
            if (isNew) {
                const created = await createEmailTemplate(draft);
                setInitial(draft);
                toast.success("Template criado.");
                navigate(`/admin/email/template/${created.id}`, {
                    replace: true,
                });
            } else if (template) {
                const saved = await updateEmailTemplate(template.id, draft);
                const payload = toPayload(saved);
                setTemplate(saved);
                setDraft(payload);
                setInitial(payload);
                toast.success("Template salvo.");
            }
        } catch (error) {
            if (
                error instanceof ApiError &&
                error.code === "TEMPLATE_KEY_EXISTS"
            ) {
                setInvalid(new Set<FieldName>(["templateKey"]));
            }
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível salvar o template.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleRestore() {
        if (!template) return;
        setSaving(true);
        try {
            const restored = await restoreEmailTemplate(template.id);
            const payload = toPayload(restored);
            setTemplate(restored);
            setDraft(payload);
            setInitial(payload);
            setRestoreOpen(false);
            toast.success("Template restaurado para o padrão.");
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível restaurar o template.",
            );
        } finally {
            setSaving(false);
        }
    }

    function goBack() {
        if (dirty) {
            setLeaveOpen(true);
            return;
        }
        navigate("/admin/email");
    }

    return (
        <>
            <AdminHeader
                eyebrow={
                    isNew ? "E-mails · Novo template" : "E-mails · Template"
                }
                title={
                    draft.name.trim() || (isNew ? "Novo template" : "Template")
                }
                description={
                    isNew
                        ? "Defina os textos do e-mail. O visual segue o padrão do Digital Paper."
                        : (template?.description ?? undefined)
                }
                actions={
                    <>
                        <Button type="button" variant="ghost" onClick={goBack}>
                            <ArrowLeftIcon data-icon="inline-start" />
                            Voltar
                        </Button>
                        {template ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setTesting(template)}
                                disabled={dirty}
                                title={
                                    dirty
                                        ? "Salve as alterações antes de testar"
                                        : undefined
                                }
                            >
                                <SendIcon data-icon="inline-start" />
                                Enviar teste
                            </Button>
                        ) : null}
                        <Button
                            type="submit"
                            form="template-form"
                            disabled={saving || loading || (!isNew && !dirty)}
                        >
                            {saving ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <SaveIcon data-icon="inline-start" />
                            )}
                            {isNew ? "Criar template" : "Salvar"}
                        </Button>
                    </>
                }
            />

            {loading ? (
                <div className="grid gap-8 px-5 py-8 md:px-8 xl:grid-cols-2">
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                    <Skeleton className="h-[600px] w-full rounded-xl" />
                </div>
            ) : (
                <div className="grid flex-1 gap-8 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                    <form
                        id="template-form"
                        onSubmit={handleSubmit}
                        className="flex min-w-0 flex-col gap-8"
                        noValidate
                    >
                        {system ? (
                            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                                        <ShieldIcon className="size-4" />
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <p className="font-heading text-base font-semibold tracking-[-0.02em]">
                                            Template do sistema
                                        </p>
                                        <p className="text-sm text-pretty text-muted-foreground">
                                            Enviado automaticamente. Você pode
                                            editar os textos; a chave, as
                                            variáveis e o link do botão são
                                            definidos pelo sistema.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => setRestoreOpen(true)}
                                >
                                    <RotateCcwIcon data-icon="inline-start" />
                                    Restaurar padrão
                                </Button>
                            </div>
                        ) : null}

                        <FieldSet>
                            <FieldLegend>Identificação</FieldLegend>
                            <FieldDescription>
                                Como o template aparece no painel e como os
                                serviços o encontram.
                            </FieldDescription>
                            <FieldGroup>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        data-invalid={
                                            invalid.has("name") || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="template-name">
                                            Nome
                                        </FieldLabel>
                                        <Input
                                            {...textProps("name")}
                                            placeholder="Ex.: Alerta de processo"
                                            autoFocus={isNew}
                                        />
                                    </Field>
                                    <Field
                                        data-invalid={
                                            invalid.has("templateKey") ||
                                            undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="template-templateKey">
                                            Chave
                                        </FieldLabel>
                                        <Input
                                            {...textProps("templateKey")}
                                            onChange={(event) => {
                                                setKeyTouched(true);
                                                update(
                                                    "templateKey",
                                                    event.target.value.toLowerCase(),
                                                );
                                            }}
                                            disabled={!isNew}
                                            placeholder="alerta-processo"
                                            className="font-mono text-sm"
                                        />
                                        <FieldDescription>
                                            {isNew
                                                ? "Usada pelos serviços para enviar este e-mail. Não muda depois de criada."
                                                : "Identificador usado pelos serviços — somente leitura."}
                                        </FieldDescription>
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="template-description">
                                        Descrição
                                    </FieldLabel>
                                    <Textarea
                                        {...textProps("description")}
                                        rows={2}
                                        placeholder="Quando este e-mail é enviado e para quem."
                                        className="resize-none"
                                    />
                                </Field>

                                {template ? (
                                    <Field orientation="horizontal">
                                        <FieldContent>
                                            <FieldLabel>Ativo</FieldLabel>
                                            <FieldDescription>
                                                Desligado, os envios são
                                                registrados como “Ignorado” e
                                                nada é enviado.
                                            </FieldDescription>
                                        </FieldContent>
                                        <TemplateEnabledSwitch
                                            template={template}
                                            showLabel={false}
                                            onChange={setTemplate}
                                        />
                                    </Field>
                                ) : null}

                                <Field
                                    orientation="horizontal"
                                    data-disabled={system || undefined}
                                >
                                    <FieldContent>
                                        <FieldLabel htmlFor="template-sensitive">
                                            Conteúdo sensível
                                        </FieldLabel>
                                        <FieldDescription>
                                            Esconde o conteúdo no histórico e
                                            apaga o HTML após o envio. Use para
                                            links de uso único.
                                        </FieldDescription>
                                    </FieldContent>
                                    <Switch
                                        id="template-sensitive"
                                        checked={draft.sensitive}
                                        disabled={system}
                                        onCheckedChange={(checked) =>
                                            update("sensitive", checked)
                                        }
                                    />
                                </Field>
                            </FieldGroup>
                        </FieldSet>

                        <FieldSeparator />

                        <FieldSet>
                            <FieldLegend>Conteúdo</FieldLegend>
                            <FieldDescription>
                                Use{" "}
                                <span className="font-mono text-foreground">
                                    {"{{variavel}}"}
                                </span>{" "}
                                para inserir dados do envio.
                            </FieldDescription>

                            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 px-3 py-3">
                                <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                                    <BracesIcon className="size-3.5" />
                                    Variáveis
                                </p>
                                {availableVariables.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableVariables.map((variable) => (
                                            <Button
                                                key={variable}
                                                type="button"
                                                variant="outline"
                                                size="xs"
                                                className="font-mono"
                                                onMouseDown={(event) =>
                                                    event.preventDefault()
                                                }
                                                onClick={() =>
                                                    insertVariable(variable)
                                                }
                                            >
                                                {`{{${variable}}}`}
                                            </Button>
                                        ))}
                                    </div>
                                ) : null}
                                <p className="text-xs text-pretty text-muted-foreground">
                                    {system
                                        ? "Clique para inserir no campo selecionado. Estes são os dados que o sistema envia."
                                        : availableVariables.length > 0
                                          ? "Clique para inserir no campo selecionado. Quem enviar este template deve informar esses valores."
                                          : "Digite {{nomeDaVariavel}} em qualquer campo para criar uma variável."}
                                </p>
                                {unknownVariables.length > 0 ? (
                                    <p className="flex items-start gap-1.5 text-xs text-warning-foreground dark:text-warning">
                                        <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                                        <span>
                                            {unknownVariables
                                                .map((name) => `{{${name}}}`)
                                                .join(", ")}{" "}
                                            não{" "}
                                            {unknownVariables.length === 1
                                                ? "é enviada"
                                                : "são enviadas"}{" "}
                                            pelo sistema e{" "}
                                            {unknownVariables.length === 1
                                                ? "ficará vazia"
                                                : "ficarão vazias"}
                                            .
                                        </span>
                                    </p>
                                ) : null}
                            </div>

                            <FieldGroup>
                                <Field
                                    data-invalid={
                                        invalid.has("subject") || undefined
                                    }
                                >
                                    <FieldLabel htmlFor="template-subject">
                                        Assunto
                                    </FieldLabel>
                                    <Input
                                        {...textProps("subject")}
                                        placeholder="Atualização no seu processo — Digital Paper"
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="template-preheader">
                                        Pré-cabeçalho
                                    </FieldLabel>
                                    <Input
                                        {...textProps("preheader")}
                                        placeholder="Resumo exibido ao lado do assunto na caixa de entrada"
                                    />
                                </Field>

                                <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                                    <Field>
                                        <FieldLabel htmlFor="template-eyebrow">
                                            Rótulo
                                        </FieldLabel>
                                        <Input
                                            {...textProps("eyebrow")}
                                            placeholder="Processo"
                                        />
                                        <FieldDescription>
                                            Texto pequeno acima do título.
                                        </FieldDescription>
                                    </Field>
                                    <Field
                                        data-invalid={
                                            invalid.has("heading") || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="template-heading">
                                            Título
                                        </FieldLabel>
                                        <Input
                                            {...textProps("heading")}
                                            placeholder="Seu processo andou"
                                        />
                                    </Field>
                                </div>

                                <Field
                                    data-invalid={
                                        invalid.has("body") || undefined
                                    }
                                >
                                    <FieldLabel htmlFor="template-body">
                                        Corpo
                                    </FieldLabel>
                                    <Textarea
                                        {...textProps("body")}
                                        rows={8}
                                        placeholder={
                                            "Olá, **{{name}}**.\n\nSeu processo recebeu uma atualização."
                                        }
                                    />
                                    <FieldDescription>
                                        <span className="font-mono">
                                            **texto**
                                        </span>{" "}
                                        para negrito. Uma linha em branco separa
                                        parágrafos.
                                    </FieldDescription>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="template-notice">
                                        Aviso em destaque
                                    </FieldLabel>
                                    <Textarea
                                        {...textProps("notice")}
                                        rows={2}
                                        placeholder="Ex.: O link expira em **{{expiresIn}}**."
                                    />
                                    <FieldDescription>
                                        Opcional. Aparece em uma caixa abaixo do
                                        botão.
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </FieldSet>

                        <FieldSeparator />

                        <FieldSet>
                            <FieldLegend>Botão</FieldLegend>
                            <FieldDescription>
                                Opcional. O link também aparece por extenso para
                                quem não conseguir clicar.
                            </FieldDescription>
                            <FieldGroup>
                                <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                                    <Field
                                        data-invalid={
                                            invalid.has("buttonLabel") ||
                                            undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="template-buttonLabel">
                                            Texto
                                        </FieldLabel>
                                        <Input
                                            {...textProps("buttonLabel")}
                                            placeholder="Ver processo"
                                        />
                                    </Field>
                                    <Field
                                        data-invalid={
                                            invalid.has("buttonUrl") ||
                                            undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="template-buttonUrl">
                                            Link
                                        </FieldLabel>
                                        <Input
                                            {...textProps("buttonUrl")}
                                            disabled={system}
                                            placeholder="{{actionUrl}} ou https://…"
                                            className="font-mono text-sm"
                                        />
                                        <FieldDescription>
                                            {system
                                                ? "Gerado pelo sistema a cada envio."
                                                : "http(s):// ou uma variável, como {{actionUrl}}."}
                                        </FieldDescription>
                                    </Field>
                                </div>
                            </FieldGroup>
                        </FieldSet>

                        <FieldSeparator />

                        <FieldSet>
                            <FieldLegend>Encerramento</FieldLegend>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="template-footerNote">
                                        Nota final
                                    </FieldLabel>
                                    <Textarea
                                        {...textProps("footerNote")}
                                        rows={2}
                                        placeholder="Ex.: Se você não reconhece esta ação, ignore este e-mail."
                                    />
                                    <FieldDescription>
                                        Texto discreto no fim do e-mail. O
                                        rodapé do Digital Paper é adicionado
                                        automaticamente.
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </form>

                    <aside className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-6 xl:self-start">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                    Prévia
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Com valores de exemplo, como o destinatário
                                    vai ver.
                                </p>
                            </div>
                            {previewLoading ? (
                                <Spinner className="text-muted-foreground" />
                            ) : null}
                            {!previewLoading && dirty && !isNew ? (
                                <Badge variant="warning">Não salvo</Badge>
                            ) : null}
                        </div>
                        <EmailPreviewFrame
                            html={preview?.html ?? null}
                            subject={preview?.subject}
                            loading={previewLoading}
                        />
                    </aside>
                </div>
            )}

            <SendTestDialog
                template={testing}
                onOpenChange={(open) => {
                    if (!open) setTesting(null);
                }}
            />

            <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Descartar alterações?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-pretty">
                            As mudanças neste template ainda não foram salvas e
                            serão perdidas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Continuar editando
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => navigate("/admin/email")}
                        >
                            Descartar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar o padrão?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-pretty">
                            Os textos voltam para a versão original do sistema.
                            Suas edições, salvas ou não, serão perdidas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={saving}
                            onClick={(event) => {
                                event.preventDefault();
                                void handleRestore();
                            }}
                        >
                            {saving ? (
                                <Spinner data-icon="inline-start" />
                            ) : null}
                            Restaurar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
