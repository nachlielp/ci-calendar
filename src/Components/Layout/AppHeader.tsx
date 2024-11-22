import { useLocation } from "react-router-dom"
import { useIsMobile } from "../../hooks/useIsMobile"
import { CIUser } from "../../util/interfaces"
import { Icon } from "../Common/Icon"
import { InstallPWAButton } from "../Common/InstallPWAButton"
import { LinkButton } from "../Common/LinkButton"
import { observer } from "mobx-react-lite"
import MenuDrawer from "./MenuDrawer"
import { store } from "../../Store/store"

const AppHeader = () => {
    const isMobile = useIsMobile()

    const location = useLocation()

    const currentPath = location.pathname

    return (
        <section className="header-container">
            {!store.isUser &&
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
            {!store.isUser &&
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
            {isMobile && location.pathname === "/" && <InstallPWAButton />}
            {store.isUser && (
                <>
                    <div className="header-actions">
                        <UserInfo user={store.getUser} />
                        <MenuDrawer />
                    </div>
                </>
            )}
        </section>
    )
}

interface IUserInfoProps {
    user: CIUser
}
const UserInfo = observer(({ user }: IUserInfoProps) => {
    return (
        <div>
            {user.user_id && (
                <div className={`user-info-container`}>
                    <p className={`user-name`}>{user.user_name}</p>
                </div>
            )}
        </div>
    )
})

export default observer(AppHeader)
