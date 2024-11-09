import React, { useEffect, useState } from "react"
import Badge from "antd/es/badge"
import Drawer from "antd/es/drawer"
import { Icon } from "../Common/Icon"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { useIsMobile } from "../../hooks/useIsMobile"
import { supabase } from "../../supabase/client"
import { UserType } from "../../util/interfaces"

export function MenuDrawer() {
    const [open, setOpen] = React.useState<boolean>(false)
    const { user } = useUser()
    const [isNewResponse, setIsNewResponse] = useState<boolean>(false)

    useEffect(() => {
        if (user && user?.requests?.length > 0) {
            setIsNewResponse(
                user.requests.some(
                    (request) =>
                        request.status === "closed" && !request.viewed_response
                )
            )
        }
    }, [user?.requests])

    const isMobile = useIsMobile()

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
            key: "edit-events",
            icon: "calendar",
            label: "הארועים שלי",
            onClick: () => {
                navigate("/manage-events")
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
            key: "my-profile",
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
            label: "התראות ופילטור",
            onClick: () => {
                navigate("/filters-and-notifications")
                setOpen(false)
            },
            disabled: true,
        },
        {
            key: "request",
            icon: "support_agent",
            label: "תמיכה",
            onClick: () => {
                navigate("/request")
                setOpen(false)
            },
            disabled: isAdmin,
        },
        {
            key: "request",
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

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="menu-drawer-btn"
                aria-label="פתח תפריט"
            >
                <Badge count={!isNewResponse && 0} size="small">
                    <Icon icon="menu" className="menu-drawer-icon" />
                </Badge>
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
                                isBadge={
                                    item.key === "request" && isNewResponse
                                }
                            />
                        ))}
                </div>
            </Drawer>
        </>
    )
}

const MenuItem = ({ item, isBadge }: { item: any; isBadge: boolean }) => {
    return (
        <article className="menu-item" onClick={item.onClick}>
            <Badge count={!isBadge && 0} size="small">
                <Icon icon={item.icon} />
            </Badge>
            <p style={{ fontSize: "24px", margin: "6px 0 10px 0" }}>
                {item.label}
            </p>
        </article>
    )
}