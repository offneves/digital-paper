import { Navigate, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { clearToken, isAuthenticated } from "@/lib/auth";

export default function HomePage() {
    const navigate = useNavigate();

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
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
                <h1 className="font-heading text-4xl font-bold tracking-[-0.03em]">
                    Você está autenticado.
                </h1>
                <p className="max-w-md text-muted-foreground">
                    Placeholder temporário. As próximas telas entram aqui.
                </p>
            </main>
        </div>
    );
}
