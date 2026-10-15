import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import {
    BanIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PlusIcon,
    SearchIcon,
    ShieldAlertIcon,
    UserCheckIcon,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
    listUsers,
    updateUser,
    type AdminUser,
} from "@/lib/api";
import { isValidEmail } from "@/lib/email";
import {
    formatCnpj,
    formatCpf,
    isCnpjRole,
    onlyDigits,
} from "@/lib/masks";
import {
    EDITABLE_USER_ROLES,
    ROLE_LABELS,
    roleLabel,
    type UserRole,
} from "@/lib/roles";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [5, 10, 25, 50] as const;

type RoleFilter = UserRole | "ALL";

function formatDateTime(value: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDocumentDisplay(value: string, role: UserRole): string {
    const digits = onlyDigits(value);
    if (isCnpjRole(role) || digits.length === 14) {
        return formatCnpj(digits);
    }
    if (digits.length === 11) {
        return formatCpf(digits);
    }
    return value || "—";
}

function usesCnpjForRole(role: UserRole): boolean {
    return isCnpjRole(role);
}

function roleChangeNeedsConfirm(
    previous: UserRole,
    next: UserRole,
): boolean {
    if (previous === next) return false;
    const defaults = new Set<UserRole>(["COMMON_USER", "ENTERPRISE_USER"]);
    return defaults.has(previous) || defaults.has(next);
}

function roleChangeMessage(previous: UserRole, next: UserRole): string {
    if (
        (previous === "COMMON_USER" && next === "ENTERPRISE_USER") ||
        (previous === "ENTERPRISE_USER" && next === "COMMON_USER")
    ) {
        return `O perfil padrão será trocado de “${previous === "COMMON_USER" ? "Público" : "Empresa"}” para “${next === "COMMON_USER" ? "Público" : "Empresa"}”.`;
    }
    if (
        (previous === "COMMON_USER" || previous === "ENTERPRISE_USER") &&
        next === "PUBLIC_SERVANT"
    ) {
        return `O perfil padrão “${previous === "COMMON_USER" ? "Público" : "Empresa"}” será removido. Servidores públicos ficam sem perfil até a aprovação.`;
    }
    if (
        previous === "PUBLIC_SERVANT" &&
        (next === "COMMON_USER" || next === "ENTERPRISE_USER")
    ) {
        return `O perfil padrão “${next === "COMMON_USER" ? "Público" : "Empresa"}” será vinculado automaticamente.`;
    }
    return "A alteração de tipo pode ajustar os perfis padrão deste usuário.";
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
    const [page, setPage] = useState(0);
    const [size, setSize] = useState<(typeof PAGE_SIZES)[number]>(50);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [document, setDocument] = useState("");
    const [role, setRole] = useState<UserRole>("COMMON_USER");
    const [active, setActive] = useState(true);
    const [nameInvalid, setNameInvalid] = useState(false);
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [documentInvalid, setDocumentInvalid] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
            setPage(0);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [query]);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await listUsers({
                q: debouncedQuery,
                role: roleFilter === "ALL" ? "" : roleFilter,
                page,
                size,
            });
            setUsers(data.content);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível carregar os usuários.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when list criteria change
    }, [debouncedQuery, roleFilter, page, size]);

    const rangeLabel = useMemo(() => {
        if (totalElements === 0) return "Nenhum usuário";
        const from = page * size + 1;
        const to = Math.min((page + 1) * size, totalElements);
        return `${from}–${to} de ${totalElements}`;
    }, [page, size, totalElements]);

    const usesCnpj = usesCnpjForRole(role);
    const documentLabel = usesCnpj ? "CNPJ" : "CPF";
    const expectedLength = usesCnpj ? 14 : role === "ADMIN" ? null : 11;
    const isAdminUser = editing?.role === "ADMIN";

    function openEdit(user: AdminUser) {
        setEditing(user);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setActive(user.active);
        setDocument(formatDocumentDisplay(user.cpfCnpj, user.role));
        setNameInvalid(false);
        setEmailInvalid(false);
        setDocumentInvalid(false);
        setSheetOpen(true);
    }

    function handleRoleChange(next: string) {
        const nextRole = next as UserRole;
        const wasCnpj = usesCnpjForRole(role);
        const willBeCnpj = usesCnpjForRole(nextRole);
        setRole(nextRole);
        if (wasCnpj !== willBeCnpj) {
            setDocument("");
            setDocumentInvalid(false);
        }
    }

    function handleDocumentChange(raw: string) {
        if (usesCnpj || (role === "ADMIN" && onlyDigits(raw).length > 11)) {
            setDocument(formatCnpj(raw));
            return;
        }
        if (role === "ADMIN") {
            const digits = onlyDigits(raw, 14);
            if (digits.length > 11) {
                setDocument(formatCnpj(digits));
            } else {
                setDocument(formatCpf(digits));
            }
            return;
        }
        setDocument(formatCpf(raw));
    }

    function validateForm(): boolean {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const digits = onlyDigits(document);
        let ok = true;

        if (!trimmedName) {
            setNameInvalid(true);
            ok = false;
        } else {
            setNameInvalid(false);
        }

        if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
            setEmailInvalid(true);
            ok = false;
        } else {
            setEmailInvalid(false);
        }

        const docOk =
            role === "ADMIN"
                ? digits.length === 11 || digits.length === 14
                : digits.length === (usesCnpj ? 14 : 11);

        if (!docOk) {
            setDocumentInvalid(true);
            ok = false;
        } else {
            setDocumentInvalid(false);
        }

        if (!ok) {
            toast.error("Verifique os dados informados.");
        }

        return ok;
    }

    async function persistUpdate() {
        if (!editing) return;
        setSaving(true);
        try {
            const updated = await updateUser(editing.id, {
                name: name.trim(),
                email: email.trim(),
                cpfCnpj: onlyDigits(document),
                role,
                active,
            });
            setUsers((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
            toast.success("Usuário atualizado.");
            setSheetOpen(false);
            setConfirmOpen(false);
            void loadUsers();
        } catch (error) {
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível atualizar o usuário.");
            }
        } finally {
            setSaving(false);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editing || !validateForm()) return;

        if (roleChangeNeedsConfirm(editing.role, role)) {
            setConfirmOpen(true);
            return;
        }

        void persistUpdate();
    }

    async function handleToggleActive(user: AdminUser, nextActive: boolean) {
        setTogglingId(user.id);
        try {
            const updated = await updateUser(user.id, {
                name: user.name,
                email: user.email,
                cpfCnpj: onlyDigits(user.cpfCnpj),
                role: user.role,
                active: nextActive,
            });
            setUsers((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
            toast.success(
                nextActive ? "Usuário desbloqueado." : "Usuário bloqueado.",
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

    return (
        <>
            <AdminHeader
                title="Usuários"
                eyebrow="Administração"
                description="Consulte, edite e bloqueie contas. A atribuição detalhada de perfis fica em um fluxo separado."
            />

            <div className="flex flex-1 flex-col gap-6 px-5 py-8 md:px-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full max-w-sm">
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar por nome, login ou e-mail…"
                                className="pl-8"
                                aria-label="Buscar usuário"
                            />
                        </div>
                        <Select
                            value={roleFilter}
                            onValueChange={(value) => {
                                setRoleFilter(value as RoleFilter);
                                setPage(0);
                            }}
                        >
                            <SelectTrigger
                                className="w-full sm:w-48"
                                aria-label="Filtrar por tipo"
                            >
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos os tipos</SelectItem>
                                {(
                                    Object.keys(ROLE_LABELS) as UserRole[]
                                ).map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {ROLE_LABELS[value]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col items-stretch gap-1 sm:items-end">
                        <Button type="button" disabled title="Disponível após o envio de e-mail">
                            <PlusIcon data-icon="inline-start" />
                            Novo usuário
                        </Button>
                        <p className="text-[11px] text-muted-foreground">
                            Criação por e-mail em breve
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                    {loading ? (
                        <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-2/3" />
                        </div>
                    ) : users.length === 0 ? (
                        <Empty className="border border-dashed border-border/80 py-14">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <UsersIcon />
                                </EmptyMedia>
                                <EmptyTitle>
                                    {debouncedQuery || roleFilter !== "ALL"
                                        ? "Nenhum usuário encontrado"
                                        : "Nenhum usuário cadastrado"}
                                </EmptyTitle>
                                <EmptyDescription>
                                    {debouncedQuery || roleFilter !== "ALL"
                                        ? "Ajuste a busca ou o filtro de tipo para ver outros resultados."
                                        : "Os cadastros feitos pelo login aparecerão aqui."}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border/70">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            Login
                                        </TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="w-32">Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">
                                            Perfis
                                        </TableHead>
                                        <TableHead className="hidden xl:table-cell">
                                            Último acesso
                                        </TableHead>
                                        <TableHead className="w-14">
                                            <span className="sr-only">Ações</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => {
                                        const pendingApproval =
                                            user.role === "PUBLIC_SERVANT" &&
                                            user.profiles.length === 0;

                                        return (
                                            <TableRow
                                                key={user.id}
                                                className={cn(
                                                    !user.active && "opacity-70",
                                                )}
                                            >
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground md:hidden">
                                                            {user.login}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden font-mono text-xs md:table-cell">
                                                    {user.login}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {roleLabel(user.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            user.active
                                                                ? "success"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {user.active
                                                            ? "Ativo"
                                                            : "Bloqueado"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {pendingApproval ? (
                                                            <Badge variant="outline">
                                                                <ShieldAlertIcon data-icon="inline-start" />
                                                                Pendente aprovação
                                                            </Badge>
                                                        ) : user.profiles.length ===
                                                          0 ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                —
                                                            </span>
                                                        ) : (
                                                            user.profiles.map(
                                                                (profile) => (
                                                                    <Badge
                                                                        key={
                                                                            profile.id
                                                                        }
                                                                        variant="secondary"
                                                                    >
                                                                        {
                                                                            profile.profileName
                                                                        }
                                                                    </Badge>
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                                                    {formatDateTime(
                                                        user.lastLoginAt,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="cursor-pointer"
                                                                aria-label={`Ações de ${user.name}`}
                                                            >
                                                                <MoreHorizontalIcon />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuGroup>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            user,
                                                                        )
                                                                    }
                                                                >
                                                                    <PencilIcon />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuGroup>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    togglingId ===
                                                                    user.id
                                                                }
                                                                variant={
                                                                    user.active
                                                                        ? "destructive"
                                                                        : undefined
                                                                }
                                                                onClick={() =>
                                                                    void handleToggleActive(
                                                                        user,
                                                                        !user.active,
                                                                    )
                                                                }
                                                            >
                                                                {user.active ? (
                                                                    <BanIcon />
                                                                ) : (
                                                                    <UserCheckIcon />
                                                                )}
                                                                {user.active
                                                                    ? "Bloquear"
                                                                    : "Desbloquear"}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            {loading ? "Carregando…" : rangeLabel}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="page-size"
                                    className="text-xs text-muted-foreground"
                                >
                                    Por página
                                </Label>
                                <Select
                                    value={String(size)}
                                    onValueChange={(value) => {
                                        setSize(
                                            Number(value) as (typeof PAGE_SIZES)[number],
                                        );
                                        setPage(0);
                                    }}
                                >
                                    <SelectTrigger
                                        id="page-size"
                                        size="sm"
                                        className="w-[4.5rem]"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZES.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={String(option)}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    disabled={loading || page <= 0}
                                    onClick={() => setPage((current) => current - 1)}
                                    aria-label="Página anterior"
                                >
                                    <ChevronLeftIcon />
                                </Button>
                                <span className="min-w-16 text-center text-xs text-muted-foreground">
                                    {totalPages === 0
                                        ? "0 / 0"
                                        : `${page + 1} / ${totalPages}`}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    disabled={
                                        loading ||
                                        totalPages === 0 ||
                                        page >= totalPages - 1
                                    }
                                    onClick={() => setPage((current) => current + 1)}
                                    aria-label="Próxima página"
                                >
                                    <ChevronRightIcon />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full gap-0 sm:max-w-md"
                >
                    <form
                        onSubmit={handleSubmit}
                        className="flex h-full flex-col"
                    >
                        <SheetHeader className="border-b border-border/70">
                            <SheetTitle>Editar usuário</SheetTitle>
                            <SheetDescription className="text-pretty">
                                Login e senha não podem ser alterados aqui. O
                                vínculo fino de perfis será feito em outro fluxo.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-4 py-5">
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="user-login">
                                        Login
                                    </FieldLabel>
                                    <Input
                                        id="user-login"
                                        value={editing?.login ?? ""}
                                        disabled
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <FieldDescription>
                                        Identificador de acesso — somente leitura.
                                    </FieldDescription>
                                </Field>

                                <Field data-invalid={nameInvalid || undefined}>
                                    <FieldLabel htmlFor="user-name">
                                        Nome
                                    </FieldLabel>
                                    <Input
                                        id="user-name"
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        aria-invalid={nameInvalid || undefined}
                                        autoFocus
                                    />
                                </Field>

                                <Field data-invalid={emailInvalid || undefined}>
                                    <FieldLabel htmlFor="user-email">
                                        E-mail
                                    </FieldLabel>
                                    <Input
                                        id="user-email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        aria-invalid={emailInvalid || undefined}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="user-role">
                                        Tipo de usuário
                                    </FieldLabel>
                                    {isAdminUser ? (
                                        <>
                                            <Input
                                                id="user-role"
                                                value={ROLE_LABELS.ADMIN}
                                                disabled
                                                readOnly
                                            />
                                            <FieldDescription>
                                                Administradores mantêm este tipo.
                                            </FieldDescription>
                                        </>
                                    ) : (
                                        <Select
                                            value={role}
                                            onValueChange={handleRoleChange}
                                        >
                                            <SelectTrigger
                                                id="user-role"
                                                className="w-full"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EDITABLE_USER_ROLES.map(
                                                    (value) => (
                                                        <SelectItem
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {ROLE_LABELS[value]}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </Field>

                                <Field
                                    data-invalid={documentInvalid || undefined}
                                >
                                    <FieldLabel htmlFor="user-document">
                                        {role === "ADMIN"
                                            ? "CPF / CNPJ"
                                            : documentLabel}
                                    </FieldLabel>
                                    <Input
                                        id="user-document"
                                        value={document}
                                        onChange={(event) =>
                                            handleDocumentChange(
                                                event.target.value,
                                            )
                                        }
                                        placeholder={
                                            usesCnpj
                                                ? "00.000.000/0000-00"
                                                : "000.000.000-00"
                                        }
                                        inputMode="numeric"
                                        aria-invalid={
                                            documentInvalid || undefined
                                        }
                                    />
                                    <FieldDescription>
                                        {expectedLength
                                            ? `Informe ${expectedLength} dígitos.`
                                            : "CPF (11) ou CNPJ (14) dígitos."}
                                    </FieldDescription>
                                </Field>

                                <Field>
                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-3">
                                        <div className="min-w-0">
                                            <Label
                                                htmlFor="user-active"
                                                className="text-sm font-medium"
                                            >
                                                Conta ativa
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Contas bloqueadas não conseguem
                                                entrar.
                                            </p>
                                        </div>
                                        <Switch
                                            id="user-active"
                                            checked={active}
                                            onCheckedChange={setActive}
                                            aria-label="Alternar conta ativa"
                                        />
                                    </div>
                                </Field>

                                {editing &&
                                editing.role === "PUBLIC_SERVANT" &&
                                editing.profiles.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                                        <p className="flex items-start gap-2">
                                            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" />
                                            <span>
                                                Pendente aprovação — nenhum perfil
                                                vinculado ainda.
                                            </span>
                                        </p>
                                    </div>
                                ) : null}

                                {editing && editing.profiles.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Perfis atuais
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {editing.profiles.map((profile) => (
                                                <Badge
                                                    key={profile.id}
                                                    variant="secondary"
                                                >
                                                    {profile.profileName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </FieldGroup>
                        </div>

                        <SheetFooter className="border-t border-border/70 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSheetOpen(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <Spinner data-icon="inline-start" />
                                ) : null}
                                Salvar
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirmar mudança de tipo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-pretty">
                            <span className="block">
                                Você está alterando de{" "}
                                <span className="font-medium text-foreground">
                                    {editing
                                        ? roleLabel(editing.role)
                                        : ""}
                                </span>{" "}
                                para{" "}
                                <span className="font-medium text-foreground">
                                    {roleLabel(role)}
                                </span>
                                .
                            </span>
                            <span className="mt-2 block">
                                {editing
                                    ? roleChangeMessage(editing.role, role)
                                    : null}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>
                            Voltar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={saving}
                            onClick={(event) => {
                                event.preventDefault();
                                void persistUpdate();
                            }}
                        >
                            {saving ? (
                                <Spinner data-icon="inline-start" />
                            ) : null}
                            Confirmar e salvar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
