import {
    FileTextIcon,
    IdCardIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    SettingsIcon,
    UsersIcon,
} from "lucide-react";
import {
    Navigate,
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { clearToken, getRole, getUserName, isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Início", icon: LayoutDashboardIcon, to: "/" },
    { label: "Perfis", icon: IdCardIcon, to: "/admin/perfis" },
    { label: "Processos", icon: FileTextIcon, to: null },
    { label: "Usuários", icon: UsersIcon, to: "/admin/usuarios" },
    { label: "Configurações", icon: SettingsIcon, to: null },
] as const;

type AdminHeaderProps = {
    title: string;
    eyebrow?: string;
    description?: string;
    actions?: React.ReactNode;
};

export function AdminHeader({
    title,
    eyebrow = "Painel",
    description,
    actions,
}: AdminHeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4 md:px-8">
            <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                    {eyebrow}
                </p>
                <h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground md:text-3xl">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {actions}
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
    );
}

export default function AdminLayout() {
    const location = useLocation();
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
                        {NAV_ITEMS.map((item) => {
                            if (!item.to) {
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        disabled
                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground/50"
                                    >
                                        <item.icon className="size-4 shrink-0" />
                                        <span className="flex-1">{item.label}</span>
                                        <span className="text-[10px] tracking-[0.12em] uppercase">
                                            Em breve
                                        </span>
                                    </button>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    end={item.to === "/"}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                            isActive
                                                ? "bg-foreground text-background"
                                                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                                        )
                                    }
                                >
                                    <item.icon className="size-4 shrink-0" />
                                    {item.label}
                                </NavLink>
                            );
                        })}
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

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div
                    key={location.pathname}
                    className="flex flex-1 flex-col animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-both"
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
