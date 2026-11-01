import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useSession } from "../../app/viewer"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { AuthAlert, PasswordField } from "./AuthFields"

// Legacy translations.ts and RestPasswordPage.tsx (Hebrew only there).
const COPY = defineCopy({
    he: {
        title: "איפוס סיסמה",
        prompt: "נא להזין את הסיסמה החדשה פעמיים:",
        newPassword: "סיסמה חדשה",
        repeatPassword: "אימות סיסמה חדשה",
        required: "נא להזין סיסמה",
        tooShort: "הסיסמה חייבת להכיל לפחות 6 תווים",
        mismatch: "הסיסמאות אינן תואמות",
        updated: "הסיסמה עודכנה בהצלחה",
        samePassword: "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית",
        failed: "אירעה שגיאה בעת עדכון הסיסמה. אנא נסו שוב.",
        linkExpired: "הקישור לאיפוס הסיסמה פג תוקף או שכבר נעשה בו שימוש.",
        requestNew: "שלחו לי קישור חדש",
    },
    en: {
        title: "Reset Password",
        prompt: "Enter the new password twice:",
        newPassword: "New Password",
        repeatPassword: "Repeat Password",
        required: "Please enter a password",
        tooShort: "The password must be at least 6 characters",
        mismatch: "The passwords don't match",
        updated: "Your password has been updated",
        samePassword: "The new password must differ from the current one",
        failed: "Something went wrong updating the password. Please try again.",
        linkExpired:
            "This password reset link has expired or was already used.",
        requestNew: "Send me a new link",
    },
    ru: {
        title: "Сбросить пароль",
        prompt: "Введите новый пароль дважды:",
        newPassword: "Новый пароль",
        repeatPassword: "Повторите пароль",
        required: "Введите пароль",
        tooShort: "Пароль должен содержать не менее 6 символов",
        mismatch: "Пароли не совпадают",
        updated: "Пароль обновлён",
        samePassword: "Новый пароль должен отличаться от текущего",
        failed: "Не удалось обновить пароль. Попробуйте снова.",
        linkExpired:
            "Срок действия ссылки для сброса пароля истёк, или она уже использована.",
        requestNew: "Отправить новую ссылку",
    },
})

type Copy = (typeof COPY)["he"]
type FieldError = keyof Pick<Copy, "required" | "tooShort" | "mismatch">
type Result = keyof Pick<Copy, "updated" | "samePassword" | "failed">

/** Legacy's form rules: required, at least 6 characters, both the same. */
function validate(password: string, repeat: string) {
    const first: FieldError | undefined = !password
        ? "required"
        : password.length < 6
          ? "tooShort"
          : undefined
    const second: FieldError | undefined = !repeat
        ? "required"
        : repeat !== password
          ? "mismatch"
          : undefined
    return { first, second }
}

/**
 * `/reset-password` (legacy ResetPasswordPage): sets a new password. Opened
 * from the menu by a signed-in user, or from the emailed link, whose
 * `#access_token=…&type=recovery` becomes the session as the app boots
 * (`createAuth`, which also clears it from the URL). An expired or used link
 * (`#error=…&error_code=otp_expired`) says so and offers a new one; that is
 * expected, so nothing is reported.
 */
export default function ResetPasswordPage() {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const { auth, telemetry } = useServices()
    const session = useSession()
    const linkError = auth.redirectError()
    const [errors, setErrors] = useState<ReturnType<typeof validate>>({
        first: undefined,
        second: undefined,
    })
    const [result, setResult] = useState<Result | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => auth.start(), [auth])

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formElement = event.currentTarget
        const form = new FormData(formElement)
        const password = String(form.get("password") ?? "")
        const checked = validate(password, String(form.get("repeat") ?? ""))
        setErrors(checked)
        setResult(null)
        if (checked.first || checked.second) return

        setBusy(true)
        const { error } = await auth.updatePassword(password)
        setBusy(false)
        if (!error) {
            setResult("updated")
            formElement.reset()
        } else if (error.code === "same_password") {
            setResult("samePassword")
        } else {
            setResult("failed")
            // Signed out (no link, or one that failed) is no bug.
            if (error.code === "session_not_found") return
            telemetry.captureError(new Error(error.message), {
                source: "reset-password",
            })
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card reset-card card">
                <h1 className="auth-title">{copy.title}</h1>
                {linkError && (
                    <div className="auth-form">
                        <AuthAlert kind="error">{copy.linkExpired}</AuthAlert>
                        <Link
                            to="/reset-password-request"
                            className="auth-text-link"
                        >
                            {copy.requestNew}
                        </Link>
                    </div>
                )}
                {!(linkError && !session) && (
                    <form className="auth-form" onSubmit={save} noValidate>
                        <span className="auth-prompt">{copy.prompt}</span>
                        <PasswordField
                            label={copy.newPassword}
                            name="password"
                            autoComplete="new-password"
                            error={errors.first && copy[errors.first]}
                        />
                        <PasswordField
                            label={copy.repeatPassword}
                            name="repeat"
                            autoComplete="new-password"
                            error={errors.second && copy[errors.second]}
                        />
                        {result && (
                            <AuthAlert
                                kind={
                                    result === "updated" ? "success" : "error"
                                }
                            >
                                {copy[result]}
                            </AuthAlert>
                        )}
                        <button
                            type="submit"
                            className="auth-submit small"
                            disabled={busy}
                        >
                            {common.save}
                        </button>
                    </form>
                )}
            </section>
        </main>
    )
}
