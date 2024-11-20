import dayjs from "dayjs"
import {
    CIRequest,
    RequestTypeHebrew,
    RequestStatusHebrew,
} from "../../util/interfaces"
import { useState } from "react"
import { useUser } from "../../context/UserContext"

export default function RequestsList() {
    const { user } = useUser()

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(
        null
    )

    function handleOpenRequest(request: CIRequest) {
        if (expandedRequestId === request.id) {
            setExpandedRequestId(null)
            return
        }
        setExpandedRequestId(request.id)
    }

    return (
        <div className="request-list">
            <div className="requests-container" role="list">
                {user.requests.map((request) => (
                    <div
                        key={request.id}
                        className="request-item"
                        role="listitem"
                    >
                        <div
                            className={`request-item ${
                                expandedRequestId === request.id ? "active" : ""
                            }`}
                            onClick={() => handleOpenRequest(request)}
                        >
                            <div
                                className={`request-summary ${
                                    expandedRequestId === request.id
                                        ? "active"
                                        : ""
                                } ${
                                    user.requests[user.requests.length - 1]
                                        .id === request.id
                                        ? "last-item"
                                        : ""
                                }`}
                            >
                                <h3 className="request-title">
                                    {RequestTypeHebrew[request.type]}
                                </h3>
                                {" - "}
                                <h3 className="request-title">
                                    {request.name}
                                </h3>

                                <label className="request-status">
                                    {RequestStatusHebrew[request.status]}
                                </label>
                                <time dateTime={request.created_at}>
                                    {dayjs(request.created_at).format(
                                        "DD/MM/YYYY"
                                    )}
                                </time>
                            </div>
                            {expandedRequestId === request.id && (
                                <div
                                    className={`request-details ${
                                        expandedRequestId === request.id
                                            ? "active"
                                            : ""
                                    } ${
                                        user.requests[user.requests.length - 1]
                                            .id === request.id
                                            ? "last-item"
                                            : ""
                                    }`}
                                >
                                    <p className="request-details-content">
                                        <span>בקשה מס׳ : {request.number}</span>

                                        <span>
                                            {dayjs(request.created_at).format(
                                                "DD/MM/YYYY HH:mm"
                                            )}
                                        </span>
                                        <label className="request-message">
                                            {request.message}
                                        </label>
                                    </p>
                                    {request.responses.length > 0 && (
                                        <article className="request-responses-container">
                                            <label className="request-responses-title">
                                                תגובות
                                            </label>
                                            <div className="request-responses">
                                                {request.responses.map(
                                                    (response, index) => (
                                                        <div
                                                            key={index}
                                                            className="request-response"
                                                        >
                                                            {response.response}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </article>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
