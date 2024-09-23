import { createContext, useContext, useEffect, useState } from "react"
import { DbUser } from "../util/interfaces"
import { supabase } from "../supabase/client"
import { useSession } from "./SessionContext"
import { userService } from "../supabase/userService"
import { utilService } from "../util/utilService"

interface IUserContextType {
    user: DbUser | null
    setUser: (user: DbUser | null) => void
    loading: boolean
    updateUserContext: (updatedUser: Partial<DbUser>) => Promise<void>
}

const UserContext = createContext<IUserContextType>({
    user: null,
    setUser: () => {},
    loading: true,
    updateUserContext: async () => {},
})

export const useUser = () => {
    return useContext(UserContext)
}

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<DbUser | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const { session } = useSession()

    const updateUserContext = async (updatedUser: Partial<DbUser>) => {
        try {
            if (user && user.user_id) {
                const updatedUserData = await userService.updateUser(
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
                if (session) {
                    const { data } = await supabase.auth.getUser()
                    if (data?.user?.id) {
                        const user = await userService.getUser(data.user.id)
                        if (user) {
                            setUser(user)
                        } else {
                            const newUser = utilService.createDbUserFromUser(
                                data.user
                            )
                            const createdUser = await userService.createUser(
                                newUser
                            )
                            if (createdUser) {
                                setUser(createdUser)
                            }
                        }
                    }
                } else {
                    setUser(null)
                }
            } catch (error) {
                console.error("Error fetching user:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [session])

    return (
        <UserContext.Provider
            value={{ user, setUser, loading, updateUserContext }}
        >
            {children}
        </UserContext.Provider>
    )
}
