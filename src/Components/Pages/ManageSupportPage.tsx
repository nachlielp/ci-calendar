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
import { useState } from "react"
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
        filters: [
            { text: "Example Name 1", value: "Example Name 1" },
            { text: "Example Name 2", value: "Example Name 2" },
            // Add more predefined names or dynamically generate this list
        ],
        onFilter: (value, record) => record.name.includes(value as string),
        filterSearch: true,
    },
    // ,
    // {
    //     title: "תאריך",
    //     dataIndex: "created_at",
    //     key: "created_at",
    //     render: (text: string) => {
    //         return <span>{dayjs(text).format("DD/MM/YY")}</span>
    //     },
    // },
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

// const getColumnSearchProps = (
//     searchInput: React.RefObject<InputRef>,
//     handleSearch: (
//         selectedKeys: string[],
//         confirm: () => void,
//         dataIndex: DataIndex
//     ) => void,
//     handleReset: (clearFilters: () => void) => void,
//     setSearchText: React.Dispatch<React.SetStateAction<string>>,
//     setSearchedColumn: React.Dispatch<React.SetStateAction<DataIndex | null>>,
//     searchText: string,
//     searchedColumn: DataIndex
// ): TableColumnType<CIRequest> => ({
//     filterDropdown: ({
//         setSelectedKeys,
//         selectedKeys,
//         confirm,
//         clearFilters,
//         close,
//     }) => (
//         <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
//             <Input
//                 ref={searchInput}
//                 placeholder={`חיפוש לפי שם`}
//                 value={selectedKeys[0]}
//                 onChange={(e) =>
//                     setSelectedKeys(e.target.value ? [e.target.value] : [])
//                 }
//                 onPressEnter={() =>
//                     handleSearch(selectedKeys as string[], confirm, "name")
//                 }
//                 style={{ marginBottom: 8, display: "block" }}
//             />
//             <Space>
//                 <Button
//                     type="primary"
//                     onClick={() =>
//                         handleSearch(
//                             selectedKeys as string[],
//                             confirm,
//                             dataIndex
//                         )
//                     }
//                     icon={<Icon icon="search" />}
//                     size="small"
//                     style={{ width: 90 }}
//                 >
//                     Search
//                 </Button>
//                 <Button
//                     onClick={() => clearFilters && handleReset(clearFilters)}
//                     size="small"
//                     style={{ width: 90 }}
//                 >
//                     Reset
//                 </Button>
//                 <Button
//                     type="link"
//                     size="small"
//                     onClick={() => {
//                         confirm({ closeDropdown: false })
//                         setSearchText((selectedKeys as string[])[0])
//                         setSearchedColumn(dataIndex)
//                     }}
//                 >
//                     Filter
//                 </Button>
//                 <Button
//                     type="link"
//                     size="small"
//                     onClick={() => {
//                         close()
//                     }}
//                 >
//                     close
//                 </Button>
//             </Space>
//         </div>
//     ),
//     filterIcon: (filtered: boolean) => <Icon icon="search" />,
//     onFilter: (value, record) =>
//         record[dataIndex]
//             .toString()
//             .toLowerCase()
//             .includes((value as string).toLowerCase()),
//     onFilterDropdownOpenChange: (visible) => {
//         if (visible) {
//             setTimeout(() => searchInput.current?.select(), 100)
//         }
//     },
//     render: (text) =>
//         searchedColumn === dataIndex ? (
//             <Highlighter
//                 highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
//                 searchWords={[searchText]}
//                 autoEscape
//                 textToHighlight={text ? text.toString() : ""}
//             />
//         ) : (
//             text
//         ),
// })
