import { Link } from "react-router-dom";

import { Separator } from "@/components/ui/separator";
import { AdminHeader } from "@/layouts/admin-layout";

export default function HomePage() {
    return (
        <>
            <AdminHeader title="Início" />

            <main className="flex flex-1 flex-col px-5 py-8 md:px-8">
                <div className="flex flex-col gap-3">
                    <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        Workspace
                    </p>
                    <h2 className="font-heading text-3xl font-bold tracking-[-0.04em] text-foreground md:text-4xl">
                        Bem-vindo!
                    </h2>
                    <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                        Área administrativa do Digital Paper. Gerencie perfis e,
                        em breve, processos, usuários e configurações.
                    </p>
                </div>

                <Separator className="my-8" />

                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        {
                            label: "Perfis",
                            hint: "Disponível",
                            to: "/admin/perfis",
                        },
                        { label: "Processos", hint: "Em breve", to: null },
                        { label: "Usuários", hint: "Em breve", to: null },
                    ].map((item) =>
                        item.to ? (
                            <Link
                                key={item.label}
                                to={item.to}
                                className="rounded-lg border border-border/70 bg-muted/20 px-4 py-4 transition-colors hover:bg-muted/40"
                            >
                                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                                    {item.hint}
                                </p>
                                <p className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em]">
                                    {item.label}
                                </p>
                            </Link>
                        ) : (
                            <div
                                key={item.label}
                                className="rounded-lg border border-border/70 bg-muted/20 px-4 py-4 opacity-70"
                            >
                                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                                    {item.hint}
                                </p>
                                <p className="mt-2 font-heading text-xl font-semibold tracking-[-0.03em]">
                                    {item.label}
                                </p>
                            </div>
                        ),
                    )}
                </div>
            </main>
        </>
    );
}
