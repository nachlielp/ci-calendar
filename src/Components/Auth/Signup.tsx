import { useEffect, useRef, useState } from "react"
import '../../styles/signup.scss'
import Alert from "antd/es/alert"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { InputRef } from "antd/es/input"
import { useNavigate } from "react-router"
import { supabase } from "../../supabase/client"
import { Icon } from "../Common/Icon"
import { store } from "../../Store/store"

enum SignupError {
    none = "",
    passwordsDontMatch = "הסיסמאות לא תואמות",
    passwordToShort = "סיסמה חייבת להיות לפחות 6 תווים",
}

export default function Signup() {
    const nameRef = useRef<InputRef>(null)
    const emailRef = useRef<InputRef>(null)
    const passwordRef = useRef<InputRef>(null)
    const passwordConfRef = useRef<InputRef>(null)
    const [error, setError] = useState<SignupError>(SignupError.none)
    const [loading, setLoading] = useState<boolean>(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (store.isUser) {
            navigate(`/`)
        } else {
            store.clearUser()
        }
    }, [store.isUser])

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
        <section id="signup-form" className="signup-form card">
            <h1 className="signup-title">הרשמה</h1>

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
                        className="form-input-large signup-input"
                        prefix={<Icon icon="person" />}
                    />
                </Form.Item>
                <Form.Item style={{ margin: "8px" }}>
                    <Input
                        type="email"
                        placeholder="כתובת מייל"
                        ref={emailRef}
                        required
                        className="form-input-large signup-input"
                        prefix={<Icon icon="mail" />}
                    />
                </Form.Item>
                <Form.Item style={{ margin: "8px" }}>
                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder="סיסמה"
                        ref={passwordRef}
                        required
                        className="form-input-large signup-input"
                        prefix={<Icon icon="lock" />}
                    />
                </Form.Item>
                <Form.Item style={{ margin: "8px" }}>
                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder="אימות סיסמה"
                        ref={passwordConfRef}
                        required
                        className="form-input-large signup-input"
                        prefix={<Icon icon="lock" />}
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
                        className="general-action-btn black-btn large-btn"
                    >
                        הרשמה
                    </button>
                    <button
                        onClick={onSupabaseGoogleSignIn}
                        disabled={loading}
                        className="google-button default-font "
                    >
                        <label className="google-button-label">כניסה עם </label>
                        <Icon
                            icon="google_color"
                            className="icon-main google-icon"
                        />
                    </button>
                </article>
            </Form>
        </section>
    )
}
