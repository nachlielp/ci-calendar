import { useRef, useState } from "react"
import Alert from "antd/es/alert"
import Card from "antd/es/card"
import Form from "antd/es/form"
import Input, { InputRef } from "antd/es/input"
import { supabase } from "../../supabase/client"

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
        <Card id="reset-password-form" className="reset-password-form">
            <h1 className="general-title">איפוס סיסמה</h1>

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
                            className="general-action-btn"
                        >
                            איפוס סיסמה
                        </button>
                    </Form.Item>
                ) : (
                    <></>
                )}
            </Form>
        </Card>
    )
}

export default ResetPasswordRequest
