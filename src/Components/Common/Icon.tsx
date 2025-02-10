import { ReactSVG } from "react-svg"
import "../../styles/icon.scss"

export const Icon = ({
    icon,
    className,
    title,
    pretitle,
    onClick,
}: {
    icon: string
    className?: string
    title?: string
    pretitle?: string
    onClick?: () => void
}) => {
    return (
        <label className="icon-component" onClick={onClick}>
            {pretitle && <span className="icon-title">{pretitle} &nbsp;</span>}
            <ReactSVG src={icon} className={className} />
            {title && <span className="icon-title">{title}</span>}
        </label>
    )
}
