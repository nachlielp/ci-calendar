import React from "react"
import "../../styles/app-header.css"
import { CIUser } from "../../util/interfaces"
import { Icon } from "../Common/Icon"
import InstallPWAModal from "../Common/InstallPWAModal"
import { LinkButton } from "../Common/LinkButton"
import { observer } from "mobx-react-lite"
import MenuDrawer from "./MenuDrawer"
import { store } from "../../Store/store"
import { appHeaderVM as vm } from "./AppHeaderVM"
import RequestPermissionModal from "../Common/RequestPermissionModal"
import { useIsMobile } from "../../hooks/useIsMobile"
import { Link, useLocation } from "react-router-dom"

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
        <InstallPWAModal>
            <section
                className={`header-container ${
                    vm.showInstallPWABanner && "install-pwa-banner"
                }`}
            >
                <RequestPermissionModal />
                {vm.showLoginButton && (
                    <>
                        <Link
                            to="/login"
                            className="link-btn"
                            style={{ textDecoration: "none" }}
                        >
                            <div
                                className={`header-btn  align-to-content ${
                                    vm.showInstallPWABanner &&
                                    "install-pwa-banner"
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                התחבר/י &nbsp;
                                <Icon icon="account" className="icon-main" />
                            </div>
                        </Link>

                        <label
                            className={`install-pwa-banner-label ${
                                vm.showInstallPWABanner && "show"
                            }`}
                        >
                            לקבלת עדכונים הוסיפו לעמוד הבית
                        </label>
                        <Icon
                            icon="add_alert"
                            className={`icon-main banner-icon ${
                                vm.showInstallPWABanner && "show"
                            }`}
                        />
                    </>
                )}
                {/* {vm.showInstallPWAButton && <InstallPWAModal />} */}
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
        </InstallPWAModal>
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
