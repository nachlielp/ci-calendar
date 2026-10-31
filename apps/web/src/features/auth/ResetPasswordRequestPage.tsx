import { useEffect, useState, type FormEvent } from "react"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { defineCopy } from "../../lib/copy"
import { MailIcon } from "../../ui/icons/MailIcon"
import { AuthAlert, AuthField } from "./AuthFields"

// Legacy translations.ts and ResetPasswordRequest.tsx (Hebrew only there).
const COPY = defineCopy({
    he: {
        title: "שכחת סיסמה?",
        subtitle: "נא להזין את המייל שאיתו נרשמתם:",
        email: "אימייל",
        send: "איפוס סיסמה",
        sent: "במידה והכתובת נמצאת במערכת, הקישור לאיפוס הסיסמה ישלח לכתובת המייל שהזנתם בדקות הקרובות, אנא אתחלו את הסיסמה מתוך החשבון שלכם",
        failed: "השיחזור נכשל",
    },
    en: {
        title: "Forgot Password?",
        subtitle: "Enter the email you registered with",
        email: "Email",
        send: "Reset Password",
        sent: "If this address is registered, a password reset link will reach it in the next few minutes. Please set your new password from within your account.",
        failed: "The reset failed",
    },
    ru: {
        title: "Забыли пароль?",
        subtitle: "Введите электронную почту, с которой вы зарегистрировались:",
        email: "Электронная почта",
        send: "Сбросить пароль",
        sent: "Если этот адрес есть в системе, ссылка для сброса пароля придёт на него в ближайшие минуты. Пожалуйста, задайте новый пароль в своём аккаунте.",
        failed: "Не удалось сбросить пароль",
    },
})

/**
 * `/reset-password-request` (legacy ResetPasswordRequest): emails a link
 * to `/reset-password` (the project's auth settings must allow it as a
 * redirect URL). Once sent, the form stays locked.
 */
export default function ResetPasswordRequestPage() {
    const copy = useCopy(COPY)
    const { auth, telemetry } = useServices()
    const [busy, setBusy] = useState(false)
    const [result, setResult] = useState<"sent" | "failed" | null>(null)

    useEffect(() => auth.start(), [auth])

    async function send(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        setResult(null)
        setBusy(true)
        const { error } = await auth.requestPasswordReset(
            String(form.get("email")),
            // The emailed link opens the app here, signed in.
            `${window.location.origin}/reset-password`,
        )
        setBusy(false)
        setResult(error ? "failed" : "sent")
        if (error) {
            telemetry.captureError(new Error(error.message), {
                source: "reset-password-request",
            })
        }
    }

    const sent = result === "sent"

    return (
        <main className="auth-page">
            <section className="auth-card reset-request-card card">
                <h1 className="auth-title">{copy.title}</h1>
                <h2 className="auth-subtitle">{copy.subtitle}</h2>
                <form className="auth-form" onSubmit={send}>
                    <AuthField
                        Icon={MailIcon}
                        label={copy.email}
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={busy || sent}
                    />
                    {result && (
                        <AuthAlert kind={sent ? "info" : "error"}>
                            {copy[result]}
                        </AuthAlert>
                    )}
                    {!sent && !busy && (
                        <button type="submit" className="auth-submit">
                            {copy.send}
                        </button>
                    )}
                </form>
            </section>
        </main>
    )
}
