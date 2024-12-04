import RequestForm from "../Requests/RequestForm"
import OpenRequest from "../Requests/OpenRequest"
import { userRequestVM } from "../Requests/UserRequestVM"
import { observer } from "mobx-react-lite"
import Card from "antd/lib/card/Card"
import { UserTypeHebrew } from "../../util/interfaces"

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
            {userRequestVM.showUserStatus && (
                <article className="support-page-description">
                    <Card>
                        <p dir="rtl">
                            <label>
                                אתם רשומים כ
                                <b>
                                    {
                                        UserTypeHebrew[
                                            userRequestVM.currentUserType
                                        ]
                                    }
                                </b>
                            </label>
                            <br />
                            על מנת לשנות את המעמד שלכם אנא מלאו טופס הרשמה
                        </p>
                        <button
                            className="general-action-btn black-btn"
                            onClick={() => userRequestVM.setEditingRequest()}
                        >
                            הרשמה
                        </button>
                    </Card>
                </article>
            )}
            {userRequestVM.showRequestForm && <RequestForm />}
            {userRequestVM.showOpenRequest && <OpenRequest />}
        </div>
    )
}

export default observer(SupportPage)
