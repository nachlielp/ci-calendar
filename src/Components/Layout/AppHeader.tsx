import React from "react"
import "../../styles/header.scss"
import { CIUser, Language } from "../../util/interfaces"
import { Icon } from "../Common/Icon"
import InstallPWABanner from "../Common/InstallPWABanner"
import { LinkButton } from "../Common/LinkButton"
import { observer } from "mobx-react-lite"
import MenuDrawer from "./MenuDrawer"
import { store } from "../../Store/store"
import { appHeaderVM as vm } from "./AppHeaderVM"
import RequestPermissionModal from "../Common/RequestPermissionModal"
import { useIsMobile } from "../../hooks/useIsMobile"
import { useLocation } from "react-router"
import { utilService } from "../../util/utilService"
import { RadioChangeEvent, Spin } from "antd/lib"
import Radio from "antd/es/radio"
import { switchLanguage } from "../../util/translate"
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

    const changeLocale = async (e: RadioChangeEvent) => {
        console.log("changeLocale", e.target.value)
        const newLang = e.target.value as Language
        store.setLanguage(newLang)
        switchLanguage(newLang)
    }

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
                        התחבר/י&nbsp;
                        <Icon icon="account" className="icon-main" />
                    </LinkButton>
                )}
                {vm.showBackButton && (
                    <LinkButton
                        to="/"
                        className="header-btn no-border align-to-content"
                    >
                        <Icon icon="home" className="icon-main" />
                    </LinkButton>
                )}
                <Radio.Group
                    value={store.getLanguage}
                    onChange={changeLocale}
                    className="header-language-toggle"
                >
                    <Radio.Button key="en" value={Language.en}>
                        En
                    </Radio.Button>
                    <Radio.Button key="he" value={Language.he}>
                        עב
                    </Radio.Button>
                    <Radio.Button key="ru" value={Language.ru}>
                        RU
                    </Radio.Button>
                </Radio.Group>
                <>
                    <div className="header-actions">
                        {store.getOffline && (
                            <Icon
                                icon="cloud_offline"
                                className="offline-icon"
                            />
                        )}
                        {vm.networkFlag && <ErrorInfo />}
                        {vm.showUserLoading && (
                            <div className="user-loading-container">
                                <Spin size="small" />
                            </div>
                        )}
                        {vm.showUserInfo && <UserInfo user={store.getUser} />}
                        <MenuDrawer />
                    </div>
                </>
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
const ErrorInfo = () => {
    return (
        <div className="network-flag-container">
            <p className={`header-error-text`}>שגיעת התחברות</p>
        </div>
    )
}

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
                <div className="install-pwa-btn-text">
                    <span>לקבלת עדכונים הוסיפו לעמוד הבית</span>
                    <Icon icon="touch_app" className="add-alert-icon white" />
                </div>
            </button>
        </div>
    )
}
