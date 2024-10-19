interface AsyncButtonProps {
    isSubmitting: boolean
    callback: (args?: any) => void
    children: React.ReactNode
}

export default function AsyncButton({
    isSubmitting,
    callback,
    children,
}: AsyncButtonProps) {
    return (
        <>
            <button
                onClick={callback}
                className="general-action-btn"
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
