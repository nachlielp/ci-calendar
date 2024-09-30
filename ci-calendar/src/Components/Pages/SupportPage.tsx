import { useState } from "react"
import { Button } from "antd"
import RequestForm from "../UI/UserForms/RequestForm"
import RequestsList from "../UI/Other/RequestsList"

export default function SupportPage() {
    const [createRequest, setCreateRequest] = useState<boolean>(false)

    return (
        <div>
            <div style={{ textAlign: "center" }}>
                <Button onClick={() => setCreateRequest((prev) => !prev)}>
                    {createRequest ? " ביטול בקשה" : "יצירת בקשה"}
                </Button>
            </div>
            {createRequest && <RequestForm />}
            <RequestsList />
        </div>
    )
}
