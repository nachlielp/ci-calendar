import { AutoComplete, Button, Card, Input, SelectProps } from "antd"
import { useEffect, useState } from "react"
import { UserType } from "../../../util/interfaces"
import { useUsers } from "../../../hooks/useUsers"
import { useWindowSize } from "../../../hooks/useWindowSize"
import { ManageUserOption, userService } from "../../../supabase/userService"
// import { useAuthContext } from "../../Auth/AuthContext";

const searchResult = (query: string, users: ManageUserOption[]) => {
    return users
        .filter(
            (user) =>
                user.fullName.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
        )
        .map((user) => ({
            value: user.user_id,
            label: (
                <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                >
                    <span>
                        {user.fullName} - {user.email}
                    </span>
                </div>
            ),
        }))
}

function ManageUsers() {
    const [options, setOptions] = useState<
        SelectProps<ManageUserOption>["options"]
    >([])
    const [selectedUser, setSelectedUser] = useState<ManageUserOption | null>(
        null
    )
    const [inputValue, setInputValue] = useState<string>("")
    const { users } = useUsers()
    const { width } = useWindowSize()

    useEffect(() => {
        if (users.length > 0) {
            setOptions(
                users.map((user) => ({
                    value: user.user_id,
                    label: `${user.fullName} - ${user.email}`,
                }))
            )
        }
    }, [users])

    const handleSearch = (value: string) => {
        setInputValue(value)
        setOptions(value ? searchResult(value, users) : [])
    }

    const onSelect = (value: string) => {
        console.log(`ManageUsers.onSelect.value: `, value)
        const user = users.find((user) => user.user_id === value)
        if (user) {
            setSelectedUser(user)
            setInputValue(user.fullName)
        }
    }

    const onMakeAdmin = async () => {
        if (!selectedUser) return
        try {
            const updatedUser = await userService.updateUser(
                selectedUser.user_id,
                {
                    user_type: UserType.admin,
                }
            )
            if (!updatedUser) return
            const partialUser = {
                user_id: updatedUser.user_id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                user_type: updatedUser.user_type,
            }

            setSelectedUser(partialUser)
        } catch (error) {
            console.error(`ManageUsers.onMakeAdmin.error: `, error)
            throw error
        }
    }
    const onMakeCreator = async () => {
        if (!selectedUser) return
        try {
            const updatedUser = await userService.updateUser(
                selectedUser.user_id,
                {
                    user_type: UserType.creator,
                }
            )
            if (!updatedUser) return
            const partialUser = {
                user_id: updatedUser.user_id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                user_type: updatedUser.user_type,
            }

            setSelectedUser(partialUser)
        } catch (error) {
            console.error(`ManageUsers.onMakeCreator.error: `, error)
            throw error
        }
    }

    const onMakeProfile = async () => {
        if (!selectedUser) return
        try {
            const updatedUser = await userService.updateUser(
                selectedUser.user_id,
                {
                    user_type: UserType.profile,
                }
            )
            if (!updatedUser) return
            const partialUser = {
                user_id: updatedUser.user_id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                user_type: updatedUser.user_type,
            }

            setSelectedUser(partialUser)
        } catch (error) {
            console.error(`ManageUsers.onMakeProfile.error: `, error)
            throw error
        }
    }
    const onMakeUser = async () => {
        if (!selectedUser) return
        try {
            const updatedUser = await userService.updateUser(
                selectedUser.user_id,
                {
                    user_type: UserType.user,
                }
            )
            if (!updatedUser) return
            const partialUser = {
                user_id: updatedUser.user_id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                user_type: updatedUser.user_type,
            }

            setSelectedUser(partialUser)
        } catch (error) {
            console.error(`ManageUsers.onMakeUser.error: `, error)
            throw error
        }
    }

    const cardWidth = Math.min(width * 0.9, 500)

    const makeAdmin = (
        <Button
            disabled={selectedUser?.user_type === UserType.admin}
            onClick={onMakeAdmin}
            className="user-btn"
        >
            הגדר
            <br />
            כמנהל
        </Button>
    )
    const makeCreator = (
        <Button
            disabled={selectedUser?.user_type === UserType.creator}
            onClick={onMakeCreator}
            className="user-btn"
        >
            הגדר
            <br />
            כיוצר
        </Button>
    )

    const makeProfile = (
        <Button
            disabled={selectedUser?.user_type === UserType.profile}
            onClick={onMakeProfile}
            className="user-btn"
        >
            הגדר
            <br />
            כפרופיל
        </Button>
    )
    const makeUser = (
        <Button
            disabled={selectedUser?.user_type === UserType.user}
            onClick={onMakeUser}
            className="user-btn"
        >
            הגדר
            <br />
            כמשתמש
        </Button>
    )
    const footer = selectedUser
        ? [makeAdmin, makeCreator, makeProfile, makeUser]
        : []

    return (
        <div className="manage-users">
            <Card
                className="manage-users-card"
                style={{ maxWidth: `${cardWidth}px` }}
                title="הגדרת משתמשים"
                actions={footer}
            >
                <AutoComplete
                    style={{ width: "100%" }}
                    options={options}
                    onSelect={onSelect}
                    onSearch={handleSearch}
                    size="large"
                    value={inputValue} // Controlled component
                >
                    <Input.Search
                        size="large"
                        placeholder="שם משתמש או כתובת מייל"
                        enterButton
                    />
                </AutoComplete>
                {selectedUser && (
                    <div>
                        <p>{selectedUser.fullName}</p>
                        <p>{selectedUser.email}</p>
                        <p>{selectedUser.user_type}</p>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ManageUsers
