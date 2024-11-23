import { observable, action, makeAutoObservable, computed, toJS } from "mobx"
import {
    CIAlert,
    CIEvent,
    CIRequest,
    CITemplate,
    CIUser,
    CIUserData,
    EventPayloadType,
    RequestStatus,
    TaggableUserOptions,
    UserBio,
    UserNotification,
    UserType,
} from "../util/interfaces"
import { supabase } from "../supabase/client"
import { ManageUserOption, usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"
import { RealtimeChannel, Session } from "@supabase/supabase-js"
import { cieventsService } from "../supabase/cieventsService"
import dayjs from "dayjs"
import { notificationService } from "../supabase/notificationService"
import { requestsService } from "../supabase/requestsService"
import { SelectOption } from "../util/options"

class Store {
    @observable session: Session | null = null
    @observable user: CIUser = {} as CIUser
    @observable notifications: UserNotification[] = []
    @observable templates: CITemplate[] = []
    @observable requests: CIRequest[] = []
    @observable bio: UserBio = {} as UserBio
    @observable alerts: CIAlert[] = []

    @observable app_ci_events: CIEvent[] = []
    @observable app_past_ci_events: CIEvent[] = []
    @observable app_public_bios: UserBio[] = []
    @observable app_taggable_teachers: TaggableUserOptions[] = []
    @observable app_users: ManageUserOption[] = []
    @observable app_requests: CIRequest[] = []
    @observable app_creators: SelectOption[] = []

    @observable loading: boolean = true

    private subscriptionRef: RealtimeChannel | null = null
    private pollingRef: NodeJS.Timeout | null = null
    private callCount: number = 0

    private readonly MINUTE_MS = 1000 * 60

    constructor() {
        makeAutoObservable(this)
        console.log("Store constructor")

        supabase.auth.onAuthStateChange(async (_, session) => {
            this.cleanup()
            this.setSession(session)
            this.init()
        })
    }

    private getPollingInterval = () => {
        if (this.callCount < 5) return this.MINUTE_MS * 2
        if (this.callCount < 10) return this.MINUTE_MS * 5
        return this.MINUTE_MS * 60
    }

    @computed
    get isLoading() {
        return this.loading
    }

    @computed
    get getSession() {
        return this.session
    }

    @computed
    get isSession() {
        return !!this.session
    }

    @computed
    get isUser() {
        return !!this.user?.user_id
    }

    @computed
    get getUser() {
        return this.user
    }

    @computed
    get getUserId() {
        return this.user.user_id
    }

    @computed
    get getEvents() {
        return this.app_ci_events
    }

    @computed
    get getSortedEvents() {
        return this.app_ci_events
            .slice()
            .sort((a, b) =>
                dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? -1 : 1
            )
    }

    @computed
    get getUserEvents() {
        return this.app_ci_events
            .filter((e) => e.user_id === this.user.user_id)
            .slice()
            .sort((a, b) =>
                dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? -1 : 1
            )
    }

    @computed
    get getUserPastEvents() {
        return this.app_past_ci_events
            .slice()
            .sort((a, b) =>
                dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? 1 : -1
            )
    }

    @computed
    get getCIEventById() {
        return (eventId: string) => {
            return this.app_ci_events.find((e) => e.id === eventId)
        }
    }

    @computed
    get getSortedNotifications() {
        return this.notifications
            .slice()
            .sort((a, b) =>
                dayjs(a.created_at).isBefore(dayjs(b.created_at)) ? -1 : 1
            )
    }

    @computed
    get getUserReceiveNotifications() {
        return this.user.receive_notifications
    }

    @computed
    get getNotifications() {
        return this.notifications
    }

    @computed
    get getNotificationByEventId() {
        return (eventId: string) => {
            const notification = this.notifications.find(
                (n) =>
                    n.ci_event_id === eventId &&
                    utilService.isNotificationNotStarted(n)
            )
            return notification
        }
    }

    @computed
    get getRequests() {
        return this.requests
            .slice()
            .sort((a, b) =>
                dayjs(a.created_at).isBefore(dayjs(b.created_at)) ? 1 : -1
            )
    }

    @computed
    get getBio() {
        return this.bio
    }

    @computed
    get getTemplates() {
        return this.templates
            .slice()
            .sort((a, b) =>
                dayjs(a.created_at).isBefore(dayjs(b.created_at)) ? 1 : -1
            )
    }

    @computed
    get getAlerts() {
        return this.alerts
    }

    @computed
    get getAppRequests() {
        return this.app_requests
    }

    @computed
    get getOpenAppRequests() {
        return this.app_requests.filter((r) => r.status === RequestStatus.open)
    }

    @computed
    get getClosedAppRequests() {
        return this.app_requests.filter(
            (r) => r.status === RequestStatus.closed
        )
    }

    @computed
    get getAppPublicBios() {
        return this.app_public_bios
    }

    @computed
    get getPublicTeacherBios() {
        return this.app_public_bios
            .filter((b) => b.user_type !== UserType.org)
            .map((b) => ({
                label: b.bio_name,
                value: b.user_id,
            }))
    }

    @computed
    get getPublicOrgBios() {
        return this.app_public_bios
            .filter((b) => b.user_type === UserType.org)
            .map((b) => ({
                label: b.bio_name,
                value: b.user_id,
            }))
    }

    @computed
    get getAppTaggableTeachers() {
        const teachers = this.app_taggable_teachers
            .filter((t) => t.user_type !== UserType.org)
            .map((t) => ({
                label: t.bio_name,
                value: t.user_id,
            }))

        const selfExists = teachers.some((t) => t.value === this.user.user_id)

        // Add self if not already in list and user is valid
        if (
            !selfExists &&
            this.user?.user_id &&
            this.user?.user_type !== UserType.org
        ) {
            return [
                {
                    label: this.bio?.bio_name || this.user.email,
                    value: this.user.user_id,
                },
                ...teachers,
            ]
        }

        return teachers
    }

    @computed
    get getAppTaggableOrgs() {
        const orgs = this.app_taggable_teachers
            .filter((t) => t.user_type === UserType.org)
            .map((t) => ({
                label: t.bio_name,
                value: t.user_id,
            }))

        const selfExists = orgs.some((o) => o.value === this.user.user_id)

        if (
            !selfExists &&
            this.user?.user_id &&
            this.user?.user_type === UserType.org
        ) {
            return [
                {
                    label: this.bio?.bio_name || this.user.email,
                    value: this.user.user_id,
                },
                ...orgs,
            ]
        }

        return orgs
    }

    @action
    setSession(session: Session | null) {
        this.session = session
    }

    @action
    private fetchEvents = async () => {
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
            this.setCIEvents(fetchedEvents)
        } catch (error) {
            console.error("Error fetching events:", error)
        } finally {
            this.setLoading(false)
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
    handleSubscriptionUpdates = ({
        table,
        payload,
    }: {
        table: string
        payload: any
    }) => {
        console.log(
            "handleSubscriptionUpdates table: ",
            table,
            "payload: ",
            payload
        )
        switch (table) {
            case "users":
                this.setUser(payload.new)
                break
            case "ci_events":
                this.setCIEvent(payload.new, payload.eventType)
                break
            case "notifications":
                this.setNotification(payload.new, payload.eventType)
                break
            case "requests":
                this.setRequest(payload.new, payload.eventType)
                break
            case "public_bio":
                this.setBio(payload.new, payload.eventType)
                break
        }
    }

    private subscribeToUserData = async () => {
        if (!this.user?.user_id) return

        const channel = usersService.subscribeToUser(
            this.user.user_type,
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
        handleVisibilityChange()
    }

    @action
    setLoading(loading: boolean) {
        this.loading = loading
    }

    @action
    setStore = (userData: CIUserData) => {
        this.user = userData.user
        this.notifications = userData.notifications
        this.templates = userData.templates
        this.requests = userData.requests
        this.app_ci_events = userData.ci_events
        this.app_past_ci_events = userData.past_ci_events
        this.alerts = userData.alerts
        this.bio = userData.userBio
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
        this.app_ci_events = ci_events
    }

    @action
    setCIEvent = (ci_event: CIEvent, eventType: EventPayloadType) => {
        switch (eventType) {
            case EventPayloadType.UPDATE:
                this.app_ci_events = this.app_ci_events.map((e) =>
                    e.id === ci_event.id ? { ...e, ...ci_event } : e
                )
                break
            case EventPayloadType.DELETE:
                this.app_ci_events = this.app_ci_events.filter(
                    (e) => e.id !== ci_event.id
                )
                break
            case EventPayloadType.INSERT:
                this.app_ci_events = [...this.app_ci_events, ci_event]
                break
        }
    }

    @action
    setNotification = (
        notification: UserNotification,
        eventType: EventPayloadType
    ) => {
        switch (eventType) {
            case EventPayloadType.UPDATE:
                this.notifications = this.notifications.map((n) =>
                    n.id === notification.id ? { ...n, ...notification } : n
                )
                break
            case EventPayloadType.DELETE:
                this.notifications = this.notifications.filter(
                    (n) => n.id !== notification.id
                )
                break
            case EventPayloadType.INSERT:
                if (this.notifications.find((n) => n.id === notification.id))
                    return

                this.notifications = [...this.notifications, notification]

                this.fetchNotification(notification.id).then(
                    (fetchedNotification) => {
                        if (fetchedNotification) {
                            this.notifications = this.notifications.map((n) =>
                                n.id === notification.id
                                    ? fetchedNotification
                                    : n
                            )
                        }
                    }
                )
                break
            case EventPayloadType.UPSERT:
                if (this.notifications.find((n) => n.id === notification.id)) {
                    this.notifications = this.notifications.map((n) =>
                        n.id === notification.id ? { ...n, ...notification } : n
                    )
                } else {
                    this.notifications = [...this.notifications, notification]
                }
                console.log(
                    "notifications after upsert",
                    toJS(this.notifications)
                )
                break
        }
    }

    @action
    setRequest = (request: CIRequest, eventType: EventPayloadType) => {
        if (this.user.user_type === UserType.admin) {
            switch (eventType) {
                case EventPayloadType.INSERT:
                    this.app_requests = [...this.app_requests, request]
                    break
                case EventPayloadType.UPDATE:
                    this.app_requests = this.app_requests.map((r) =>
                        r.id === request.id ? { ...r, ...request } : r
                    )
                    break
            }
        } else {
            switch (eventType) {
                case EventPayloadType.INSERT:
                    this.requests = [...this.requests, request]
                    break
                case EventPayloadType.UPDATE:
                    this.requests = this.requests.map((r) =>
                        r.id === request.id ? { ...r, ...request } : r
                    )
                    break
            }
        }
        console.log("requests after update", toJS(this.requests))
    }

    @action
    setBio = (bio: UserBio, eventType: EventPayloadType) => {
        switch (eventType) {
            case EventPayloadType.UPDATE:
                this.bio = bio
                break
            case EventPayloadType.INSERT:
                this.bio = bio
                break
        }
    }

    @action
    setTemplate = (template: CITemplate, eventType: EventPayloadType) => {
        switch (eventType) {
            case EventPayloadType.UPDATE:
                this.templates = this.templates.map((t) =>
                    t.id === template.id ? { ...t, ...template } : t
                )
                break
            case EventPayloadType.DELETE:
                this.templates = this.templates.filter(
                    (t) => t.id !== template.id
                )
                break
            case EventPayloadType.INSERT:
                this.templates = [...this.templates, template]
                break
        }
    }

    @action
    setAppUsers = (appUsers: ManageUserOption[]) => {
        this.app_users = appUsers
    }

    @action
    setAppRequests = (appRequests: CIRequest[]) => {
        this.app_requests = appRequests
    }

    @action
    setAppRequest = (appRequest: CIRequest, eventType: EventPayloadType) => {
        switch (eventType) {
            case EventPayloadType.UPDATE:
                this.app_requests = this.app_requests.map((r) =>
                    r.id === appRequest.id ? { ...r, ...appRequest } : r
                )
                break
            case EventPayloadType.INSERT:
                this.app_requests = [...this.app_requests, appRequest]
                break
        }
    }

    @action
    setAppCreators = (appCreators: SelectOption[]) => {
        this.app_creators = appCreators
    }

    @action
    setAppPublicBios = (appPublicBios: UserBio[]) => {
        this.app_public_bios = appPublicBios
    }

    @action
    setAppTaggableTeachers = (appTaggableTeachers: TaggableUserOptions[]) => {
        this.app_taggable_teachers = appTaggableTeachers
    }

    async init() {
        console.log("Store init")
        this.setLoading(true)
        try {
            if (!this.isSession) {
                console.log("Store init no session")
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

            if (this.getSession?.user.id) {
                const userData = await usersService.getUserData(
                    this.getSession.user.id
                )

                if (userData) {
                    this.setStore(userData)
                } else {
                    const newUser = utilService.createDbUserFromUser(
                        this.getSession?.user
                    )
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

                this.fetchAppPublicBios()

                if (
                    [UserType.admin, UserType.creator, UserType.org].includes(
                        this.user.user_type
                    )
                ) {
                    this.fetchAppTaggableTeachers()
                }

                if (this.user.user_type === UserType.admin) {
                    this.fetchAppUsers()
                    this.fetchAppRequests()
                    this.fetchAppCreators()
                }
            }
            this.setupSubscription()
        } catch (error) {
            console.error("Error fetching user:", error)
        } finally {
            this.setLoading(false)
        }
    }

    fetchNotification = async (notificationId: string) => {
        const notification = await notificationService.getNotificationById(
            notificationId
        )
        return notification
    }

    fetchAppUsers = async () => {
        const appUsers = await usersService.getUsers()
        this.setAppUsers(appUsers)
    }

    //TODO pagination and filters
    fetchAppRequests = async () => {
        const appRequests = await requestsService.getAllRequests()
        this.setAppRequests(appRequests)
    }

    fetchAppCreators = async () => {
        const appCreators = await cieventsService.getCIEventsCreators()
        this.setAppCreators(appCreators)
    }

    fetchAppPublicBios = async () => {
        const appPublicBios = await usersService.getPublicBioList()
        this.setAppPublicBios(appPublicBios)
    }

    fetchAppTaggableTeachers = async () => {
        const appTaggableTeachers = await usersService.getTaggableUsers()
        this.setAppTaggableTeachers(appTaggableTeachers)
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
        this.setStore({ ci_events: this.app_ci_events } as CIUserData)
    }
}

export const store = new Store()
