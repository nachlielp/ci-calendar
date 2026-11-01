import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { MailIcon } from "../../ui/icons/MailIcon"
import { AuthAlert, AuthField, GoogleButton, PasswordField } from "./AuthFields"

// Legacy translations.ts (loginTitle, …) and Login.tsx's error.
const COPY = defineCopy({
    he: {
        title: "כניסה והזדהות",
        subtitle: "על מנת לקבל תזכורות על אירועים יש להירשם:",
        withPassword: "כניסה עם סיסמה",
        email: "אימייל",
        password: "סיסמה",
        signIn: "כניסה",
        failed: "שגיאת התחברות",
        firstTime: "פה בפעם הראשונה?",
        signUp: "הרשם",
        forgotPassword: "שכחת סיסמה?",
        resetPassword: "איפוס סיסמה",
    },
    en: {
        title: "Login",
        subtitle: "To receive reminders for events, please sign up:",
        withPassword: "Login with Password",
        email: "Email",
        password: "Password",
        signIn: "Sign In",
        failed: "Login failed",
        firstTime: "Here for the first time?",
        signUp: "Sign Up",
        forgotPassword: "Forgot Password?",
        resetPassword: "Reset Password",
    },
    ru: {
        title: "Вход и идентификация",
        subtitle:
            "Чтобы получать напоминания о любимых джемах, пожалуйста, зарегистрируйтесь:",
        withPassword: "Вход с паролем",
        email: "Электронная почта",
        password: "Пароль",
        signIn: "Войти",
        failed: "Ошибка входа",
        firstTime: "Впервые здесь?",
        signUp: "Зарегистрироваться",
        forgotPassword: "Забыли пароль?",
        resetPassword: "Сбросить пароль",
    },
})

/**
 * `/login` (legacy Login): Google, or email and password. Success goes to
 * the calendar, as in legacy; the menu follows once the profile loads.
 */
export default function LoginPage() {
    const copy = useCopy(COPY)
    const { auth } = useServices()
    const navigate = useNavigate()
    const [failed, setFailed] = useState(false)
    const [busy, setBusy] = useState(false)

    // Fetch auth-js while the visitor types.
    useEffect(() => auth.start(), [auth])

    async function signIn(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        setFailed(false)
        setBusy(true)
        const { error } = await auth.signInWithPassword(
            String(form.get("email")),
            String(form.get("password")),
        )
        setBusy(false)
        if (error) setFailed(true)
        else await navigate("/")
    }

    async function signInWithGoogle() {
        setFailed(false)
        setBusy(true)
        // On success the browser leaves for Google.
        const { error } = await auth.signInWithGoogle()
        setBusy(false)
        if (error) setFailed(true)
    }

    return (
        <main className="auth-page">
            <section className="auth-card login-card card">
                <h1 className="auth-title">{copy.title}</h1>
                <h2 className="auth-subtitle">{copy.subtitle}</h2>
                <GoogleButton disabled={busy} onClick={signInWithGoogle} />
                <form className="auth-form" onSubmit={signIn}>
                    <h2 className="auth-subtitle">{copy.withPassword}</h2>
                    <AuthField
                        Icon={MailIcon}
                        label={copy.email}
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                    />
                    <PasswordField
                        label={copy.password}
                        name="password"
                        autoComplete="current-password"
                        required
                        error={failed}
                    />
                    {failed && (
                        <AuthAlert kind="error">{copy.failed}</AuthAlert>
                    )}
                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={busy}
                    >
                        {copy.signIn}
                    </button>
                </form>
                <div className="auth-links">
                    <p>
                        {copy.firstTime}
                        <Link to="/signup" className="auth-text-link">
                            {copy.signUp}
                        </Link>
                    </p>
                    <p>
                        {copy.forgotPassword}
                        <Link
                            to="/reset-password-request"
                            className="auth-text-link"
                        >
                            {copy.resetPassword}
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}
