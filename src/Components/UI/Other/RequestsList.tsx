import { Table } from "antd"
import type { TableColumnsType } from "antd"

import dayjs from "dayjs"
import {
    CIRequest,
    RequestStatus,
    RequestType,
    RequestTypeHebrew,
    RequestStatusHebrew,
} from "../../../util/interfaces"
import { useState } from "react"
import { requestsService } from "../../../supabase/requestsService"

const columns: TableColumnsType<CIRequest> = [
    {
        title: "בקשה",
        dataIndex: "type",
        key: "type",
        render: (text: RequestType) => {
            return <span>{RequestTypeHebrew[text]}</span>
        },
    },
    {
        title: "סטטוס",
        dataIndex: "status",
        key: "status",
        render: (text: RequestStatus) => {
            return <span>{RequestStatusHebrew[text]}</span>
        },
    },
    {
        title: "תאריך",
        dataIndex: "created_at",
        key: "created_at",
        render: (text: string) => {
            return <span>{dayjs(text).format("DD/MM/YY")}</span>
        },
    },
]

export default function RequestsList({ requests }: { requests: CIRequest[] }) {
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    async function handleExpand(expanded: boolean, record: CIRequest) {
        setExpandedRowKeys(expanded ? [record.request_id] : [])
        if (record.status === RequestStatus.closed && !record.viewed_response) {
            await requestsService.markAsViewedResponseByUser(record.request_id)
        }
    }

    return (
        <div style={{ direction: "rtl", marginTop: "20px" }}>
            <Table
                dataSource={requests}
                columns={columns}
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
            />
        </div>
    )
}
