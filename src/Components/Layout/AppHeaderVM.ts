import { store } from "../../Store/store"
import { action, computed, makeObservable, observable, reaction } from "mobx"
import { utilService } from "../../util/utilService"
import { getToken } from "firebase/messaging"
import { messaging } from "../../firebase.messaging"

class AppHeaderVM {
    @observable _showRequestPermissionModal: boolean = false
    @observable _isMobile: boolean = false
    @observable _currentPath: string = ""
    @observable _loading: boolean = false
    @observable _showInstallPWAModal: boolean = false

    constructor() {
        makeObservable(this)

        reaction(
            () => store.requestNotification,
            (requestNotification) => {
                const getCurrentPermission = () => Notification.permission

                if (
                    requestNotification &&
                    utilService.isPWA() &&
                    store.user.receive_notifications
                ) {
                    if (getCurrentPermission() === "granted") {
                        this.setFCMToken()
                    } else if (getCurrentPermission() !== "denied") {
                        this.setShowRequestPermissionModal(true)
                    }
                }
            }
        )
    }

    @computed
    get isMobile() {
        return this._isMobile
    }

    @computed
    get currentPath() {
        return this._currentPath
    }

    @computed
    get showLoginButton() {
        return (
            !store.isUser &&
            !store.isLoading &&
            ![
                "/login",
                "/signup",
                "/reset-password-request",
                "/privacy-policy",
                "/terms-and-conditions",
                "/about",
            ].includes(this.currentPath)
        )
    }

    @computed
    get showInstallPWAButton() {
        return this.isMobile && this.currentPath === "/"
    }

    @computed
    get showInstallPWABanner() {
        return this.isMobile && this.currentPath === "/" && !utilService.isPWA()
    }

    @computed
    get showUserInfo() {
        return store.isUser
    }

    @computed
    get showUserLoading() {
        return store.isLoading
    }

    @computed
    get showMenuDrawer() {
        return store.isUser
    }

    @computed
    get showBackButton() {
        return (
            (!store.isUser &&
                [
                    "/login",
                    "/signup",
                    "/reset-password-request",
                    "/about",
                    "/privacy-policy",
                    "/terms-and-conditions",
                ].includes(this.currentPath)) ||
            (store.isUser && this.currentPath !== "/")
        )
    }

    @computed
    get showRequestPermissionModal() {
        return this._showRequestPermissionModal
    }

    @computed
    get isLoading() {
        return this._loading
    }

    @computed
    get isAppLoading() {
        return store.isLoading
    }

    @computed
    get showInstallPWAModal() {
        return this._showInstallPWAModal
    }

    @action
    setIsMobile(isMobile: boolean) {
        this._isMobile = isMobile
    }

    @action
    setCurrentPath(path: string) {
        this._currentPath = path
    }

    @action
    setLoading() {
        this._loading = true
        console.log("setLoading :", this._loading)
    }

    @action
    setShowRequestPermissionModal = (show: boolean) => {
        this._showRequestPermissionModal = show
    }

    @action
    setDontReceiveNotifications = () => {
        this._showRequestPermissionModal = false
        store.updateUser({ receive_notifications: false })
    }

    @action
    setReceiveNotifications = () => {
        this._showRequestPermissionModal = false
        store.updateUser({ receive_notifications: true })
    }

    @action
    setShowInstallPWAModal = (show: boolean) => {
        console.log("setShowInstallPWAModal :", show)
        this._showInstallPWAModal = show
    }

    @action
    setFCMToken = async () => {
        const pwaInstallId = utilService.getPWAInstallId()

        let token = ""
        try {
            token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_VAPID_PUBLIC_FIREBASE_KEY,
            })
            store.updateUser({
                pwa_install_id: pwaInstallId,
                fcm_token: token,
            })
        } catch (error) {
            console.error("checkAndUpdateToken - error", error)
        } finally {
            this._loading = false
            this.setShowRequestPermissionModal(false)
        }
    }
}

export const appHeaderVM = new AppHeaderVM()
