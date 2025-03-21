import { observer } from "mobx-react-lite"
import { UserTypeHebrew } from "../../util/interfaces"
import { userRequestVM } from "./UserRequestVM"
import '../../styles/open-request.scss'

const OpenRequest = () => {
    if (!userRequestVM.openPositionRequest) return <></>

    return (
        <section className="open-request card">
            <article>
                <label className="text">
                    בקשתך להרשמה
                    <b>
                        {" "}
                        כ
                        {
                            UserTypeHebrew[
                                userRequestVM.getRequestType as keyof typeof UserTypeHebrew
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
                    className="text-btn"
                    type="button"
                >
                    עריכת הבקשה
                </button>
                <button
                    onClick={userRequestVM.closeRequest}
                    className="text-btn"
                    type="button"
                >
                    ביטול הבקשה
                </button>
            </article>
        </section>
    )
}

export default observer(OpenRequest)
