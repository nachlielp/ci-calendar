import { useEffect, useState } from "react"
import RequestForm from "../Requests/RequestForm"
import RequestsList from "../Requests/RequestsList"
import MenuButtons from "../Common/MenuButtons"
import { useNavigate, useParams } from "react-router-dom"

export default function SupportPage() {
    const { requestId } = useParams<{ requestId: string }>()
    const [createRequest, setCreateRequest] = useState<boolean>(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null
    )
    const navigate = useNavigate()

    useEffect(() => {
        if (requestId) {
            setCreateRequest(false)
            setSelectedRequestId(requestId)
        }
    }, [requestId])

    function onSelectKey(key: string) {
        setCreateRequest(key === "create")
        navigate("/request")
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
            {!createRequest && (
                <RequestsList selectedRequestId={selectedRequestId} />
            )}
        </div>
    )
}
