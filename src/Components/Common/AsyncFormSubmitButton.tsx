interface AsyncFormSubmitButtonProps {
    isSubmitting: boolean
    children: React.ReactNode
    size?: "general" | "large"
    className?: string
    disabled?: boolean
}

export default function AsyncFormSubmitButton({
    isSubmitting,
    children,
    size = "general",
    className,
    disabled,
}: AsyncFormSubmitButtonProps) {
    return (
        <>
            <button
                type="submit"
                className={`${
                    size === "large"
                        ? "general-action-btn large-btn"
                        : "general-action-btn"
                } ${className} ${disabled ? "disabled" : ""}`}
                disabled={isSubmitting || disabled}
            >
                {isSubmitting ? (
                    <>
                        <svg
                            className="loading-spinner"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v2"></path>
                        </svg>
                        טוען...
                    </>
                ) : (
                    children
                )}
            </button>
        </>
    )
}
