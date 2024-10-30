import { useEffect, useRef, useState } from "react"
import Alert from "antd/es/alert"
import Button from "antd/es/button"
import Card from "antd/es/card"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { InputRef } from "antd/es/input"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { supabase } from "../../supabase/client"
import { Icon } from "../UI/Other/Icon"

enum SignupError {
    none = "",
    passwordsDontMatch = "הסיסמאות לא תואמות",
    passwordToShort = "סיסמה חייבת להיות לפחות 6 תווים",
}

export default function Signup() {
    const { user } = useUser()
    const nameRef = useRef<InputRef>(null)
    const emailRef = useRef<InputRef>(null)
    const passwordRef = useRef<InputRef>(null)
    const passwordConfRef = useRef<InputRef>(null)
    const [error, setError] = useState<SignupError>(SignupError.none)
    const [loading, setLoading] = useState<boolean>(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (user != null) {
            navigate("/")
        }
    }, [user])

    const onFinish = async () => {
        if (
            passwordRef.current?.input?.value !==
            passwordConfRef.current?.input?.value
        ) {
            return setError(SignupError.passwordsDontMatch)
        }
        try {
            setError(SignupError.none)
            setLoading(true)
            const email = emailRef.current?.input?.value
            const password = passwordRef.current?.input?.value
            const name = nameRef.current?.input?.value
            if (!email || !password || !name) {
                throw new Error("Email or password is null")
            }
            //TODO add method that creates user and passes name not create user in supabase
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } },
            })
            if (error) {
                throw error
            }
            navigate("/")
        } catch (e) {
            if (e instanceof Error) {
                //TODO add more specific error handling
                setError(SignupError.passwordToShort)
                console.error(` Error: ${e}`)
            } else {
                console.error(`Other Error: ${e}`)
            }
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
        <Card id="signup-form" className="signup-form">
            <h1 className="general-title">הרשמה</h1>

            <Form
                title="הרשמה"
                name="basic"
                labelCol={{ span: 16 }}
                wrapperCol={{ span: 24 }}
                className="signup-form-content"
                onFinish={onFinish}
            >
                <Form.Item style={{ margin: "8px" }}>
                    <Input
                        type="text"
                        placeholder="שם"
                        ref={nameRef}
                        required
                        className="signup-input"
                    />
                </Form.Item>
                <Form.Item style={{ margin: "8px" }}>
                    <Input
                        type="email"
                        placeholder="כתובת מייל"
                        ref={emailRef}
                        required
                        className="signup-input"
                    />
                </Form.Item>
                <Form.Item style={{ margin: "8px" }}>
                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder="סיסמה"
                        ref={passwordRef}
                        required
                        className="signup-input"
                    />
                </Form.Item>
                <Form.Item style={{ margin: "8px" }}>
                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder="אימות סיסמה"
                        ref={passwordConfRef}
                        required
                        className="signup-input"
                    />
                </Form.Item>

                {error && (
                    <Form.Item>
                        <Alert
                            description={error}
                            type="error"
                            className="signup-alert"
                        />
                    </Form.Item>
                )}

                <article className="button-container">
                    <button
                        type="submit"
                        disabled={loading}
                        className="general-action-btn"
                    >
                        הרשמה
                    </button>
                    <Button
                        type="default"
                        onClick={onSupabaseGoogleSignIn}
                        disabled={loading}
                        className="google-button"
                    >
                        <label className="google-button-label">כניסה עם </label>
                        &nbsp;
                        <Icon
                            icon="google_color"
                            className="icon-main google-icon"
                        />
                    </Button>
                </article>
                <Form.Item></Form.Item>
            </Form>
        </Card>
    )
}
