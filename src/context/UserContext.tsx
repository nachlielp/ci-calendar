import { createContext, useContext, useEffect, useState } from "react"
import { DbUser } from "../util/interfaces"
import { supabase } from "../supabase/client"
import { useSession } from "./SessionContext"
import { usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"

interface IUserContextType {
    user: DbUser | null
    updateUser: (updatedUser: Partial<DbUser>) => void
    loading: boolean
    updateUserContext: (updatedUser: Partial<DbUser>) => Promise<void>
}

const UserContext = createContext<IUserContextType>({
    user: null,
    updateUser: () => {},
    loading: true,
    updateUserContext: async () => {},
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
    const { session } = useSession()

    function updateUser(updatedUser: Partial<DbUser>) {
        if (user) {
            setUser({ ...user, ...updatedUser })
        }
    }

    const updateUserContext = async (updatedUser: Partial<DbUser>) => {
        console.log("updating user context")
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
        if (!user) return
        const channel = usersService.subscribeToUser(
            user.user_id,
            async ({ table, payload }) => {
                switch (table) {
                    case "users":
                        setUser({ ...user, ...payload.new })
                        break
                    case "requests":
                        console.log("requests", payload.new)
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
                    case "notifications":
                        if (payload.eventType === "UPDATE") {
                            const newUser = { ...user }
                            newUser.notifications = newUser.notifications.map(
                                (n) => {
                                    if (n.id === payload.new.id) {
                                        return payload.new
                                    }
                                    return n
                                }
                            )
                            setUser(newUser)
                        } else if (payload.eventType === "DELETE") {
                            setUser({
                                ...user,
                                notifications: user.notifications.filter(
                                    (n) => n.id !== payload.old.id
                                ),
                            })
                        } else if (payload.eventType === "INSERT") {
                            setUser({
                                ...user,
                                notifications: [
                                    ...user.notifications,
                                    payload.new,
                                ],
                            })
                        }
                        break
                }
            }
        )
        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    return (
        <UserContext.Provider
            value={{ user, updateUser, loading, updateUserContext }}
        >
            {children}
        </UserContext.Provider>
    )
}
