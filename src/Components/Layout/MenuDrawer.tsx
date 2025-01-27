import { useState } from "react"
import Drawer from "antd/es/drawer"
import { Icon } from "../Common/Icon"
import { useLocation, useNavigate } from "react-router"
import { useIsMobile } from "../../hooks/useIsMobile"
import { supabase } from "../../supabase/client"
import { UserType } from "../../util/interfaces"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import "../../styles/menu-drawer.scss"
import { translations } from "../../util/translations"

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
            label: translations[store.getLanguage].home,
            onClick: goHome,
        },
        {
            key: "manage-events",
            icon: "calendar",
            label: translations[store.getLanguage].myEvents,
            onClick: () => {
                navigate("/manage-events")
                setOpen(false)
            },
            disabled: !isCreator,
        },
        {
            key: "create-events",
            icon: "calendar_add_on",
            label: translations[store.getLanguage].createEvents,
            onClick: () => {
                navigate("/create-events")
                setOpen(false)
            },
            disabled: !isCreator,
        },
        {
            key: "manage-all-events",
            icon: "calendar_add_on",
            label: translations[store.getLanguage].manageAllEvents,
            onClick: () => {
                navigate("/manage-all-events")
                setOpen(false)
            },
            disabled: !isAdmin,
        },
        {
            key: "manage-users",
            icon: "group",
            label: translations[store.getLanguage].manageUsers,
            onClick: () => {
                navigate("/manage-users")
                setOpen(false)
            },
            disabled: !isAdmin,
        },
        {
            key: "bio",
            icon: "account",
            label: translations[store.getLanguage].profile,
            onClick: () => {
                navigate("/bio")
                setOpen(false)
            },
            disabled: !isProfile,
        },
        {
            key: "filters-and-notifications",
            icon: "notifications",
            label: translations[store.getLanguage].notifications,
            onClick: () => {
                navigate("/filters-and-notifications")
                setOpen(false)
            },
            disabled: !isUser,
        },
        {
            key: "request",
            icon: "verified_user",
            label: translations[store.getLanguage].registerAsOrganization,
            onClick: () => {
                navigate("/request")
                setOpen(false)
            },
            disabled: !isUserOnly,
        },
        {
            key: "manage-support",
            icon: "support_agent",
            label: translations[store.getLanguage].manageSupport,
            onClick: () => {
                navigate("/manage-support")
                setOpen(false)
            },
            disabled: !isAdmin,
        },
        {
            key: "reset-password",
            icon: "lock_reset",
            label: translations[store.getLanguage].resetPassword,
            onClick: () => {
                navigate("/reset-password")
                setOpen(false)
            },
            disabled: !isEmailProvider,
        },
        {
            key: "about",
            icon: "info",
            label: translations[store.getLanguage].about,
            onClick: () => {
                navigate("/about")
                setOpen(false)
            },
        },
        {
            key: "logout",
            icon: "logout",
            label: translations[store.getLanguage].logout,
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
