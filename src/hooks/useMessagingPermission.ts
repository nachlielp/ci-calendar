import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { getToken } from "firebase/messaging"
import { usersService } from "../supabase/usersService"
import { messaging } from "../firebase.messaging"
import { CIUser, PushNotificationPromission } from "../util/interfaces"
import { store } from "../Store/store"

export default function useMessagingPermission() {
    const [permissionStatus, setPermissionStatus] =
        useState<PushNotificationPromission>(
            (utilService.getNotificationPermission() as PushNotificationPromission) ||
                null
        )

    useEffect(() => {
        if (utilService.isPWA()) {
            checkPermissionsAndToken()
        }
    }, [store.isUser, permissionStatus])

    const requestPermission = async () => {
        if (!utilService.isPWA()) {
            return
        }
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)
        utilService.setFirstNotificationPermissionRequest(permission)
    }

    const checkPermissionsAndToken = async () => {
        try {
            if (!store.isUser) {
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
                await checkAndUpdateToken(store.getUser)
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

async function checkAndUpdateToken(user: CIUser) {
    if (!utilService.isPWA()) {
        return
    }
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
                {
                    device_id: utilService.getDeviceId(),
                    token,
                    created_at: new Date().toISOString(),
                    is_pwa: utilService.isPWA(),
                    branch: import.meta.env.VITE_BRANCH,
                },
            ],
        })
    }
}
