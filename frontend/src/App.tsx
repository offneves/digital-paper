import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AdminLayout from "@/layouts/admin-layout";
import AdminEmailsPage from "@/pages/admin/emails";
import EmailTemplateEditorPage from "@/pages/admin/emails/template-editor";
import AdminProfilesPage from "@/pages/admin/profiles";
import AdminUsersPage from "@/pages/admin/users";
import ContaPage from "@/pages/conta";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import AuthLayout from "@/pages/login/auth-layout";
import ConfirmEmailPage from "@/pages/login/confirm-email";
import ForgotPasswordPage from "@/pages/login/forgot-password";
import ResetPasswordPage from "@/pages/login/reset-password";
import NotificationsPage from "@/pages/notifications";

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/recuperar-senha"
                            element={<ForgotPasswordPage />}
                        />
                        <Route
                            path="/redefinir-senha"
                            element={<ResetPasswordPage />}
                        />
                        <Route
                            path="/confirmar-email"
                            element={<ConfirmEmailPage />}
                        />
                    </Route>
                    <Route path="/conta" element={<ContaPage />} />
                    <Route element={<AdminLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route
                            path="/notificacoes"
                            element={<NotificationsPage />}
                        />
                        <Route
                            path="/admin/perfis"
                            element={<AdminProfilesPage />}
                        />
                        <Route
                            path="/admin/usuarios"
                            element={<AdminUsersPage />}
                        />
                        <Route
                            path="/admin/email"
                            element={<AdminEmailsPage />}
                        />
                        <Route
                            path="/admin/email/template/novo"
                            element={<EmailTemplateEditorPage />}
                        />
                        <Route
                            path="/admin/email/template/:id"
                            element={<EmailTemplateEditorPage />}
                        />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster closeButton position="bottom-right" />
        </ThemeProvider>
    );
}
