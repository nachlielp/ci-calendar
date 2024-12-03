import RequestForm from "../Requests/RequestForm"
import OpenRequest from "../Requests/OpenRequest"
import { userRequestVM } from "../Requests/UserRequestVM"
import { observer } from "mobx-react-lite"

const SupportPage = () => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <h2>הרשמה כמורה או ארגון</h2>
            {userRequestVM.showRequestForm ? <RequestForm /> : <OpenRequest />}
        </div>
    )
}

export default observer(SupportPage)
