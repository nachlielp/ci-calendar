import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import Card from "antd/es/card/Card"
import { UserTypeHebrew } from "../../util/interfaces"
import { userRequestVM } from "./UserRequestVM"

const OpenRequest = () => {
    const openPositionRequest = store.getOpenPositionRequests
    if (!openPositionRequest) return <></>

    const cancelRequest = () => {
        userRequestVM.closeRequest()
    }

    return (
        <Card className="open-request">
            <article>
                <label>
                    בקשתך להרשמה
                    <b>
                        {" "}
                        כ
                        {
                            UserTypeHebrew[
                                openPositionRequest.type as keyof typeof UserTypeHebrew
                            ]
                        }
                    </b>{" "}
                    נקלטה בהצלחה.
                    <br />
                    אם יש צורך במידע נוסף אנו ניצור קשר טלפוני.
                    <br />
                    <br />
                    עדכון לגבי סטטוס הבקשה ישלח לכאן, על מנת לקבל נוטיפיקציה
                    צריך להפעיל את ההתראות באפליקציה.
                </label>
            </article>
            <article className="submit-button-container">
                <button
                    onClick={userRequestVM.setEditingRequest}
                    className="general-action-btn black-btn"
                    type="button"
                >
                    עריכת הבקשה
                </button>
                <button
                    onClick={cancelRequest}
                    className="general-action-btn black-btn"
                    type="button"
                >
                    ביטול הבקשה
                </button>
            </article>
        </Card>
    )
}

export default observer(OpenRequest)
