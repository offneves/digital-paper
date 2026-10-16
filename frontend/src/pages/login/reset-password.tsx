import { Link, Navigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getRole, isAuthenticated } from "@/lib/auth";
import { homePathForRole } from "@/lib/roles";

import { AuthShell } from "./auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get("token")?.trim() ?? "";

    if (isAuthenticated()) {
        return <Navigate to={homePathForRole(getRole())} replace />;
    }

    if (!token) {
        return (
            <AuthShell
                eyebrow="Recuperação"
                title="Link inválido"
                description="Este link de redefinição está incompleto ou expirado. Solicite um novo."
            >
                <Button asChild className="h-10 w-full">
                    <Link to="/recuperar-senha">Pedir novo link</Link>
                </Button>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Recuperação"
            title="Nova senha"
            description="Defina uma senha forte para voltar a acessar o Digital Paper."
        >
            <ResetPasswordForm token={token} />
        </AuthShell>
    );
}
