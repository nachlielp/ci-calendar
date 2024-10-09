import {
    TableColumnsType,
    Table,
    TablePaginationConfig,
    TableProps,
    GetProp,
    TableColumnType,
    Input,
    Space,
    Button,
    InputRef,
} from "antd"
import {
    CIRequest,
    RequestType,
    RequestTypeHebrew,
    RequestStatus,
    RequestStatusHebrew,
} from "../../util/interfaces"
import useRequests from "../../hooks/useRequests"
import { Key, useState } from "react"
import { SorterResult } from "antd/es/table/interface"
import Highlighter from "react-highlight-words"
import { Icon } from "../UI/Other/Icon"

type DataIndex = keyof CIRequest

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
        filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }) => (
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
                        <Icon
                            icon="search"
                            className="filter-search-icon-btn"
                        />
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
        ),
        filterIcon: (filtered) => (
            <Icon
                icon="search"
                className={`filter-search-icon ${filtered && "active"}`}
            />
        ),
        onFilter: (value: boolean | Key, record: CIRequest) =>
            typeof value === "string" &&
            record.name.toString().toLowerCase().includes(value.toLowerCase()),
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

    return (
        <div style={{ direction: "rtl", marginTop: "20px" }}>
            <Table
                dataSource={requests}
                columns={getColumns(tableParams)}
                pagination={false}
                rowKey={(record) => record.request_id}
                expandable={{
                    expandedRowRender: (record) => (
                        <>
                            <p style={{ margin: 0 }}>
                                בקשה מס׳ : {record.request_id}
                                <br />
                                <span style={{ marginRight: "10px" }}>
                                    {record.message}
                                </span>
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
                        </>
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: handleExpand,
                }}
                onChange={handleTableChange}
            />
        </div>
    )
}
