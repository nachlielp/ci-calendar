import { useState, useRef } from "react"
import { Alert, Button, Card, Form, Input, InputRef } from "antd"
// import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "./AuthContext"
import { LinkButton } from "../UI/Other/LinkButton"
import { supabase } from "../../supabase/client"

enum LoginError {
    none = "",
    wrongPassword = "הסימה לא מתאימה לכתובת מייל",
    default = "שגיאת התחברות",
}

export default function Login() {
    const { googleLogin, emailLogin } = useAuthContext()
    if (!googleLogin || !emailLogin) {
        throw new Error(
            "AuthContext is null, make sure you're within a Provider"
        )
    }
    const emailRef = useRef<InputRef>(null)
    const passwordRef = useRef<InputRef>(null)
    const [error, setError] = useState<LoginError>(LoginError.none)
    const [loading, setLoading] = useState<boolean>(false)
    const navigate = useNavigate()

    const onFinish = async () => {
        try {
            setError(LoginError.none)
            setLoading(true)
            const email = emailRef.current?.input?.value
            const password = passwordRef.current?.input?.value
            if (!email || !password) {
                throw new Error("Email and password are required")
            }
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            navigate(`/`)
        } catch (e) {
            setError(LoginError.default)
            console.error(`Login Error:`, e)
        }
        setLoading(false)
    }

    const onSupabaseGoogleSignIn = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
        })
        if (error) {
            alert(error.message)
        }
        setLoading(false)
    }

    return (
        <Card id="login-form" className="login-form">
            <h1 className="login-title">כניסה</h1>
            <Form
                name="basic"
                labelCol={{ span: 16 }}
                wrapperCol={{ span: 24 }}
                style={{ maxWidth: 500 }}
                onFinish={onFinish}
            >
                <Form.Item>
                    <Input
                        type="email"
                        placeholder="כתובת מייל"
                        ref={emailRef}
                        required
                    />
                </Form.Item>
                <Form.Item>
                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder="סיסמה"
                        ref={passwordRef}
                        required
                        className="default-font"
                    />
                </Form.Item>
                {error ? (
                    <Form.Item>
                        <Alert description={error} type="error" />
                    </Form.Item>
                ) : (
                    <></>
                )}

                <Form.Item style={{ marginBottom: "8px" }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={loading}
                        className="login-button default-font"
                    >
                        כניסה
                    </Button>
                </Form.Item>
            </Form>
            <div>
                <Button
                    type="default"
                    onClick={onSupabaseGoogleSignIn}
                    disabled={loading}
                    className="google-button default-font"
                >
                    כניסה עם Google
                </Button>
            </div>

            <div className="link-container">
                <LinkButton to="/reset-password" className="default-font">
                    איפוס סיסמה
                </LinkButton>
                <LinkButton to="/signup" className="default-font">
                    הרשמה
                </LinkButton>
            </div>
        </Card>
    )
}
