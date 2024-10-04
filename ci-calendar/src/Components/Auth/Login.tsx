import { useState, useRef } from "react"
import { Alert, Button, Card, Form, Input, InputRef } from "antd"
// import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "./AuthContext"
import { LinkButton } from "../UI/Other/LinkButton"
import { supabase } from "../../supabase/client"
import { Icon } from "../UI/Other/Icon"

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
            <h1 className="login-title">כניסה והזדהות</h1>
            <div>
                <Button
                    type="default"
                    onClick={onSupabaseGoogleSignIn}
                    disabled={loading}
                    className="google-button default-font"
                >
                    <label className="google-button-label">כניסה עם </label>
                    <Icon
                        icon="google_color"
                        className="icon-main google-icon"
                    />
                </Button>
            </div>
            <Form
                name="basic"
                labelCol={{ span: 16 }}
                wrapperCol={{ span: 24 }}
                style={{ maxWidth: 500 }}
                onFinish={onFinish}
            >
                <h3 className="login-subtitle">כניסה עם סיסמה:</h3>
                <Form.Item>
                    <Input
                        type="email"
                        placeholder="כתובת מייל"
                        // prefix={
                        //     <Icon icon="mail" className="login-input-icon" />
                        // }
                        ref={emailRef}
                        required
                        style={{ marginBottom: "8px" }}
                        allowClear
                    />

                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder="סיסמה"
                        ref={passwordRef}
                        required
                        className="default-font"
                        allowClear
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
                    <button
                        type="submit"
                        disabled={loading}
                        className="general-action-btn"
                    >
                        כניסה
                    </button>
                </Form.Item>
            </Form>

            <div className="link-container">
                <LinkButton
                    to="/reset-password-request"
                    className="login-secondary-btn"
                >
                    איפוס סיסמה
                </LinkButton>
                <LinkButton to="/signup" className="login-secondary-btn">
                    הרשמה
                </LinkButton>
            </div>
        </Card>
    )
}
