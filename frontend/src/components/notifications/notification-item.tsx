import {
    CheckIcon,
    ExternalLinkIcon,
    MailIcon,
    MoreHorizontalIcon,
    RotateCcwIcon,
    Trash2Icon,
} from "lucide-react";

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
import type { AppNotification } from "@/lib/api";
import {
    formatNotificationTime,
    isNotificationRead,
    notificationMeta,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

type NotificationItemProps = {
    notification: AppNotification;
    onSelect: (notification: AppNotification) => void;
    onMarkRead?: (notification: AppNotification) => void;
    onMarkUnread?: (notification: AppNotification) => void;
    onDelete?: (notification: AppNotification) => void;
    onRestore?: (notification: AppNotification) => void;
    /** Badge + linha lateral — só na seção Todas */
    showStatusVisual?: boolean;
    compact?: boolean;
};

export function NotificationItem({
    notification,
    onSelect,
    onMarkRead,
    onMarkUnread,
    onDelete,
    onRestore,
    showStatusVisual = false,
    compact = false,
}: NotificationItemProps) {
    const meta = notificationMeta(notification.type);
    const Icon = meta.icon;
    const unread = !isNotificationRead(notification);
    const deleted = Boolean(notification.deleted);
    const hasActions = Boolean(
        onMarkRead || onMarkUnread || onDelete || onRestore,
    );

    return (
        <div
            className={cn(
                "group relative flex gap-3 bg-background px-3 transition-colors hover:bg-muted/40",
                compact ? "py-2.5" : "py-3.5",
                showStatusVisual &&
                    !deleted &&
                    (unread
                        ? "border-l-2 border-l-warning"
                        : "border-l-2 border-l-success"),
            )}
        >
            <button
                type="button"
                onClick={() => onSelect(notification)}
                className="flex min-w-0 flex-1 gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                            {meta.label}
                        </p>
                        {showStatusVisual && !deleted ? (
                            <Badge
                                variant={unread ? "warning" : "success"}
                                className="h-5 rounded-md px-1.5 text-[10px] font-medium"
                            >
                                {unread ? "Não lida" : "Lida"}
                            </Badge>
                        ) : null}
                    </div>

                    <p
                        className={cn(
                            "mt-1 truncate text-sm",
                            unread && !deleted
                                ? "font-medium text-foreground"
                                : "text-muted-foreground",
                        )}
                    >
                        {notification.title}
                    </p>

                    <p
                        className={cn(
                            "mt-1 text-sm text-muted-foreground",
                            compact ? "line-clamp-1" : "line-clamp-2",
                        )}
                    >
                        {notification.body}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground/80">
                        {formatNotificationTime(notification.createdAt)}
                    </p>
                </div>
            </button>

            {hasActions ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="mt-0.5 shrink-0 cursor-pointer"
                            aria-label="Ações da notificação"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <MoreHorizontalIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-52">
                        <DropdownMenuGroup>
                            {!deleted ? (
                                <DropdownMenuItem
                                    onSelect={() => onSelect(notification)}
                                >
                                    <ExternalLinkIcon />
                                    {notification.link ? "Abrir" : "Ver"}
                                </DropdownMenuItem>
                            ) : null}
                            {unread && !deleted && onMarkRead ? (
                                <DropdownMenuItem
                                    onSelect={() => onMarkRead(notification)}
                                >
                                    <CheckIcon />
                                    Marcar como lida
                                </DropdownMenuItem>
                            ) : null}
                            {!unread && !deleted && onMarkUnread ? (
                                <DropdownMenuItem
                                    onSelect={() => onMarkUnread(notification)}
                                >
                                    <MailIcon />
                                    Marcar como não lida
                                </DropdownMenuItem>
                            ) : null}
                            {deleted && onRestore ? (
                                <DropdownMenuItem
                                    onSelect={() => onRestore(notification)}
                                >
                                    <RotateCcwIcon />
                                    Restaurar
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuGroup>
                        {!deleted && onDelete ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => onDelete(notification)}
                                >
                                    <Trash2Icon />
                                    Excluir
                                </DropdownMenuItem>
                            </>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </div>
    );
}
