import { useState } from "react"
import Drawer from "antd/es/drawer"
import { Icon } from "../Common/Icon"
import { useLocation, useNavigate } from "react-router"
import { useIsMobile } from "../../hooks/useIsMobile"
import { supabase } from "../../supabase/client"
import { UserType } from "../../util/interfaces"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import '../../styles/menu-drawer.scss'

const MenuDrawer = () => {
    const [open, setOpen] = useState<boolean>(false)
    const user = store.getUser

    const isMobile = useIsMobile()

    const page = useLocation()
    const firstPage = page.pathname.split("/")[1]

    const isAdmin = user?.user_type === UserType.admin

    const isCreator =
        user?.user_type === UserType.admin ||
        user?.user_type === UserType.creator ||
        user?.user_type === UserType.org

    const isProfile =
        user?.user_type === UserType.profile ||
        user?.user_type === UserType.admin ||
        user?.user_type === UserType.creator ||
        user?.user_type === UserType.org

    const isUser =
        user?.user_type === UserType.profile ||
        user?.user_type === UserType.admin ||
        user?.user_type === UserType.creator ||
        user?.user_type === UserType.org ||
        user?.user_type === UserType.user

    const isUserOnly = user?.user_type === UserType.user

    const isEmailProvider = user?.provider === "email"

    const navigate = useNavigate()

    const goHome = () => {
        navigate("/")
        setOpen(false)
    }

    let mapOfMenu = [
        {
            key: "all-events",
            icon: "home",
            label: "כל האירועים",
            onClick: goHome,
        },
        {
            key: "manage-events",
            icon: "calendar",
            label: "הארועים שלי",
            onClick: () => {
                navigate("/manage-events")
                setOpen(false)
            },
            disabled: !isCreator,
        },
        {
            key: "create-events",
            icon: "calendar_add_on",
            label: " יצירת ארועים",
            onClick: () => {
                navigate("/create-events")
                setOpen(false)
            },
            disabled: !isCreator,
        },
        {
            key: "manage-all-events",
            icon: "calendar_add_on",
            label: "ניהול אירועים",
            onClick: () => {
                navigate("/manage-all-events")
                setOpen(false)
            },
            disabled: !isAdmin,
        },
        {
            key: "manage-users",
            icon: "group",
            label: "ניהול משתמשים",
            onClick: () => {
                navigate("/manage-users")
                setOpen(false)
            },
            disabled: !isAdmin,
        },
        {
            key: "bio",
            icon: "account",
            label: "פרופיל",
            onClick: () => {
                navigate("/bio")
                setOpen(false)
            },
            disabled: !isProfile,
        },
        {
            key: "filters-and-notifications",
            icon: "notifications",
            label: "התראות ",
            onClick: () => {
                navigate("/filters-and-notifications")
                setOpen(false)
            },
            disabled: !isUser,
        },
        {
            key: "request",
            icon: "verified_user",
            label: "הרשמה כמורה או ארגון",
            onClick: () => {
                navigate("/request")
                setOpen(false)
            },
            disabled: !isUserOnly,
        },
        {
            key: "manage-support",
            icon: "support_agent",
            label: "ניהול תמיכה",
            onClick: () => {
                navigate("/manage-support")
                setOpen(false)
            },
            disabled: !isAdmin,
        },
        {
            key: "reset-password",
            icon: "lock_reset",
            label: "איפוס סיסמה",
            onClick: () => {
                navigate("/reset-password")
                setOpen(false)
            },
            disabled: !isEmailProvider,
        },
        {
            key: "about",
            icon: "info",
            label: "אודות",
            onClick: () => {
                navigate("/about")
                setOpen(false)
            },
        },
        {
            key: "logout",
            icon: "logout",
            label: "התנתקות",
            onClick: async () => {
                try {
                    await supabase.auth.signOut()
                } catch (error) {
                    // Ignore session_not_found error as we want to logout anyway
                    console.log("Logout error:", error)
                } finally {
                    store.clearUser()
                    setOpen(false)
                    navigate("/")
                }
            },
            disabled: !isUser,
        },
    ]

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="menu-drawer-btn"
                aria-label="פתח תפריט"
            >
                <Icon icon="menu" className="menu-drawer-icon" />
            </button>
            <Drawer
                closable
                destroyOnClose
                title={null}
                placement={isMobile ? "top" : "right"}
                open={open}
                onClose={() => setOpen(false)}
                className="menu-drawer"
                height="auto"
                styles={{ body: { padding: 0 } }}
            >
                <div className="menu-drawer-content">
                    {mapOfMenu
                        .filter((item) => !item.disabled)
                        .map((item) => (
                            <MenuItem
                                key={item.key}
                                item={item}
                                isActive={
                                    firstPage === item.key ||
                                    (firstPage === "" &&
                                        item.key === "all-events")
                                }
                            />
                        ))}
                </div>
            </Drawer>
        </>
    )
}

export default observer(MenuDrawer)

const MenuItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    return (
        <article
            className={`menu-item ${isActive ? "active" : ""}`}
            onClick={item.onClick}
        >
            <Icon icon={item.icon} />
            <p style={{ fontSize: "24px", margin: "6px 0 10px 0" }}>
                {item.label}
            </p>
        </article>
    )
}
