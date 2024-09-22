import { AutoComplete, Button, Card, Input, SelectProps } from "antd"
import { useEffect, useState } from "react"
import { DbTeacher, UserType } from "../../../util/interfaces"
import { useUsers } from "../../../hooks/useUsers"
import { useWindowSize } from "../../../hooks/useWindowSize"
import { ManageUserOption } from "../../../supabase/userService"
// import { useAuthContext } from "../../Auth/AuthContext";

const searchResult = (query: string, users: ManageUserOption[]) => {
    return users
        .filter(
            (user) =>
                user.fullName.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
        )
        .map((user) => ({
            value: user.id,
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
                    value: user.id,
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
        const user = users.find((user) => user.id === value)
        if (user) {
            setSelectedUser(user)
            setInputValue(user.fullName)
        }
    }

    const onMakeAdmin = async () => {
        if (!selectedUser) return
        try {
            // await updateUser({ ...selectedUser, userType: UserType.admin });
            setSelectedUser({ ...selectedUser, userType: UserType.admin })
            await onAddTeacher()
        } catch (error) {
            console.error(`ManageUsers.onMakeAdmin.error: `, error)
            throw error
        }
    }
    const onMakeTeacher = async () => {
        if (!selectedUser) return
        try {
            // await updateUser({ ...selectedUser, userType: UserType.teacher });
            setSelectedUser({ ...selectedUser, userType: UserType.teacher })
            await onAddTeacher()
        } catch (error) {
            console.error(`ManageUsers.onMakeTeacher.error: `, error)
            throw error
        }
    }
    const onMakeUser = async () => {
        if (!selectedUser) return
        try {
            // await updateUser({ ...selectedUser, userType: UserType.user });
            setSelectedUser({ ...selectedUser, userType: UserType.user })
            // await disableTeacher(selectedUser.id);
        } catch (error) {
            console.error(`ManageUsers.onMakeUser.error: `, error)
            throw error
        }
    }

    async function onAddTeacher() {
        if (!selectedUser) return
        const teacher: DbTeacher = {
            id: selectedUser.id,
            fullName: selectedUser.fullName,
            bio: "",
            allowTagging: true,
            pageTitle: "",
            pageUrl: "",
            showProfile: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            img: "",
        }
        // await addTeacher(teacher)
    }
    const cardWidth = Math.min(width * 0.9, 500)

    const makeAdmin = (
        <Button
            disabled={selectedUser?.userType === "admin"}
            onClick={onMakeAdmin}
            className="user-btn"
        >
            הגדר
            <br />
            כמנהל
        </Button>
    )
    const makeTeacher = (
        <Button
            disabled={selectedUser?.userType === "teacher"}
            onClick={onMakeTeacher}
            className="user-btn"
        >
            הגדר
            <br />
            כמורה
        </Button>
    )
    const makeUser = (
        <Button
            disabled={selectedUser?.userType === "user"}
            onClick={onMakeUser}
            className="user-btn"
        >
            הגדר
            <br />
            כמשתמש
        </Button>
    )
    const footer = selectedUser ? [makeAdmin, makeTeacher, makeUser] : []

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
                        <p>{selectedUser.userType}</p>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ManageUsers
