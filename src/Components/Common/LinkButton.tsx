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
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (onClick) {
            ;() => onClick()
        }
    }
    return (
        <Link to={to} className="link-btn" style={{ textDecoration: "none" }}>
            <button
                className={` ${className} `}
                disabled={disabled}
                onClick={handleClick}
                title={label}
            >
                {children}
            </button>
        </Link>
    )
}
