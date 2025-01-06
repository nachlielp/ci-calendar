import { useMemo } from "react"
import {
    ManageUserOption,
    UserType,
    UserTypeHebrew,
} from "../../util/interfaces"
import { useWindowSize } from "../../hooks/useWindowSize"
import Select from "antd/es/select"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import "../../styles/manage-users.css"
import { action, computed, makeObservable, observable } from "mobx"
import { reaction } from "mobx"
import message from "antd/es/message"
import { Icon } from "../Common/Icon"

class ManageUsersVM {
    @observable users: ManageUserOption[] = []
    @observable selectedUser: ManageUserOption | null = null
    @observable inputValue: string = ""

    constructor() {
        makeObservable(this)

        reaction(
            () => this.selectedUser?.user_type,
            () => {
                if (this.selectedUser) {
                    this.setSelectedUser(this.selectedUser.id)
                }
            }
        )
    }

    @computed
    get getOptions() {
        return store.app_users.map((user) => ({
            value: user.id,
            label: `${user.user_name} - ${user.email}`,
        }))
    }

    @computed
    get getSelectedUser() {
        return this.selectedUser
    }

    @computed
    get getSelectedUserType() {
        return this.selectedUser?.user_type
    }

    @computed
    get getInputValue() {
        return this.inputValue
    }

    @computed
    get getNumOfUsers() {
        return store.app_users.length
    }

    @computed
    get getNumOfAdmins() {
        return store.app_users.filter(
            (user) => user.user_type === UserType.admin
        ).length
    }

    @computed
    get getNumOfCreators() {
        return store.app_users.filter(
            (user) => user.user_type === UserType.creator
        ).length
    }

    @computed
    get getNumOfOrgs() {
        return store.app_users.filter((user) => user.user_type === UserType.org)
            .length
    }

    @computed
    get getNumOfProfiles() {
        return store.app_users.filter(
            (user) => user.user_type === UserType.profile
        ).length
    }

    @computed
    get getNumOfTypeUsers() {
        return store.app_users.filter(
            (user) => user.user_type === UserType.user
        ).length
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
    onSetRole = async (user_type: UserType, role_id: number) => {
        if (!this.selectedUser) return

        await store.updateUserRole({
            user_id: this.selectedUser.id,
            user_type: user_type,
            role_id: role_id,
        })

        this.setSelectedUser(this.selectedUser.id)
    }

    @action
    handleSearch = (value: string) => {
        this.setInputValue(value)
    }

    @action
    handleClear = () => {
        this.setInputValue("")
        this.selectedUser = null
    }
}

function ManageUsersPage() {
    const vm = useMemo(() => new ManageUsersVM(), [])

    const { width } = useWindowSize()

    const cardWidth = Math.min(width * 0.9, 500)

    const makeAdmin = (
        <button
            disabled={vm.getSelectedUserType === UserType.admin}
            onClick={() => vm.onSetRole(UserType.admin, 1)}
            className="user-btn"
            key="admin"
        >
            מנהל
        </button>
    )
    const makeCreator = (
        <button
            disabled={vm.getSelectedUserType === UserType.creator}
            onClick={() => vm.onSetRole(UserType.creator, 2)}
            className="user-btn"
            key="creator"
        >
            יוצר
        </button>
    )
    const makeOrg = (
        <button
            disabled={vm.getSelectedUserType === UserType.org}
            onClick={() => vm.onSetRole(UserType.org, 3)}
            className="user-btn"
            key="org"
        >
            ארגון
        </button>
    )

    const makeProfile = (
        <button
            disabled={vm.getSelectedUserType === UserType.profile}
            onClick={() => vm.onSetRole(UserType.profile, 4)}
            className="user-btn"
            key="profile"
        >
            פרופיל
        </button>
    )
    const makeUser = (
        <button
            disabled={vm.getSelectedUserType === UserType.user}
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
                <label className="manage-users-label">
                    חיפוש משתמש לפי שם או כתובת מייל:
                </label>
                <Select
                    options={vm.getOptions}
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
                        <p
                            onClick={async () => {
                                await navigator.clipboard.writeText(
                                    vm.getSelectedUser?.phone || ""
                                )
                                // If you're using antd, you can use their message component
                                message.success(
                                    "Phone number copied to clipboard"
                                )
                            }}
                            style={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                            }}
                            title="Click to copy"
                        >
                            {vm.getSelectedUser?.phone}
                            <Icon icon="contentCopy" className="copy-icon" />
                        </p>
                        <p>
                            {
                                UserTypeHebrew[
                                    vm.getSelectedUser?.role
                                        ? (vm.getSelectedUser?.role
                                              .role as UserType)
                                        : ("user" as UserType)
                                ]
                            }
                        </p>
                    </div>
                )}
                <div className="manage-users-actions">{footer}</div>
            </section>
            <section className="manage-users-stats card">
                <label className="stats-label">
                    סהכ חשבונות: {vm.getNumOfUsers}
                </label>
                <label className="stats-label">
                    מנהלים: {vm.getNumOfAdmins}
                </label>
                <label className="stats-label">
                    יוצרים: {vm.getNumOfCreators}
                </label>
                <label className="stats-label">
                    ארגונים: {vm.getNumOfOrgs}
                </label>
                <label className="stats-label">
                    פרופילים: {vm.getNumOfProfiles}
                </label>
                <label className="stats-label">
                    משתמשים: {vm.getNumOfTypeUsers}
                </label>
            </section>
        </div>
    )
}

export default observer(ManageUsersPage)
