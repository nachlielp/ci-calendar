interface AsyncFormSubmitButtonProps {
    isSubmitting: boolean
    children: React.ReactNode
    size?: "general" | "large"
}

export default function AsyncFormSubmitButton({
    isSubmitting,
    children,
    size = "general",
}: AsyncFormSubmitButtonProps) {
    return (
        <>
            <button
                type="submit"
                className={`${
                    size === "large"
                        ? "general-action-btn large-btn"
                        : "general-action-btn"
                }`}
                disabled={isSubmitting}
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
