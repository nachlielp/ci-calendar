import Badge from "antd/es/badge"
import Table from "antd/es/table"

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
import { useUser } from "../../../context/UserContext"
import { TableColumnsType } from "antd/lib"

const columns: TableColumnsType<CIRequest> = [
    {
        title: "בקשה",
        dataIndex: "type",
        key: "type",
        render: (text: RequestType, record: CIRequest) => {
            return (
                <span>
                    <Badge
                        count={!closedAndNotViewedResponse(record) && 0}
                        size="small"
                    >
                        {RequestTypeHebrew[text]}
                    </Badge>
                </span>
            )
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

export default function RequestsList() {
    const { user } = useUser()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    async function handleExpand(expanded: boolean, record: CIRequest) {
        setExpandedRowKeys(expanded ? [record.request_id] : [])
        if (record.status === RequestStatus.closed && !record.viewed_response) {
            await requestsService.markAsViewedResponseByUser(record.request_id)
        }
    }

    return (
        <div className="request-list">
            <Table
                dataSource={user.requests}
                columns={columns}
                pagination={false}
                rowKey={(record) => record.request_id}
                expandable={{
                    expandedRowRender: (record) => (
                        <section className="request-list-cell-container">
                            <p className="message-container">
                                <label className="sub-title">
                                    בקשה מס׳ : {record.request_id}
                                </label>
                                <span className="message">
                                    {record.message}
                                </span>
                            </p>
                            {record.responses.length > 0 && (
                                <p>
                                    תשובה :
                                    <span
                                        style={{
                                            paddingRight: "10px",
                                        }}
                                    >
                                        {record.responses.map((response) => (
                                            <article
                                                key={response.created_at}
                                                className="request-list-item"
                                            >
                                                <label className="sub-title">
                                                    {response.created_by} ב{" "}
                                                    {dayjs(
                                                        response.created_at
                                                    ).format(
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
                        </section>
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: handleExpand,
                }}
            />
        </div>
    )
}

function closedAndNotViewedResponse(record: CIRequest) {
    return record.status === RequestStatus.closed && !record.viewed_response
}
