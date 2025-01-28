import { useState, useRef } from "react"
import "../../styles/login.scss"
import Alert from "antd/es/alert"
import Form from "antd/es/form"
import Input, { InputRef } from "antd/es/input"
import { supabase } from "../../supabase/client"
import { Icon } from "../Common/Icon"
import { LinkButton } from "../Common/LinkButton"
import { useClearUser } from "../../hooks/useClearUser"
import { useNavigate } from "react-router"
import { translations } from "../../util/translations"
import { store } from "../../Store/store"
import { observer } from "mobx-react-lite"
import { Language } from "../../util/interfaces"

enum LoginError {
    none = "",
    wrongPassword = "הסימה לא מתאימה לכתובת מייל",
    default = "שגיאת התחברות",
}

export default observer(function Login() {
    const emailRef = useRef<InputRef>(null)
    const passwordRef = useRef<InputRef>(null)
    const [error, setError] = useState<LoginError>(LoginError.none)
    const [loading, setLoading] = useState<boolean>(false)
    const navigate = useNavigate()

    useClearUser()

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
        } finally {
            setLoading(false)
        }
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
        <section
            id="login-form"
            className={`login-form card ${
                store.getLanguage === Language.he ? "rtl" : "ltr"
            }`}
        >
            <h1 className="login-title">
                {translations[store.getLanguage].loginTitle}
            </h1>
            <h3 className="login-subtitle">
                {translations[store.getLanguage].loginSubtitle}
            </h3>
            <div>
                <button
                    onClick={onSupabaseGoogleSignIn}
                    disabled={loading}
                    className="google-button default-font "
                >
                    <label className="google-button-label">
                        {translations[store.getLanguage].loginWith}
                    </label>
                    <Icon
                        icon="google_color"
                        className="icon-main google-icon"
                    />
                </button>
            </div>
            <Form
                name="basic"
                labelCol={{ span: 16 }}
                wrapperCol={{ span: 24 }}
                style={{ maxWidth: 500 }}
                onFinish={onFinish}
            >
                <h3 className="login-subtitle">
                    {translations[store.getLanguage].loginWithPassword}
                </h3>

                <Form.Item>
                    <Input
                        type="email"
                        placeholder={translations[store.getLanguage].email}
                        ref={emailRef}
                        required
                        style={{ marginBottom: "8px" }}
                        allowClear
                        size="large"
                        prefix={<Icon icon="mail" />}
                        className="form-input-large login-input"
                    />

                    <Input.Password
                        status={error ? "error" : undefined}
                        placeholder={translations[store.getLanguage].password}
                        ref={passwordRef}
                        required
                        className="form-input-large login-input"
                        allowClear
                        size="large"
                        prefix={<Icon icon="lock" />}
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
                        className="general-action-btn black-btn large-btn"
                    >
                        {translations[store.getLanguage].signin}
                    </button>
                </Form.Item>
            </Form>

            <div className="link-container">
                <div className="spacer">
                    {translations[store.getLanguage].hereForTheFirstTime}
                    <LinkButton to="/signup" className="text-btn">
                        {translations[store.getLanguage].signUp}
                    </LinkButton>
                </div>
                <div className="spacer">
                    {translations[store.getLanguage].forgotPassword}
                    <LinkButton
                        to="/reset-password-request"
                        className="text-btn"
                    >
                        {translations[store.getLanguage].resetPassword}
                    </LinkButton>
                </div>
            </div>
        </section>
    )
})
