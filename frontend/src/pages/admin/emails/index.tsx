import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminHeader } from "@/layouts/admin-layout";
import { ApiError, listEmailTemplates, type EmailTemplate } from "@/lib/api";

import { HistoryTab } from "./history-tab";
import { TemplatesTab } from "./templates-tab";

type Tab = "templates" | "historico";

export default function AdminEmailsPage() {
    const [params, setParams] = useSearchParams();
    const tab: Tab = params.get("aba") === "historico" ? "historico" : "templates";
    const templateFilter = params.get("template") ?? "";

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        listEmailTemplates()
            .then((data) => {
                if (!cancelled) setTemplates(data);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                toast.error(
                    error instanceof ApiError
                        ? error.message
                        : "Não foi possível carregar os templates.",
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    function updateParams(next: { aba?: Tab; template?: string }) {
        setParams(
            (current) => {
                const result = new URLSearchParams(current);
                if (next.aba) {
                    if (next.aba === "templates") result.delete("aba");
                    else result.set("aba", next.aba);
                }
                if (next.template !== undefined) {
                    if (next.template) result.set("template", next.template);
                    else result.delete("template");
                }
                return result;
            },
            { replace: true },
        );
    }

    return (
        <>
            <AdminHeader
                title="E-mails"
                eyebrow="Administração"
                description="Gerencie os templates enviados pelo sistema e acompanhe cada envio."
            />

            <div className="flex flex-1 flex-col px-5 py-8 md:px-8">
                <Tabs
                    value={tab}
                    onValueChange={(value) => updateParams({ aba: value as Tab })}
                    className="flex flex-1 flex-col gap-6"
                >
                    <TabsList>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                        <TabsTrigger value="historico">Histórico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates" className="flex flex-1 flex-col">
                        <TemplatesTab
                            templates={templates}
                            loading={loading}
                            onTemplateChange={(updated) =>
                                setTemplates((current) =>
                                    current.map((item) =>
                                        item.id === updated.id ? updated : item,
                                    ),
                                )
                            }
                            onTemplateRemove={(id) =>
                                setTemplates((current) =>
                                    current.filter((item) => item.id !== id),
                                )
                            }
                            onShowHistory={(templateKey) =>
                                updateParams({ aba: "historico", template: templateKey })
                            }
                        />
                    </TabsContent>

                    <TabsContent value="historico" className="flex flex-1 flex-col">
                        <HistoryTab
                            templates={templates}
                            templateFilter={templateFilter}
                            onTemplateFilterChange={(templateKey) =>
                                updateParams({ template: templateKey })
                            }
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
