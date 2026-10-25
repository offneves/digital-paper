import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

type AuthShellProps = {
    eyebrow?: string;
    title: string;
    description: string;
    children: ReactNode;
};

export function AuthShell({
    eyebrow = "Acesso",
    title,
    description,
    children,
}: AuthShellProps) {
    return (
        <>
            <div className="mb-7 flex items-start justify-between gap-4">
                <div
                    key={title}
                    className="flex flex-col gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-both"
                >
                    <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                        {eyebrow}
                    </p>
                    <h1 className="font-heading text-[2.35rem] leading-none font-bold tracking-[-0.04em] text-foreground">
                        {title}
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                </div>
                <ThemeToggle />
            </div>

            <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-both">
                {children}
            </div>
        </>
    );
}
