import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { useUser } from "../Context/UserContext"
import { getToken } from "firebase/messaging"
import { usersService } from "../supabase/usersService"
import { messaging } from "../firebase.messaging"
import { DbUser, PushNotificationPromission } from "../util/interfaces"

export default function useMessagingPermission() {
    const [permissionStatus, setPermissionStatus] =
        useState<PushNotificationPromission>(
            (utilService.getNotificationPermission() as PushNotificationPromission) ||
                null
        )

    const { user } = useUser()

    // TODO: use local storage to check if the user has already granted permission
    useEffect(() => {
        checkPermissionsAndToken()
    }, [user, permissionStatus])

    const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)
        utilService.setFirstNotificationPermissionRequest(permission)
    }

    const checkPermissionsAndToken = async () => {
        try {
            if (!user) {
                console.log("no user")
                setPermissionStatus(null)
                return
            }

            if (!utilService.isPWA()) {
                setPermissionStatus("denied")
                return
            }
            const { permission } = Notification
            setPermissionStatus(permission)
            utilService.setFirstNotificationPermissionRequest(permission)
            if (permission === "granted") {
                await checkAndUpdateToken(user)
            } else {
                console.error("Permission not granted for Notification")
            }
        } catch (error) {
            console.error("Error:", error)
        }
    }

    return {
        permissionStatus,
        requestPermission,
        checkPermissionsAndToken,
    }
}

async function checkAndUpdateToken(user: DbUser) {
    const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_PUBLIC_FIREBASE_KEY,
    })

    const deviceId = utilService.getDeviceId()

    const existingToken = user.push_notification_tokens?.find(
        (token) => token.device_id === deviceId
    )?.token

    if (token && token !== existingToken) {
        await usersService.updateUser(user.user_id, {
            push_notification_tokens: [
                ...(user.push_notification_tokens || []).filter(
                    (token) => token.device_id !== deviceId
                ),
                {
                    device_id: utilService.getDeviceId(),
                    token,
                    created_at: new Date().toISOString(),
                    is_pwa: utilService.isPWA(),
                    breanch: import.meta.env.VITE_BRANCH,
                },
            ],
        })
    }
}
