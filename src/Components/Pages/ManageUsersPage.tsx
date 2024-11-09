import AutoComplete from "antd/es/auto-complete"
import Card from "antd/es/card"
import Input from "antd/es/input"
import { useEffect, useState } from "react"
import { UserType } from "../../util/interfaces"
import { useUsers } from "../../hooks/useUsers"
import { useWindowSize } from "../../hooks/useWindowSize"
import { ManageUserOption } from "../../supabase/usersService"
import { SelectProps } from "antd/es/select"
import userRoleService from "../../supabase/userRoleService"

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

function ManageUsersPage() {
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
                      role: {
                          id: role_id,
                          role: user_type,
                      },
                  }
                : null
        )
    }
    const cardWidth = Math.min(width * 0.9, 500)

    const makeAdmin = (
        <button
            disabled={selectedUser?.role?.id === 1}
            onClick={() => onSetRole(UserType.admin, 1)}
            className="user-btn"
        >
            מנהל
        </button>
    )
    const makeCreator = (
        <button
            disabled={selectedUser?.role?.id === 2}
            onClick={() => onSetRole(UserType.creator, 2)}
            className="user-btn"
        >
            יוצר
        </button>
    )
    const makeOrg = (
        <button
            disabled={selectedUser?.role?.id === 3}
            onClick={() => onSetRole(UserType.org, 3)}
            className="user-btn"
        >
            ארגון
        </button>
    )

    const makeProfile = (
        <button
            disabled={selectedUser?.role?.id === 4}
            onClick={() => onSetRole(UserType.profile, 4)}
            className="user-btn"
        >
            פרופיל
        </button>
    )
    const makeUser = (
        <button
            disabled={selectedUser?.role?.id === 5 || !selectedUser?.role}
            onClick={() => onSetRole(UserType.user, 5)}
            className="user-btn"
        >
            משתמש
        </button>
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
                        <p>
                            {selectedUser.role
                                ? selectedUser.role.role
                                : "user"}
                        </p>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ManageUsersPage