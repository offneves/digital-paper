import { CheckIcon, CircleIcon } from "lucide-react";

import { getPasswordChecks } from "@/lib/password";
import { cn } from "@/lib/utils";

type PasswordRequirementsProps = {
    password: string;
};

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
    const checks = getPasswordChecks(password);
    const hasStarted = password.length > 0;

    return (
        <ul className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
            {checks.map((check) => {
                const ok = check.met;
                return (
                    <li
                        key={check.id}
                        className={cn(
                            "flex items-center gap-2 text-xs transition-colors",
                            ok
                                ? "text-foreground"
                                : hasStarted
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/80",
                        )}
                    >
                        {ok ? (
                            <CheckIcon className="size-3.5 shrink-0 text-foreground" />
                        ) : (
                            <CircleIcon className="size-3.5 shrink-0 opacity-50" />
                        )}
                        <span className={cn(ok && "font-medium")}>
                            {check.label}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
