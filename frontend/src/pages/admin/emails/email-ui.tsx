import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EmailStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

import { EMAIL_STATUS_LABELS } from "./email-utils";

const STATUS_VARIANT: Record<
    EmailStatus,
    "success" | "warning" | "destructive" | "secondary" | "outline"
> = {
    PENDING: "secondary",
    SENT: "success",
    RETRYING: "warning",
    FAILED: "destructive",
    SKIPPED: "outline",
};

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
    return (
        <Badge variant={STATUS_VARIANT[status]}>
            {EMAIL_STATUS_LABELS[status]}
        </Badge>
    );
}

type EmailPreviewFrameProps = {
    html: string | null;
    subject?: string | null;
    loading?: boolean;
    className?: string;
    frameClassName?: string;
};

export function EmailPreviewFrame({
    html,
    subject,
    loading = false,
    className,
    frameClassName,
}: EmailPreviewFrameProps) {
    const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

    return (
        <div
            className={cn(
                "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/30",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-background px-4 py-2.5">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        Assunto
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                        {subject || "—"}
                    </p>
                </div>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={device}
                    onValueChange={(value) => {
                        if (value) setDevice(value as "desktop" | "mobile");
                    }}
                    aria-label="Largura da prévia"
                >
                    <ToggleGroupItem value="desktop" aria-label="Desktop">
                        <MonitorIcon />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="mobile" aria-label="Celular">
                        <SmartphoneIcon />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="relative flex flex-1 justify-center overflow-hidden p-3">
                {html ? (
                    <iframe
                        title="Prévia do e-mail"
                        sandbox=""
                        srcDoc={html}
                        className={cn(
                            "h-[880px] rounded-lg border border-border/70 bg-white transition-[width] duration-300",
                            device === "mobile" ? "w-[375px]" : "w-full",
                            loading && "opacity-60",
                            frameClassName,
                        )}
                    />
                ) : (
                    <div className="flex w-full flex-col gap-3 p-6">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}
            </div>
        </div>
    );
}
