import { useMemo, useState } from "react"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useForm } from "../../app/useForm"
import { useViewer } from "../../app/viewer"
import { defineCopy } from "../../lib/copy"
import {
    jerusalemDateLabel,
    jerusalemDateTimeLabel,
} from "../../lib/jerusalemDate"
import {
    ChoiceChips,
    FormAlert,
    Switch,
    TextAreaField,
} from "../../ui/form/fields"
import { QueryList } from "../../ui/QueryList"
import { usePagedAdminList } from "../admin/adminLists"
import { CopyPhone } from "../admin/CopyPhone"
import { RefreshButton } from "../admin/RefreshButton"
import { REQUEST_WORDS } from "../requests/requestWords"
import {
    adminRequestsQuery,
    ApprovalCloseError,
    ApprovalRoleError,
    OtherOpenRequestError,
    FILTER_TYPES,
    RequestChangedError,
    RoleGivenRequestChangedError,
    useApproveRequest,
    useRequestAction,
    type AdminRequest,
    type RequestAction,
    type RequestStatus,
} from "./adminRequests"
import "./ManageSupportPage.scss"

// Legacy ManageSupportPage (Hebrew only there, but the toast). Replies,
// the responses list and reopening are new: legacy's reply was commented
// out and it showed no responses.
const COPY = defineCopy({
    he: {
        title: "ניהול בקשות",
        filter: "סינון לפי סוג הבקשה",
        status: "הצגת בקשות",
        open: "פתוחות",
        closed: "סגורות",
        requests: "בקשות",
        none: "אין בקשות",
        loadMore: "טעינת בקשות נוספות",
        loadFailed: "לא הצלחנו לטעון את הבקשות",
        refreshFailed: "לא הצלחנו לרענן את הבקשות",
        filtering: "מסנן…",
        number: (number: number) => `בקשה מס׳ : ${number}`,
        email: (email: string) => `מייל : ${email}`,
        phone: "פלאפון :",
        responses: "תגובות",
        reply: "תגובה",
        replyRequired: "נא לכתוב תגובה",
        send: "שליחת תגובה",
        approve: "אישור",
        decline: "דחיה",
        reopen: "פתיחה מחדש",
        actions: "פעולות על הבקשה",
        actionFailed: "הפעולה נכשלה, נסו שוב",
        roleFailed: "שינוי התפקיד נכשל, והבקשה נשארה פתוחה",
        closeFailed: "התפקיד שונה, אך סגירת הבקשה נכשלה. נסו לאשר שוב",
        roleGiven:
            "התפקיד ניתן, אך הבקשה השתנתה בינתיים (ייתכן שהמשתמש ביטל אותה) ולא נסגרה. הרשימה עודכנה.",
        otherOpen:
            "למשתמש כבר יש בקשה פתוחה אחרת, ולכן אי אפשר לפתוח את הבקשה הזו מחדש",
        changed:
            "הבקשה השתנתה בינתיים (ייתכן שהמשתמש ביטל אותה), ולא נשמר דבר. הרשימה עודכנה.",
    },
    en: {
        title: "Manage Requests",
        filter: "Filter by request type",
        status: "Show requests",
        open: "Open",
        closed: "Closed",
        requests: "Requests",
        none: "No requests",
        loadMore: "Load more requests",
        loadFailed: "We couldn't load the requests",
        refreshFailed: "We couldn't refresh the requests",
        filtering: "Filtering…",
        number: (number: number) => `Request no. ${number}`,
        email: (email: string) => `Email: ${email}`,
        phone: "Phone: ",
        responses: "Responses",
        reply: "Reply",
        replyRequired: "Please write a reply",
        send: "Send reply",
        approve: "Approve",
        decline: "Decline",
        reopen: "Reopen",
        actions: "Request actions",
        actionFailed: "That didn't work, please try again",
        roleFailed: "Changing the role failed, and the request stays open",
        closeFailed:
            "The role was changed, but closing the request failed. Try approving again",
        roleGiven:
            "The role was given, but the request changed meanwhile (the user may have cancelled it) and wasn't closed. The list is up to date.",
        otherOpen:
            "The user already has another open request, so this one can't be reopened",
        changed:
            "The request changed meanwhile (the user may have cancelled it), so nothing was saved. The list is up to date.",
    },
    ru: {
        title: "Управление заявками",
        filter: "Фильтр по типу заявки",
        status: "Показать заявки",
        open: "Открытые",
        closed: "Закрытые",
        requests: "Заявки",
        none: "Заявок нет",
        loadMore: "Загрузить ещё заявки",
        loadFailed: "Не удалось загрузить заявки",
        refreshFailed: "Не удалось обновить заявки",
        filtering: "Фильтрация…",
        number: (number: number) => `Заявка № ${number}`,
        email: (email: string) => `Email: ${email}`,
        phone: "Телефон: ",
        responses: "Ответы",
        reply: "Ответ",
        replyRequired: "Напишите ответ",
        send: "Отправить ответ",
        approve: "Одобрить",
        decline: "Отклонить",
        reopen: "Открыть снова",
        actions: "Действия с заявкой",
        actionFailed: "Не получилось, попробуйте ещё раз",
        roleFailed: "Не удалось изменить роль, заявка осталась открытой",
        closeFailed:
            "Роль изменена, но закрыть заявку не удалось. Попробуйте одобрить снова",
        roleGiven:
            "Роль назначена, но заявка тем временем изменилась (возможно, пользователь её отменил) и не была закрыта. Список обновлён.",
        otherOpen:
            "У пользователя уже есть другая открытая заявка, поэтому эту нельзя открыть снова",
        changed:
            "Заявка изменилась (возможно, пользователь её отменил), поэтому ничего не сохранено. Список обновлён.",
    },
})

/**
 * `/manage-support` (admins): legacy's requests, open or closed (its
 * switch) and filtered by type, each opening to its details, responses,
 * a reply and legacy's approve and decline. The open ones load when the
 * page opens, the closed ones when first shown; nothing of it at boot.
 */
export default function ManageSupportPage() {
    const copy = useCopy(COPY)
    const words = useCopy(REQUEST_WORDS)
    const services = useServices()
    const adminId = useUserId()
    const viewer = useViewer()
    const responder = "name" in viewer ? viewer.name : ""
    const [status, setStatus] = useState<RequestStatus>("open")
    const [types, setTypes] = useState<string[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    // What the page says about a write that found the request changed.
    const [notice, setNotice] = useState<Notice | null>(null)

    const requestsOptions = useMemo(
        () => adminRequestsQuery(services, adminId, status, types),
        [services, adminId, status, types],
    )
    // The refresh button: the list shown, from its first page; the others
    // (the other switch position, other filters) load again when shown.
    const {
        list: requests,
        refreshing,
        refresh,
    } = usePagedAdminList({
        ...requestsOptions,
        // A new type filter shows the last list until its own arrives;
        // the other switch position never shows this one's requests.
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[2] === status ? previous : undefined,
    })

    const shown = useMemo(
        () => requests.data?.pages.flatMap((page) => page.requests),
        [requests.data],
    )
    const typeOptions = useMemo(
        () =>
            FILTER_TYPES.map((type) => ({
                value: type,
                label: words.type(type),
            })),
        [words],
    )

    return (
        <main className="manage-support-page">
            <header className="manage-support-header">
                <h1 className="manage-support-header-title">{copy.title}</h1>
                <div className="filters-container">
                    <ChoiceChips
                        label={copy.filter}
                        options={typeOptions}
                        selected={types}
                        onChange={setTypes}
                    />
                    <Switch
                        label={copy.status}
                        checked={status === "open"}
                        onChange={(open) => {
                            setExpandedId(null)
                            setStatus(open ? "open" : "closed")
                        }}
                        onText={copy.open}
                        offText={copy.closed}
                    />
                </div>
            </header>
            <section className="manage-support-card card">
                <div className="manage-support-toolbar">
                    <RefreshButton
                        refreshing={refreshing}
                        onRefresh={() => {
                            setNotice(null)
                            refresh()
                        }}
                    />
                </div>
                {notice && <FormAlert kind="warning">{copy[notice]}</FormAlert>}
                {requests.isPlaceholderData && (
                    <p className="manage-support-status" role="status">
                        {copy.filtering}
                    </p>
                )}
                {requests.isRefetchError && (
                    <FormAlert kind="error">{copy.refreshFailed}</FormAlert>
                )}
                <QueryList
                    label={copy.requests}
                    items={shown}
                    query={requests}
                    paging={requests}
                    busy={requests.isPlaceholderData}
                    empty={<p className="manage-support-status">{copy.none}</p>}
                    loadFailed={copy.loadFailed}
                    loadMore={copy.loadMore}
                    classes={LIST_CLASSES}
                >
                    {(request) => (
                        <RequestItem
                            key={request.id}
                            request={request}
                            adminId={adminId}
                            responder={responder}
                            expanded={expandedId === request.id}
                            onToggle={() =>
                                setExpandedId(
                                    expandedId === request.id
                                        ? null
                                        : request.id,
                                )
                            }
                            onNotice={setNotice}
                        />
                    )}
                </QueryList>
            </section>
        </main>
    )
}

const LIST_CLASSES = {
    list: "requests-container",
    status: "manage-support-status",
    more: "manage-support-more",
}

/** What the page says after a write found the request changed. */
type Notice = "changed" | "roleGiven"

interface ItemProps {
    request: AdminRequest
    adminId: string
    responder: string
    expanded: boolean
    onToggle: () => void
    /**
     * A write found the request changed (the lists are read again, so the
     * request may leave this list: the page says it, not the request).
     */
    onNotice: (notice: Notice) => void
}

/** Legacy's summary row ("type - name", status, day); open, its details. */
function RequestItem({ request, expanded, onToggle, ...props }: ItemProps) {
    const words = useCopy(REQUEST_WORDS)
    const detailsId = `request-${request.id}`
    return (
        <li className={`request-item${expanded ? " active" : ""}`}>
            <button
                type="button"
                className="request-summary"
                aria-expanded={expanded}
                aria-controls={expanded ? detailsId : undefined}
                onClick={onToggle}
            >
                <span className="request-title">
                    {words.type(request.type)} - {request.name}
                </span>
                <span className="request-status">
                    {request.closed ? words.closed : words.open}
                </span>
                <time dateTime={request.createdAt}>
                    {jerusalemDateLabel(request.createdAt)}
                </time>
            </button>
            {expanded && (
                <RequestDetails id={detailsId} request={request} {...props} />
            )}
        </li>
    )
}

function RequestDetails({
    id,
    request,
    adminId,
    responder,
    onNotice,
}: Omit<ItemProps, "expanded" | "onToggle"> & { id: string }) {
    const copy = useCopy(COPY)
    const act = useRequestAction(adminId)
    const approve = useApproveRequest(adminId)
    const pending = act.isPending || approve.isPending
    // Each reply sent starts a new, empty reply form.
    const [replies, setReplies] = useState(0)

    function run(action: RequestAction) {
        approve.reset()
        return act
            .mutateAsync({ request, action, responder })
            .catch((error: unknown) => {
                if (error instanceof RequestChangedError) onNotice("changed")
                throw error
            })
    }
    function runApproval() {
        act.reset()
        approve.mutate(
            { request, responder },
            {
                onError: (error) => {
                    if (error instanceof RequestChangedError) {
                        onNotice("changed")
                    } else if (error instanceof RoleGivenRequestChangedError) {
                        onNotice("roleGiven")
                    }
                },
            },
        )
    }

    const failure = errorText(approve.error ?? act.error)
    function errorText(error: Error | null) {
        if (!error) return null
        if (error instanceof ApprovalRoleError) return copy.roleFailed
        if (error instanceof ApprovalCloseError) return copy.closeFailed
        if (error instanceof OtherOpenRequestError) return copy.otherOpen
        // Said by the page.
        if (
            error instanceof RequestChangedError ||
            error instanceof RoleGivenRequestChangedError
        ) {
            return null
        }
        return copy.actionFailed
    }

    return (
        <div className="request-details" id={id}>
            <div className="request-details-content">
                <span>{copy.number(request.number)}</span>
                <span>{copy.email(request.email)}</span>
                {request.phone && (
                    <CopyPhone phone={request.phone} label={copy.phone} />
                )}
                <time dateTime={request.createdAt}>
                    {jerusalemDateTimeLabel(request.createdAt)}
                </time>
                <p className="request-message">{request.message}</p>
            </div>
            {request.responses.length > 0 && (
                <article className="request-responses-container">
                    <h3 className="request-responses-title">
                        {copy.responses}
                    </h3>
                    <ul className="request-responses">
                        {request.responses.map((response, index) => (
                            <li key={index} className="request-response">
                                <p>{response.response}</p>
                                <p className="request-response-meta">
                                    {response.responder_name}
                                    {response.created_at && (
                                        <>
                                            {" · "}
                                            <time
                                                dateTime={response.created_at}
                                            >
                                                {jerusalemDateTimeLabel(
                                                    response.created_at,
                                                )}
                                            </time>
                                        </>
                                    )}
                                </p>
                            </li>
                        ))}
                    </ul>
                </article>
            )}
            <ReplyForm
                key={replies}
                disabled={pending}
                onSend={(text) =>
                    run({ kind: "reply", text }).then(() =>
                        setReplies((count) => count + 1),
                    )
                }
            />
            <div
                className="manage-support-actions"
                role="group"
                aria-label={copy.actions}
            >
                {!request.closed && request.type !== "support" && (
                    <button
                        type="button"
                        className="secondary-action-btn low-margin"
                        disabled={pending}
                        onClick={runApproval}
                    >
                        {copy.approve}
                    </button>
                )}
                {request.closed ? (
                    <button
                        type="button"
                        className="secondary-action-btn low-margin"
                        disabled={pending}
                        onClick={() =>
                            void run({ kind: "reopen" }).catch(() => {})
                        }
                    >
                        {copy.reopen}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="secondary-action-btn low-margin"
                        disabled={pending}
                        onClick={() =>
                            void run({ kind: "close" }).catch(() => {})
                        }
                    >
                        {copy.decline}
                    </button>
                )}
            </div>
            {failure && <FormAlert kind="error">{failure}</FormAlert>}
        </div>
    )
}

const NO_REPLY = { reply: "" }

/** A reply to the request (new: legacy's was commented out). */
function ReplyForm({
    disabled,
    onSend,
}: {
    disabled: boolean
    onSend: (text: string) => Promise<unknown>
}) {
    const copy = useCopy(COPY)
    const form = useForm({
        saved: NO_REPLY,
        validate: (values: typeof NO_REPLY) =>
            values.reply.trim() ? {} : { reply: "required" as const },
    })
    const save = form.handleSubmit(async ({ values }) => {
        try {
            await onSend(values.reply.trim())
        } catch {
            // Kept for another try; the details say what failed.
        }
    })
    return (
        <form className="request-reply" noValidate onSubmit={save}>
            <TextAreaField
                label={copy.reply}
                value={form.values.reply}
                onChange={(value) => form.set("reply", value)}
                error={form.errors.reply && copy.replyRequired}
                rows={3}
            />
            <button
                type="submit"
                className="secondary-action-btn low-margin"
                disabled={disabled || form.submitting}
            >
                {copy.send}
            </button>
        </form>
    )
}
