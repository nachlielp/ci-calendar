import { useState, type InputHTMLAttributes, type ReactNode } from "react"
import { useCopy } from "../../app/language"
import { defineCopy } from "../../lib/copy"
import googleLogo from "../../assets/logos/google.svg?no-inline"
import { LockIcon } from "../../ui/icons/LockIcon"
import { VisibilityIcon } from "../../ui/icons/VisibilityIcon"
import { VisibilityOffIcon } from "../../ui/icons/VisibilityOffIcon"
import "./AuthPages.scss"

// The pieces the auth pages share (legacy's antd inputs with an icon inside,
// the password eye, the alert box and the Google button).

const COPY = defineCopy({
    he: {
        showPassword: "הצגת הסיסמה",
        hidePassword: "הסתרת הסיסמה",
        loginWith: "כניסה עם",
        google: "Google",
    },
    en: {
        showPassword: "Show password",
        hidePassword: "Hide password",
        loginWith: "Login with",
        google: "Google",
    },
    ru: {
        showPassword: "Показать пароль",
        hidePassword: "Скрыть пароль",
        loginWith: "Войти с",
        google: "Google",
    },
})

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder">

/** A large input with an icon at its start; the label is its placeholder. */
export function AuthField({
    Icon,
    label,
    error,
    ...input
}: InputProps & {
    Icon: (props: { className?: string }) => ReactNode
    label: string
    /** Marks the field invalid, with this text under it if any. */
    error?: string | boolean
}) {
    return (
        <div className="auth-field-wrapper">
            <label className={`auth-field${error ? " invalid" : ""}`}>
                <Icon className="auth-field-icon" />
                <input
                    className="auth-field-input"
                    placeholder={label}
                    aria-label={label}
                    aria-invalid={error ? true : undefined}
                    {...input}
                />
            </label>
            {typeof error === "string" && error && (
                <p className="auth-field-error">{error}</p>
            )}
        </div>
    )
}

/** A password input with legacy's show/hide eye. */
export function PasswordField({
    label,
    error,
    ...input
}: Omit<InputProps, "type"> & { label: string; error?: string | boolean }) {
    const copy = useCopy(COPY)
    const [shown, setShown] = useState(false)
    return (
        <div className="auth-field-wrapper">
            <div className={`auth-field${error ? " invalid" : ""}`}>
                <LockIcon className="auth-field-icon" />
                <input
                    className="auth-field-input"
                    type={shown ? "text" : "password"}
                    placeholder={label}
                    aria-label={label}
                    aria-invalid={error ? true : undefined}
                    {...input}
                />
                <button
                    type="button"
                    className="auth-field-eye"
                    aria-label={shown ? copy.hidePassword : copy.showPassword}
                    onClick={() => setShown(!shown)}
                >
                    {shown ? (
                        <VisibilityIcon className="auth-field-icon" />
                    ) : (
                        <VisibilityOffIcon className="auth-field-icon" />
                    )}
                </button>
            </div>
            {typeof error === "string" && error && (
                <p className="auth-field-error">{error}</p>
            )}
        </div>
    )
}

/** Legacy's antd `Alert`: an error, a notice, or a success. */
export function AuthAlert({
    kind,
    children,
}: {
    kind: "error" | "info" | "success"
    children: ReactNode
}) {
    return (
        <p
            className={`auth-alert auth-alert-${kind}`}
            role={kind === "error" ? "alert" : "status"}
        >
            {children}
        </p>
    )
}

/** "Login with" and Google's logo: Supabase's Google sign-in. */
export function GoogleButton({
    disabled,
    onClick,
}: {
    disabled: boolean
    onClick: () => void
}) {
    const copy = useCopy(COPY)
    return (
        <button
            type="button"
            className="google-button"
            disabled={disabled}
            onClick={onClick}
        >
            <span className="google-button-label">{copy.loginWith}</span>
            <img
                src={googleLogo}
                alt={copy.google}
                width={24}
                height={24}
                className="google-icon"
            />
        </button>
    )
}
