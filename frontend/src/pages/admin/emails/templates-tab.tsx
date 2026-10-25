import { useMemo, useState } from "react";
import {
    CopyIcon,
    HistoryIcon,
    MailIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PlusIcon,
    RotateCcwIcon,
    SearchIcon,
    SendIcon,
    ShieldIcon,
    Trash2Icon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ApiError,
    deleteEmailTemplate,
    restoreEmailTemplate,
    type EmailTemplate,
} from "@/lib/api";

import { SendTestDialog } from "./send-test-dialog";
import { formatDateTime } from "./email-utils";
import { TemplateEnabledSwitch } from "./template-enabled-switch";

type TemplatesTabProps = {
    templates: EmailTemplate[];
    loading: boolean;
    onTemplateChange: (updated: EmailTemplate) => void;
    onTemplateRemove: (id: number) => void;
    onShowHistory: (templateKey: string) => void;
};

type PendingAction =
    | { kind: "delete"; template: EmailTemplate }
    | { kind: "restore"; template: EmailTemplate };

export function TemplatesTab({
    templates,
    loading,
    onTemplateChange,
    onTemplateRemove,
    onShowHistory,
}: TemplatesTabProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [working, setWorking] = useState(false);
    const [testing, setTesting] = useState<EmailTemplate | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter(
            (template) =>
                template.name.toLowerCase().includes(q) ||
                template.templateKey.includes(q) ||
                template.subject.toLowerCase().includes(q),
        );
    }, [templates, query]);

    async function handleConfirm() {
        if (!pending) return;
        setWorking(true);
        try {
            if (pending.kind === "delete") {
                await deleteEmailTemplate(pending.template.id);
                onTemplateRemove(pending.template.id);
                toast.success("Template apagado.");
            } else {
                const restored = await restoreEmailTemplate(pending.template.id);
                onTemplateChange(restored);
                toast.success("Template restaurado para o padrão.");
            }
            setPending(null);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível concluir a ação.",
            );
        } finally {
            setWorking(false);
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar por nome, chave ou assunto…"
                        className="pl-8"
                        aria-label="Buscar template"
                    />
                </div>
                <Button asChild>
                    <Link to="/admin/email/template/novo">
                        <PlusIcon data-icon="inline-start" />
                        Novo template
                    </Link>
                </Button>
            </div>

            <div className="flex flex-1 flex-col gap-3">
                {loading ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Empty className="border border-dashed border-border/80 py-14">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <MailIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                                {query
                                    ? "Nenhum template encontrado"
                                    : "Nenhum template cadastrado"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {query
                                    ? "Ajuste a busca ou limpe o filtro para ver todos os templates."
                                    : "Crie um template para enviar e-mails a partir de outros serviços."}
                            </EmptyDescription>
                        </EmptyHeader>
                        {!query ? (
                            <EmptyContent>
                                <Button asChild>
                                    <Link to="/admin/email/template/novo">
                                        <PlusIcon data-icon="inline-start" />
                                        Criar template
                                    </Link>
                                </Button>
                            </EmptyContent>
                        ) : null}
                    </Empty>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/70">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Template</TableHead>
                                    <TableHead className="hidden lg:table-cell">
                                        Assunto
                                    </TableHead>
                                    <TableHead className="w-32 text-center">
                                        Envios (30d)
                                    </TableHead>
                                    <TableHead className="hidden w-48 pl-8 md:table-cell">
                                        Último envio
                                    </TableHead>
                                    <TableHead className="w-36">Ativo</TableHead>
                                    <TableHead className="w-14">
                                        <span className="sr-only">Ações</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-2 font-medium">
                                                    {template.name}
                                                    {template.systemTemplate ? (
                                                        <Badge variant="outline">
                                                            <ShieldIcon data-icon="inline-start" />
                                                            Sistema
                                                        </Badge>
                                                    ) : null}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {template.templateKey}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden max-w-xs truncate text-muted-foreground lg:table-cell">
                                            {template.subject}
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums">
                                            {template.sentLast30Days}
                                        </TableCell>
                                        <TableCell className="hidden pl-8 text-muted-foreground md:table-cell">
                                            {formatDateTime(template.lastSentAt)}
                                        </TableCell>
                                        <TableCell>
                                            <TemplateEnabledSwitch
                                                template={template}
                                                onChange={onTemplateChange}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="cursor-pointer"
                                                        aria-label={`Ações de ${template.name}`}
                                                    >
                                                        <MoreHorizontalIcon />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/email/template/${template.id}`,
                                                                )
                                                            }
                                                        >
                                                            <PencilIcon />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/email/template/novo?duplicar=${template.id}`,
                                                                )
                                                            }
                                                        >
                                                            <CopyIcon />
                                                            Duplicar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setTesting(template)
                                                            }
                                                        >
                                                            <SendIcon />
                                                            Enviar teste
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onShowHistory(
                                                                    template.templateKey,
                                                                )
                                                            }
                                                        >
                                                            <HistoryIcon />
                                                            Ver histórico
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                    <DropdownMenuSeparator />
                                                    {template.systemTemplate ? (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setPending({
                                                                    kind: "restore",
                                                                    template,
                                                                })
                                                            }
                                                        >
                                                            <RotateCcwIcon />
                                                            Restaurar padrão
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() =>
                                                                setPending({
                                                                    kind: "delete",
                                                                    template,
                                                                })
                                                            }
                                                        >
                                                            <Trash2Icon />
                                                            Apagar
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <p className="mt-auto self-end text-sm text-muted-foreground">
                    {loading
                        ? "Carregando…"
                        : filtered.length === 1
                          ? "1 template"
                          : `${filtered.length} templates`}
                </p>
            </div>

            <SendTestDialog
                template={testing}
                onOpenChange={(open) => {
                    if (!open) setTesting(null);
                }}
            />

            <AlertDialog
                open={Boolean(pending)}
                onOpenChange={(open) => {
                    if (!open) setPending(null);
                }}
            >
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pending?.kind === "delete"
                                ? "Apagar template?"
                                : "Restaurar o padrão?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-pretty">
                            {pending?.kind === "delete" ? (
                                <>
                                    <span className="block">
                                        O template{" "}
                                        <span className="font-medium text-foreground">
                                            {pending.template.name}
                                        </span>{" "}
                                        será apagado permanentemente.
                                    </span>
                                    <span className="mt-2 block">
                                        Serviços que ainda usarem a chave{" "}
                                        <span className="font-mono text-foreground">
                                            {pending.template.templateKey}
                                        </span>{" "}
                                        terão os envios registrados como falha. O
                                        histórico é mantido.
                                    </span>
                                </>
                            ) : (
                                <span className="block">
                                    Os textos de{" "}
                                    <span className="font-medium text-foreground">
                                        {pending?.template.name}
                                    </span>{" "}
                                    voltam para a versão original do sistema. As
                                    suas edições serão perdidas.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={working}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant={pending?.kind === "delete" ? "destructive" : "default"}
                            disabled={working}
                            onClick={(event) => {
                                event.preventDefault();
                                void handleConfirm();
                            }}
                        >
                            {working ? <Spinner data-icon="inline-start" /> : null}
                            {pending?.kind === "delete" ? "Apagar" : "Restaurar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
