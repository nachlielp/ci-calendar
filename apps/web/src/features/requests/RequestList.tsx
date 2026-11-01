import { useEffect, useId, useState } from "react"
import { useCopy } from "../../app/language"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import {
    jerusalemDateLabel,
    jerusalemDateTimeLabel,
} from "@ci-calendar/core/lib/jerusalemDate"
import type { UserRequest } from "./myRequests"
import type { RequestResponse } from "./requestRows"
import { useRequestTexts } from "./requestTexts"
import { REQUEST_WORDS } from "./requestWords"

// Legacy RequestsList (Hebrew only there; it had no heading).
const COPY = defineCopy({
    he: {
        title: "הבקשות שלי",
        empty: "🤷🏼‍♂️ אין לכם בקשות",
        number: (number: number) => `בקשה מס׳ : ${number}`,
        responses: "תגובות",
    },
    en: {
        title: "My requests",
        empty: "🤷🏼‍♂️ You have no requests",
        number: (number: number) => `Request no. ${number}`,
        responses: "Responses",
    },
    ru: {
        title: "Мои заявки",
        empty: "🤷🏼‍♂️ У вас нет заявок",
        number: (number: number) => `Заявка № ${number}`,
        responses: "Ответы",
    },
})

/**
 * The user's requests, newest first, each with its type, status and date
 * (legacy RequestsList, which legacy had built but not shown). A tap opens
 * one: its number, time, message and the responses to it. `/request/:id`
 * opens that one.
 */
export function RequestList({
    requests,
    selectedId,
}: {
    requests: readonly UserRequest[]
    selectedId?: string
}) {
    const copy = useCopy(COPY)
    const words = useCopy(REQUEST_WORDS)
    const [expanded, setExpanded] = useState(selectedId ?? null)
    const id = useId()

    // A link to another request (while the page stays open) opens it.
    useEffect(() => {
        if (selectedId) setExpanded(selectedId)
    }, [selectedId])

    return (
        <section className="request-list" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`} className="request-list-title">
                {copy.title}
            </h2>
            {requests.length === 0 ? (
                <p className="request-list-empty">{copy.empty}</p>
            ) : (
                <ul className="requests-container">
                    {requests.map((request) => {
                        const open = expanded === request.id
                        const detailsId = `${id}-${request.id}`
                        return (
                            <li
                                key={request.id}
                                className={`request-item${open ? " active" : ""}`}
                            >
                                <button
                                    type="button"
                                    className="request-summary"
                                    aria-expanded={open}
                                    aria-controls={detailsId}
                                    onClick={() =>
                                        setExpanded(open ? null : request.id)
                                    }
                                >
                                    <span className="request-title">
                                        {words.type(request.type)}
                                    </span>
                                    <span className="request-status">
                                        {request.closed
                                            ? words.closed
                                            : words.open}
                                    </span>
                                    <time dateTime={request.createdAt}>
                                        {jerusalemDateLabel(request.createdAt)}
                                    </time>
                                </button>
                                {open && (
                                    <div
                                        id={detailsId}
                                        className="request-details"
                                    >
                                        <div className="request-details-content">
                                            <span>
                                                {copy.number(request.number)}
                                            </span>
                                            <time dateTime={request.createdAt}>
                                                {jerusalemDateTimeLabel(
                                                    request.createdAt,
                                                )}
                                            </time>
                                            <p className="request-message">
                                                {request.message}
                                            </p>
                                        </div>
                                        {request.responses.length > 0 && (
                                            <article className="request-responses-container">
                                                <h3 className="request-responses-title">
                                                    {copy.responses}
                                                </h3>
                                                <ResponseList
                                                    responses={
                                                        request.responses
                                                    }
                                                />
                                            </article>
                                        )}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

/**
 * A request's responses: the admins' replies and the app's notes, in the
 * reader's language (`useRequestTexts`).
 */
function ResponseList({
    responses,
}: {
    responses: readonly RequestResponse[]
}) {
    const text = useRequestTexts(responses.map((r) => r.response))
    return (
        <ul className="request-responses">
            {responses.map((response, index) => (
                <li key={index} className="request-response">
                    {text(response.response)}
                </li>
            ))}
        </ul>
    )
}
