import { store } from "../../Store/store"
import { action, computed, makeObservable, observable } from "mobx"
import { utilService } from "../../util/utilService"

class AppHeaderVM {
    @observable _isMobile: boolean = false
    @observable _currentPath: string = ""
    @observable _loading: boolean = false
    @observable _showInstallPWAModal: boolean = false

    constructor() {
        makeObservable(this)
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
    get networkFlag() {
        return store.getNetworkFlag && !store.isLoading && !store.isUser
    }

    @computed
    get showLoginButton() {
        return (
            !store.isUser &&
            !store.isLoading &&
            !this.networkFlag &&
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
    setShowInstallPWAModal = (show: boolean) => {
        this._showInstallPWAModal = show
    }
}

export const appHeaderVM = new AppHeaderVM()
