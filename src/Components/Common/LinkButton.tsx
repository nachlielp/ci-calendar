import { Link } from "react-router-dom"

interface ILinkButtonProps {
    to: string
    label?: string
    className?: string
    disabled?: boolean
    shape?: "default" | "circle" | "round"
    style?: React.CSSProperties
    onClick?: () => void
    children: React.ReactNode
}

export const LinkButton = ({
    to,
    label,
    className,
    disabled,
    onClick,
    children,
}: ILinkButtonProps) => {
    return (
        <Link to={to} className="link-btn" style={{ textDecoration: "none" }}>
            <button
                className={` ${className} `} // Add flexbox utilities
                disabled={disabled}
                // shape={shape}
                onClick={onClick}
                title={label}
            >
                {children}
            </button>
        </Link>
    )
}
