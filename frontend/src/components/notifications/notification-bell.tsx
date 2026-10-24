import { useCallback, useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { NotificationPanel } from "@/components/notifications/notification-panel";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    ApiError,
    deleteNotification,
    getUnreadNotificationCount,
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    markNotificationUnread,
    type AppNotification,
} from "@/lib/api";
import {
    isNotificationRead,
    normalizeNotification,
} from "@/lib/notifications";
const POLL_MS = 45_000;
const PREVIEW_SIZE = 10;

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
    });

    useEffect(() => {
        const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const onChange = () => setIsMobile(media.matches);
        onChange();
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [breakpoint]);

    return isMobile;
}

export function NotificationBell() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const refreshCount = useCallback(async () => {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch {
            // silencioso no poll — evita toast em loop
        }
    }, []);

    const loadPreview = useCallback(async () => {
        setLoading(true);
        try {
            const page = await listNotifications({
                status: "all",
                page: 0,
                size: PREVIEW_SIZE,
            });
            setItems(page.content.map(normalizeNotification));
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível carregar as notificações.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshCount();
        const id = window.setInterval(() => {
            void refreshCount();
        }, POLL_MS);
        return () => window.clearInterval(id);
    }, [refreshCount]);

    useEffect(() => {
        if (open) {
            void loadPreview();
        }
    }, [open, loadPreview]);

    async function handleSelect(notification: AppNotification) {
        try {
            if (!notification.read) {
                const updated = normalizeNotification(
                    await markNotificationRead(notification.id),
                );
                setItems((current) =>
                    current.map((item) =>
                        item.id === notification.id ? updated : item,
                    ),
                );
                setUnreadCount((count) => Math.max(0, count - 1));
            }
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível marcar a notificação.";
            toast.error(message);
            return;
        }

        setOpen(false);

        if (notification.link) {
            navigate(notification.link);
        }
    }

    async function handleMarkAllRead() {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            setItems((current) =>
                current.map((item) => ({
                    ...item,
                    read: true,
                    readAt: item.readAt ?? new Date().toISOString(),
                })),
            );
            setUnreadCount(0);
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

    async function handleDelete(notification: AppNotification) {
        try {
            await deleteNotification(notification.id);
            setItems((current) =>
                current.filter((item) => item.id !== notification.id),
            );
            if (!notification.read) {
                setUnreadCount((count) => Math.max(0, count - 1));
            }
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível excluir a notificação.";
            toast.error(message);
        }
    }

    async function handleMarkRead(notification: AppNotification) {
        if (isNotificationRead(notification)) return;
        try {
            const updated = normalizeNotification(
                await markNotificationRead(notification.id),
            );
            setItems((current) =>
                current.map((item) =>
                    item.id === notification.id ? updated : item,
                ),
            );
            setUnreadCount((count) => Math.max(0, count - 1));
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível marcar a notificação.";
            toast.error(message);
        }
    }

    async function handleMarkUnread(notification: AppNotification) {
        if (!isNotificationRead(notification)) return;
        try {
            const updated = normalizeNotification(
                await markNotificationUnread(notification.id),
            );
            setItems((current) =>
                current.map((item) =>
                    item.id === notification.id ? updated : item,
                ),
            );
            setUnreadCount((count) => count + 1);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível marcar como não lida.";
            toast.error(message);
        }
    }

    const badgeLabel =
        unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

    const trigger = (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
                unreadCount > 0
                    ? `Notificações, ${unreadCount} não lidas`
                    : "Notificações"
            }
        >
            <BellIcon />
            {badgeLabel ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background tabular-nums">
                    {badgeLabel}
                </span>
            ) : null}
        </Button>
    );

    const panel = (
        <NotificationPanel
            items={items}
            loading={loading}
            unreadCount={unreadCount}
            markingAll={markingAll}
            onSelect={handleSelect}
            onMarkRead={handleMarkRead}
            onMarkUnread={handleMarkUnread}
            onDelete={handleDelete}
            onMarkAllRead={handleMarkAllRead}
            onClose={() => setOpen(false)}
        />
    );

    if (isMobile) {
        return (
            <>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        unreadCount > 0
                            ? `Notificações, ${unreadCount} não lidas`
                            : "Notificações"
                    }
                    onClick={() => setOpen(true)}
                >
                    <BellIcon />
                    {badgeLabel ? (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background tabular-nums">
                            {badgeLabel}
                        </span>
                    ) : null}
                </Button>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Notificações</SheetTitle>
                        </SheetHeader>
                        <div className="px-1 pt-2">{panel}</div>
                    </SheetContent>
                </Sheet>
            </>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[22rem] p-3 sm:w-[24rem]"
            >
                {panel}
            </PopoverContent>
        </Popover>
    );
}
