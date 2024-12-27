import { useMemo } from "react"
import { ManageUserOption, UserType } from "../../util/interfaces"
import { useWindowSize } from "../../hooks/useWindowSize"
import Select, { SelectProps } from "antd/es/select"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import "../../styles/manage-users.css"
import { action, computed, makeObservable, observable } from "mobx"
import { reaction } from "mobx"
class ManageUsersVM {
    @observable users: ManageUserOption[] = []
    @observable selectedUser: ManageUserOption | null = null
    @observable inputValue: string = ""
    @observable options: SelectProps<ManageUserOption>["options"] = []

    constructor() {
        makeObservable(this)

        reaction(
            () => store.app_users,
            (users) => {
                if (users.length > 0) {
                    this.setOptions(
                        users.map((user) => ({
                            value: user.id,
                            label: `${user.user_name} - ${user.email}`,
                        }))
                    )
                }
            }
        )
    }

    @computed
    get getSelectedUser() {
        return this.selectedUser
    }

    @computed
    get getInputValue() {
        return this.inputValue
    }

    @action
    setSelectedUser = (value: string) => {
        const user = store.app_users.find((user) => user.id === value)
        if (user) {
            this.selectedUser = user
            this.setInputValue(user.user_name)
        }
    }

    @action
    setInputValue = (value: string) => {
        this.inputValue = value
    }

    @action
    setOptions = (options: SelectProps<ManageUserOption>["options"]) => {
        this.options = options
    }

    @action
    onSetRole = async (user_type: UserType, role_id: number) => {
        if (!this.selectedUser) return

        await store.updateUserRole({
            user_id: this.selectedUser.id,
            user_type: user_type,
            role_id: role_id,
        })
    }

    @action
    handleSearch = (value: string) => {
        this.setInputValue(value)
        this.setOptions(value ? searchResult(value, store.app_users) : [])
    }

    @action
    handleClear = () => {
        this.setInputValue("")
        this.selectedUser = null
    }
}

const searchResult = (query: string, users: ManageUserOption[]) => {
    return users
        .filter(
            (user) =>
                user.user_name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
        )
        .map((user) => ({
            value: user.id,
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
    const vm = useMemo(() => new ManageUsersVM(), [])

    const { width } = useWindowSize()

    const cardWidth = Math.min(width * 0.9, 500)

    const makeAdmin = (
        <button
            disabled={vm.getSelectedUser?.user_type === UserType.admin}
            onClick={() => vm.onSetRole(UserType.admin, 1)}
            className="user-btn"
            key="admin"
        >
            מנהל
        </button>
    )
    const makeCreator = (
        <button
            disabled={vm.getSelectedUser?.user_type === UserType.creator}
            onClick={() => vm.onSetRole(UserType.creator, 2)}
            className="user-btn"
            key="creator"
        >
            יוצר
        </button>
    )
    const makeOrg = (
        <button
            disabled={vm.getSelectedUser?.user_type === UserType.org}
            onClick={() => vm.onSetRole(UserType.org, 3)}
            className="user-btn"
            key="org"
        >
            ארגון
        </button>
    )

    const makeProfile = (
        <button
            disabled={vm.getSelectedUser?.user_type === UserType.profile}
            onClick={() => vm.onSetRole(UserType.profile, 4)}
            className="user-btn"
            key="profile"
        >
            פרופיל
        </button>
    )
    const makeUser = (
        <button
            disabled={vm.getSelectedUser?.user_type === UserType.user}
            onClick={() => vm.onSetRole(UserType.user, 5)}
            className="user-btn"
            key="user"
        >
            משתמש
        </button>
    )

    const footer = vm.getSelectedUser
        ? [makeAdmin, makeOrg, makeCreator, makeProfile, makeUser]
        : []

    return (
        <div className="manage-users">
            <section
                className="manage-users-card card"
                style={{ maxWidth: `${cardWidth}px` }}
                title="הגדרת משתמשים"
            >
                <Select
                    options={vm.options}
                    onSelect={vm.setSelectedUser}
                    size="large"
                    value={vm.getInputValue}
                    placeholder="שם משתמש או כתובת מייל"
                    showSearch
                    filterOption={(input, option) =>
                        String(option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                    }
                />
                {vm.getSelectedUser && (
                    <div>
                        <p>{vm.getSelectedUser?.user_name}</p>
                        <p>{vm.getSelectedUser?.email}</p>
                        <p>{vm.getSelectedUser?.phone}</p>
                        <p>
                            {vm.getSelectedUser?.role
                                ? vm.getSelectedUser?.role.role
                                : "user"}
                        </p>
                    </div>
                )}
                <div className="manage-users-actions">{footer}</div>
            </section>
        </div>
    )
}

export default observer(ManageUsersPage)
