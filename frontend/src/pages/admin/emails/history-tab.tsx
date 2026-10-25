import { useEffect, useState } from "react";
import {
    CheckCircle2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    InboxIcon,
    LockIcon,
    RefreshCwIcon,
    SearchIcon,
    XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
    getEmail,
    listEmails,
    resendEmail,
    type EmailLog,
    type EmailLogDetail,
    type EmailStatus,
    type EmailTemplate,
} from "@/lib/api";

import { EmailPreviewFrame, EmailStatusBadge } from "./email-ui";
import { EMAIL_STATUS_LABELS, formatDateTime } from "./email-utils";

const PAGE_SIZES = [10, 25, 50] as const;
const ALL = "ALL";

type HistoryTabProps = {
    templates: EmailTemplate[];
    templateFilter: string;
    onTemplateFilterChange: (templateKey: string) => void;
};

export function HistoryTab({
    templates,
    templateFilter,
    onTemplateFilterChange,
}: HistoryTabProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [status, setStatus] = useState<EmailStatus | typeof ALL>(ALL);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState<(typeof PAGE_SIZES)[number]>(25);
    const [emails, setEmails] = useState<EmailLog[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    const [detailId, setDetailId] = useState<number | null>(null);
    const [detail, setDetail] = useState<EmailLogDetail | null>(null);
    const [resending, setResending] = useState(false);

    const templateNames = new Map(
        templates.map((template) => [template.templateKey, template.name]),
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
            setPage(0);
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [query]);

    useEffect(() => {
        let cancelled = false;

        listEmails({
            q: debouncedQuery,
            status: status === ALL ? "" : status,
            template: templateFilter,
            page,
            size,
        })
            .then((result) => {
                if (cancelled) return;
                setEmails(result.content);
                setTotalElements(result.totalElements);
                setTotalPages(result.totalPages);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : "Não foi possível carregar o histórico.",
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, status, templateFilter, page, size, reloadKey]);

    useEffect(() => {
        if (detailId === null) return;
        let cancelled = false;

        getEmail(detailId)
            .then((result) => {
                if (!cancelled) setDetail(result);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : "Não foi possível carregar o e-mail.",
                );
                setDetailId(null);
            });

        return () => {
            cancelled = true;
        };
    }, [detailId]);

    function reload() {
        setLoading(true);
        setReloadKey((current) => current + 1);
    }

    async function handleResend() {
        if (!detail) return;
        setResending(true);
        try {
            const updated = await resendEmail(detail.email.id);
            setDetail(updated);
            if (updated.email.status === "SENT") {
                toast.success("E-mail reenviado.");
            } else {
                toast.error("O reenvio falhou novamente.", {
                    description: updated.email.lastError ?? undefined,
                });
            }
            reload();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível reenviar o e-mail.",
            );
        } finally {
            setResending(false);
        }
    }

    const rangeLabel =
        totalElements === 0
            ? "Nenhum e-mail"
            : `${page * size + 1}–${Math.min((page + 1) * size, totalElements)} de ${totalElements}`;

    const hasFilters = Boolean(debouncedQuery) || status !== ALL || Boolean(templateFilter);
    const canResend =
        detail !== null &&
        (detail.email.status === "FAILED" || detail.email.status === "RETRYING");

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full max-w-sm">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => {
                            setLoading(true);
                            setQuery(event.target.value);
                        }}
                        placeholder="Buscar por destinatário ou assunto…"
                        className="pl-8"
                        aria-label="Buscar e-mail"
                    />
                </div>
                <Select
                    value={status}
                    onValueChange={(value) => {
                        setLoading(true);
                        setStatus(value as EmailStatus | typeof ALL);
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por status">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Todos os status</SelectItem>
                        {(Object.keys(EMAIL_STATUS_LABELS) as EmailStatus[]).map((value) => (
                            <SelectItem key={value} value={value}>
                                {EMAIL_STATUS_LABELS[value]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={templateFilter || ALL}
                    onValueChange={(value) => {
                        setLoading(true);
                        onTemplateFilterChange(value === ALL ? "" : value);
                        setPage(0);
                    }}
                >
                    <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por template">
                        <SelectValue placeholder="Template" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Todos os templates</SelectItem>
                        {templates.map((template) => (
                            <SelectItem key={template.id} value={template.templateKey}>
                                {template.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 sm:ml-auto"
                    onClick={reload}
                    disabled={loading}
                    aria-label="Atualizar"
                >
                    <RefreshCwIcon />
                </Button>
            </div>

            <div className="flex flex-1 flex-col gap-3">
                {loading && emails.length === 0 ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                    </div>
                ) : emails.length === 0 ? (
                    <Empty className="border border-dashed border-border/80 py-14">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <InboxIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                                {hasFilters
                                    ? "Nenhum e-mail encontrado"
                                    : "Nenhum e-mail enviado ainda"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {hasFilters
                                    ? "Ajuste os filtros para ver outros envios."
                                    : "Os e-mails enviados pelo sistema aparecem aqui."}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/70">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Destinatário</TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Template
                                    </TableHead>
                                    <TableHead className="hidden xl:table-cell">
                                        Assunto
                                    </TableHead>
                                    <TableHead className="w-36">Status</TableHead>
                                    <TableHead className="hidden w-24 text-center sm:table-cell">
                                        Tentativas
                                    </TableHead>
                                    <TableHead className="hidden w-40 lg:table-cell">
                                        Data
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className={loading ? "opacity-60" : undefined}>
                                {emails.map((email) => (
                                    <TableRow
                                        key={email.id}
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setDetail(null);
                                            setDetailId(email.id);
                                        }}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">
                                                    {email.recipientName ?? email.recipientEmail}
                                                </span>
                                                {email.recipientName ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        {email.recipientEmail}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-col gap-0.5">
                                                <span>
                                                    {templateNames.get(email.templateKey) ??
                                                        email.templateKey}
                                                </span>
                                                {email.source === "admin-test" ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        Envio de teste
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden max-w-xs truncate text-muted-foreground xl:table-cell">
                                            {email.subject}
                                        </TableCell>
                                        <TableCell>
                                            <EmailStatusBadge status={email.status} />
                                        </TableCell>
                                        <TableCell className="hidden text-center tabular-nums text-muted-foreground sm:table-cell">
                                            {email.attempts}/{email.maxAttempts}
                                        </TableCell>
                                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                                            {formatDateTime(email.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {loading ? "Carregando…" : rangeLabel}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="email-page-size" className="text-xs text-muted-foreground">
                                Por página
                            </Label>
                            <Select
                                value={String(size)}
                                onValueChange={(value) => {
                                    setLoading(true);
                                    setSize(Number(value) as (typeof PAGE_SIZES)[number]);
                                    setPage(0);
                                }}
                            >
                                <SelectTrigger id="email-page-size" size="sm" className="w-[4.5rem]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((option) => (
                                        <SelectItem key={option} value={String(option)}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                disabled={loading || page <= 0}
                                onClick={() => {
                                    setLoading(true);
                                    setPage((current) => current - 1);
                                }}
                                aria-label="Página anterior"
                            >
                                <ChevronLeftIcon />
                            </Button>
                            <span className="min-w-16 text-center text-xs text-muted-foreground">
                                {totalPages === 0 ? "0 / 0" : `${page + 1} / ${totalPages}`}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                disabled={loading || totalPages === 0 || page >= totalPages - 1}
                                onClick={() => {
                                    setLoading(true);
                                    setPage((current) => current + 1);
                                }}
                                aria-label="Próxima página"
                            >
                                <ChevronRightIcon />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Sheet
                open={detailId !== null}
                onOpenChange={(open) => {
                    if (!open) setDetailId(null);
                }}
            >
                <SheetContent side="right" className="w-full gap-0 sm:max-w-2xl">
                    <SheetHeader className="border-b border-border/70">
                        <SheetTitle className="pr-8">
                            {detail?.email.subject ?? "Carregando…"}
                        </SheetTitle>
                        <SheetDescription>
                            {detail
                                ? `Para ${detail.email.recipientName ? `${detail.email.recipientName} · ` : ""}${detail.email.recipientEmail}`
                                : "Detalhes do envio"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-5">
                        {!detail ? (
                            <div className="flex flex-col gap-3">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <DetailItem label="Status">
                                        <EmailStatusBadge status={detail.email.status} />
                                    </DetailItem>
                                    <DetailItem label="Template">
                                        {templateNames.get(detail.email.templateKey) ??
                                            detail.email.templateKey}
                                    </DetailItem>
                                    <DetailItem label="Origem">
                                        <span className="font-mono text-xs">{detail.email.source}</span>
                                    </DetailItem>
                                    <DetailItem label="Tentativas">
                                        {detail.email.attempts}/{detail.email.maxAttempts}
                                    </DetailItem>
                                    <DetailItem label="Criado em">
                                        {formatDateTime(detail.email.createdAt)}
                                    </DetailItem>
                                    <DetailItem label="Enviado em">
                                        {formatDateTime(detail.email.sentAt)}
                                    </DetailItem>
                                    {detail.email.nextAttemptAt ? (
                                        <DetailItem label="Próxima tentativa">
                                            {formatDateTime(detail.email.nextAttemptAt)}
                                        </DetailItem>
                                    ) : null}
                                </dl>

                                {detail.email.lastError ? (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                                        <p className="text-[11px] font-medium tracking-[0.14em] text-destructive uppercase">
                                            Último erro
                                        </p>
                                        <p className="mt-1 font-mono text-xs break-words text-foreground">
                                            {detail.email.lastError}
                                        </p>
                                    </div>
                                ) : null}

                                {detail.attempts.length > 0 ? (
                                    <section className="flex flex-col gap-3">
                                        <h3 className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Tentativas
                                        </h3>
                                        <ol className="flex flex-col gap-2">
                                            {detail.attempts.map((attempt) => (
                                                <li
                                                    key={attempt.attemptNumber}
                                                    className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5"
                                                >
                                                    {attempt.success ? (
                                                        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
                                                    ) : (
                                                        <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                                                            <span className="font-medium">
                                                                Tentativa {attempt.attemptNumber}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDateTime(attempt.attemptedAt)} ·{" "}
                                                                {attempt.durationMs} ms
                                                            </span>
                                                        </p>
                                                        {attempt.error ? (
                                                            <p className="mt-1 font-mono text-xs break-words text-muted-foreground">
                                                                {attempt.error}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    </section>
                                ) : null}

                                <section className="flex flex-col gap-3">
                                    <h3 className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                        Conteúdo
                                    </h3>
                                    {detail.body ? (
                                        <EmailPreviewFrame
                                            html={detail.body}
                                            subject={detail.email.subject}
                                            frameClassName="h-[560px]"
                                        />
                                    ) : (
                                        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                            <LockIcon className="mt-0.5 size-4 shrink-0" />
                                            {detail.email.sensitive
                                                ? "Conteúdo protegido: este e-mail contém um link de uso único e não é exibido."
                                                : "Conteúdo não disponível para este envio."}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>

                    {canResend ? (
                        <SheetFooter className="border-t border-border/70 sm:flex-row sm:justify-end">
                            <Button type="button" onClick={() => void handleResend()} disabled={resending}>
                                {resending ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <RefreshCwIcon data-icon="inline-start" />
                                )}
                                Reenviar agora
                            </Button>
                        </SheetFooter>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {label}
            </dt>
            <dd className="text-foreground">{children}</dd>
        </div>
    );
}
