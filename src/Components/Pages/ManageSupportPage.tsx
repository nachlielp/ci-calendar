import {
    TableColumnsType,
    Table,
    TablePaginationConfig,
    TableProps,
    GetProp,
    Input,
    Space,
} from "antd"
import {
    CIRequest,
    RequestType,
    RequestTypeHebrew,
    RequestStatus,
    RequestStatusHebrew,
    UserType,
} from "../../util/interfaces"
import useRequests from "../../hooks/useRequests"
import { useState } from "react"
import { SorterResult } from "antd/es/table/interface"
// import Highlighter from "react-highlight-words"
import { Icon } from "../UI/Other/Icon"

import { requestsService } from "../../supabase/requestsService"
import { usersService } from "../../supabase/usersService"

interface TableParams {
    pagination?: TablePaginationConfig
    sortField?: SorterResult<any>["field"]
    sortOrder?: SorterResult<any>["order"]
    filters?: Parameters<GetProp<TableProps, "onChange">>[1] & {
        name?: string[]
    }
}

const getColumns = (tableParams: TableParams): TableColumnsType<CIRequest> => [
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
                        : null

                if (!newUserType) {
                    console.error(
                        "ManageSupportPage.handleAction.newUserType.error: ",
                        request.type,
                        " does not match any user type"
                    )
                    return
                }

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

                const newResponseMessage =
                    (request.response || "") + "\n" + "הבקשה אושרה"
                const newRequest: CIRequest = {
                    ...request,
                    status: RequestStatus.closed,
                    response: newResponseMessage,
                    viewed_response: false,
                }
                await requestsService.updateRequest(newRequest)
                break
            case "add_response":
                await requestsService.updateRequest({
                    request_id: request.request_id,
                    response: request.response,
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
}: {
    record: CIRequest
    handleAction: (action: string, request: CIRequest) => void
}) => {
    const [showInput, setShowInput] = useState(false)
    const [inputValue, setInputValue] = useState("")
    return (
        <>
            <p style={{ margin: 0 }}>
                בקשה מס׳ : {record.request_id}
                <br />
                מייל : {record.email}
                <br />
                פלאפון : {record.phone}
                <br />
                <br />
                הודעה :
                <span style={{ marginRight: "10px" }}>{record.message}</span>
            </p>
            {record.response && (
                <p style={{ margin: 0 }}>
                    תשובה :
                    <br />
                    <span
                        style={{
                            paddingRight: "10px",
                        }}
                    >
                        {record.response}
                    </span>
                </p>
            )}
            {!showInput && (
                <article className="manage-support-cell-actions">
                    <button
                        className="support-action-btn"
                        onClick={() => handleAction("in_progress", record)}
                    >
                        בטיפול
                    </button>
                    <button
                        className="support-action-btn"
                        onClick={() => handleAction("approved", record)}
                    >
                        אישור וסגירה
                    </button>
                    <button
                        className="support-action-btn"
                        onClick={() => setShowInput(true)}
                    >
                        הוספת תשובה
                    </button>
                </article>
            )}
            {showInput && (
                <article>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button
                        className="support-action-btn"
                        onClick={() => {
                            setInputValue("")
                            setShowInput(false)
                        }}
                    >
                        ביטול
                    </button>
                    <button
                        className="support-action-btn"
                        onClick={() => {
                            handleAction("add_response", {
                                ...record,
                                response:
                                    (record.response || "") + "\n" + inputValue,
                            })
                            setInputValue("")
                            setShowInput(false)
                        }}
                    >
                        שליחה
                    </button>
                </article>
            )}
        </>
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
                <button onClick={() => confirm()} style={{ width: 90 }}>
                    <Icon icon="search" className="filter-search-icon-btn" />
                </button>

                <button
                    onClick={() => clearFilters && clearFilters()}
                    style={{ width: 90 }}
                >
                    <Icon
                        icon="search_off"
                        className="filter-search-icon-btn"
                    />
                </button>
            </Space>
        </div>
    )
}
