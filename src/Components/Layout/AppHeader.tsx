import React from "react"
import "../../styles/header.css"
import { CIUser } from "../../util/interfaces"
import { Icon } from "../Common/Icon"
import InstallPWABanner from "../Common/InstallPWABanner"
import { LinkButton } from "../Common/LinkButton"
import { observer } from "mobx-react-lite"
import MenuDrawer from "./MenuDrawer"
import { store } from "../../Store/store"
import { appHeaderVM as vm } from "./AppHeaderVM"
import RequestPermissionModal from "../Common/RequestPermissionModal"
import { useIsMobile } from "../../hooks/useIsMobile"
import { useLocation } from "react-router-dom"
import { utilService } from "../../util/utilService"

const AppHeader = () => {
    const isMobile = useIsMobile()
    const location = useLocation()

    // Update VM with values from hooks
    React.useEffect(() => {
        vm.setIsMobile(isMobile)
    }, [isMobile])

    React.useEffect(() => {
        vm.setCurrentPath(location.pathname)
    }, [location.pathname])
    return (
        <section className="header-container-wapper">
            <div>
                {vm.showInstallPWABanner && (
                    <InstallPWABanner
                        anchorElement={<InstallPWABannerAnchor />}
                    />
                )}
            </div>
            <section className="header-container">
                <RequestPermissionModal />
                {vm.showLoginButton && (
                    <LinkButton
                        to="/login"
                        className="header-btn no-border align-to-content"
                    >
                        התחבר/י &nbsp;
                        <Icon icon="account" className="icon-main" />
                    </LinkButton>
                )}
                {vm.showBackButton && (
                    <LinkButton
                        to="/"
                        className="header-btn no-border align-to-content"
                    >
                        חזרה &nbsp;
                        <Icon icon="home" className="icon-main" />
                    </LinkButton>
                )}
                {vm.showUserInfo && (
                    <>
                        <div className="header-actions">
                            <UserInfo user={store.getUser} />
                            <MenuDrawer />
                        </div>
                    </>
                )}
            </section>
        </section>
    )
}

interface IUserInfoProps {
    user: CIUser
}
const UserInfo = observer(({ user }: IUserInfoProps) => {
    return (
        <div>
            {user.id && (
                <div className={`user-info-container`}>
                    <p className={`user-name`}>{user.user_name}</p>
                </div>
            )}
        </div>
    )
})

export default observer(AppHeader)

const InstallPWABannerAnchor = () => {
    return (
        <div className="install-pwa-btn-container">
            <button
                id="install-button"
                className="install-pwa-btn"
                style={{ display: !utilService.isPWA() ? "block" : "none" }}
                onClick={() => vm.setShowInstallPWAModal(true)}
            >
                לקבלת עדכונים הוסיפו לעמוד הבית
            </button>
            <Icon icon="add_alert" className="add-alert-icon" />
        </div>
    )
}
