import {
    FileTextIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    SettingsIcon,
    UsersIcon,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clearToken, getRole, getUserName, isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Início", icon: LayoutDashboardIcon, active: true },
    { label: "Processos", icon: FileTextIcon, active: false },
    { label: "Usuários", icon: UsersIcon, active: false },
    { label: "Configurações", icon: SettingsIcon, active: false },
] as const;

export default function HomePage() {
    const navigate = useNavigate();
    const authenticated = isAuthenticated();
    const role = getRole();
    const userName = getUserName();

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "ADMIN") {
        return <Navigate to="/conta" replace />;
    }

    return (
        <div className="flex min-h-svh bg-background">
            <aside className="relative hidden w-[17.5rem] shrink-0 overflow-hidden border-r border-border md:flex md:flex-col">
                <div className="login-wash absolute inset-0 opacity-80" />
                <div className="login-paper-grain absolute inset-0" />

                <div className="relative z-10 flex h-full flex-col px-5 py-6">
                    <div className="px-2">
                        <p className="font-heading text-2xl leading-[0.86] font-bold tracking-[-0.045em] text-foreground">
                            Digital
                            <br />
                            Paper
                        </p>
                        <div className="mt-4 h-px w-12 bg-foreground" />
                        <p className="mt-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                            Admin
                        </p>
                    </div>

                    <nav className="mt-10 flex flex-1 flex-col gap-1">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                    item.active
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                                )}
                            >
                                <item.icon className="size-4 shrink-0" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto rounded-lg border border-border/70 bg-background/50 px-3 py-3 backdrop-blur-sm">
                        <p className="truncate text-sm font-medium text-foreground">
                            {userName ?? "Admin"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Perfil administrador
                        </p>
                    </div>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-border px-5 py-4 md:px-8">
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                            Painel
                        </p>
                        <h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground md:text-3xl">
                            Início
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                clearToken();
                                navigate("/login", { replace: true });
                            }}
                        >
                            <LogOutIcon data-icon="inline-start" />
                            Sair
                        </Button>
                    </div>
                </header>

                <main className="flex flex-1 flex-col px-5 py-8 md:px-8">
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                            Workspace
                        </p>
                        <h2 className="font-heading text-3xl font-bold tracking-[-0.04em] text-foreground md:text-4xl">
                            Bem-vindo!
                        </h2>
                        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                            Área administrativa inicial. Em breve entram
                            processos, usuários e configurações — no mesmo ritmo
                            limpo da tela de acesso.
                        </p>
                    </div>

                    <Separator className="my-8" />

                    <div className="grid gap-3 sm:grid-cols-3">
                        {["Processos", "Usuários", "Auditoria"].map((label) => (
                            <div
                                key={label}
                                className="rounded-lg border border-border/70 bg-muted/20 px-4 py-4"
                            >
                                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                                    Em breve
                                </p>
                                <p className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em]">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
