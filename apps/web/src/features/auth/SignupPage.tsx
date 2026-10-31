import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { defineCopy } from "../../lib/copy"
import { MailIcon } from "../../ui/icons/MailIcon"
import { PersonIcon } from "../../ui/icons/PersonIcon"
import { AuthAlert, AuthField, GoogleButton, PasswordField } from "./AuthFields"

// Legacy translations.ts (signUp, name, …) and Signup.tsx's errors. Legacy
// showed "too short" for every failure; an address already registered and
// other failures now say so.
const COPY = defineCopy({
    he: {
        title: "הרשם",
        name: "שם",
        email: "אימייל",
        password: "סיסמה",
        repeatPassword: "אימות סיסמה חדשה",
        signUp: "הרשם",
        passwordsDontMatch: "הסיסמאות לא תואמות",
        passwordTooShort: "סיסמה חייבת להיות לפחות 6 תווים",
        emailTaken: "כבר קיים חשבון עם כתובת המייל הזו",
        failed: "ההרשמה נכשלה, נסו שוב",
    },
    en: {
        title: "Sign Up",
        name: "Name",
        email: "Email",
        password: "Password",
        repeatPassword: "Repeat Password",
        signUp: "Sign Up",
        passwordsDontMatch: "The passwords don't match",
        passwordTooShort: "The password must be at least 6 characters",
        emailTaken: "An account with this email already exists",
        failed: "Sign-up failed, please try again",
    },
    ru: {
        title: "Зарегистрироваться",
        name: "Имя",
        email: "Электронная почта",
        password: "Пароль",
        repeatPassword: "Повторите пароль",
        signUp: "Зарегистрироваться",
        passwordsDontMatch: "Пароли не совпадают",
        passwordTooShort: "Пароль должен содержать не менее 6 символов",
        emailTaken: "Аккаунт с этой почтой уже существует",
        failed: "Не удалось зарегистрироваться, попробуйте снова",
    },
})

type SignupError = keyof Pick<
    (typeof COPY)["he"],
    "passwordsDontMatch" | "passwordTooShort" | "emailTaken" | "failed"
>

/**
 * `/signup` (legacy Signup): name, email and password, or Google. The
 * project confirms emails automatically, so sign-up signs in at once and
 * goes to the calendar; the account's `users` row is created the first time
 * it is seen without one (`profileQuery`), as legacy did.
 */
export default function SignupPage() {
    const copy = useCopy(COPY)
    const { auth, telemetry } = useServices()
    const navigate = useNavigate()
    const [error, setError] = useState<SignupError | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => auth.start(), [auth])

    async function signUp(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const password = String(form.get("password"))
        if (password !== form.get("repeatPassword")) {
            setError("passwordsDontMatch")
            return
        }
        setError(null)
        setBusy(true)
        const { error: failure } = await auth.signUp({
            name: String(form.get("name")),
            email: String(form.get("email")),
            password,
        })
        setBusy(false)
        if (!failure) {
            await navigate("/")
        } else if (failure.code === "weak_password") {
            setError("passwordTooShort")
        } else if (failure.code === "user_already_exists") {
            setError("emailTaken")
        } else {
            setError("failed")
            telemetry.captureError(new Error(failure.message), {
                source: "signup",
            })
        }
    }

    async function signInWithGoogle() {
        setError(null)
        setBusy(true)
        const { error: failure } = await auth.signInWithGoogle()
        setBusy(false)
        if (failure) setError("failed")
    }

    const passwordError =
        error === "passwordsDontMatch" || error === "passwordTooShort"

    return (
        <main className="auth-page">
            <section className="auth-card signup-card card">
                <h1 className="auth-title">{copy.title}</h1>
                <form className="auth-form" onSubmit={signUp}>
                    <AuthField
                        Icon={PersonIcon}
                        label={copy.name}
                        name="name"
                        autoComplete="name"
                        required
                    />
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
                        autoComplete="new-password"
                        required
                        error={passwordError}
                    />
                    <PasswordField
                        label={copy.repeatPassword}
                        name="repeatPassword"
                        autoComplete="new-password"
                        required
                        error={passwordError}
                    />
                    {error && <AuthAlert kind="error">{copy[error]}</AuthAlert>}
                    <div className="auth-buttons">
                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={busy}
                        >
                            {copy.signUp}
                        </button>
                        <GoogleButton
                            disabled={busy}
                            onClick={signInWithGoogle}
                        />
                    </div>
                </form>
            </section>
        </main>
    )
}
