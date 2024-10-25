import { LinkButton } from "./LinkButton"
import { useLocation } from "react-router-dom"
import { DbUser } from "../../../util/interfaces"

import { Icon } from "./Icon"
import { MenuDrawer } from "./MenuDrawer"
import { useUser } from "../../../context/UserContext"
import { InstallPWAButton } from "./InstallPWAButton"
import { utilService } from "../../../util/utilService"

export default function AppHeader() {
    const { user } = useUser()

    const location = useLocation()

    const currentPath = location.pathname

    return (
        <section className="header-container">
            {!user &&
                !["/login", "/signup", "/reset-password-request"].includes(
                    currentPath
                ) && (
                    <LinkButton
                        to="/login"
                        className="header-btn no-border align-to-content"
                    >
                        התחבר/י &nbsp;
                        <Icon icon="account" className="icon-main" />
                    </LinkButton>
                )}
            {!user &&
                ["/login", "/signup", "/reset-password-request"].includes(
                    currentPath
                ) && (
                    <LinkButton
                        to="/"
                        className="header-btn no-border align-to-content"
                    >
                        חזרה &nbsp;
                        <Icon icon="home" className="icon-main" />
                    </LinkButton>
                )}
            {utilService.isMobileBrowser() && <InstallPWAButton />}
            {user && (
                <>
                    <div className="header-actions">
                        <UserInfo user={user} />
                        <MenuDrawer />
                    </div>
                </>
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
                    <p className={`user-name`}>{user.full_name}</p>
                </div>
            )}
        </div>
    )
}
