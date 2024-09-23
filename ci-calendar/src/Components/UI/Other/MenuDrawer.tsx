import React from "react"
import { Drawer } from "antd"
import { Icon } from "../Other/Icon"
import { useNavigate } from "react-router-dom"
import { useWindowSize } from "../../../hooks/useWindowSize"
import { supabase } from "../../../supabase/client"
import { useUser } from "../../../context/UserContext"
import { UserType } from "../../../util/interfaces"
export function MenuDrawer() {
    const [open, setOpen] = React.useState<boolean>(false)
    const { user } = useUser()
    const { width } = useWindowSize()

    const isMobile = width < 768
    const isAdmin = user?.user_type === UserType.admin
    const isCreator =
        user?.user_type === UserType.admin ||
        user?.user_type === UserType.creator
    const isUser =
        user?.user_type === UserType.user ||
        user?.user_type === UserType.profile

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
            key: "edit-events",
            icon: "calendar",
            label: "ניהול ארועים",
            onClick: () => {
                navigate("/manage-events")
                setOpen(false)
            },
            disabled: !isCreator,
        },
        {
            key: "create-event",
            icon: "calendar_add_on",
            label: "הוספת אירוע",
            onClick: () => {
                navigate("/create-events")
                setOpen(false)
            },
            disabled: !isCreator,
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
            key: "my-profile",
            icon: "account",
            label: "פרופיל",
            onClick: () => {
                navigate("/bio")
                setOpen(false)
            },
            disabled: isUser,
        },
        {
            key: "newsletter",
            icon: "mail",
            label: "ניוזלטר",
            onClick: () => {
                navigate("/user")
                setOpen(false)
            },
        },
        {
            key: "logout",
            icon: "logout",
            label: "התנתקות",
            onClick: () => {
                supabase.auth.signOut()
                setOpen(false)
                navigate("/")
            },
        },
    ]

    // if (!isAdmin) {
    //   mapOfMenu = mapOfMenu.filter((item) => item.key !== "manage-users");
    // }

    return (
        <>
            <button onClick={() => setOpen(true)} className="menu-drawer-btn">
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
                bodyStyle={{ padding: 0 }}
            >
                <div className="menu-drawer-content">
                    {mapOfMenu
                        .filter((item) => !item.disabled)
                        .map((item) => (
                            <MenuItem key={item.key} item={item} />
                        ))}
                </div>
            </Drawer>
        </>
    )
}

const MenuItem = ({ item }: { item: any }) => {
    return (
        <article className="menu-item" onClick={item.onClick}>
            <Icon icon={item.icon} />
            <p>{item.label}</p>
        </article>
    )
}
