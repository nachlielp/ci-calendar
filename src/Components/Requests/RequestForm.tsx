import Form, { FormProps } from "antd/es/form"
import Input from "antd/es/input"
import Select from "antd/es/select"
import { RequestType } from "../../util/interfaces"
import { useState } from "react"
import Alert from "antd/es/alert"
import "../../styles/request-form.css"

import { userRequestVM } from "./UserRequestVM"
import { observer } from "mobx-react-lite"
import AsyncButton from "../Common/AsyncButton"

type RequestFieldType = {
    requestType: RequestType
    description?: string
    phone?: string
}

const requestOptions = [
    { label: "הרשמה כמורה - יוצר ארועים", value: RequestType.creator },
    { label: "הרשמה כמורה - פרופיל בלבד  ", value: RequestType.profile },
    { label: "הרשמה כארגון", value: RequestType.org },
    // { label: "תמיכה", value: "support" },
]

const profileDescription = (
    <label>
        <b>מורים</b> יכולים ליצור פרופיל ציבורי עם פרטים אישיים ומידע נוסף עבור
        חברי הקהילה. מורים לא מורשים להוסיף אירועים ללוח אירועים.
    </label>
)
const creatorDescription = (
    <label>
        <b>מורים עם הרשאה לפרסום אירועים</b> יכולים ליצור פרופיל ציבורי עם פרטים
        אישיים ומידע נוסף עבור חברי הקהילה. בנוסף, יש אפשרות להוסיף אירועים ללוח
        שנה הציבורי.
    </label>
)
const orgDescription = (
    <label>
        <b>ארגון</b> יכולים ליצור פרופיל ציבורי עם פרטים אישיים ומידע נוסף עבור
        חברי הקהילה. בנוסף, יש אפשרות להוסיף אירועים ללוח שנה הציבורי.
    </label>
)

const RequestForm = () => {
    const [inputErrors, setInputErrors] = useState<boolean>(false)

    const [form] = Form.useForm()

    const filteredRequestOptions = requestOptions.filter(
        (option) =>
            String(option.value) !== String(userRequestVM.currentUserType)
    )

    const onFinish = async () => {
        await form.validateFields()
        const values = form.getFieldsValue()
        if (!userRequestVM.openPositionRequest) {
            try {
                console.log("RequestForm.onFinish.createRequest")
                await userRequestVM.createRequest({
                    type: values.requestType as RequestType,
                    phone: values.phone || "",
                    message: values.description || "",
                })
            } catch (error) {
                console.error("RequestForm.onFinish.error: ", error)
            } finally {
                userRequestVM.closeForm()
            }
        } else if (userRequestVM.openPositionRequest) {
            try {
                console.log("RequestForm.onFinish.updateRequest")
                await userRequestVM.updateRequest({
                    type: values.requestType as RequestType,
                    phone: values.phone || "",
                    message: values.description || "",
                })
            } catch (error) {
                console.error("RequestForm.onFinish.error: ", error)
            } finally {
                userRequestVM.closeForm()
            }
        }
    }

    const onFinishFailed: FormProps<RequestFieldType>["onFinishFailed"] =
        () => {
            setInputErrors(true)
        }

    return (
        <div className="request-form">
            <section className="request-form-card card">
                <Form
                    form={form}
                    autoComplete="off"
                    initialValues={{
                        phone: userRequestVM.getPhone,
                        requestType: userRequestVM.getRequestType,
                        description: userRequestVM.getDescription,
                    }}
                    style={{ minHeight: "130px" }}
                    onFinishFailed={onFinishFailed}
                >
                    <Form.Item<RequestFieldType>
                        name="requestType"
                        rules={[
                            {
                                required: true,
                                message: "Please select a request type",
                            },
                        ]}
                    >
                        <Select
                            placeholder="סוג הבקשה"
                            options={filteredRequestOptions}
                            onChange={(value) =>
                                userRequestVM.setRequestType(
                                    value as RequestType
                                )
                            }
                            size="large"
                            className="form-input-large"
                            popupClassName="form-input-large"
                        />
                    </Form.Item>

                    {userRequestVM.getRequestType && (
                        <>
                            <Form.Item>
                                {userRequestVM.getRequestType ===
                                    RequestType.org && (
                                    <label className="text">
                                        {orgDescription}
                                    </label>
                                )}
                                {userRequestVM.getRequestType ===
                                    RequestType.creator && (
                                    <label className="text">
                                        {creatorDescription}
                                    </label>
                                )}
                                {userRequestVM.getRequestType ===
                                    RequestType.profile && (
                                    <label className="text">
                                        {profileDescription}
                                    </label>
                                )}
                            </Form.Item>
                            <Form.Item<RequestFieldType>
                                name="phone"
                                rules={[
                                    {
                                        required: true,
                                        message: "נא להזין מספר פלאפון",
                                    },
                                    {
                                        pattern:
                                            /^(?:\+972|972|0)5[0-9][0-9]{7}$/,
                                        message:
                                            "נא להזין מספר פלאפון ישראלי תקין",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="מספר פלאפון"
                                    className="form-input-large"
                                />
                            </Form.Item>

                            <Form.Item<RequestFieldType>
                                name="description"
                                rules={[
                                    {
                                        required: true,
                                        message: "נא להזין תיאור ",
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder={
                                        userRequestVM.getRequestType ===
                                        RequestType.support
                                            ? "תיאור הבקשה"
                                            : "קצת עליי והערות נוספות"
                                    }
                                    rows={6}
                                    className="form-input-large"
                                />
                            </Form.Item>
                            {inputErrors && (
                                <Alert
                                    message="ערכים שגויים, נא לבדוק את הטופס"
                                    type="error"
                                    style={{
                                        margin: "10px 0",
                                        fontSize: "18px",
                                    }}
                                />
                            )}
                            <Form.Item wrapperCol={{ span: 24 }}>
                                <article className="submit-button-container">
                                    <AsyncButton
                                        isSubmitting={
                                            userRequestVM.getIsSubmitting
                                        }
                                        className="general-action-btn black-btn large-btn"
                                        callback={onFinish}
                                    >
                                        {userRequestVM.isOpenPositionRequest
                                            ? "עדכון"
                                            : "הגשה"}
                                    </AsyncButton>
                                    {userRequestVM.isEditRequest && (
                                        <AsyncButton
                                            isSubmitting={
                                                userRequestVM.getIsSubmitting
                                            }
                                            callback={userRequestVM.closeForm}
                                            className="text-btn large-btn"
                                        >
                                            ביטול
                                        </AsyncButton>
                                    )}
                                </article>
                            </Form.Item>
                        </>
                    )}
                </Form>
            </section>
        </div>
    )
}

export default observer(RequestForm)
