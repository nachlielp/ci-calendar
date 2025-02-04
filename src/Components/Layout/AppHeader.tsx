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
import Spin from "antd/es/spin"
import Select from "antd/es/select"

import { translations } from "../../util/translations"
import he from "../../assets/img/he.png"
import en from "../../assets/img/en.png"
import ru from "../../assets/img/ru.png"
const AppHeader = () => {
    const isMobile = useIsMobile()
    const location = useLocation()
    const languagesToShow = import.meta.env.VITE_LANGUAGES_TO_SHOW.split(",")
    // Update VM with values from hooks
    React.useEffect(() => {
        vm.setIsMobile(isMobile)
    }, [isMobile])

    React.useEffect(() => {
        vm.setCurrentPath(location.pathname)
    }, [location.pathname])

    const changeLocale = (lang: Language) => {
        store.setLanguage(lang)
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
                        <Icon icon="account" className="icon-main" />
                        &nbsp;
                        {translations[store.getLanguage].login}
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
                {languageMenu(languagesToShow, changeLocale)}
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
                    <span>{translations[store.getLanguage].addPWABanner}</span>
                    <Icon icon="touch_app" className="add-alert-icon white" />
                </div>
            </button>
        </div>
    )
}

const languageMenu = (
    languagesToShow: Language[],
    changeLocale: (lang: Language) => void
) => (
    <div className="header-language-toggle-container">
        <Select
            onChange={(value) => changeLocale(value as Language)}
            value={store.getLanguage}
            dropdownRender={(menu) => <div>{menu}</div>}
            popupClassName="header-language-toggle-select"
            popupMatchSelectWidth={40}
            suffixIcon={null}
        >
            {languagesToShow.map((lang: Language) => {
                const isSelected = store.getLanguage === lang
                return (
                    <Select.Option
                        key={lang}
                        value={lang}
                        className={
                            isSelected
                                ? "header-language-toggle-select-option"
                                : ""
                        }
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <img
                                src={
                                    lang === "he" ? he : lang === "en" ? en : ru
                                }
                                alt={lang}
                                className="header-language-toggle-btn"
                                style={{ width: 24, height: 24 }}
                            />
                        </div>
                    </Select.Option>
                )
            })}
        </Select>
    </div>
)
