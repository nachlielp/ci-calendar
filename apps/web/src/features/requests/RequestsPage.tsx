import { useQuery } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import { useParams } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useViewer, type SignedInRole } from "../../app/viewer"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { FormAlert } from "../../ui/form/fields"
import { SupportEmail } from "../../ui/SupportEmail"
import {
    myRequestsQuery,
    openRequestOf,
    RequestClosedError,
    useCancelRequest,
    type UserRequest,
} from "./myRequests"
import { RequestForm, type Abandoned } from "./RequestForm"
import { RequestList } from "./RequestList"
import { REQUEST_WORDS } from "./requestWords"
import "./RequestsPage.scss"

// Legacy SupportPage and OpenRequest (Hebrew only there). OpenRequest also
// said the status would come as a notification "once notifications are on";
// legacy removed notifications, so that sentence is gone.
const COPY = defineCopy({
    he: {
        title: "הרשמה כמורה או ארגון",
        registeredAs: (role: ReactNode) => (
            <>
                אתם רשומים כ<b>{role}</b>
            </>
        ),
        toChange: "על מנת לשנות את המעמד שלכם אנא מלאו טופס הרשמה",
        register: "הרשמה",
        received: (role: ReactNode) => (
            <>
                בקשתך להרשמה <b>כ{role}</b> נקלטה בהצלחה.
            </>
        ),
        supportReceived: "בקשת התמיכה שלך נקלטה בהצלחה.",
        contact: "אם יש צורך במידע נוסף אנו ניצור קשר טלפוני.",
        updates: "עדכון לגבי סטטוס הבקשה ישלח לכאן.",
        edit: "עריכת הבקשה",
        cancelRequest: "ביטול הבקשה",
        cancelFailed: "ביטול הבקשה נכשל, נסו שוב",
        loadFailed: "לא הצלחנו לטעון את הבקשות שלך",
        closed: "הבקשה כבר נסגרה",
        alreadyOpen: "כבר יש לכם בקשה פתוחה",
    },
    en: {
        title: "Register as a teacher or organisation",
        registeredAs: (role: ReactNode) => (
            <>
                You are registered as: <b>{role}</b>
            </>
        ),
        toChange: "To change your status, please fill in a registration form",
        register: "Register",
        received: (role: ReactNode) => (
            <>
                Your request to register as <b>{role}</b> was received.
            </>
        ),
        supportReceived: "Your support request was received.",
        contact: "If we need more information, we will call you.",
        updates: "Updates on the request will appear here.",
        edit: "Edit the request",
        cancelRequest: "Cancel the request",
        cancelFailed: "Cancelling the request failed, please try again",
        loadFailed: "We couldn't load your requests",
        closed: "This request was already closed",
        alreadyOpen: "You already have an open request",
    },
    ru: {
        title: "Регистрация как учитель или организация",
        registeredAs: (role: ReactNode) => (
            <>
                Вы зарегистрированы как: <b>{role}</b>
            </>
        ),
        toChange:
            "Чтобы изменить свой статус, пожалуйста, заполните форму регистрации",
        register: "Регистрация",
        received: (role: ReactNode) => (
            <>
                Ваша заявка на регистрацию как <b>{role}</b> получена.
            </>
        ),
        supportReceived: "Ваша заявка в поддержку получена.",
        contact: "Если понадобится дополнительная информация, мы позвоним вам.",
        updates: "Новости по заявке появятся здесь.",
        edit: "Изменить заявку",
        cancelRequest: "Отменить заявку",
        cancelFailed: "Не удалось отменить заявку, попробуйте снова",
        loadFailed: "Не удалось загрузить ваши заявки",
        closed: "Эта заявка уже закрыта",
        alreadyOpen: "У вас уже есть открытая заявка",
    },
})

/**
 * `/request` and `/bio/request` (legacy SupportPage; `:requestId` opens
 * one request in the list): the user's role, their open request (edit or
 * cancel it) or a form to ask for another role, and all their requests
 * with status and responses. Their requests load when the page opens.
 */
export default function RequestsPage() {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const userId = useUserId()
    const viewer = useViewer()
    const { requestId } = useParams()
    const [mode, setMode] = useState<Mode>(VIEW)
    const [notice, setNotice] = useState<Abandoned | null>(null)
    const { data, isError, refetch } = useQuery({
        ...myRequestsQuery(services, userId),
        enabled: !!userId,
    })

    // The request being edited closed meanwhile (an admin answered it, as
    // a refetch shows): stop editing rather than turn into a new request.
    const edited = mode.kind === "edit" ? mode.request.id : null
    const editedClosed =
        !!edited &&
        !!data &&
        !data.some((request) => request.id === edited && !request.closed)
    useEffect(() => {
        if (!editedClosed) return
        setMode(VIEW)
        setNotice("closed")
    }, [editedClosed])

    // The guard lets only signed-in roles in.
    if (!("name" in viewer)) return null
    const { role, name } = viewer
    const open = data && openRequestOf(data)

    function abandon(reason: Abandoned) {
        setMode(VIEW)
        setNotice(reason)
    }
    function start(next: Mode) {
        setNotice(null)
        setMode(next)
    }

    return (
        <main className="support-page">
            <h1 className="support-page-title">{copy.title}</h1>
            {notice && (
                <div className="support-page-notice">
                    <FormAlert kind="info">{copy[notice]}</FormAlert>
                </div>
            )}
            {data ? (
                <>
                    {mode.kind !== "view" && !editedClosed ? (
                        <RequestForm
                            userId={userId}
                            role={role}
                            name={name}
                            request={
                                mode.kind === "edit" ? mode.request : undefined
                            }
                            onDone={() => setMode(VIEW)}
                            onAbandon={abandon}
                        />
                    ) : open ? (
                        <OpenRequest
                            request={open}
                            userId={userId}
                            name={name}
                            onEdit={() =>
                                start({ kind: "edit", request: open })
                            }
                            onClosed={() => abandon("closed")}
                        />
                    ) : (
                        <UserStatus
                            role={role}
                            onRegister={() => start({ kind: "new" })}
                        />
                    )}
                    <RequestList requests={data} selectedId={requestId} />
                </>
            ) : isError ? (
                <div className="card support-page-card" role="alert">
                    <p>{copy.loadFailed}</p>
                    <button
                        type="button"
                        className="text-button"
                        onClick={() => void refetch()}
                    >
                        {common.retry}
                    </button>
                </div>
            ) : (
                <p role="status">{common.loading}</p>
            )}
            <SupportEmail />
        </main>
    )
}

/**
 * What the page shows: the role or open request, a new request's form, or
 * the open request's form with the request as it was when editing began.
 */
type Mode =
    { kind: "view" } | { kind: "new" } | { kind: "edit"; request: UserRequest }

const VIEW: Mode = { kind: "view" }

/** The user's role, and the way to ask for another. */
function UserStatus({
    role,
    onRegister,
}: {
    role: SignedInRole
    onRegister: () => void
}) {
    const copy = useCopy(COPY)
    const words = useCopy(REQUEST_WORDS)
    return (
        <article className="support-page-description">
            <section className="card">
                <p className="text">
                    {copy.registeredAs(words.role(role))}
                    <br />
                    {copy.toChange}
                </p>
                <button
                    type="button"
                    className="action-button"
                    onClick={onRegister}
                >
                    {copy.register}
                </button>
            </section>
        </article>
    )
}

/** Legacy OpenRequest: the request was received; edit or cancel it. */
function OpenRequest({
    request,
    userId,
    name,
    onEdit,
    onClosed,
}: {
    request: UserRequest
    userId: string
    name: string
    onEdit: () => void
    /** It was closed already when the user tried to cancel it. */
    onClosed: () => void
}) {
    const copy = useCopy(COPY)
    const words = useCopy(REQUEST_WORDS)
    const cancel = useCancelRequest(userId)

    return (
        <section className="open-request card">
            <p className="text">
                {request.type === "support"
                    ? copy.supportReceived
                    : copy.received(words.role(request.type))}
                <br />
                {copy.contact}
                <br />
                <br />
                {copy.updates}
            </p>
            {cancel.isError &&
                !(cancel.error instanceof RequestClosedError) && (
                    <FormAlert kind="error">{copy.cancelFailed}</FormAlert>
                )}
            <div className="submit-button-container">
                <button
                    type="button"
                    className="text-button"
                    disabled={cancel.isPending}
                    onClick={onEdit}
                >
                    {copy.edit}
                </button>
                <button
                    type="button"
                    className="text-button"
                    disabled={cancel.isPending}
                    onClick={() =>
                        cancel.mutate(
                            { id: request.id, name },
                            {
                                onError: (error) => {
                                    if (error instanceof RequestClosedError) {
                                        onClosed()
                                    }
                                },
                            },
                        )
                    }
                >
                    {copy.cancelRequest}
                </button>
            </div>
        </section>
    )
}
