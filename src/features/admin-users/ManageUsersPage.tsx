import {
    keepPreviousData,
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useDebouncedValue } from "../../app/useDebouncedValue"
import type { SignedInRole } from "../../app/viewer"
import { COMMON_COPY } from "../../lib/commonCopy"
import { defineCopy } from "../../lib/copy"
import { FormAlert, TextField } from "../../ui/form/fields"
import { ContentCopyIcon } from "../../ui/icons/ContentCopyIcon"
import { refreshFirstPage, useRefreshWhenBack } from "../admin/adminLists"
import { RefreshButton } from "../admin/RefreshButton"
import { ActionDialog } from "../events/ActionDialog"
import { REQUEST_WORDS } from "../requests/requestWords"
import { useAssignRole } from "./roles"
import {
    ADMIN_USERS_KIND,
    adminUsersKey,
    adminUsersQuery,
    adminUserStatsQuery,
    type AdminUser,
} from "./users"
import "./ManageUsersPage.scss"

// Legacy ManageUsersPage (Hebrew only there, but the toast).
const COPY = defineCopy({
    he: {
        title: "ניהול משתמשים",
        search: "חיפוש משתמש לפי שם או כתובת מייל:",
        searchPlaceholder: "שם משתמש או כתובת מייל",
        searching: "מחפש…",
        users: "משתמשים",
        noUsers: "לא נמצאו משתמשים",
        loadMore: "טעינת משתמשים נוספים",
        loadFailed: "לא הצלחנו לטעון את המשתמשים",
        refreshFailed: "לא הצלחנו לרענן את המשתמשים",
        copyPhone: "העתקת מספר הטלפון",
        phoneCopied: "מספר הטלפון הועתק",
        setRole: "הגדרת תפקיד",
        roleFailed: "שינוי התפקיד נכשל",
        demoteTitle: "להסיר את הרשאות הניהול שלך?",
        demoteText:
            "הגישה שלך לדפי הניהול תיפסק מיד, ורק מנהל אחר יוכל להחזיר אותה.",
        demoteOk: "כן, להסיר",
        roles: {
            admin: "מנהל",
            org: "ארגון",
            creator: "יוצר",
            profile: "פרופיל",
            user: "משתמש",
        },
        stats: "חשבונות",
        total: "סהכ חשבונות",
        counts: {
            admin: "מנהלים",
            creator: "יוצרים",
            org: "ארגונים",
            profile: "פרופילים",
            user: "משתמשים",
        },
    },
    en: {
        title: "Manage Users",
        search: "Search for a user by name or email:",
        searchPlaceholder: "User name or email",
        searching: "Searching…",
        users: "Users",
        noUsers: "No users found",
        loadMore: "Load more users",
        loadFailed: "We couldn't load the users",
        refreshFailed: "We couldn't refresh the users",
        copyPhone: "Copy the phone number",
        phoneCopied: "Phone number copied to clipboard",
        setRole: "Set role",
        roleFailed: "Changing the role failed",
        demoteTitle: "Remove your own admin rights?",
        demoteText:
            "You will lose access to the admin pages at once, and only another admin can give it back.",
        demoteOk: "Yes, remove",
        roles: {
            admin: "Admin",
            org: "Organisation",
            creator: "Creator",
            profile: "Profile",
            user: "User",
        },
        stats: "Accounts",
        total: "Total accounts",
        counts: {
            admin: "Admins",
            creator: "Creators",
            org: "Organisations",
            profile: "Profiles",
            user: "Users",
        },
    },
    ru: {
        title: "Управление пользователями",
        search: "Поиск пользователя по имени или email:",
        searchPlaceholder: "Имя пользователя или email",
        searching: "Поиск…",
        users: "Пользователи",
        noUsers: "Пользователи не найдены",
        loadMore: "Загрузить ещё пользователей",
        loadFailed: "Не удалось загрузить пользователей",
        refreshFailed: "Не удалось обновить пользователей",
        copyPhone: "Скопировать номер телефона",
        phoneCopied: "Номер телефона скопирован",
        setRole: "Назначить роль",
        roleFailed: "Не удалось изменить роль",
        demoteTitle: "Снять с себя права администратора?",
        demoteText:
            "Вы сразу потеряете доступ к страницам администратора, и вернуть его сможет только другой администратор.",
        demoteOk: "Да, снять",
        roles: {
            admin: "Администратор",
            org: "Организация",
            creator: "Организатор",
            profile: "Профиль",
            user: "Пользователь",
        },
        stats: "Аккаунты",
        total: "Всего аккаунтов",
        counts: {
            admin: "Администраторы",
            creator: "Организаторы",
            org: "Организации",
            profile: "Профили",
            user: "Пользователи",
        },
    },
})

/** The role buttons, in legacy's order. */
const ROLE_BUTTONS: readonly SignedInRole[] = [
    "admin",
    "org",
    "creator",
    "profile",
    "user",
]

/** The counts, in legacy's order. */
const COUNTS: readonly SignedInRole[] = [
    "admin",
    "creator",
    "org",
    "profile",
    "user",
]

/** A search goes to the server once typing pauses this long. */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * `/manage-users` (admins): legacy's user search with each user's details
 * and role buttons, and the account counts. Users load when the page opens,
 * a page at a time, searched on the server; nothing of it at boot.
 */
export default function ManageUsersPage() {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const adminId = useUserId()
    const queryClient = useQueryClient()
    const [text, setText] = useState("")
    const search = useDebouncedValue(text, SEARCH_DEBOUNCE_MS).trim()
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const users = useInfiniteQuery({
        ...adminUsersQuery(services, adminId, search),
        enabled: !!adminId,
        // A new search shows the last results until its own arrive.
        placeholderData: keepPreviousData,
    })
    const stats = useQuery({
        ...adminUserStatsQuery(services, adminId),
        enabled: !!adminId,
    })
    // The lists last as long as the page: the next visit starts over.
    useEffect(
        () => () =>
            queryClient.removeQueries({
                queryKey: [ADMIN_USERS_KIND, adminId],
            }),
        [queryClient, adminId],
    )

    const usersKey = useMemo(
        () => adminUsersKey(adminId, search),
        [adminId, search],
    )
    const refreshUsers = useCallback(
        () => void refreshFirstPage(queryClient, usersKey),
        [queryClient, usersKey],
    )
    useRefreshWhenBack(usersKey, refreshUsers)
    // The refresh button: the users from their first page, and the counts.
    const { refetch: refetchStats } = stats
    const [refreshing, setRefreshing] = useState(false)
    function refresh() {
        setRefreshing(true)
        void Promise.all([
            refreshFirstPage(queryClient, usersKey),
            refetchStats(),
        ]).finally(() => setRefreshing(false))
    }

    const shown = useMemo(
        () => users.data?.pages.flatMap((page) => page.users),
        [users.data],
    )

    return (
        <main className="manage-users">
            <h1 className="visually-hidden">{copy.title}</h1>
            <section className="manage-users-card card">
                <div className="manage-users-toolbar">
                    <RefreshButton
                        refreshing={refreshing}
                        onRefresh={refresh}
                    />
                </div>
                <TextField
                    type="search"
                    label={copy.search}
                    placeholder={copy.searchPlaceholder}
                    autoComplete="off"
                    value={text}
                    onChange={setText}
                />
                {users.isPlaceholderData && (
                    <p className="manage-users-status" role="status">
                        {copy.searching}
                    </p>
                )}
                {users.isRefetchError && (
                    <FormAlert kind="error">{copy.refreshFailed}</FormAlert>
                )}
                {shown ? (
                    shown.length > 0 ? (
                        <ul
                            className={`manage-users-list ${users.isPlaceholderData ? "pending" : ""}`}
                            aria-busy={users.isPlaceholderData}
                            aria-label={copy.users}
                        >
                            {shown.map((user) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    adminId={adminId}
                                    expanded={expandedId === user.id}
                                    onToggle={() =>
                                        setExpandedId(
                                            expandedId === user.id
                                                ? null
                                                : user.id,
                                        )
                                    }
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="manage-users-status">{copy.noUsers}</p>
                    )
                ) : users.isError ? (
                    <div className="manage-users-status" role="alert">
                        <p>{copy.loadFailed}</p>
                        <button
                            type="button"
                            className="text-button"
                            onClick={() => void users.refetch()}
                        >
                            {common.retry}
                        </button>
                    </div>
                ) : (
                    <p className="manage-users-status" role="status">
                        {common.loading}
                    </p>
                )}
                {users.hasNextPage && (
                    <div className="manage-users-more">
                        {users.isFetchNextPageError && (
                            <p role="alert">{copy.loadFailed}</p>
                        )}
                        <button
                            type="button"
                            className="text-button"
                            disabled={users.isFetchingNextPage}
                            onClick={() => void users.fetchNextPage()}
                        >
                            {users.isFetchingNextPage
                                ? common.loading
                                : copy.loadMore}
                        </button>
                    </div>
                )}
            </section>
            <section
                className="manage-users-stats card"
                aria-label={copy.stats}
            >
                {stats.data ? (
                    <>
                        <p className="stats-label">
                            {copy.total}: {stats.data.total}
                        </p>
                        {COUNTS.map((role) => (
                            <p key={role} className="stats-label">
                                {copy.counts[role]}: {stats.data.byType[role]}
                            </p>
                        ))}
                    </>
                ) : stats.isError ? (
                    <p role="alert">{copy.loadFailed}</p>
                ) : (
                    <p role="status">{common.loading}</p>
                )}
            </section>
        </main>
    )
}

/**
 * A user (legacy's option: "name - email"); open, legacy's details (name,
 * email, phone to copy, role) and the role buttons.
 */
function UserRow({
    user,
    adminId,
    expanded,
    onToggle,
}: {
    user: AdminUser
    adminId: string
    expanded: boolean
    onToggle: () => void
}) {
    const detailsId = `user-${user.id}`
    return (
        <li className="manage-users-item">
            <button
                type="button"
                className={`manage-users-option ${expanded ? "active" : ""}`}
                aria-expanded={expanded}
                aria-controls={expanded ? detailsId : undefined}
                onClick={onToggle}
            >
                {user.name} - {user.email}
            </button>
            {expanded && (
                <UserDetails id={detailsId} user={user} adminId={adminId} />
            )}
        </li>
    )
}

function UserDetails({
    id,
    user,
    adminId,
}: {
    id: string
    user: AdminUser
    adminId: string
}) {
    const copy = useCopy(COPY)
    const words = useCopy(REQUEST_WORDS)
    const assign = useAssignRole(adminId)
    const [copied, setCopied] = useState(false)

    async function copyPhone() {
        try {
            await navigator.clipboard.writeText(user.phone)
            setCopied(true)
        } catch {
            // No clipboard (permission refused): the number is on screen.
        }
    }

    // Admins taking their own admin rights away are asked first: it locks
    // them out of this page at once.
    const [demoting, setDemoting] = useState<SignedInRole | null>(null)
    function setRole(userType: SignedInRole) {
        if (user.id === adminId && user.userType === "admin") {
            setDemoting(userType)
        } else assign.mutate({ userId: user.id, userType })
    }

    return (
        <div className="manage-users-details" id={id}>
            <p>{user.name}</p>
            <p>{user.email}</p>
            {user.phone && (
                <p>
                    <button
                        type="button"
                        className="manage-users-phone"
                        title={copy.copyPhone}
                        onClick={() => void copyPhone()}
                    >
                        <span dir="ltr">{user.phone}</span>
                        <ContentCopyIcon className="copy-icon" />
                        <span className="visually-hidden">
                            {copy.copyPhone}
                        </span>
                    </button>
                </p>
            )}
            {copied && <FormAlert kind="success">{copy.phoneCopied}</FormAlert>}
            <p>{words.role(user.role)}</p>
            <div
                className="manage-users-actions"
                role="group"
                aria-label={copy.setRole}
            >
                {ROLE_BUTTONS.map((role) => (
                    <button
                        key={role}
                        type="button"
                        className="user-btn"
                        disabled={user.userType === role || assign.isPending}
                        onClick={() => setRole(role)}
                    >
                        {copy.roles[role]}
                    </button>
                ))}
            </div>
            {demoting && (
                <ActionDialog
                    title={copy.demoteTitle}
                    ok={copy.demoteOk}
                    warning
                    pending={assign.isPending}
                    failed={assign.isError}
                    onOk={() =>
                        assign.mutate(
                            { userId: user.id, userType: demoting },
                            { onSuccess: () => setDemoting(null) },
                        )
                    }
                    onClose={() => {
                        assign.reset()
                        setDemoting(null)
                    }}
                >
                    <p>{copy.demoteText}</p>
                </ActionDialog>
            )}
            {assign.isError && !demoting && (
                <FormAlert kind="error">{copy.roleFailed}</FormAlert>
            )}
        </div>
    )
}
