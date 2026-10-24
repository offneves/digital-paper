import { useCallback, useEffect, useState } from "react";
import {
    BellIcon,
    CheckCheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdminHeader } from "@/layouts/admin-layout";
import {
    ApiError,
    deleteNotification,
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    markNotificationUnread,
    restoreNotification,
    type AppNotification,
    type NotificationListStatus,
} from "@/lib/api";
import {
    groupNotificationsByDay,
    isNotificationRead,
    normalizeNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const FILTERS: {
    value: NotificationListStatus;
    label: string;
    dotClass: string;
}[] = [
    { value: "all", label: "Todas", dotClass: "bg-foreground/40" },
    { value: "read", label: "Lidas", dotClass: "bg-success" },
    { value: "unread", label: "Não lidas", dotClass: "bg-warning" },
    { value: "deleted", label: "Apagadas", dotClass: "bg-destructive" },
];

function matchesStatus(
    notification: AppNotification,
    status: NotificationListStatus,
): boolean {
    const item = normalizeNotification(notification);
    switch (status) {
        case "unread":
            return !item.deleted && !item.read;
        case "read":
            return !item.deleted && item.read;
        case "deleted":
            return item.deleted;
        default:
            return !item.deleted;
    }
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<NotificationListStatus>("all");
    const [page, setPage] = useState(0);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listNotifications({
                status: filter,
                page,
                size: PAGE_SIZE,
            });
            const normalized = result.content
                .map(normalizeNotification)
                .filter((item) => matchesStatus(item, filter));
            setItems(normalized);
            setTotalPages(result.totalPages);
            // Confia no total do servidor; filtro local só remove inconsistências pontuais
            setTotalElements(result.totalElements);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível carregar as notificações.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => {
        void load();
    }, [load]);

    async function markAsRead(notification: AppNotification): Promise<boolean> {
        if (isNotificationRead(notification) || notification.deleted) {
            return true;
        }

        try {
            const updated = normalizeNotification(
                await markNotificationRead(notification.id),
            );

            if (filter === "unread") {
                setItems((current) =>
                    current.filter((item) => item.id !== notification.id),
                );
                setTotalElements((n) => Math.max(0, n - 1));
            } else {
                setItems((current) =>
                    current.map((item) =>
                        item.id === notification.id ? updated : item,
                    ),
                );
            }
            return true;
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível marcar a notificação.";
            toast.error(message);
            return false;
        }
    }

    async function handleMarkRead(notification: AppNotification) {
        const ok = await markAsRead(notification);
        if (ok) {
            toast.success("Marcada como lida.");
        }
    }

    async function handleMarkUnread(notification: AppNotification) {
        if (!isNotificationRead(notification) || notification.deleted) {
            return;
        }

        try {
            const updated = normalizeNotification(
                await markNotificationUnread(notification.id),
            );

            if (filter === "read") {
                setItems((current) =>
                    current.filter((item) => item.id !== notification.id),
                );
                setTotalElements((n) => Math.max(0, n - 1));
            } else {
                setItems((current) =>
                    current.map((item) =>
                        item.id === notification.id ? updated : item,
                    ),
                );
            }
            toast.success("Marcada como não lida.");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível marcar como não lida.";
            toast.error(message);
        }
    }

    async function handleSelect(notification: AppNotification) {
        if (notification.deleted) return;

        const ok = await markAsRead(notification);
        if (!ok) return;

        if (notification.link) {
            navigate(notification.link);
        }
    }

    async function handleDelete(notification: AppNotification) {
        try {
            await deleteNotification(notification.id);
            setItems((current) =>
                current.filter((item) => item.id !== notification.id),
            );
            setTotalElements((n) => Math.max(0, n - 1));
            toast.success("Notificação apagada.");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível excluir a notificação.";
            toast.error(message);
        }
    }

    async function handleRestore(notification: AppNotification) {
        try {
            await restoreNotification(notification.id);
            setItems((current) =>
                current.filter((item) => item.id !== notification.id),
            );
            setTotalElements((n) => Math.max(0, n - 1));
            toast.success("Notificação restaurada.");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível restaurar a notificação.";
            toast.error(message);
        }
    }

    async function handleMarkAllRead() {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            if (filter === "unread") {
                setItems([]);
                setTotalElements(0);
                setTotalPages(0);
                setPage(0);
            } else if (filter === "all") {
                setItems((current) =>
                    current.map((item) => ({
                        ...item,
                        read: true,
                        readAt: item.readAt ?? new Date().toISOString(),
                    })),
                );
            }
            toast.success("Todas as notificações foram marcadas como lidas.");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível marcar as notificações.";
            toast.error(message);
        } finally {
            setMarkingAll(false);
        }
    }

    const groups = groupNotificationsByDay(items);
    const hasUnreadOnPage = items.some(
        (item) => !isNotificationRead(item) && !item.deleted,
    );
    const showStatusVisual = filter === "all";

    return (
        <>
            <AdminHeader
                title="Notificações"
                eyebrow="Caixa de entrada"
                description="Abra um item para ir ao destino, ou use o menu ⋯ para mais opções."
                actions={
                    filter !== "deleted" && hasUnreadOnPage ? (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={markingAll || loading}
                            onClick={() => void handleMarkAllRead()}
                        >
                            <CheckCheckIcon data-icon="inline-start" />
                            Marcar todas como lidas
                        </Button>
                    ) : null
                }
            />

            <main className="flex flex-1 flex-col gap-6 px-5 py-8 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ToggleGroup
                        type="single"
                        value={filter}
                        onValueChange={(value) => {
                            if (
                                value === "all" ||
                                value === "unread" ||
                                value === "read" ||
                                value === "deleted"
                            ) {
                                setFilter(value);
                                setPage(0);
                            }
                        }}
                        variant="outline"
                        size="sm"
                    >
                        {FILTERS.map((item) => (
                            <ToggleGroupItem
                                key={item.value}
                                value={item.value}
                                className="gap-1.5"
                            >
                                <span
                                    className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        item.dotClass,
                                    )}
                                    aria-hidden
                                />
                                {item.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <Badge variant="outline" className="font-normal tabular-nums">
                        {totalElements === 0
                            ? "Nenhum item"
                            : `${totalElements} ${totalElements === 1 ? "item" : "itens"}`}
                    </Badge>
                </div>

                {loading ? (
                    <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border/70 p-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex gap-3">
                                <Skeleton className="size-9 shrink-0 rounded-lg" />
                                <div className="flex flex-1 flex-col gap-2 py-0.5">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-full max-w-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <Empty className="border border-dashed border-border/80 py-14">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <BellIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                                {filter === "unread"
                                    ? "Nenhuma não lida"
                                    : filter === "read"
                                      ? "Nenhuma lida"
                                      : filter === "deleted"
                                        ? "Nenhuma apagada"
                                        : "Caixa de entrada vazia"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {filter === "unread"
                                    ? "Você está em dia com as notificações."
                                    : filter === "read"
                                      ? "As notificações que você ler aparecem aqui."
                                      : filter === "deleted"
                                        ? "Itens excluídos ficam aqui para restaurar."
                                        : "Quando houver novidades, elas aparecem aqui."}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="flex flex-col gap-6">
                        {groups.map((group) => (
                            <section key={group.key} className="flex flex-col gap-2">
                                <p className="px-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                    {group.label}
                                </p>
                                <div className="overflow-hidden rounded-xl border border-border/70">
                                    {group.items.map((item, index) => (
                                        <div key={item.id}>
                                            {index > 0 ? (
                                                <Separator />
                                            ) : null}
                                            <NotificationItem
                                                notification={item}
                                                onSelect={handleSelect}
                                                onMarkRead={
                                                    filter === "deleted"
                                                        ? undefined
                                                        : handleMarkRead
                                                }
                                                onMarkUnread={
                                                    filter === "deleted"
                                                        ? undefined
                                                        : handleMarkUnread
                                                }
                                                onDelete={
                                                    filter === "deleted"
                                                        ? undefined
                                                        : handleDelete
                                                }
                                                onRestore={
                                                    filter === "deleted"
                                                        ? handleRestore
                                                        : undefined
                                                }
                                                showStatusVisual={showStatusVisual}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {totalPages > 1 ? (
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            Página {page + 1} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page <= 0 || loading}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                            >
                                <ChevronLeftIcon data-icon="inline-start" />
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1 || loading}
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(totalPages - 1, p + 1),
                                    )
                                }
                            >
                                Próxima
                                <ChevronRightIcon data-icon="inline-end" />
                            </Button>
                        </div>
                    </div>
                ) : null}
            </main>
        </>
    );
}
