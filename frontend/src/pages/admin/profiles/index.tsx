import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    MoreHorizontalIcon,
    PencilIcon,
    PlusIcon,
    SearchIcon,
    Trash2Icon,
    UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AdminHeader } from "@/layouts/admin-layout";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ApiError,
    createProfile,
    deleteProfile,
    listProfiles,
    updateProfile,
    type Profile,
} from "@/lib/api";
import { Label } from "@/components/ui/label";

type DialogMode = "create" | "edit";

export default function AdminProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<DialogMode>("create");
    const [editing, setEditing] = useState<Profile | null>(null);
    const [name, setName] = useState("");
    const [nameInvalid, setNameInvalid] = useState(false);
    const [deleting, setDeleting] = useState<Profile | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    async function loadProfiles() {
        setLoading(true);
        try {
            const data = await listProfiles();
            setProfiles(
                [...data].sort((a, b) =>
                    a.profileName.localeCompare(b.profileName, "pt-BR"),
                ),
            );
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível carregar os perfis.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadProfiles();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return profiles;
        return profiles.filter((profile) =>
            profile.profileName.toLowerCase().includes(q),
        );
    }, [profiles, query]);

    function openCreate() {
        setDialogMode("create");
        setEditing(null);
        setName("");
        setNameInvalid(false);
        setDialogOpen(true);
    }

    function openEdit(profile: Profile) {
        setDialogMode("edit");
        setEditing(profile);
        setName(profile.profileName);
        setNameInvalid(false);
        setDialogOpen(true);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setNameInvalid(true);
            toast.error("Informe o nome do perfil.");
            return;
        }

        setNameInvalid(false);
        setSaving(true);

        try {
            if (dialogMode === "create") {
                const created = await createProfile({ profileName: trimmed });
                setProfiles((current) =>
                    [...current, created].sort((a, b) =>
                        a.profileName.localeCompare(b.profileName, "pt-BR"),
                    ),
                );
                toast.success("Perfil criado.");
            } else if (editing) {
                const updated = await updateProfile(editing.id, {
                    profileName: trimmed,
                    active: editing.active,
                });
                setProfiles((current) =>
                    current
                        .map((item) => (item.id === updated.id ? updated : item))
                        .sort((a, b) =>
                            a.profileName.localeCompare(b.profileName, "pt-BR"),
                        ),
                );
                toast.success("Perfil renomeado.");
            }
            setDialogOpen(false);
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível salvar o perfil.");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleActive(profile: Profile, nextActive: boolean) {
        setTogglingId(profile.id);
        try {
            const updated = await updateProfile(profile.id, {
                profileName: profile.profileName,
                active: nextActive,
            });
            setProfiles((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
            toast.success(
                nextActive ? "Perfil ativado." : "Perfil desativado.",
            );
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível alterar o status.");
            }
        } finally {
            setTogglingId(null);
        }
    }

    async function handleDelete() {
        if (!deleting) return;
        setSaving(true);
        try {
            await deleteProfile(deleting.id);
            setProfiles((current) =>
                current.filter((item) => item.id !== deleting.id),
            );
            toast.success("Perfil apagado.");
            setDeleting(null);
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível apagar o perfil.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <AdminHeader
                title="Perfis"
                eyebrow="Administração"
                description="Crie, edite e ative os perfis usados no vínculo com usuários."
            />

            <div className="flex flex-1 flex-col gap-6 px-5 py-8 md:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar perfil…"
                            className="pl-8"
                            aria-label="Buscar perfil"
                        />
                    </div>
                    <Button type="button" onClick={openCreate}>
                        <PlusIcon data-icon="inline-start" />
                        Novo perfil
                    </Button>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                {loading ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Empty className="border border-dashed border-border/80 py-14">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <UsersIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                                {query
                                    ? "Nenhum perfil encontrado"
                                    : "Nenhum perfil cadastrado"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {query
                                    ? "Ajuste a busca ou limpe o filtro para ver todos os perfis."
                                    : "Comece criando o primeiro perfil do sistema."}
                            </EmptyDescription>
                        </EmptyHeader>
                        {!query ? (
                            <EmptyContent>
                                <Button type="button" onClick={openCreate}>
                                    <PlusIcon data-icon="inline-start" />
                                    Criar perfil
                                </Button>
                            </EmptyContent>
                        ) : null}
                    </Empty>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/70">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="w-36">Status</TableHead>
                                    <TableHead className="w-40">Ativo</TableHead>
                                    <TableHead className="w-14">
                                        <span className="sr-only">Ações</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell className="font-medium">
                                            {profile.profileName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    profile.active
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {profile.active
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={profile.active}
                                                    disabled={
                                                        togglingId === profile.id
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        void handleToggleActive(
                                                            profile,
                                                            checked,
                                                        )
                                                    }
                                                    aria-label={`Alternar ${profile.profileName}`}
                                                />
                                                <Label className="text-xs text-muted-foreground">
                                                    {profile.active
                                                        ? "Ligado"
                                                        : "Desligado"}
                                                </Label>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="cursor-pointer"
                                                        aria-label={`Ações de ${profile.profileName}`}
                                                    >
                                                        <MoreHorizontalIcon />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                openEdit(profile)
                                                            }
                                                        >
                                                            <PencilIcon />
                                                            Renomear
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setDeleting(profile)
                                                        }
                                                    >
                                                        <Trash2Icon />
                                                        Apagar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                    <p className="mt-auto self-end text-sm text-muted-foreground">
                        {loading
                            ? "Carregando…"
                            : filtered.length === 1
                              ? "1 perfil"
                              : `${filtered.length} perfis`}
                    </p>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                {dialogMode === "create"
                                    ? "Novo perfil"
                                    : "Renomear perfil"}
                            </DialogTitle>
                            <DialogDescription className="text-pretty">
                                {dialogMode === "create"
                                    ? "Novos perfis nascem ativos e podem ser vinculados a usuários depois."
                                    : "Altere apenas o nome. O status continua sendo controlado na lista."}
                            </DialogDescription>
                        </DialogHeader>

                        <FieldGroup>
                            <Field data-invalid={nameInvalid || undefined}>
                                <FieldLabel htmlFor="profile-name">
                                    Nome do perfil
                                </FieldLabel>
                                <Input
                                    id="profile-name"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="Ex.: Analista, Coordenador…"
                                    aria-invalid={nameInvalid || undefined}
                                    autoFocus
                                />
                            </Field>
                        </FieldGroup>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? <Spinner data-icon="inline-start" /> : null}
                                {dialogMode === "create" ? "Criar" : "Renomear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => {
                    if (!open) setDeleting(null);
                }}
            >
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apagar perfil?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-pretty">
                            <span className="block">
                                O perfil{" "}
                                <span className="font-medium text-foreground">
                                    {deleting?.profileName}
                                </span>{" "}
                                será apagado permanentemente e não poderá ser
                                recuperado.
                            </span>
                            <span className="mt-2 block">
                                Se estiver vinculado a usuários, a exclusão será
                                bloqueada.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={saving}
                            onClick={(event) => {
                                event.preventDefault();
                                void handleDelete();
                            }}
                        >
                            {saving ? <Spinner data-icon="inline-start" /> : null}
                            Apagar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
