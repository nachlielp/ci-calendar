import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useDebouncedValue } from "../../app/useDebouncedValue"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { FormAlert, TextField } from "../../ui/form/fields"
import { QueryList } from "../../ui/QueryList"
import { SEARCH_DEBOUNCE_MS, usePagedAdminList } from "../admin/adminLists"
import { CopyPhone } from "../admin/CopyPhone"
import { RefreshButton } from "../admin/RefreshButton"
import { ActionDialog } from "../events/ActionDialog"
import { REQUEST_WORDS } from "@ci-calendar/core/features/requests/requestWords"
import { useAssignRole } from "./roles"
import {
    adminUsersQuery,
    adminUserStatsQuery,
    type AdminUser,
} from "@ci-calendar/core/features/admin-users/users"
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
        setRole: "הגדרת תפקיד",
        roleFailed: "שינוי התפקיד נכשל",
        demoteTitle: "להסיר את הרשאות הניהול שלך?",
        demoteText:
            "הגישה שלך לדפי הניהול תיפסק מיד, ורק מנהל אחר יוכל להחזיר אותה.",
        demoteOk: "כן, להסיר",
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
        setRole: "Set role",
        roleFailed: "Changing the role failed",
        demoteTitle: "Remove your own admin rights?",
        demoteText:
            "You will lose access to the admin pages at once, and only another admin can give it back.",
        demoteOk: "Yes, remove",
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
        setRole: "Назначить роль",
        roleFailed: "Не удалось изменить роль",
        demoteTitle: "Снять с себя права администратора?",
        demoteText:
            "Вы сразу потеряете доступ к страницам администратора, и вернуть его сможет только другой администратор.",
        demoteOk: "Да, снять",
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

const LIST_CLASSES = {
    list: "manage-users-list",
    status: "manage-users-status",
    more: "manage-users-more",
}

/** The counts, in legacy's order. */
const COUNTS: readonly SignedInRole[] = [
    "admin",
    "creator",
    "org",
    "profile",
    "user",
]

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
    const [text, setText] = useState("")
    const search = useDebouncedValue(text, SEARCH_DEBOUNCE_MS).trim()
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const usersOptions = useMemo(
        () => adminUsersQuery(services, adminId, search),
        [services, adminId, search],
    )
    const {
        list: users,
        refreshing,
        refresh,
    } = usePagedAdminList(
        {
            ...usersOptions,
            // A new search shows the last results until its own arrive.
            placeholderData: keepPreviousData,
        },
        // Other searches stay cached, as they were.
        { keepOthers: true },
    )
    const stats = useQuery({
        ...adminUserStatsQuery(services, adminId),
        enabled: !!adminId,
    })
    // The refresh button: the users from their first page, and the counts.
    const { refetch: refetchStats } = stats

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
                        onRefresh={() => refresh(refetchStats)}
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
                <QueryList
                    label={copy.users}
                    items={shown}
                    query={users}
                    paging={users}
                    busy={users.isPlaceholderData}
                    empty={
                        <p className="manage-users-status">{copy.noUsers}</p>
                    }
                    loadFailed={copy.loadFailed}
                    loadMore={copy.loadMore}
                    classes={LIST_CLASSES}
                >
                    {(user) => (
                        <UserRow
                            key={user.id}
                            user={user}
                            adminId={adminId}
                            expanded={expandedId === user.id}
                            onToggle={() =>
                                setExpandedId(
                                    expandedId === user.id ? null : user.id,
                                )
                            }
                        />
                    )}
                </QueryList>
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
            {user.phone && <CopyPhone phone={user.phone} />}
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
                        {words.roleButton(role)}
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
