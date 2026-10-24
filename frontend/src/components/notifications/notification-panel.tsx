import { BellIcon, CheckCheckIcon } from "lucide-react";
import { Link } from "react-router-dom";

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
import type { AppNotification } from "@/lib/api";

type NotificationPanelProps = {
    items: AppNotification[];
    loading: boolean;
    unreadCount: number;
    markingAll: boolean;
    onSelect: (notification: AppNotification) => void;
    onMarkRead: (notification: AppNotification) => void;
    onMarkUnread: (notification: AppNotification) => void;
    onDelete: (notification: AppNotification) => void;
    onMarkAllRead: () => void;
    onClose?: () => void;
};

export function NotificationPanel({
    items,
    loading,
    unreadCount,
    markingAll,
    onSelect,
    onMarkRead,
    onMarkUnread,
    onDelete,
    onMarkAllRead,
    onClose,
}: NotificationPanelProps) {
    return (
        <div className="flex max-h-[min(28rem,70vh)] w-full flex-col">
            <div className="flex items-start justify-between gap-3 px-1 pb-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Caixa de entrada
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                        <p className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
                            Notificações
                        </p>
                        {unreadCount > 0 ? (
                            <Badge variant="warning" className="tabular-nums">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </Badge>
                        ) : null}
                    </div>
                </div>
                {unreadCount > 0 ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={markingAll}
                        onClick={onMarkAllRead}
                        className="shrink-0"
                    >
                        <CheckCheckIcon data-icon="inline-start" />
                        Marcar todas
                    </Button>
                ) : null}
            </div>

            <Separator />

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
                {loading ? (
                    <div className="flex flex-col gap-3 px-1 py-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex gap-3 px-2">
                                <Skeleton className="size-9 shrink-0 rounded-lg" />
                                <div className="flex flex-1 flex-col gap-2 py-0.5">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <Empty className="border-0 py-8">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <BellIcon />
                            </EmptyMedia>
                            <EmptyTitle>Nenhuma notificação</EmptyTitle>
                            <EmptyDescription>
                                Quando houver novidades, elas aparecem aqui.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-border/60">
                        {items.map((item, index) => (
                            <div key={item.id}>
                                {index > 0 ? <Separator /> : null}
                                <NotificationItem
                                    notification={item}
                                    onSelect={onSelect}
                                    onMarkRead={onMarkRead}
                                    onMarkUnread={onMarkUnread}
                                    onDelete={onDelete}
                                    showStatusVisual
                                    compact
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Separator className="mt-2" />

            <div className="pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    asChild
                >
                    <Link to="/notificacoes" onClick={onClose}>
                        Ver todas
                    </Link>
                </Button>
            </div>
        </div>
    );
}
