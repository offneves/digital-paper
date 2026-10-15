import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AdminLayout from "@/layouts/admin-layout";
import AdminProfilesPage from "@/pages/admin/profiles";
import AdminUsersPage from "@/pages/admin/users";
import ContaPage from "@/pages/conta";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/conta" element={<ContaPage />} />
                    <Route element={<AdminLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route
                            path="/admin/perfis"
                            element={<AdminProfilesPage />}
                        />
                        <Route
                            path="/admin/usuarios"
                            element={<AdminUsersPage />}
                        />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster closeButton position="bottom-right" />
        </ThemeProvider>
    );
}
