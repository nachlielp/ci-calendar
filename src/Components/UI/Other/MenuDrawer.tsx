import React, { useEffect, useState } from "react"
import Badge from "antd/es/badge"
import Drawer from "antd/es/drawer"
import { Icon } from "../Other/Icon"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase/client"
import { useUser } from "../../../context/UserContext"
import { UserType } from "../../../util/interfaces"
import { useIsMobile } from "../../../hooks/useIsMobile"

export function MenuDrawer() {
    const [open, setOpen] = React.useState<boolean>(false)
    const { user, requests } = useUser()
    const [isNewResponse, setIsNewResponse] = useState<boolean>(false)

    useEffect(() => {
        if (requests.length > 0) {
            setIsNewResponse(
                requests.some(
                    (request) =>
                        request.status === "closed" && !request.viewed_response
                )
            )
        }
    }, [requests])

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
            disabled: !isProfile,
        },
        {
            key: "newsletter",
            icon: "notifications",
            label: "התראות ופילטור",
            onClick: () => {
                navigate("/newsletter")
                setOpen(false)
            },
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
            <button onClick={() => setOpen(true)} className="menu-drawer-btn">
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
            <p>{item.label}</p>
        </article>
    )
}
