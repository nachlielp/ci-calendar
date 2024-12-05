import Alert from "antd/es/alert"
import Card from "antd/es/card"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { supabase } from "../../supabase/client"
import { useState } from "react"

export default function ResetPasswordPage() {
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
        <section className="reset-password-page">
            <Card>
                <h1 className="general-title">עדכון סיסמה</h1>

                <Form form={form} onFinish={onFinish}>
                    <label style={{ marginBottom: "0.5rem" }}>
                        נא להזין את הסיסמה החדשה פעמים:
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
                            placeholder="סיסמה חדשה"
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
                            placeholder="אימות סיסמה חדשה"
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
                        שמירה
                    </button>
                </Form>
            </Card>
        </section>
    )
}
