import {
    observable,
    action,
    makeAutoObservable,
    computed,
    reaction,
} from "mobx"
import {
    CIAlert,
    CIEvent,
    CIRequest,
    CITemplate,
    CIUser,
    CIUserData,
    DBCIEvent,
    EventPayloadType,
    IAddress,
    Language,
    ManageUserOption,
    NotificationDB,
    NotificationType,
    SupabaseSessionEvent,
    TaggableUserOptions,
    UserBio,
    UserNotification,
    UserRole,
    UserType,
    WeeklyScheduleFilters,
} from "../util/interfaces"
import { supabase } from "../supabase/client"
import { usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"
import { RealtimeChannel, Session } from "@supabase/supabase-js"
import { cieventsService } from "../supabase/cieventsService"
import dayjs from "dayjs"
import { notificationService } from "../supabase/notificationService"
import { requestsService, UpdateRequest } from "../supabase/requestsService"
import { SelectOption } from "../util/options"
import { templateService } from "../supabase/templateService"
import { publicBioService } from "../supabase/publicBioService"
import { alertsService } from "../supabase/alertsService"
import { userRoleService } from "../supabase/userRoleService"
import { CACHE_VERSION } from "../App"
import { AuthChangeEvent } from "@supabase/supabase-js"
import { getAddressFromGooglePlaceId } from "../Components/Common/GooglePlacesInput"
import { translateText } from "../util/translate"

class Store {
    @observable session: Session | null = null
    @observable user: CIUser = {} as CIUser
    @observable notifications: UserNotification[] = []
    @observable templates: CITemplate[] = []
    @observable requests: CIRequest[] = []
    @observable bio: UserBio = {} as UserBio
    @observable alerts: CIAlert[] = []

    @observable user_past_ci_events: CIEvent[] = []
    @observable user_future_ci_events: CIEvent[] = []
    @observable app_ci_events: CIEvent[] = []
    @observable app_public_bios: UserBio[] = []
    @observable app_taggable_teachers: TaggableUserOptions[] = []
    @observable app_users: ManageUserOption[] = []
    @observable app_requests: CIRequest[] = []
    @observable app_creators: SelectOption[] = []

    @observable loading: boolean = true
    @observable isOnline: boolean = navigator.onLine
    @observable networkFlag: boolean = false
    @observable language: Language = utilService.getLanguage()

    @observable requestNotification: boolean = false

    @observable private currentSessionId: string | null = null

    @observable private lastActivityTimestamp: number = 0
    @observable private lastFetchTimestamp: number = 0

    private subscriptionRef: RealtimeChannel | null = null
    private pollingRef: NodeJS.Timeout | null = null
    private isInitializing = false
    private inactivityTimeout: NodeJS.Timeout | null = null
    private readonly INACTIVITY_DELAY = 5 * 60 * 1000

    constructor() {
        makeAutoObservable(this)

        window.addEventListener("online", this.handleOnlineStatus)
        window.addEventListener("offline", this.handleOnlineStatus)

        setTimeout(() => {
            this.getOfflineData()
        }, 0)

        supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                // this.cleanup() // Notice issue with file upload on android - reload app and clears image state

                const timeSinceLastActivity =
                    Date.now() - this.lastActivityTimestamp
                const needsReinitialization =
                    timeSinceLastActivity > this.INACTIVITY_DELAY

                if (needsReinitialization) {
                    this.isInitializing = false
                    this.currentSessionId = null
                }

                this.setSession(session)

                if (
                    session?.access_token === this.currentSessionId &&
                    !needsReinitialization
                ) {
                    console.log(
                        "Skipping initialization - same session and recently active"
                    )

                    return
                }

                switch (event) {
                    case SupabaseSessionEvent.signedIn:
                    case SupabaseSessionEvent.initialSession:
                    case SupabaseSessionEvent.tokenRefreshed:
                        const isValidToken =
                            session?.access_token &&
                            session.access_token !== this.session?.access_token

                        const isValidUser =
                            session?.user?.id &&
                            this.user?.id &&
                            session.user.id === this.user.id

                        if (!isValidToken || !isValidUser) {
                            this.currentSessionId =
                                session?.access_token || null
                            this.lastActivityTimestamp = Date.now()
                            this.init()
                        } else {
                            console.log(
                                "Skipping initialization - token/user are already initialized"
                            )
                        }
                        break

                    case SupabaseSessionEvent.signedOut:
                        this.currentSessionId = null
                        this.lastActivityTimestamp = Date.now()
                        this.clearUser()
                        break

                    case SupabaseSessionEvent.userUpdated:
                        if (session) {
                            this.setUser(session.user)
                            this.lastActivityTimestamp = Date.now()
                        }
                        break

                    case SupabaseSessionEvent.passwordRecovery:
                        this.lastActivityTimestamp = Date.now()
                        break
                }
            }
        )

        reaction(
            () => this.user.user_type,
            (userType) => {
                if (
                    userType === UserType.org ||
                    userType === UserType.creator
                ) {
                    this.fetchAppPublicBios()
                    this.fetchAppTaggableTeachers()
                }
            }
        )
    }

    //For non-authenticated users, I use polling to avoid useing a subscription channel
    // private getPollingInterval = () => {
    //     if (this.callCount < 5) return this.MINUTE_MS * 2
    //     if (this.callCount < 10) return this.MINUTE_MS * 5
    //     return this.MINUTE_MS * 60
    // }

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
        return !!this.session && !!this.user?.id
    }

    @computed
    get getUser() {
        return this.user
    }

    @computed
    get getUserId() {
        return this.user.id
    }

    @computed
    get getEvents() {
        return this.app_ci_events
    }

    @computed
    get getOffline() {
        return !this.isOnline
    }

    @computed
    get getIsOnlineNoEvents() {
        return this.isOnline && this.app_ci_events.length === 0
    }

    @computed
    get getSortedEvents() {
        const events = new Map()
        this.app_ci_events.forEach((e) => {
            events.set(e.id, e)
        })
        this.user_future_ci_events.forEach((e) => {
            events.set(e.id, e)
        })
        return Array.from(events.values())
            .slice()
            .filter((e) => !e.hide)
            .filter(
                (e) =>
                    dayjs(e.start_date)
                        .startOf("day")
                        .isAfter(dayjs().startOf("day")) ||
                    dayjs(e.start_date)
                        .startOf("day")
                        .isSame(dayjs().startOf("day"))
            )
            .sort((a, b) =>
                dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? -1 : 1
            )
    }

    @computed
    get getUserFutureEvents() {
        return this.user_future_ci_events
            .slice()
            .sort((a, b) =>
                dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? -1 : 1
            )
    }

    @computed
    get getUserPastEvents() {
        return this.user_past_ci_events
            .slice()
            .sort((a, b) =>
                dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? 1 : -1
            )
    }

    @computed
    get getCIEventById() {
        return (eventId: string) => {
            let event = this.app_ci_events.find(
                (e) => e.id === eventId || e.short_id === eventId
            )
            if (!event) {
                event = this.user_future_ci_events.find(
                    (e) => e.id === eventId || e.short_id === eventId
                )
            }
            return event
        }
    }

    @computed
    get getFutureRecurringEventsByRefKey() {
        return (event: CIEvent) => {
            return this.app_ci_events.filter(
                (e) =>
                    e.recurring_ref_key &&
                    e.recurring_ref_key === event.recurring_ref_key &&
                    dayjs(e.start_date).isAfter(dayjs(event.start_date))
            )
        }
    }
    @computed
    get getIsFutureRecurringEvent() {
        return (event: CIEvent) => {
            return (
                this.app_ci_events.filter(
                    (e) =>
                        e.recurring_ref_key &&
                        e.recurring_ref_key === event.recurring_ref_key &&
                        dayjs(e.start_date).isAfter(dayjs(event.start_date))
                ).length > 0
            )
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
        if (!this.isOnline) return false
        return this.user.receive_notifications
    }

    @computed
    get getNotifications() {
        return this.notifications
    }

    @computed
    get getNotificationByEventId() {
        return (eventId: string) => {
            if (!this.isOnline || !this.isUser) return undefined
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
    get getOpenPositionRequest() {
        return this.requests.find((r) => !r.closed)
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
    get getSingleDayTemplateOptions() {
        return this.templates
            .filter((t) => !t.is_multi_day)
            .map((t) => ({
                value: t.id,
                label: t.name,
            }))
    }

    @computed
    get getMultiDayTemplateOptions() {
        return this.templates
            .filter((t) => t.is_multi_day)
            .map((t) => ({
                value: t.id,
                label: t.name,
            }))
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
        return this.app_requests.filter((r) => !r.closed)
    }

    @computed
    get getClosedAppRequests() {
        return this.app_requests.filter((r) => r.closed)
    }

    @computed
    get getAppPublicBios() {
        if (
            this.bio &&
            !this.app_public_bios.find(
                (bio) => bio.user_id === this.bio?.user_id
            )
        ) {
            return [...this.app_public_bios, this.bio]
        }
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
    get getNetworkFlag() {
        return this.networkFlag
    }

    @computed
    get getLanguage() {
        return this.language
    }
    @computed
    get getDirection() {
        return this.language === Language.he ? "rtl" : "ltr"
    }

    @computed
    get getAppTaggableTeachers() {
        const teachers = this.app_taggable_teachers
            .filter((t) => t.user_type !== UserType.org)
            .map((t) => ({
                label: t.bio_name,
                value: t.user_id,
            }))

        const selfExists = teachers.some((t) => t.value === this.user.id)

        // Add self if not already in list and user is valid
        if (
            !selfExists &&
            this.user?.id &&
            this.user?.user_type !== UserType.org &&
            this.bio?.bio_name
        ) {
            return [
                {
                    label: this.bio?.bio_name,
                    value: this.user.id,
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

        const selfExists = orgs.some((o) => o.value === this.user.id)

        if (
            !selfExists &&
            this.user?.id &&
            this.user?.user_type === UserType.org
        ) {
            return [
                {
                    label: this.bio?.bio_name || this.user.email,
                    value: this.user.id,
                },
                ...orgs,
            ]
        }

        return orgs
    }

    @computed
    get getReceiveWeeklySchedule() {
        return this.user.receive_weekly_schedule
    }

    @computed
    get getWeeklyScheduleFilters() {
        return this.user.weekly_schedule
    }

    @action
    setSession(session: Session | null) {
        const previousSession = this.session
        this.session = session

        if (previousSession?.access_token !== session?.access_token) {
            this.isInitializing = false
        }
    }

    @action
    private fetchEvents = async () => {
        try {
            const fetchedEvents = await cieventsService.getCIEvents({
                from_start_date: dayjs()
                    .tz("Asia/Jerusalem")
                    .add(3, "hours")
                    .toISOString(),
                to_start_date: dayjs()
                    .tz("Asia/Jerusalem")
                    .add(30, "day")
                    .toISOString(),
                sort_by: "start_date",
                sort_direction: "asc",
                future_events: true,
            })

            this.setCIEvents(fetchedEvents)
            utilService.saveEventsToLocalStorage(fetchedEvents)
        } catch (error) {
            console.error("Error fetching events:", error)
        }
    }

    // private setupPolling = () => {
    //     const handleVisibilityChange = () => {
    //         if (document.visibilityState === "visible") {
    //             // if (this.pollingRef) clearInterval(this.pollingRef)
    //             this.fetchEvents()

    //             // Notice - currently not employing this polling
    //             const intervalCallback = async () => {
    //                 await this.fetchEvents()
    //                 await this.fetchAppPublicBios()
    //                 this.callCount++
    //                 // Clear and set new interval with updated duration
    //                 if (this.pollingRef) clearInterval(this.pollingRef)
    //                 this.pollingRef = setInterval(
    //                     intervalCallback,
    //                     this.getPollingInterval()
    //                 )
    //             }

    //             this.pollingRef = setInterval(
    //                 intervalCallback,
    //                 this.getPollingInterval()
    //             )
    //         } else {
    //             if (this.pollingRef) clearInterval(this.pollingRef)
    //         }
    //     }

    //     document.addEventListener("visibilitychange", handleVisibilityChange)
    //     handleVisibilityChange() // Initial call

    //     return () => {
    //         if (this.pollingRef) clearInterval(this.pollingRef)
    //         document.removeEventListener(
    //             "visibilitychange",
    //             handleVisibilityChange
    //         )
    //     }
    // }
    private fetchOnVisibilityChange = async () => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                const timeSinceLastFetch = Date.now() - this.lastFetchTimestamp
                if (timeSinceLastFetch >= this.INACTIVITY_DELAY) {
                    Promise.all([
                        this.fetchEvents(),
                        this.fetchAppPublicBios(),
                    ]).then(() => {
                        this.lastFetchTimestamp = Date.now()
                    })
                }
            }
        }

        document.removeEventListener("visibilitychange", handleVisibilityChange)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        // Initial fetch
        await Promise.all([this.fetchEvents(), this.fetchAppPublicBios()])
        this.lastFetchTimestamp = Date.now()

        return () => {
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
        // console.log(
        //     "__handleSubscriptionUpdates table: ",
        //     table,
        //     "payload: ",
        //     payload
        // )
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
            case "alerts":
                let alert = payload.new
                if (
                    [
                        NotificationType.reminder,
                        NotificationType.subscription,
                    ].includes(payload.new.type)
                ) {
                    const event = this.app_ci_events.find(
                        (e) => e.id === alert.ci_event_id
                    )
                    if (!event) {
                        console.error(`Event not found for alert: ${alert.id}`)
                        break
                    }
                } else if (NotificationType.response === payload.new.type) {
                    //currently no formatting needed
                } else if (
                    NotificationType.admin_response === payload.new.type
                ) {
                    //currently no formatting needed
                } else {
                    throw new Error(`Unknown alert type: ${alert.type}`)
                }

                this.setAlert(alert, payload.eventType)

                break
            case "templates":
                this.setTemplate(payload.new, payload.eventType)
                break
            // case "config":
            //     this.setConfig(payload.new, payload.eventType)
            //     break
        }
    }

    private subscribeToUserData = async () => {
        if (!this.user?.id) return

        const channel = usersService.subscribeToUser(
            this.user.user_type,
            this.user.id,
            this.handleSubscriptionUpdates
        )

        return channel
    }

    @action
    setupSubscription = () => {
        if (this.loading || !this.user?.id) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                this.lastActivityTimestamp = Date.now()
                if (this.inactivityTimeout) {
                    clearTimeout(this.inactivityTimeout)
                    this.inactivityTimeout = null
                }
                if (this.subscriptionRef) {
                    return
                }

                this.subscribeToUserData().then((channel) => {
                    if (channel) {
                        this.subscriptionRef = channel
                    }
                })
            } else {
                this.inactivityTimeout = setTimeout(() => {
                    if (this.subscriptionRef) {
                        this.subscriptionRef.unsubscribe()
                        this.subscriptionRef = null
                    }
                }, this.INACTIVITY_DELAY)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        setTimeout(() => {
            handleVisibilityChange()
        }, 0)

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
            if (this.inactivityTimeout) {
                clearTimeout(this.inactivityTimeout)
            }
            if (this.subscriptionRef) {
                this.subscriptionRef.unsubscribe()
                this.subscriptionRef = null
            }
        }
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
        this.user_past_ci_events = userData.past_ci_events
        this.user_future_ci_events = userData.future_ci_events
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
                this.user.id,
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
    setUserFutureCIEvents = (ci_events: CIEvent[]) => {
        this.user_future_ci_events = ci_events
    }

    @action
    setUserPastCIEvents = (ci_events: CIEvent[]) => {
        this.user_past_ci_events = ci_events
    }

    @action
    setCIEvent = (ci_event: CIEvent, eventType: EventPayloadType) => {
        switch (eventType) {
            case EventPayloadType.UPDATE:
                this.app_ci_events = this.app_ci_events.map((e) =>
                    e.id === ci_event.id ? { ...e, ...ci_event } : e
                )
                this.user_future_ci_events = this.user_future_ci_events.map(
                    (e) => (e.id === ci_event.id ? { ...e, ...ci_event } : e)
                )

                break
            case EventPayloadType.DELETE:
                this.app_ci_events = this.app_ci_events.filter(
                    (e) => e.id !== ci_event.id
                )
                this.user_future_ci_events = this.user_future_ci_events.filter(
                    (e) => e.id !== ci_event.id
                )

                break
            case EventPayloadType.INSERT:
                if (this.app_ci_events.find((e) => e.id === ci_event.id)) return
                this.app_ci_events = [...this.app_ci_events, ci_event]
                this.user_future_ci_events = [
                    ...this.user_future_ci_events,
                    ci_event,
                ]
                break
        }
    }

    @action
    updateCIEvent = async (ci_event: Partial<CIEvent>) => {
        if (!ci_event.id) return

        const sorceAddress = this.user_future_ci_events.find(
            (e) => e.id === ci_event.id
        )?.address

        if (
            ci_event.address &&
            ci_event.address.place_id &&
            ci_event.address.place_id !== sorceAddress?.place_id
        ) {
            ci_event.address = await this.fetchAddressTranslation(
                ci_event.address
            )
        }

        const sourceTitle = this.user_future_ci_events.find(
            (e) => e.id === ci_event.id
        )?.title

        if (ci_event.title && ci_event.title !== sourceTitle) {
            ci_event.lng_titles = await this.fetchTitleTranslation(
                ci_event.title
            )
        }

        const updatedCIEvent = await cieventsService.updateCIEvent(
            ci_event.id,
            ci_event
        )
        this.setCIEvent(updatedCIEvent, EventPayloadType.UPDATE)
    }

    @action
    deleteCIEvent = async (eventId: string) => {
        //DELETE does not emit a payload, so we need to update the event to cancelled and then delete it incase some other user is online
        const ci_event = this.user_future_ci_events.find(
            (e) => e.id === eventId
        )
        if (!ci_event) return
        const deletedEventId = await cieventsService.deleteCIEvent(eventId)
        this.setCIEvent(
            { id: deletedEventId } as CIEvent,
            EventPayloadType.DELETE
        )
    }

    @action
    createCIEvent = async (
        ci_event: Omit<DBCIEvent, "id" | "cancelled_text" | "short_id">
    ) => {
        const [address, lng_titles] = await Promise.all([
            this.fetchAddressTranslation(ci_event.address),
            this.fetchTitleTranslation(ci_event.title),
        ])

        const newCIEvent = await cieventsService.createCIEvent({
            ...ci_event,
            address,
            lng_titles,
        })
        this.setCIEvent(newCIEvent, EventPayloadType.INSERT)
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

                const event = this.app_ci_events.find(
                    (e) => e.id === notification.ci_event_id
                )
                if (!event) {
                    console.error(
                        `Event not found for notification: ${notification.id}`
                    )
                    return
                }
                notification.title = event.title
                notification.start_date = event.start_date
                notification.firstSegment = event.segments[0]

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

                break
        }
    }

    @action
    upsertNotification = async (notification: NotificationDB) => {
        const updatedNotification =
            await notificationService.upsertNotification(notification)
        const event = this.app_ci_events.find(
            (e) => e.id === updatedNotification.ci_event_id
        )
        if (event) {
            updatedNotification.title = event.title
            updatedNotification.start_date = event.start_date
            updatedNotification.is_multi_day = event.is_multi_day
            if (event.segments.length > 0) {
                updatedNotification.firstSegment = event.segments[0]
            } else {
                updatedNotification.firstSegment = null
            }
        }

        this.setNotification(updatedNotification, EventPayloadType.UPSERT)
    }

    @action
    setRequest = (request: CIRequest, eventType: EventPayloadType) => {
        if (this.user.user_type === UserType.admin) {
            switch (eventType) {
                case EventPayloadType.INSERT:
                    if (this.app_requests.find((r) => r.id === request.id))
                        return
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
                    if (this.requests.find((r) => r.id === request.id)) return
                    this.requests = [...this.requests, request]
                    break
                case EventPayloadType.UPDATE:
                    this.requests = this.requests.map((r) =>
                        r.id === request.id ? { ...r, ...request } : r
                    )
                    break
            }
        }
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
    updateBio = async (bio: Partial<UserBio>) => {
        const updatedBio = await publicBioService.updateTeacherBio(bio)
        this.setBio(updatedBio, EventPayloadType.UPDATE)
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
                if (this.templates.find((t) => t.id === template.id)) return
                this.templates = [...this.templates, template]
                break
        }
    }

    @action
    createTemplate = async (template: Omit<CITemplate, "id">) => {
        const newTemplate = await templateService.createTemplate(template)
        this.setTemplate(newTemplate, EventPayloadType.INSERT)
    }

    @action
    deleteTemplate = async (templateId: string) => {
        await templateService.deleteTemplate(templateId)
        this.setTemplate(
            { id: templateId } as CITemplate,
            EventPayloadType.DELETE
        )
    }

    @action
    updateTemplate = async (template: Partial<CITemplate> & { id: string }) => {
        if (!template.id) return

        const updatedTemplate = await templateService.updateTemplate(template)
        this.setTemplate(updatedTemplate, EventPayloadType.UPDATE)
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
                if (this.app_requests.find((r) => r.id === appRequest.id))
                    return
                this.app_requests = [...this.app_requests, appRequest]
                break
        }
    }

    @action
    updateRequest = async (request: UpdateRequest) => {
        if (!request.id) return
        const updatedRequest = await requestsService.updateRequest(request)
        this.setAppRequest(updatedRequest, EventPayloadType.UPDATE)
    }

    @action
    createRequest = async (
        request: Omit<CIRequest, "id" | "number">
    ): Promise<CIRequest> => {
        const newRequest = await requestsService.createRequest(request)
        if (!this.user.phone) {
            this.updateUser({ phone: request.phone })
        }
        this.setAppRequest(newRequest, EventPayloadType.INSERT)
        return newRequest
    }

    @action
    setAlert = (alert: CIAlert, eventType: EventPayloadType) => {
        switch (eventType) {
            case EventPayloadType.INSERT:
                if (
                    alert.type === NotificationType.subscription ||
                    alert.type === NotificationType.reminder
                ) {
                    const event = this.app_ci_events.find(
                        (e) => e.id === alert.ci_event_id
                    )
                    if (!event) {
                        console.error(`Event not found for alert: ${alert.id}`)
                        return
                    }
                    alert.title = event.title
                    alert.start_date = event.start_date
                    alert.firstSegment = event.segments[0]
                } else if (alert.type === NotificationType.admin_response) {
                    //No need to set title or start_date for admin response
                } else {
                    throw new Error(
                        `setAlert - unknown alert type: ${alert.type}`
                    )
                }
                this.alerts = [...this.alerts, alert]
                break
            case EventPayloadType.UPDATE:
                this.alerts = this.alerts.map((a) =>
                    a.id === alert.id ? { ...a, ...alert } : a
                )
                break
        }
    }

    @action
    updateAlert = async (alert: Partial<CIAlert>) => {
        if (!alert.id) return
        const updatedAlert = await alertsService.updateAlert(alert)
        this.setAlert(updatedAlert, EventPayloadType.UPDATE)
    }

    @action
    viewEventAlert = async (eventId: string) => {
        const alert = this.alerts.find((a) => a.ci_event_id === eventId)
        if (alert && !alert.viewed) {
            const updatedAlert = await alertsService.updateAlert({
                id: alert.id,
                viewed: true,
            })
            this.setAlert(
                { ...alert, ...updatedAlert },
                EventPayloadType.UPDATE
            )
        }
    }

    @action
    viewRequestAlert = async (requestId: string) => {
        //Notice - batch updates are blocked by policy
        const alerts = this.alerts.filter((a) => a.request_id === requestId)
        const request = this.requests.find((r) => r.id === requestId)

        for (const alert of alerts) {
            if (alert && !alert.viewed && request) {
                const updatedAlert = await alertsService.updateAlert({
                    id: alert.id,
                    viewed: true,
                })
                this.setAlert(
                    { ...alert, ...updatedAlert },
                    EventPayloadType.UPDATE
                )
                const updatedRequest = await requestsService.updateRequest({
                    id: requestId,
                    viewed: true,
                })
                this.setRequest(
                    { ...request, ...updatedRequest },
                    EventPayloadType.UPDATE
                )
            }
        }
    }
    @action
    viewRequestAlerts = async () => {
        //Notice - batch updates are blocked by policy issues
        const alerts = this.alerts.filter((a) => !!a.request_id)

        for (const alert of alerts) {
            if (alert && !alert.viewed) {
                const updatedAlert = await alertsService.updateAlert({
                    id: alert.id,
                    viewed: true,
                })
                this.setAlert(
                    { ...alert, ...updatedAlert },
                    EventPayloadType.UPDATE
                )
                if (!alert.request_id) continue
                const updatedRequest = await requestsService.updateRequest({
                    id: alert.request_id,
                    viewed: true,
                })
                const request = this.requests.find(
                    (r) => r.id === alert.request_id
                )
                if (!request) continue
                this.setRequest(
                    { ...request, ...updatedRequest },
                    EventPayloadType.UPDATE
                )
            }
        }
    }

    // @action
    // setConfig = (config: CIConfig, eventType: EventPayloadType) => {
    //     switch (eventType) {
    //         case EventPayloadType.UPDATE:
    //             this.config = config
    //             break
    //     }
    // }

    @action
    setUserRole = (userRole: UserRole) => {
        this.app_users = this.app_users.map((u) =>
            u.id === userRole.user_id ? { ...u, ...userRole } : u
        )
    }

    @action
    updateUserData(
        user: ManageUserOption,
        userTypeByRoleId: UserType,
        userRole: { role_id: number }
    ) {
        user.user_type = userTypeByRoleId
        user.role = {
            id: userRole.role_id,
            role: userTypeByRoleId,
        }
    }

    @action
    updateUserRole = async (userRole: UserRole) => {
        await userRoleService.updateUserRole(userRole)

        const userTypeByRoleId = utilService.getUserTypeByRoleId(
            userRole.role_id.toString()
        )

        this.setUserRole({
            user_id: userRole.user_id,
            user_type: userTypeByRoleId,
            role_id: userRole.role_id,
        })

        const user = this.app_users.find((u) => u.id === userRole.user_id)
        if (!user) return
        this.updateUserData(user, userTypeByRoleId, userRole)

        this.setAppUsers(
            this.app_users.map((u) => (u.id === userRole.user_id ? user : u))
        )
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

    @action
    updateUserAppVersion = async () => {
        const payload = {
            version: CACHE_VERSION,
            last_signin: dayjs().toISOString(),
        }
        await usersService.updateUser(this.user.id, payload)
    }

    @action
    setRequestNotification = (flag: boolean) => {
        this.requestNotification = flag
    }

    @action
    private handleOnlineStatus = () => {
        console.log("handleOnlineStatus")
        const wasOffline = !this.isOnline
        const newOnlineStatus = navigator.onLine

        if (this.isOnline !== newOnlineStatus) {
            this.isOnline = newOnlineStatus

            if (wasOffline && this.isOnline) {
                this.init()
            }
        }
    }

    @action
    setNetworkFlag = (flag: boolean) => {
        this.networkFlag = flag
    }

    @action getOfflineData = () => {
        const events = utilService.getEventsFromLocalStorage()
        const filteredEvents = events.filter((e) =>
            dayjs(e.start_date).isAfter(dayjs().subtract(1, "day"))
        )
        const bios = utilService.getBiosFromLocalStorage()
        this.setAppPublicBios(bios)
        this.setCIEvents(filteredEvents)
    }

    @action
    setLanguage = (language: Language) => {
        this.language = language
        utilService.setLanguage(language)
    }

    @action
    toggleUserReceiveWeeklySchedule = async (
        id: string,
        receive_weekly_schedule: boolean
    ) => {
        this.user.receive_weekly_schedule = receive_weekly_schedule
        const updatedUser = await usersService.toggleUserReceiveWeeklySchedule(
            id,
            receive_weekly_schedule
        )
        if (updatedUser.receive_weekly_schedule !== receive_weekly_schedule) {
            this.user.receive_weekly_schedule =
                updatedUser.receive_weekly_schedule
        }
    }

    @action
    setWeeklyScheduleFilters = async (
        filters: WeeklyScheduleFilters,
        phone: string
    ) => {
        this.user.weekly_schedule = filters
        await usersService.updateUserWeeklyScheduleFilters(
            this.user.id,
            filters,
            phone
        )
    }

    @action
    updateUserPhoneNumber = async (phoneNumber: string) => {
        this.user.phone = phoneNumber
        const updatedUser = await usersService.updateUserPhoneNumber(
            this.user.id,
            phoneNumber
        )
        if (updatedUser.phone !== phoneNumber) {
            this.user.phone = updatedUser.phone
        }
        return updatedUser
    }

    async init() {
        console.log("init")
        this.setNetworkFlag(false)
        this.getOfflineData()

        if (!this.isOnline) {
            this.setLoading(false)
            return
        }

        try {
            await Promise.race([
                this.initializeUserAndData(),
                this.createTimeout(30000),
            ])
        } catch (error) {
            console.error("Error in initialization:", error)
            this.setNetworkFlag(true)
        } finally {
            this.fetchNextMonthCIEvents()
            this.finalizeInitialization()
        }
    }

    private createTimeout(ms: number): Promise<never> {
        return new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Network timeout")), ms)
        )
    }

    private async initializeUserAndData() {
        console.log("initializeUserAndData")
        if (!this.getSession?.user?.id) {
            await this.initPolling()
            return
        }
        this.setLoading(true)
        await this.initializeUser()
        await this.fetchAdditionalData()
    }

    private async initializeUser() {
        console.log("initializeUser")
        if (this.isInitializing) {
            console.log("Initialization already in progress, skipping...")
            this.setLoading(false)
            return
        }
        this.isInitializing = true
        try {
            let userData = await this.getUserData()

            if (!userData) {
                await this.createNewUser()
                this.setLoading(false)
                return
            }

            this.setStore(userData)
            utilService.saveEventsToLocalStorage(userData.ci_events)
        } catch (error: any) {
            // Handle other errors
            this.initPolling()
            this.setLoading(false)
            throw new Error("Error in initializeUser: " + error)
        } finally {
            this.isInitializing = false
        }
    }

    private async getUserData() {
        console.log("getUserData")
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const userId = user?.id

        if (!userId) {
            throw new Error("NO_USER_ID")
        }

        return await usersService.getUserData(userId)
    }

    private async createNewUser() {
        console.log("createNewUser")
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        try {
            const newUser = utilService.createDbUserFromUser(user)
            const createdUser = await usersService.createUser(newUser)

            if (createdUser) {
                this.setUser(createdUser)
                return createdUser
            }
            throw new Error("Failed to create user - no user data returned")
        } catch (error) {
            throw new Error(`Error in createNewUser: ${error}`)
        }
    }

    private finalizeInitialization() {
        console.log("finalizeInitialization")
        this.setLoading(false)

        if (this.getSession?.user?.id && this.isOnline) {
            this.setupSubscription()
            this.updateUserAppVersion()
            this.checkNotifications()
            utilService.saveIsInternalToLocalStorage(this.user.is_internal)
        }
    }

    @action
    private fetchAdditionalData = async () => {
        console.log("fetchAdditionalData")
        try {
            if (this.user.user_type === UserType.user) {
                await this.fetchAppPublicBios()
            }

            if (
                [UserType.admin, UserType.creator, UserType.org].includes(
                    this.user.user_type
                )
            ) {
                await Promise.allSettled([
                    this.fetchAppTaggableTeachers(),
                    this.fetchAppPublicBios(),
                ])
            }

            if (this.user.user_type === UserType.admin) {
                await Promise.allSettled([
                    this.fetchAppTaggableTeachers(),
                    this.fetchAppPublicBios(),
                    this.fetchAppUsers(),
                    this.fetchAppRequests(),
                    this.fetchAppCreators(),
                ])
            }
        } catch (error) {
            console.error("Fetch timeout:", error)
        } finally {
            this.setLoading(false)
        }
    }

    initPolling = async () => {
        console.log("initPolling")
        try {
            this.setLoading(true)
            await this.fetchOnVisibilityChange()
        } catch (error) {
            console.error("Error in initPolling:", error)
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
        try {
            const appPublicBios = await publicBioService.getPublicBioList()
            this.setAppPublicBios(appPublicBios)
            utilService.saveBiosToLocalStorage(appPublicBios)
        } catch (error) {
            throw new Error("Error in fetchAppPublicBios: " + error)
        }
    }

    fetchAppTaggableTeachers = async () => {
        const appTaggableTeachers = await publicBioService.getTaggableUsers()
        this.setAppTaggableTeachers(appTaggableTeachers)
    }

    @action
    fetchNextMonthCIEvents = async () => {
        const nextMonthCIEvents = await cieventsService.getCIEvents({
            from_start_date: dayjs()
                .tz("Asia/Jerusalem")
                .add(30, "day")
                .toISOString(),
            to_start_date: dayjs()
                .tz("Asia/Jerusalem")
                .add(60, "day")
                .toISOString(),
            sort_by: "start_date",
            sort_direction: "asc",
            future_events: true,
        })
        // Get only new events that don't exist in app_ci_events
        const existingEventIds = new Set(
            this.app_ci_events.map((event) => event.id)
        )
        const newEvents = nextMonthCIEvents.filter(
            (event) => !existingEventIds.has(event.id)
        )
        // If there are new events, append them to the existing array
        if (newEvents.length > 0) {
            this.app_ci_events.push(...newEvents)
        }
    }

    fetchAddressTranslation = async (address: IAddress) => {
        try {
            const enAddress = await getAddressFromGooglePlaceId(
                address.place_id
            )
            address.en_label = enAddress
        } catch (error) {
            console.error("Error in fetchAddressTranslation:", error)
        } finally {
            return address
        }
    }

    fetchTitleTranslation = async (title: string) => {
        const [ruTitle, enTitle] = await Promise.all([
            translateText(title, Language.ru, "name"),
            translateText(title, Language.en, "name"),
        ])
        return { ru: ruTitle, en: enTitle }
    }

    checkNotifications = async () => {
        const pwaInstallId = utilService.getPWAInstallId()

        if (pwaInstallId && pwaInstallId === this.user.pwa_install_id) {
            return
        }
        this.setRequestNotification(true)
    }

    cleanup = () => {
        this.currentSessionId = null
        if (this.subscriptionRef) {
            this.subscriptionRef.unsubscribe()
            this.subscriptionRef = null
        }
        if (this.pollingRef) {
            clearInterval(this.pollingRef)
            this.pollingRef = null
        }
        window.removeEventListener("online", this.handleOnlineStatus)
        window.removeEventListener("offline", this.handleOnlineStatus)
        this.setStore({
            ci_events: this.app_ci_events,
        } as CIUserData)
    }

    clearUser = () => {
        this.setStore({
            ci_events: this.app_ci_events,
            past_ci_events: this.user_past_ci_events,
            future_ci_events: this.user_future_ci_events,
            user: {} as CIUser,
            notifications: [],
            templates: [],
            requests: [],
            alerts: [],
            userBio: {} as UserBio,
        } as CIUserData)
        this.currentSessionId = null

        sessionStorage.clear()
        localStorage.removeItem(import.meta.env.VITE_AUTH_KEY_NAME)
    }

    @action
    clearAppStorage = async (): Promise<void> => {
        this.currentSessionId = null
        try {
            localStorage.clear()
            this.session = null
            this.user = {} as CIUser
            this.app_ci_events = []
            this.app_public_bios = []
            this.app_users = []
            this.app_requests = []
            this.app_creators = []
            this.app_taggable_teachers = []
            this.user_past_ci_events = []

            return Promise.resolve()
        } catch (error) {
            console.error("Error clearing app storage:", error)
            return Promise.reject(error)
        }
    }
}

export const store = new Store()
