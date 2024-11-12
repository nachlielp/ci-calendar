import { createContext, useContext, useEffect, useRef, useState } from "react"
import { DbUser } from "../util/interfaces"
import { supabase } from "../supabase/client"
import { usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useSession } from "./SessionContext"

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
            setUser({ ...user, ...updatedUser })
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
                    const newUser = { ...user, ...updatedUserData }
                    setUser(newUser)
                }
            }
        } catch (error) {
            console.error("Error updating user context:", error)
        }
    }

    const updateUserState = async (updatedUser: Partial<DbUser>) => {
        console.log("updating user state with", updatedUser)
        setUser((prev) => {
            if (!prev) {
                console.warn("User state is null, cannot update")
                return null
            }
            const newState = { ...prev, ...updatedUser }
            console.log("new user state", newState)
            return newState
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
        console.log("_sub, user before update", user)
        console.log("_sub, payloadObj", payloadObj)
        const { table, payload } = payloadObj

        switch (table) {
            case "users":
                setUser({ ...user, ...payload.new })
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
                setUser({
                    ...user,
                    requests: user.requests.map((r) => {
                        if (r.request_id === payload.old.request_id) {
                            return payload.new
                        }
                        return r
                    }),
                })
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
                console.log("payload", payload)
                if (payload.eventType === "UPDATE") {
                    const newUser = { ...user }
                    newUser.notifications = newUser?.notifications?.map((n) => {
                        if (n.id === payload.new.id) {
                            return { ...n, ...payload.new }
                        }
                        return n
                    })

                    setUser(newUser)
                } else if (payload.eventType === "DELETE") {
                    setUser({
                        ...user,
                        notifications: user.notifications.filter(
                            (n) => n.id !== payload.old.id
                        ),
                    })
                } else if (payload.eventType === "INSERT") {
                    //Cant update without date and title
                    // console.log("inserting new notification")
                    // if (
                    //     user.notifications.find((n) => n.id === payload.new.id)
                    // ) {
                    //     console.log("notification already exists")
                    //     return
                    // }
                    // console.log(
                    //     "adding new notification to state: ",
                    //     payload.new
                    // )
                    // setUser((prev) =>
                    //     prev
                    //         ? {
                    //               ...prev,
                    //               notifications: [
                    //                   ...prev.notifications,
                    //                   payload.new,
                    //               ],
                    //           }
                    //         : null
                    // )
                }
                break
        }
        console.log("_sub, user after update", user)
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
