import { LinkButton } from "./LinkButton"
import { useLocation } from "react-router-dom"
import { DbUser } from "../../../util/interfaces"

import { Icon } from "./Icon"
import { MenuDrawer } from "./MenuDrawer"
import { useUser } from "../../../context/UserContext"

export default function Header() {
    const { user } = useUser()
    const location = useLocation()

    const currentPath = location.pathname

    return (
        <section className="header-container">
            {!user &&
                !["/login", "/signup", "/reset-password"].includes(
                    currentPath
                ) && (
                    <LinkButton to="/login" className="header-btn no-border">
                        התחבר/י &nbsp;
                        <Icon icon="account" className="icon-main" />
                    </LinkButton>
                )}

            {user && (
                <div className="header-actions">
                    <UserInfo user={user} />
                    <MenuDrawer />
                </div>
            )}
        </section>
    )
}

interface IUserInfoProps {
    user: DbUser
}
const UserInfo = ({ user }: IUserInfoProps) => {
    return (
        <div>
            {user && (
                <div className={`user-info-container`}>
                    <p className={`user-name`}>{user.fullName}</p>
                </div>
            )}
        </div>
    )
}
