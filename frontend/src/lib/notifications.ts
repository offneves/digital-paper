import {
    BellIcon,
    FileTextIcon,
    InfoIcon,
    MegaphoneIcon,
    UserPlusIcon,
    type LucideIcon,
} from "lucide-react";

import type { AppNotification, NotificationType } from "@/lib/api";

function hasTimestamp(value: string | null | undefined): boolean {
    if (value == null || value === "") return false;
    return true;
}

/** Normaliza resposta da API — `read`/`deleted` derivados também de timestamps. */
export function normalizeNotification(
    notification: AppNotification,
): AppNotification {
    const readAt = notification.readAt ?? null;
    const deletedAt = notification.deletedAt ?? null;
    return {
        ...notification,
        readAt,
        deletedAt,
        read: Boolean(notification.read) || hasTimestamp(readAt),
        deleted: Boolean(notification.deleted) || hasTimestamp(deletedAt),
    };
}

export function isNotificationRead(notification: AppNotification): boolean {
    return normalizeNotification(notification).read;
}

export const NOTIFICATION_META: Record<
    NotificationType,
    { label: string; icon: LucideIcon }
> = {
    USER_REGISTERED: { label: "Cadastro", icon: UserPlusIcon },
    PROCESS_UPDATED: { label: "Processo", icon: FileTextIcon },
    SYSTEM_UPDATE: { label: "Sistema", icon: InfoIcon },
    CITY_ANNOUNCEMENT: { label: "Aviso", icon: MegaphoneIcon },
    INTERNAL_ANNOUNCEMENT: { label: "Aviso", icon: MegaphoneIcon },
    ENTERPRISE_ANNOUNCEMENT: { label: "Aviso", icon: MegaphoneIcon },
    GENERIC: { label: "Geral", icon: BellIcon },
};

export function notificationMeta(type: NotificationType) {
    return NOTIFICATION_META[type] ?? NOTIFICATION_META.GENERIC;
}

function toDate(value: string): Date | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

export function formatNotificationTime(value: string): string {
    const date = toDate(value);
    if (!date) return "—";

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `há ${diffMin} min`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `há ${diffHour} h`;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfYesterday && date < startOfToday) {
        return `ontem, ${date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    }

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export type NotificationDayGroup = {
    key: string;
    label: string;
    items: AppNotification[];
};

export function groupNotificationsByDay(
    items: AppNotification[],
): NotificationDayGroup[] {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const buckets = new Map<string, NotificationDayGroup>();

    for (const item of items) {
        const date = toDate(item.createdAt);
        let key: string;
        let label: string;

        if (!date) {
            key = "unknown";
            label = "Anteriores";
        } else if (date >= startOfToday) {
            key = "today";
            label = "Hoje";
        } else if (date >= startOfYesterday) {
            key = "yesterday";
            label = "Ontem";
        } else if (date >= startOfWeek) {
            key = "week";
            label = "Esta semana";
        } else {
            key = "older";
            label = "Anteriores";
        }

        const group = buckets.get(key) ?? { key, label, items: [] };
        group.items.push(item);
        buckets.set(key, group);
    }

    const order = ["today", "yesterday", "week", "older", "unknown"];
    return order
        .map((key) => buckets.get(key))
        .filter((group): group is NotificationDayGroup => Boolean(group));
}
