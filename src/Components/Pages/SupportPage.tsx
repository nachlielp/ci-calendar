import { useState } from "react"
import RequestForm from "../UI/UserForms/RequestForm"
import RequestsList from "../UI/Other/RequestsList"
import MenuButtons from "../UI/Other/MenuButtons"

export default function SupportPage() {
    const [createRequest, setCreateRequest] = useState<boolean>(false)

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
                defaultKey="requests"
            />
            {createRequest && <RequestForm />}
            {!createRequest && <RequestsList />}
        </div>
    )
}
