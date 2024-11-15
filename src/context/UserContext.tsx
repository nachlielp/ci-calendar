import { createContext, useContext, useEffect, useRef, useState } from "react"
import { DbUser } from "../util/interfaces"
import { supabase } from "../supabase/client"
import { usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useSession } from "./SessionContext"
import { notificationService } from "../supabase/notificationService"
import { alertsService } from "../supabase/alertsService"

interface IUserContextType {
    user: DbUser | null
    updateUser: (updatedUser: Partial<DbUser>) => void
    loading: boolean
    updateUserContext: (updatedUser: Partial<DbUser>) => Promise<void>
    updateUserState: (updatedUser: Partial<DbUser>) => void
}

const UserContext = createContext<IUserContextType>({
    user: null,
    updateUser: () => {},
    loading: true,
    updateUserContext: async () => {},
    updateUserState: async () => {},
})

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<DbUser | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const subscriptionRef = useRef<RealtimeChannel | null>(null)

    const { session } = useSession()

    function updateUser(updatedUser: Partial<DbUser>) {
        if (user) {
            setUser((prev) => {
                return { ...prev, ...updatedUser } as DbUser
            })
        }
    }

    const updateUserContext = async (updatedUser: Partial<DbUser>) => {
        try {
            if (user && user.user_id) {
                const updatedUserData = await usersService.updateUser(
                    user.user_id,
                    updatedUser
                )
                if (updatedUserData) {
                    setUser((prev) => ({ ...prev, ...updatedUserData }))
                }
            }
        } catch (error) {
            console.error("Error updating user context:", error)
        }
    }

    const updateUserState = async (updatedUser: Partial<DbUser>) => {
        setUser((prev) => {
            if (!prev) return null // Ensure prev is not null
            return { ...prev, ...updatedUser } as DbUser // Type assertion
        })
    }

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!session) {
                    setUser(null)
                    return
                }
                const { data } = await supabase.auth.getUser()
                if (data?.user?.id) {
                    const user = await usersService.getUser(data.user.id)
                    if (user) {
                        setUser(user)
                    } else {
                        const newUser = utilService.createDbUserFromUser(
                            data.user
                        )
                        const createdUser = await usersService.createUser(
                            newUser
                        )
                        if (createdUser) {
                            setUser(createdUser)
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching user:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [session])

    useEffect(() => {
        if (loading || !user) return

        const subscribeToUserData = async () => {
            if (!user) return
            const channel = usersService.subscribeToUser(
                user.user_id,
                handleSubscriptionUpdates
            )
            return channel
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                subscribeToUserData().then((channel) => {
                    if (channel) {
                        subscriptionRef.current = channel
                    }
                })
            } else {
                if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe()
                }
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        subscribeToUserData().then((channel) => {
            if (channel) {
                subscriptionRef.current = channel
            }
        })

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe()
            }
        }
    }, [loading])

    async function handleSubscriptionUpdates(payloadObj: any) {
        if (!user) return

        const { table, payload } = payloadObj

        switch (table) {
            case "users":
                setUser((prev) => ({ ...prev, ...payload.new }))
                break
            case "ci_events":
                switch (payload.eventType) {
                    case "UPDATE":
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      ci_events: prev.ci_events.map((e) => {
                                          if (e.id === payload.new.id) {
                                              return payload.new
                                          }
                                          return e
                                      }),
                                  }
                                : null
                        )
                        break
                    case "DELETE":
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      ci_events: prev.ci_events.filter(
                                          (e) => e.id !== payload.old.id
                                      ),
                                  }
                                : null
                        )
                        break
                    case "INSERT":
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      ci_events: [
                                          ...prev.ci_events,
                                          payload.new,
                                      ],
                                  }
                                : null
                        )
                        break
                }
                break
            case "requests":
                setUser((prev) =>
                    prev
                        ? {
                              ...prev,
                              requests: prev.requests.map((r) => {
                                  if (r.request_id === payload.old.request_id) {
                                      return payload.new
                                  }
                                  return r
                              }),
                          }
                        : null
                )
                break
            case "templates":
                switch (payload.eventType) {
                    case "UPDATE":
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      templates: prev.templates.map((t) => {
                                          if (
                                              t.template_id ===
                                              payload.old.template_id
                                          ) {
                                              return payload.new
                                          }
                                          return t
                                      }),
                                  }
                                : null
                        )
                        break
                    case "DELETE":
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      templates: prev.templates.filter(
                                          (t) =>
                                              t.template_id !==
                                              payload.old.template_id
                                      ),
                                  }
                                : null
                        )
                        break
                    case "INSERT":
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      templates: [
                                          ...prev.templates,
                                          payload.new,
                                      ],
                                  }
                                : null
                        )
                }
                break
            case "notifications":
                if (payload.eventType === "UPDATE") {
                    const newUser = { ...user }
                    newUser.notifications = newUser?.notifications?.map((n) => {
                        if (n.id === payload.new.id) {
                            return { ...n, ...payload.new }
                        }
                        return n
                    })

                    const notifications = user.notifications.map((n) => {
                        if (n.id === payload.new.id) {
                            return { ...n, ...payload.new }
                        }
                        return n
                    })

                    setUser((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  notifications: notifications,
                              }
                            : null
                    )
                } else if (payload.eventType === "DELETE") {
                    setUser((prev) =>
                        prev
                            ? {
                                  ...user,
                                  notifications: user.notifications.filter(
                                      (n) => n.id !== payload.old.id
                                  ),
                              }
                            : null
                    )
                } else if (payload.eventType === "INSERT") {
                    const notification =
                        await notificationService.getNotificationById(
                            payload.new.id
                        )

                    if (
                        user.notifications.find((n) => n.id === payload.new.id)
                    ) {
                        console.log("notification already exists")
                        return
                    }

                    setUser((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  notifications: [
                                      ...prev.notifications,
                                      notification,
                                  ],
                              }
                            : null
                    )
                }
                break
            case "alerts":
                if (payload.eventType === "UPDATE") {
                    if (payload.new.viewed) {
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      alerts: prev.alerts.filter((a) => {
                                          if (a.id === payload.new.id) {
                                              return false
                                          }
                                          return a
                                      }),
                                  }
                                : null
                        )
                    } else {
                        setUser((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      alerts: prev.alerts.map((a) => {
                                          if (a.id === payload.new.id) {
                                              return { ...a, ...payload.new }
                                          }
                                          return a
                                      }),
                                  }
                                : null
                        )
                    }
                }
                if (payload.eventType === "INSERT") {
                    const alert = await alertsService.getAlertById(
                        payload.new.id
                    )
                    setUser((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  alerts: [...prev.alerts, alert],
                              }
                            : null
                    )
                }
                break
        }
    }
    return (
        <UserContext.Provider
            value={{
                user,
                updateUser,
                loading,
                updateUserContext,
                updateUserState,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}
