import { useRef, useState } from "react"
import Alert from "antd/es/alert"
import Form from "antd/es/form"
import Input, { InputRef } from "antd/es/input"
import { supabase } from "../../supabase/client"
import { Icon } from "../Common/Icon"
import "../../styles/reset-password-request.css"

function ResetPasswordRequest() {
    const emailRef = useRef<InputRef>(null)

    const [loading, setLoading] = useState<boolean>(false)
    const [message, setMessage] = useState<string>("")
    const [mailSent, setMailSent] = useState<boolean>(false)
    const [messageType, setMessageType] = useState<"info" | "error">()

    const onFinish = async () => {
        try {
            setMessage("")
            setLoading(true)
            const email = emailRef.current?.input?.value
            if (!email) {
                throw new Error("Email is required")
            }
            const resetPasswordPage = `${window.location.origin}/reset-password`
            console.log("resetPasswordUrl", resetPasswordPage)
            const { error, data } = await supabase.auth.resetPasswordForEmail(
                email,
                { redirectTo: resetPasswordPage }
            )
            if (error) throw error
            console.log("data", data)
            setMailSent(true)
            setMessage(
                "במידה והכתובת נמצאת במערכת, הקישור לאיפוס הסיסמה נשלח לכתובת המייל שהזנתם בדקות הקרובות, אנא אתחלו את הסיסמה מתוך החשבון שלכם"
            )
            setMessageType("info")
        } catch (e) {
            setMessage("השיחזור נכשל")
            setMessageType("error")
            console.error(`Failed to reset : ${e}`)
        }
        setLoading(false)
    }

    return (
        <section className="reset-password-request card">
            <h1 className="title">איפוס סיסמה</h1>

            <h3 className="login-subtitle">נא להזין את המייל שאיתו נרשמתם:</h3>
            <Form
                title=" איפוס סיסמה"
                name="basic"
                labelCol={{ span: 16 }}
                wrapperCol={{ span: 24 }}
                style={{ maxWidth: 400 }}
                onFinish={onFinish}
            >
                <Form.Item>
                    <Input
                        type="email"
                        placeholder="אימייל"
                        ref={emailRef}
                        required
                        disabled={mailSent}
                        className="form-input-large"
                        prefix={<Icon icon="mail" />}
                    />
                </Form.Item>
                {message ? (
                    <Form.Item>
                        <Alert description={message} type={messageType} />
                    </Form.Item>
                ) : (
                    <></>
                )}
                {!mailSent ? (
                    <Form.Item style={{ marginBottom: "8px" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="general-action-btn black-btn large-btn"
                        >
                            איפוס סיסמה
                        </button>
                    </Form.Item>
                ) : (
                    <></>
                )}
            </Form>
        </section>
    )
}

export default ResetPasswordRequest
