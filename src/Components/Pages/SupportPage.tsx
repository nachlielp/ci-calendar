import RequestForm from "../Requests/RequestForm"
import OpenRequest from "../Requests/OpenRequest"
import { userRequestVM } from "../Requests/UserRequestVM"
import { observer } from "mobx-react-lite"
import { UserTypeHebrew } from "../../util/interfaces"
import "../../styles/support-page.css"
import { EMAIL_SUPPORT } from "../../App"

const SupportPage = () => {
    return (
        <section className="support-page">
            <h2>הרשמה כמורה או ארגון</h2>
            {userRequestVM.showUserStatus && (
                <article className="support-page-description">
                    <section className="card">
                        <p dir="rtl" className="text">
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
                            className="general-action-btn black-btn large-btn"
                            onClick={() => userRequestVM.setEditingRequest()}
                        >
                            הרשמה
                        </button>
                    </section>
                </article>
            )}
            {userRequestVM.showRequestForm && <RequestForm />}
            {userRequestVM.showOpenRequest && <OpenRequest />}
            <label className="support-email">
                <label>לתמיכה שאלות או הערות ניתן לפנות אלינו במייל:</label>
                <a href={`mailto:${EMAIL_SUPPORT}`} target="_blank">
                    {EMAIL_SUPPORT}
                </a>
            </label>
        </section>
    )
}

export default observer(SupportPage)
