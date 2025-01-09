import Switch from "antd/es/switch"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import { useState } from "react"
import { Icon } from "../Common/Icon"
import '../../styles/notification-switch.scss'
const NotificationSwitch = () => {
    const [loading, setLoading] = useState(false)

    const handleChange = async (checked: boolean) => {
        setLoading(true)

        await store.updateUser({
            receive_notifications: checked,
        })
        setLoading(false)
    }
    return (
        <section className="notification-switch">
            <Switch
                checked={store.getUserReceiveNotifications}
                onChange={handleChange}
                loading={loading}
                checkedChildren={
                    <Icon
                        icon="notifications_active"
                        className="notification-switch-icon active"
                    />
                }
                unCheckedChildren={
                    <Icon
                        icon="notificationsOff"
                        className="notification-switch-icon"
                    />
                }
            />
        </section>
    )
}

export default observer(NotificationSwitch)
