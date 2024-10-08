import { useState } from "react"
import RequestForm from "../UI/UserForms/RequestForm"
import RequestsList from "../UI/Other/RequestsList"
import MenuButtons from "../UI/Other/MenuButtons"
import useRequests from "../../hooks/useRequests"
import { useUser } from "../../context/UserContext"

export default function SupportPage() {
    const { user } = useUser()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const { requests } = useRequests(user.user_id)
    const [createRequest, setCreateRequest] = useState<boolean>(
        requests.length === 0
    )

    function onSelectKey(key: string) {
        setCreateRequest(key === "create")
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <MenuButtons
                onSelectKey={onSelectKey}
                options={[
                    {
                        key: "create",
                        title: "יצירת בקשה",
                    },
                    {
                        key: "requests",
                        title: "צפייה בבקשות",
                    },
                ]}
                defaultKey={requests.length > 0 ? "requests" : "create"}
            />
            {createRequest && <RequestForm />}
            {!createRequest && <RequestsList requests={requests} />}
        </div>
    )
}
