import { Navigate, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { clearToken, getRole, getUserName, isAuthenticated } from "@/lib/auth";

export default function ContaPage() {
    const navigate = useNavigate();

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (getRole() === "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-svh flex-col bg-background">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
                <p className="font-heading text-xl font-bold tracking-[-0.03em]">
                    Digital Paper
                </p>
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
                        Sair
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                    Conta
                </p>
                <h1 className="font-heading text-4xl font-bold tracking-[-0.03em]">
                    Olá, {getUserName() ?? "usuário"}
                </h1>
                <p className="max-w-md text-muted-foreground">
                    Você está autenticado. A área deste perfil entra em breve.
                </p>
            </main>
        </div>
    );
}
