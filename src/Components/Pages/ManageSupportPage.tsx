import type { ColumnsType } from "antd/es/table/interface"
// import type { ColumnsType } from "antd/es/table/interface"
import Table, { TablePaginationConfig, TableProps } from "antd/es/table"
import Input from "antd/es/input"
import Space from "antd/es/space"
import {
    CIRequest,
    RequestType,
    RequestTypeHebrew,
    RequestStatus,
    RequestStatusHebrew,
    UserType,
    DbUser,
} from "../../util/interfaces"
import useRequests from "../../hooks/useRequests"
import { useState } from "react"
import { SorterResult } from "antd/es/table/interface"
// import Highlighter from "react-highlight-words"
import { Icon } from "../UI/Other/Icon"

import { requestsService } from "../../supabase/requestsService"
import { GetProp } from "antd/es/_util/type"
import { usersService } from "../../supabase/usersService"
import AddResponseToSupportReqModal from "../UI/Other/AddResponseToSupportReqModal"
import { useUser } from "../../context/UserContext"
import dayjs from "dayjs"

interface TableParams {
    pagination?: TablePaginationConfig
    sortField?: SorterResult<any>["field"]
    sortOrder?: SorterResult<any>["order"]
    filters?: Parameters<GetProp<TableProps, "onChange">>[1] & {
        name?: string[]
    }
}

const getColumns = (tableParams: TableParams): ColumnsType<CIRequest> => [
    {
        title: "בקשה",
        dataIndex: "type",
        key: "type",
        render: (text: RequestType) => {
            return <span>{RequestTypeHebrew[text]}</span>
        },
        filters: Object.values(RequestType).map((type) => ({
            text: RequestTypeHebrew[type],
            value: type,
        })),
        filteredValue: tableParams.filters?.type || null,
        filterMultiple: false,
    },
    {
        title: "סטטוס",
        dataIndex: "status",
        key: "status",
        render: (text: RequestStatus) => {
            return <span>{RequestStatusHebrew[text]}</span>
        },
        filters: Object.values(RequestStatus).map((status) => ({
            text: RequestStatusHebrew[status],
            value: status,
        })),
        filteredValue: tableParams.filters?.status || null,
    },
    {
        title: "שם",
        dataIndex: "name",
        key: "name",
        render: (text: string) => {
            return <span>{text}</span>
        },
        filterDropdown: filterDropdown,
        filterIcon: (filtered) => (
            <Icon
                icon="search"
                className={`filter-search-icon ${filtered && "active"}`}
            />
        ),
        filteredValue: tableParams.filters?.name || null,
    },
]

export default function ManageSupportPage() {
    const { user } = useUser()
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])
    const [tableParams, setTableParams] = useState<TableParams>({
        pagination: {
            current: 1,
            pageSize: 10,
        },
        filters: {
            status: [RequestStatus.open, RequestStatus.pending],
            type: null,
            name: [""],
        },
    })

    const { requests } = useRequests({
        status: tableParams.filters?.status as RequestStatus[] | null,
        type: tableParams.filters?.type as RequestType | null,
        name: tableParams.filters?.name as string[],
    })

    async function handleExpand(expanded: boolean, record: CIRequest) {
        setExpandedRowKeys(expanded ? [record.request_id] : [])
    }

    const handleTableChange: TableProps<CIRequest>["onChange"] = (
        pagination,
        filters,
        sorter
    ) => {
        setTableParams((prevParams) => ({
            ...prevParams,
            pagination,
            filters,
            sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
            sortField: Array.isArray(sorter) ? undefined : sorter.field,
        }))
    }

    async function handleAction(action: string, request: CIRequest) {
        switch (action) {
            case "in_progress":
                await requestsService.updateRequest({
                    request_id: request.request_id,
                    status: RequestStatus.pending,
                })
                break
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
                    const userRes = await usersService.updateUser(
                        request.created_by,
                        {
                            user_type: newUserType,
                        }
                    )
                    if (!userRes) {
                        console.error(
                            "ManageSupportPage.handleAction.userRes.error: ",
                            userRes
                        )
                        return
                    }
                }

                const newResponseApprovedMessage = [
                    ...request.responses,
                    {
                        response: "הבקשה אושרה",
                        created_at: new Date().toISOString(),
                        created_by: user?.full_name || "",
                    },
                ]
                const newRequest: CIRequest = {
                    ...request,
                    status: RequestStatus.closed,
                    responses: newResponseApprovedMessage,
                    viewed_response: false,
                }
                await requestsService.updateRequest(newRequest)
                break

            case "add_response":
                await requestsService.updateRequest({
                    request_id: request.request_id,
                    responses: request.responses,
                    viewed_response: false,
                })
                break

            case "close":
                const newDeclineResponseMessage = [
                    ...request.responses,
                    {
                        response: "הבקשה נסגרה",
                        created_at: new Date().toISOString(),
                        created_by: user?.full_name || "",
                    },
                ]
                await requestsService.updateRequest({
                    request_id: request.request_id,
                    status: RequestStatus.closed,
                    responses: newDeclineResponseMessage,
                    viewed_response: false,
                })
                break
        }
    }

    return (
        <div style={{ marginTop: "20px" }}>
            <Table
                dataSource={requests}
                columns={getColumns(tableParams)}
                pagination={false}
                rowKey={(record) => record.request_id}
                expandable={{
                    expandedRowRender: (record) => (
                        <ManageSupportCell
                            record={record}
                            handleAction={handleAction}
                            user={user}
                        />
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: handleExpand,
                }}
                onChange={handleTableChange}
            />
        </div>
    )
}

const ManageSupportCell = ({
    record,
    handleAction,
    user,
}: {
    record: CIRequest
    handleAction: (action: string, request: CIRequest) => void
    user: DbUser | null
}) => {
    return (
        <section className="manage-support-cell">
            <p style={{ margin: 0 }}>
                בקשה מס׳ : {record.request_id}
                <br />
                מייל : {record.email}
                <br />
                פלאפון : {record.phone}
                <br />
                <span className="manage-support-cell-request">
                    <label className="sub-title">
                        {dayjs(record.created_at).format("DD/MM/YYYY HH:mm")}
                    </label>
                    {record.message}
                </span>
            </p>
            {record.responses.length > 0 && (
                <p style={{ margin: 0 }}>
                    <b> תשובה</b>
                    <span
                        style={{
                            paddingRight: "10px",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                        }}
                    >
                        {record.responses.map((response) => (
                            <article
                                key={response.created_at}
                                className="manage-support-cell-response"
                            >
                                <label className="sub-title">
                                    {response.created_by} ב{" "}
                                    {dayjs(response.created_at).format(
                                        "DD/MM/YYYY HH:mm"
                                    )}
                                </label>
                                <label className="content">
                                    {response.response}
                                </label>
                            </article>
                        ))}
                    </span>
                </p>
            )}
            <article
                className="manage-support-cell-actions"
                style={{
                    display: "flex",
                    flexDirection: "row",
                }}
            >
                <button
                    className="secondary-action-btn low-margin"
                    onClick={() => handleAction("in_progress", record)}
                >
                    בטיפול
                </button>
                <button
                    className="secondary-action-btn low-margin"
                    onClick={() => handleAction("approved", record)}
                >
                    אישור וסגירה
                </button>
                <AddResponseToSupportReqModal
                    onSubmit={(response) =>
                        handleAction("add_response", {
                            ...record,
                            responses: [
                                ...record.responses,
                                {
                                    response,
                                    created_at: new Date().toISOString(),
                                    created_by: user?.full_name || "",
                                },
                            ],
                        })
                    }
                />
                <button
                    className="secondary-action-btn low-margin"
                    onClick={() => handleAction("close", record)}
                >
                    סגירה
                </button>
            </article>
        </section>
    )
}

const filterDropdown = ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
}: {
    setSelectedKeys: (keys: React.Key[]) => void
    selectedKeys: React.Key[]
    confirm: () => void
    clearFilters?: () => void
}) => {
    const onClear = () => {
        clearFilters?.()
        confirm()
    }
    return (
        <div style={{ padding: 8 }}>
            <Input
                placeholder={`חיפוש לפי שם`}
                value={selectedKeys[0]}
                onChange={(e) =>
                    setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => confirm()}
                style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
                <button onClick={() => confirm()} className="general-icon-btn">
                    <Icon icon="search" className="filter-search-icon-btn" />
                </button>

                <button onClick={onClear} className="general-icon-btn">
                    <Icon
                        icon="search_off"
                        className="filter-search-icon-btn"
                    />
                </button>
            </Space>
        </div>
    )
}
