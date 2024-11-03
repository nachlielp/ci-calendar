import AutoComplete from "antd/es/auto-complete"
import Button from "antd/es/button"
import Card from "antd/es/card"
import Input from "antd/es/input"
import { useEffect, useState } from "react"
import { DbUser, UserType } from "../../../util/interfaces"
import { useUsers } from "../../../hooks/useUsers"
import { useWindowSize } from "../../../hooks/useWindowSize"
import { ManageUserOption } from "../../../supabase/usersService"
import { SelectProps } from "antd/es/select"
import userRoleService from "../../../supabase/userRoleService"

const searchResult = (query: string, users: ManageUserOption[]) => {
    return users
        .filter(
            (user) =>
                user.user_name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
        )
        .map((user) => ({
            value: user.user_id,
            label: (
                <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                >
                    <span>
                        {user.user_name} - {user.email}
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
                    label: `${user.user_name} - ${user.email}`,
                }))
            )
        }
    }, [users])

    const handleSearch = (value: string) => {
        setInputValue(value)
        setOptions(value ? searchResult(value, users) : [])
    }

    const handleClear = () => {
        setInputValue("")
        setSelectedUser(null)
    }

    const onSelect = (value: string) => {
        const user = users.find((user) => user.user_id === value)
        if (user) {
            setSelectedUser(user)
            setInputValue(user.user_name)
        }
    }

    const onSetRole = async (user_type: UserType, role_id: number) => {
        if (!selectedUser) return
        await userRoleService.setUserRole({
            user_id: selectedUser.user_id,
            user_type: user_type,
            role_id: role_id,
        })
        setSelectedUser((prev) =>
            prev
                ? {
                      ...prev,
                      user_type: user_type,
                  }
                : null
        )
    }
    const cardWidth = Math.min(width * 0.9, 500)

    const makeAdmin = (
        <Button
            disabled={selectedUser?.user_type === UserType.admin}
            onClick={() => onSetRole(UserType.admin, 1)}
            className="user-btn"
        >
            הגדרה כמנהל
        </Button>
    )
    const makeCreator = (
        <Button
            disabled={selectedUser?.user_type === UserType.creator}
            onClick={() => onSetRole(UserType.creator, 2)}
            className="user-btn"
        >
            הגדרה כיוצר
        </Button>
    )
    const makeOrg = (
        <Button
            disabled={selectedUser?.user_type === UserType.org}
            onClick={() => onSetRole(UserType.org, 3)}
            className="user-btn"
        >
            הגדרה כארגון
        </Button>
    )

    const makeProfile = (
        <Button
            disabled={selectedUser?.user_type === UserType.profile}
            onClick={() => onSetRole(UserType.profile, 4)}
            className="user-btn"
        >
            הגדרה כפרופיל
        </Button>
    )
    const makeUser = (
        <Button
            disabled={selectedUser?.user_type === UserType.user}
            onClick={() => onSetRole(UserType.user, 5)}
            className="user-btn"
        >
            הגדרה כמשתמש
        </Button>
    )
    const footer = selectedUser
        ? [makeAdmin, makeOrg, makeCreator, makeProfile, makeUser]
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
                    value={inputValue}
                >
                    <Input.Search
                        size="large"
                        placeholder="שם משתמש או כתובת מייל"
                        enterButton
                        onClear={handleClear}
                        allowClear
                    />
                </AutoComplete>
                {selectedUser && (
                    <div>
                        <p>{selectedUser.user_name}</p>
                        <p>{selectedUser.email}</p>
                        <p>{selectedUser.user_type}</p>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ManageUsers
