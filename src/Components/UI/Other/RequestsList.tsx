import { useUser } from "../../../context/UserContext"
import useRequests from "../../../hooks/useRequests"
import { List } from "antd"
import dayjs from "dayjs"
import { RequestTypeHebrew } from "../../../util/interfaces"
// TODO: style list

export default function RequestsList() {
    const { user } = useUser()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const { requests } = useRequests(user.user_id)
    console.log(requests)
    return (
        <div style={{ direction: "rtl" }}>
            <List
                itemLayout="horizontal"
                dataSource={requests}
                renderItem={(item, index) => (
                    <List.Item key={index}>
                        <label>{RequestTypeHebrew[item.type]}</label>
                        <label>{item.message}</label>
                        <label>{item.status}</label>
                        <label>
                            {dayjs(item.created_at).format("DD/MM/YYYY")}
                        </label>
                    </List.Item>
                )}
            />
        </div>
    )
}
