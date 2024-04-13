import { Button } from "antd";
import { Link } from "react-router-dom";

interface IButtonLinkProps {
  to: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  shape?: "default" | "circle" | "round";
  style?: React.CSSProperties;
  onClick?: () => void;
  children: React.ReactNode;
}

export const ButtonLink = ({
  to,
  label,
  className,
  disabled,
  shape,
  onClick,
  children,
}: IButtonLinkProps) => {
  return (
    <Link to={to} className="flex items-center justify-center  h-full">
      <Button
        className={`flex items-center justify-center ${className}`} // Add flexbox utilities
        disabled={disabled}
        shape={shape}
        onClick={onClick}
        title={label}
      >
        {children}
      </Button>
    </Link>
  );
};
