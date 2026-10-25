import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="relative flex min-h-svh overflow-hidden bg-background">
            <main className="relative flex w-full items-center justify-center px-6 py-12 sm:px-8 lg:w-[42%] lg:shrink-0 lg:px-10 xl:w-[40%] xl:px-12">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-border lg:block"
                />

                <div className="animate-login-fade-up w-full max-w-[22rem]">
                    <div className="mb-10 flex flex-col gap-4 lg:hidden">
                        <p className="font-heading text-5xl leading-[0.9] font-bold tracking-[-0.04em] text-foreground">
                            Digital
                            <br />
                            Paper
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Documentos com clareza. Processos com ritmo.
                        </p>
                    </div>

                    <Outlet />

                    <p className="mt-8 text-center text-[10px] tracking-wide text-muted-foreground uppercase">
                        Acesso restrito a usuários autorizados
                    </p>
                </div>
            </main>

            <aside className="relative hidden min-h-svh flex-1 overflow-hidden lg:block">
                <div className="login-wash absolute inset-0" />
                <div className="login-paper-grain absolute inset-0" />

                <div className="animate-login-panel-in relative z-10 flex h-full p-6 xl:p-8">
                    <div className="login-ruled relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-sm border border-border/70 bg-background/60 shadow-[0_28px_90px_-48px_oklch(0_0_0_/_0.55)] backdrop-blur-sm dark:bg-background/45">
                        <div className="login-margin-line absolute top-0 bottom-0 left-12 w-px xl:left-14" />

                        <div
                            aria-hidden
                            className="animate-login-float pointer-events-none absolute right-[-4%] bottom-[-6%] font-heading text-[14rem] leading-none font-bold tracking-tighter text-foreground/[0.045] select-none xl:text-[16rem]"
                        >
                            DP
                        </div>

                        <header className="relative z-10 flex items-center justify-between pt-8 pr-12 pb-4 pl-16 xl:pt-10 xl:pr-14 xl:pl-20">
                            <div className="flex items-center gap-3">
                                <span className="size-2 rounded-full bg-foreground" />
                                <span className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
                                    Workspace
                                </span>
                            </div>
                            <span className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                Digital Paper
                            </span>
                        </header>

                        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 py-8 pr-12 pl-16 xl:gap-10 xl:pr-14 xl:pl-20">
                            <div>
                                <p className="font-heading text-[clamp(4rem,8vw,6.5rem)] leading-[0.86] font-bold tracking-[-0.045em] text-foreground">
                                    Digital
                                    <br />
                                    Paper
                                </p>
                                <div className="animate-login-mark mt-7 h-px w-28 bg-foreground" />
                            </div>

                            <div className="grid max-w-lg gap-3">
                                <p className="text-lg leading-snug text-foreground/90 xl:text-xl">
                                    Documentos com clareza.
                                    <br />
                                    Processos com ritmo.
                                </p>
                                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    Cadastre-se como usuário público, empresa ou
                                    servidor público e entre no fluxo digital do
                                    seu time.
                                </p>
                            </div>
                        </div>

                        <footer className="relative z-10 mt-auto flex items-end justify-between gap-6 border-t border-border/50 py-6 pr-12 pl-16 xl:pr-14 xl:pl-20">
                            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                Papel digital para times que preferem fluxo
                                limpo.
                            </p>
                            <p className="shrink-0 font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
                                dp —
                            </p>
                        </footer>
                    </div>
                </div>
            </aside>
        </div>
    );
}
