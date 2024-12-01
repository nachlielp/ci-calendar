import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { getToken } from "firebase/messaging"
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
        console.log("checkPermissionsAndToken")
        try {
            if (!store.isUser) {
                setPermissionStatus(null)
                return
            }

            const permission = await Notification.requestPermission()
            console.log("permission", permission)
            setPermissionStatus(permission)

            utilService.setFirstNotificationPermissionRequest(permission)

            if (permission === "granted") {
                try {
                    await checkAndUpdateToken(store.getUser)
                } catch (error) {
                    // Handle FCM token errors gracefully
                    console.error("FCM token error:", error)
                    // Continue with the rest of the flow even if token retrieval fails
                }
            } else {
                setPermissionStatus(permission)
                // console.error("Permission not granted for Notification")
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
    console.log("checkAndUpdateToken")
    if (!utilService.isPWA()) {
        return
    }
    try {
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_VAPID_PUBLIC_FIREBASE_KEY,
        })

        const deviceId = utilService.getDeviceId()

        const existingToken = user.push_notification_tokens?.find(
            (token) => token.device_id === deviceId
        )?.token

        if (!existingToken || token !== existingToken) {
            store.updateUser({
                user_id: user.user_id,
                push_notification_tokens: [
                    {
                        device_id: utilService.getDeviceId(),
                        token,
                        created_at: new Date().toISOString(),
                        is_pwa: utilService.isPWA(),
                        branch: import.meta.env.VITE_BRANCH,
                    },
                ],
                receive_notifications: true,
            })
        }
    } catch (error) {
        console.error("Error:", error)
    }
}
