import { createContext, useContext, useEffect, useState } from "react"
import { CIRequest, DbUser } from "../util/interfaces"
import { supabase } from "../supabase/client"
import { useSession } from "./SessionContext"
import { usersService } from "../supabase/usersService"
import { utilService } from "../util/utilService"
import useUserRequests from "../hooks/useUserRequests"

interface IUserContextType {
    user: DbUser | null
    requests: CIRequest[]
    setUser: (user: DbUser | null) => void
    loading: boolean
    updateUserContext: (updatedUser: Partial<DbUser>) => Promise<void>
}

const UserContext = createContext<IUserContextType>({
    user: null,
    requests: [],
    setUser: () => {},
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
    //requests are in user context because they are used in multiple components but the subscription events can be caught by a single instance
    const { requests } = useUserRequests(user?.user_id || "")

    const updateUserContext = async (updatedUser: Partial<DbUser>) => {
        try {
            if (user && user.user_id) {
                const updatedUserData = await usersService.updateUser(
                    user.user_id,
                    updatedUser
                )
                if (updatedUserData) {
                    setUser(updatedUserData)
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
            (payload) => {
                switch (payload.eventType) {
                    case "UPDATE":
                        setUser(payload.new)
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
            value={{ user, setUser, loading, updateUserContext, requests }}
        >
            {children}
        </UserContext.Provider>
    )
}
