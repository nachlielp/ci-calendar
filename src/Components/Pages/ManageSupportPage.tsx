import {
    RequestType,
    RequestTypeHebrew,
    RequestStatus,
    RequestStatusHebrew,
    CIRequest,
    UserType,
} from "../../util/interfaces"
import { useEffect, useState } from "react"

import dayjs from "dayjs"

import DoubleBindedSelect from "../Common/DoubleBindedSelect"
import { requestTypeOptions } from "../../util/options"
import Switch from "antd/es/switch"
import AddResponseToSupportReqModal from "../Requests/AddResponseToSupportReqModal"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

const ManageSupportPage = () => {
    const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(
        RequestStatus.open
    )
    const [selectedTypes, setSelectedTypes] = useState<RequestType[]>([])
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(
        null
    )
    const [filteredRequests, setFilteredRequests] = useState<CIRequest[]>([])
    const [addResponseModalOpen, setAddResponseModalOpen] =
        useState<boolean>(false)

    useEffect(() => {
        const requests =
            selectedStatus === RequestStatus.open
                ? store.getOpenAppRequests
                : store.getClosedAppRequests

        console.log("requests: ", requests)
        if (selectedTypes.length === 0) {
            setFilteredRequests(requests)
            return
        }
        const filteredRequests = requests.filter((request) =>
            selectedTypes.includes(request.type)
        )

        const sortedRequests = filteredRequests.sort((a, b) => {
            return dayjs(a.created_at).isBefore(dayjs(b.created_at)) ? 1 : -1
        })

        setFilteredRequests(sortedRequests)
    }, [store.app_requests, selectedTypes, selectedStatus])

    function handleStatusChange(checked: boolean) {
        setSelectedStatus(checked ? RequestStatus.open : RequestStatus.closed)
    }

    function handleTypesChange(values: string[]) {
        setSelectedTypes(values as RequestType[])
    }

    async function handleAction(action: string, request: CIRequest) {
        switch (action) {
            case "approved":
                const newUserType =
                    request.type === RequestType.make_profile
                        ? UserType.profile
                        : request.type === RequestType.make_creator
                        ? UserType.creator
                        : request.type === RequestType.make_org
                        ? UserType.org
                        : null

                if (newUserType) {
                    await store.updateUserRole({
                        user_id: request.user_id,
                        user_type: newUserType,
                        role_id:
                            request.type === RequestType.make_profile
                                ? 4
                                : request.type === RequestType.make_creator
                                ? 2
                                : request.type === RequestType.make_org
                                ? 3
                                : 0,
                    })
                }

                const newResponseApprovedMessage = [
                    ...request.responses,
                    {
                        response: "הבקשה אושרה",
                        created_at: new Date().toISOString(),
                        responder_name: store.user.user_name || "",
                    },
                ]
                const newRequest: CIRequest = {
                    ...request,
                    status: RequestStatus.closed,
                    responses: newResponseApprovedMessage,
                    viewed: false,
                    sent: false,
                    to_send: true,
                }
                await store.updateRequest(newRequest)
                break

            case "add_response":
                await store.updateRequest({
                    id: request.id,
                    responses: request.responses,
                    viewed: false,
                    sent: false,
                    to_send: true,
                })
                break

            case "close":
                const newDeclineResponseMessage = [
                    ...request.responses,
                    {
                        response: "הבקשה נסגרה",
                        created_at: new Date().toISOString(),
                        responder_name: store.user.user_name || "",
                    },
                ]
                await store.updateRequest({
                    id: request.id,
                    status: RequestStatus.closed,
                    responses: newDeclineResponseMessage,
                    viewed: false,
                    sent: false,
                    to_send: true,
                })
                break
        }
    }

    function handleOpenRequest(request: CIRequest) {
        if (expandedRequestId === request.id) {
            setExpandedRequestId(null)
            setAddResponseModalOpen(false)
            return
        }
        setExpandedRequestId(request.id)
        setAddResponseModalOpen(false)
    }

    return (
        <section className="manage-support-page">
            <header className="manage-support-header">
                <h2 className="manage-support-header-title">ניהול בקשות</h2>
                <div className="filters-container">
                    <DoubleBindedSelect
                        options={requestTypeOptions}
                        selectedValues={selectedTypes}
                        onChange={handleTypesChange}
                        placeholder="סינון לפי סוג הבקשה"
                        className="filter-select"
                    />
                    <Switch
                        className="filter-switch"
                        size="default"
                        onChange={handleStatusChange}
                        checked={selectedStatus === RequestStatus.open}
                        checkedChildren={RequestStatusHebrew.open}
                        unCheckedChildren={RequestStatusHebrew.closed}
                    />
                </div>
            </header>
            <div className="requests-container" role="list">
                {filteredRequests.map((request) => (
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
                                    filteredRequests[
                                        filteredRequests.length - 1
                                    ].id === request.id
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
                                        filteredRequests[
                                            filteredRequests.length - 1
                                        ].id === request.id
                                            ? "last-item"
                                            : ""
                                    }`}
                                >
                                    <p className="request-details-content">
                                        <span>בקשה מס׳ : {request.number}</span>

                                        <span>מייל : {request.email}</span>

                                        <span>פלאפון : {request.phone}</span>

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
                                    <article className="manage-support-actions">
                                        {request.type !==
                                            RequestType.support && (
                                            <button
                                                className="secondary-action-btn low-margin"
                                                onClick={() =>
                                                    handleAction(
                                                        "approved",
                                                        request
                                                    )
                                                }
                                            >
                                                אישור וסגירה
                                            </button>
                                        )}
                                        <AddResponseToSupportReqModal
                                            isOpen={addResponseModalOpen}
                                            setIsOpen={setAddResponseModalOpen}
                                            onSubmit={(response) =>
                                                handleAction("add_response", {
                                                    ...request,
                                                    responses: [
                                                        ...request.responses,
                                                        {
                                                            response,
                                                            created_at:
                                                                new Date().toISOString(),
                                                            responder_name:
                                                                store.user
                                                                    .user_name ||
                                                                "",
                                                        },
                                                    ],
                                                })
                                            }
                                        />
                                        <button
                                            className="secondary-action-btn low-margin"
                                            onClick={() =>
                                                handleAction("close", request)
                                            }
                                        >
                                            סגירה
                                        </button>
                                    </article>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default observer(ManageSupportPage)
