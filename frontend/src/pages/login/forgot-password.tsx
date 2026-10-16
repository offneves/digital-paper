import { Navigate } from "react-router-dom";

/** Mantém o deep link antigo e abre o modo recuperação na mesma shell do login. */
export default function ForgotPasswordPage() {
    return (
        <Navigate to="/login" replace state={{ mode: "forgot" as const }} />
    );
}
