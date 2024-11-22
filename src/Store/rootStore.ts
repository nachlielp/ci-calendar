import { Store } from "./store"

class RootStore {
    store: Store
    private static instance: RootStore

    private constructor() {
        this.store = new Store()
        if (typeof window !== "undefined") {
            // Initialize on client side only
            const initStore = async () => {
                console.info("UserStore init")
                this.store.init()
            }
            initStore()
        }
    }

    static getInstance(): RootStore {
        if (!RootStore.instance) {
            RootStore.instance = new RootStore()
        }
        return RootStore.instance
    }
}

export const rootStore = RootStore.getInstance()
