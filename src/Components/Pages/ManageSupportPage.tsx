import {
    RequestType,
    RequestTypeHebrew,
    RequestStatusHebrew,
    CIRequest,
    UserType,
} from "../../util/interfaces"
import { useState } from "react"

import dayjs from "dayjs"
import "../../styles/manage-support-page.scss"
import DoubleBindedSelect from "../Common/DoubleBindedSelect"
import { requestTypeOptions } from "../../util/options"
import Switch from "antd/es/switch"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import { action, computed, makeObservable, observable, reaction } from "mobx"
import message from "antd/es/message"
import { Icon } from "../Common/Icon"

class ManageSupportPageVM {
    @observable showOpenRequests = true
    @observable selectedTypes: RequestType[] = []
    @observable expandedRequestId: string | null = null
    @observable filteredRequests: CIRequest[] = []

    constructor() {
        makeObservable(this)

        reaction(
            () => ({
                showOpen: this.showOpenRequests,
                types: this.selectedTypes,
                requests: store.app_requests,
            }),
            ({ showOpen, types }) => {
                const requests = showOpen
                    ? store.getOpenAppRequests
                    : store.getClosedAppRequests

                if (types.length === 0) {
                    this.filteredRequests = requests
                    return
                }

                const filteredRequests = requests.filter((request) =>
                    types.includes(request.type)
                )

                this.filteredRequests = [...filteredRequests].sort((a, b) => {
                    return dayjs(a.created_at).isBefore(dayjs(b.created_at))
                        ? 1
                        : -1
                })
            },
            { fireImmediately: true }
        )
    }

    @computed
    get getSelectedTypes() {
        return this.selectedTypes
    }

    @computed
    get getFilteredRequests() {
        return this.filteredRequests
    }

    @computed
    get getFilteredRequestsLastIndex() {
        return this.filteredRequests.length
            ? this.filteredRequests.length - 1
            : 0
    }

    @computed
    get getShowOpenRequests() {
        return this.showOpenRequests
    }

    @computed
    get getExpandedRequestId() {
        return this.expandedRequestId
    }

    @action
    setShowOpenRequests = () => {
        this.showOpenRequests = !this.showOpenRequests
    }

    @action
    setSelectedTypes = (types: string[]) => {
        this.selectedTypes = types as RequestType[]
    }

    @action
    setExpandedRequestId = (id: string | null) => {
        this.expandedRequestId = id

        const alert = store.getAlerts.find(
            (alert) => alert.request_id === id && !alert.viewed
        )
        if (alert) {
            store.updateAlert({ id: alert.id, viewed: true })
        }
    }

    @action
    handleAction = async (action: string, request: CIRequest) => {
        switch (action) {
            case "approved":
                const newUserType =
                    request.type === RequestType.profile
                        ? UserType.profile
                        : request.type === RequestType.creator
                        ? UserType.creator
                        : request.type === RequestType.org
                        ? UserType.org
                        : null

                if (newUserType) {
                    await store.updateUserRole({
                        user_id: request.user_id,
                        user_type: newUserType,
                        role_id:
                            request.type === RequestType.profile
                                ? 4
                                : request.type === RequestType.creator
                                ? 2
                                : request.type === RequestType.org
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
                    // status: RequestStatus.closed,
                    responses: newResponseApprovedMessage,
                    viewed: false,
                    sent: false,
                    to_send: true,
                    closed: true,
                }
                await store.updateRequest(newRequest)
                break

            // case "add_response":
            //     await store.updateRequest({
            //         id: request.id,
            //         responses: request.responses,
            //         viewed: false,
            //         sent: false,
            //         to_send: true,
            //     })
            //     break

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
                    // status: RequestStatus.closed,
                    responses: newDeclineResponseMessage,
                    viewed: false,
                    sent: false,
                    to_send: true,
                    closed: true,
                })
                break
        }
    }

    @action
    handleOpenRequest = (request: CIRequest) => {
        if (this.expandedRequestId === request.id) {
            this.setExpandedRequestId(null)
            return
        }
        this.setExpandedRequestId(request.id)
    }
}

const ManageSupportPage = () => {
    const [vm] = useState(() => new ManageSupportPageVM())

    return (
        <section className="manage-support-page">
            <header className="manage-support-header">
                <h2 className="manage-support-header-title">ניהול בקשות</h2>
                <div className="filters-container">
                    <DoubleBindedSelect
                        options={requestTypeOptions}
                        selectedValues={vm.getSelectedTypes}
                        onChange={vm.setSelectedTypes}
                        placeholder="סינון לפי סוג הבקשה"
                        className="filter-select"
                    />
                    <Switch
                        className="filter-switch"
                        size="default"
                        onChange={vm.setShowOpenRequests}
                        checked={vm.getShowOpenRequests}
                        checkedChildren={"פתוחות"}
                        unCheckedChildren={"סגורות"}
                    />
                </div>
            </header>
            <div className="requests-container" role="list">
                {vm.getFilteredRequests.map((request) => (
                    <div
                        key={request.id}
                        className="request-item"
                        role="listitem"
                    >
                        <div
                            className={`request-item ${
                                vm.getExpandedRequestId === request.id
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() => vm.handleOpenRequest(request)}
                        >
                            <div
                                className={`request-summary ${
                                    vm.getExpandedRequestId === request.id
                                        ? "active"
                                        : ""
                                } ${
                                    vm.getFilteredRequests[
                                        vm.getFilteredRequestsLastIndex
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
                                    {request.closed
                                        ? RequestStatusHebrew.closed
                                        : RequestStatusHebrew.open}
                                </label>
                                <time dateTime={request.created_at}>
                                    {dayjs(request.created_at).format(
                                        "DD/MM/YYYY"
                                    )}
                                </time>
                            </div>
                            {vm.getExpandedRequestId === request.id && (
                                <div
                                    className={`request-details ${
                                        vm.getExpandedRequestId === request.id
                                            ? "active"
                                            : ""
                                    } ${
                                        vm.getFilteredRequests[
                                            vm.getFilteredRequestsLastIndex
                                        ].id === request.id
                                            ? "last-item"
                                            : ""
                                    }`}
                                >
                                    <p className="request-details-content">
                                        <span>בקשה מס׳ : {request.number}</span>

                                        <span>מייל : {request.email}</span>
                                        <span
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                await navigator.clipboard.writeText(
                                                    request.phone || ""
                                                )
                                                // If you're using antd, you can use their message component
                                                message.success(
                                                    "Phone number copied to clipboard"
                                                )
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                            title="Click to copy"
                                        >
                                            פלאפון :{request.phone}
                                            <Icon
                                                icon="contentCopy"
                                                className="copy-icon"
                                            />
                                        </span>

                                        <span>
                                            {dayjs(request.created_at).format(
                                                "DD/MM/YYYY HH:mm"
                                            )}
                                        </span>
                                        <label className="request-message">
                                            {request.message}
                                        </label>
                                    </p>
                                    {/* {request.responses.length > 0 && (
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
                                    )} */}
                                    <article className="manage-support-actions">
                                        {request.type !==
                                            RequestType.support && (
                                            <button
                                                className="secondary-action-btn low-margin"
                                                onClick={() =>
                                                    vm.handleAction(
                                                        "approved",
                                                        request
                                                    )
                                                }
                                            >
                                                אישור
                                            </button>
                                        )}
                                        {/* <AddResponseToSupportReqModal
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
                                        /> */}
                                        <button
                                            className="secondary-action-btn low-margin"
                                            onClick={() =>
                                                vm.handleAction(
                                                    "close",
                                                    request
                                                )
                                            }
                                        >
                                            דחיה
                                        </button>
                                    </article>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="test-error-container">
                <button
                    className="secondary-action-btn"
                    onClick={() => {
                        throw new Error(
                            "Test error thrown from ManageSupportPage"
                        )
                    }}
                >
                    Throw Test Error
                </button>
            </div>
        </section>
    )
}

export default observer(ManageSupportPage)
