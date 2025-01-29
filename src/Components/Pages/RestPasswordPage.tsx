import Alert from "antd/es/alert"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { supabase } from "../../supabase/client"
import { useState } from "react"
import "../../styles/reset-password-page.scss"
import { getTranslation } from "../../util/translations"
import { store } from "../../Store/store"
import { observer } from "mobx-react-lite"

export default observer(function ResetPasswordPage() {
    const [form] = Form.useForm()
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<
        "success" | "error" | "info" | "warning" | undefined
    >("success")

    const onFinish = async (values: any) => {
        setMessage(null)
        if (values.password !== values.passwordConfirmation) {
            return
        }
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: values.password,
            })

            if (error) {
                throw error
            }

            if (data) {
                setMessage("הסיסמה עודכנה בהצלחה")
                setMessageType("success")
                form.resetFields()
            }
        } catch (err: any) {
            if (
                err.message ===
                "New password should be different from the old password."
            ) {
                setMessage("הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית")
                setMessageType("error")
            } else {
                setMessage("אירעה שגיאה בעת עדכון הסיסמה. אנא נסו שוב.")
                setMessageType("error")
            }
        }
    }
    return (
        <section className={`reset-password-page ${store.getDirection}`}>
            <section className="card">
                <h1 className="general-title">
                    {getTranslation("resetPassword", store.getLanguage)}
                </h1>

                <Form form={form} onFinish={onFinish}>
                    <label className="subTitle">
                        {getTranslation(
                            "resetPasswordSubTitle",
                            store.getLanguage
                        )}
                    </label>
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: "נא להזין סיסמה" },
                            {
                                min: 6,
                                message: "הסיסמה חייבת להכיל לפחות 6 תווים",
                            },
                        ]}
                        style={{ marginBottom: "0" }}
                    >
                        <Input.Password
                            placeholder={getTranslation(
                                "newPassword",
                                store.getLanguage
                            )}
                            style={{ marginBottom: "0.5rem" }}
                            className="form-input-large"
                        />
                    </Form.Item>
                    <Form.Item
                        name="passwordConfirmation"
                        rules={[
                            { required: true, message: "נא להזין סיסמה" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("password") === value
                                    ) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(
                                        new Error("הסיסמאות אינן תואמות")
                                    )
                                },
                            }),
                        ]}
                        style={{ marginBottom: "8px" }}
                    >
                        <Input.Password
                            placeholder={getTranslation(
                                "repeatPassword",
                                store.getLanguage
                            )}
                            style={{ marginBottom: "0.5rem" }}
                            className="form-input-large"
                        />
                    </Form.Item>
                    {message ? (
                        <Form.Item>
                            <Alert description={message} type={messageType} />
                        </Form.Item>
                    ) : (
                        <></>
                    )}
                    <button type="submit" className="general-action-btn">
                        {getTranslation("save", store.getLanguage)}
                    </button>
                </Form>
            </section>
        </section>
    )
})
