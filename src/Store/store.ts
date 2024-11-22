import { observable, action, makeAutoObservable } from "mobx"
import {
    CIAlert,
    CIEvent,
    CINotification,
    CIRequest,
    CITemplate,
    CIUser,
    CIUserData,
    UserBio,
} from "../util/interfaces"
import { supabase } from "../supabase/client"
import { usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"
import { RealtimeChannel } from "@supabase/supabase-js"
import { cieventsService } from "../supabase/cieventsService"
import dayjs from "dayjs"

export class Store {
    @observable user: CIUser = {} as CIUser
    @observable notifications: CINotification[] = []
    @observable templates: CITemplate[] = []
    @observable requests: CIRequest[] = []
    @observable userBio: UserBio = {} as UserBio
    @observable ci_events: CIEvent[] = []
    @observable past_ci_events: CIEvent[] = []
    @observable alerts: CIAlert[] = []
    @observable loading: boolean = true
    private subscriptionRef: RealtimeChannel | null = null
    private pollingRef: NodeJS.Timeout | null = null
    private callCount: number = 0

    private readonly MINUTE_MS = 1000 * 60

    constructor() {
        makeAutoObservable(this, {
            user: observable,
            notifications: observable,
            templates: observable,
            requests: observable,
            userBio: observable,
            ci_events: observable,
            past_ci_events: observable,
            alerts: observable,
            loading: observable,
        })
    }

    private getPollingInterval = () => {
        if (this.callCount < 5) return this.MINUTE_MS * 2
        if (this.callCount < 10) return this.MINUTE_MS * 5
        return this.MINUTE_MS * 60
    }

    @action
    private fetchEvents = async () => {
        console.log("fetchEvents")
        try {
            const fetchedEvents = await cieventsService.getCIEvents({
                start_date: dayjs()
                    .tz("Asia/Jerusalem")
                    .add(3, "hours")
                    .toISOString(),
                sort_by: "start_date",
                sort_direction: "asc",
                future_events: true,
            })
            this.ci_events = fetchedEvents
        } catch (error) {
            console.error("Error fetching events:", error)
        } finally {
            this.loading = false
        }
    }

    private setupPolling = () => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                if (this.pollingRef) clearInterval(this.pollingRef)
                this.fetchEvents()

                const intervalCallback = async () => {
                    await this.fetchEvents()
                    this.callCount++
                    // Clear and set new interval with updated duration
                    if (this.pollingRef) clearInterval(this.pollingRef)
                    this.pollingRef = setInterval(
                        intervalCallback,
                        this.getPollingInterval()
                    )
                }

                this.pollingRef = setInterval(
                    intervalCallback,
                    this.getPollingInterval()
                )
            } else {
                if (this.pollingRef) clearInterval(this.pollingRef)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        handleVisibilityChange() // Initial call

        return () => {
            if (this.pollingRef) clearInterval(this.pollingRef)
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
        }
    }

    //TODO Handle updates from the user subscription
    @action
    handleSubscriptionUpdates = (payload: any) => {
        // Handle different types of updates
        if (payload.new && payload.eventType === "UPDATE") {
            // Update specific data based on payload
            this.setStore(payload.new)
        }
    }

    private subscribeToUserData = async () => {
        if (!this.user?.user_id) return
        const channel = usersService.subscribeToUser(
            this.user.user_id,
            this.handleSubscriptionUpdates
        )
        return channel
    }

    @action
    setupSubscription = () => {
        if (this.loading || !this.user?.user_id) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                this.subscribeToUserData().then((channel) => {
                    if (channel) {
                        this.subscriptionRef = channel
                    }
                })
            } else {
                if (this.subscriptionRef) {
                    this.subscriptionRef.unsubscribe()
                    this.subscriptionRef = null
                }
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        this.subscribeToUserData().then((channel) => {
            if (channel) {
                this.subscriptionRef = channel
            }
        })

        return () => {
            if (this.subscriptionRef) {
                this.subscriptionRef.unsubscribe()
                this.subscriptionRef = null
            }
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
        }
    }

    @action
    setLoading = (loading: boolean) => {
        this.loading = loading
    }

    @action
    setStore = (userData: CIUserData) => {
        this.user = userData.user
        this.notifications = userData.notifications
        this.templates = userData.templates
        this.requests = userData.requests
        this.ci_events = userData.ci_events
        this.past_ci_events = userData.past_ci_events
        this.alerts = userData.alerts
        this.userBio = userData.userBio
    }

    @action
    setUser = (user: Partial<CIUser>) => {
        if (!this.user) return
        this.user = { ...this.user, ...user }
    }

    @action
    updateUser = async (user: Partial<CIUser>) => {
        try {
            const updatedUserData = await usersService.updateUser(
                this.user.user_id,
                user
            )
            if (updatedUserData) {
                this.setUser(updatedUserData)
            }
        } catch (error) {
            console.error("Error updating user context:", error)
        }
    }

    @action
    setCIEvents = (ci_events: CIEvent[]) => {
        this.ci_events = ci_events
    }

    async init() {
        const { data } = await supabase.auth.getUser()

        const { user } = data

        try {
            if (!user) {
                // Only fetch and set ci_events, keep other store values empty
                if (this.pollingRef) clearInterval(this.pollingRef)
                const ci_events = await cieventsService.getCIEvents()
                this.setStore({
                    user: {} as CIUser,
                    notifications: [],
                    templates: [],
                    requests: [],
                    ci_events,
                    past_ci_events: [],
                    alerts: [],
                    userBio: {} as UserBio,
                })
                this.setupPolling()
                return
            }

            if (this.pollingRef) clearInterval(this.pollingRef)

            if (user.id) {
                const userData = await usersService.getUserData(user.id)
                if (userData) {
                    this.setStore(userData)
                } else {
                    const newUser = utilService.createDbUserFromUser(user)
                    const createdUser = await usersService.createUser(newUser)
                    const ci_events = await cieventsService.getCIEvents()
                    if (createdUser) {
                        const userData = {
                            user: createdUser,
                            ci_events,
                            requests: [],
                            templates: [],
                            notifications: [],
                            alerts: [],
                            past_ci_events: [],
                            userBio: {} as UserBio,
                        }
                        this.setStore(userData)
                    }
                }
            }
            this.setupSubscription()
        } catch (error) {
            console.error("Error fetching user:", error)
        } finally {
            this.setLoading(false)
        }
    }

    cleanup = () => {
        if (this.subscriptionRef) {
            this.subscriptionRef.unsubscribe()
            this.subscriptionRef = null
        }
        if (this.pollingRef) {
            clearInterval(this.pollingRef)
            this.pollingRef = null
        }
    }
    // ... rest of your subscription and handler methods
}
