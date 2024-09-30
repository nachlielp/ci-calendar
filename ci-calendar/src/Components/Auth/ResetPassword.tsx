import { useRef, useState } from "react"
import { Alert, Button, Card, Form, Input, InputRef } from "antd"
import { useAuthContext } from "./AuthContext"
import { supabase } from "../../supabase/client"

function ResetPassword() {
    const { resetPassword } = useAuthContext()
    if (!resetPassword) {
        throw new Error(
            "AuthContext is null, make sure you're within a Provider"
        )
    }
    const emailRef = useRef<InputRef>(null)

    const [loading, setLoading] = useState<boolean>(false)
    const [message, setMessage] = useState<string>("")
    const [messageType, setMessageType] = useState<"info" | "error">()
    const onFinish = async () => {
        try {
            setMessage("")
            setLoading(true)
            const email = emailRef.current?.input?.value
            if (!email) {
                throw new Error("Email is required")
            }
            const { error, data } = await supabase.auth.resetPasswordForEmail(
                email
            )
            if (error) throw error
            console.log("data", data)
            setMessage(
                "הקישרו לכניסה לחשבון נשלח לכתובת המייל שהזנתם, אנה אתחלו את הסיסמה מתוך החשבון שלכם"
            )
            setMessageType("info")
        } catch (e) {
            setMessage("Failed to reset password")
            setMessageType("error")
            console.error(`Failed to reset password: ${e}`)
        }
        setLoading(false)
    }

    return (
        <Card id="reset-password-form" className="reset-password-form">
            <h1 className="reset-password-title">איפוס סיסמה</h1>

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
                    />
                </Form.Item>
                {message ? (
                    <Form.Item>
                        <Alert description={message} type={messageType} />
                    </Form.Item>
                ) : (
                    <></>
                )}
                <Form.Item style={{ marginBottom: "8px" }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={loading}
                        className="reset-password-button"
                    >
                        איפוס סיסמה
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    )
}

export default ResetPassword
