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

    constructor() {
        makeObservable(this)

        reaction(
            () => store.requestNotification,
            (requestNotification) => {
                const getCurrentPermission = () => Notification.permission

                if (
                    requestNotification &&
                    utilService.isPWA() &&
                    getCurrentPermission() === "default" &&
                    store.user.receive_notifications
                ) {
                    this.setShowRequestPermissionModal(true)
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
            !["/login", "/signup", "/reset-password-request"].includes(
                this.currentPath
            )
        )
    }

    @computed
    get showInstallPWAButton() {
        return this.isMobile && this.currentPath === "/"
    }

    @computed
    get showUserInfo() {
        return store.isUser
    }

    @computed
    get showMenuDrawer() {
        return store.isUser
    }

    @computed
    get showBackButton() {
        return (
            !store.isUser &&
            ["/login", "/signup", "/reset-password-request"].includes(
                this.currentPath
            )
        )
    }

    @computed
    get showRequestPermissionModal() {
        return this._showRequestPermissionModal
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
    setFCMToken = async () => {
        const pwaInstallId = utilService.getPWAInstallId()
        if (pwaInstallId && store.user.pwa_install_id === pwaInstallId) {
            return
        }

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
            this.setShowRequestPermissionModal(false)
        }
    }
}

export const appHeaderVM = new AppHeaderVM()
