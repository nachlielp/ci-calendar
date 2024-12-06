import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { getToken } from "firebase/messaging"
import { messaging } from "../firebase.messaging"
import {
    CIUser,
    PromissionStatus,
    PushNotificationPromission,
} from "../util/interfaces"
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

    const requestPermission = async (): Promise<
        PromissionStatus | undefined
    > => {
        if (!utilService.isPWA()) {
            return undefined
        }
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)
        utilService.setFirstNotificationPermissionRequest(permission)
        return permission as PromissionStatus
    }

    const checkPermissionsAndToken = async () => {
        console.log("checkPermissionsAndToken")
        try {
            if (!store.isUser) {
                setPermissionStatus(null)
                return
            }

            const { permission } = Notification
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
        let token = ""
        try {
            token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_VAPID_PUBLIC_FIREBASE_KEY,
            })
        } catch (error) {
            console.error("checkAndUpdateToken - error", error)
        }

        // const deviceId = utilService.getPWAInstallId()
        console.log("checkAndUpdateToken - deviceId")
        const existingToken = user.pwa_install_id

        if (token !== "" && (!existingToken || token !== existingToken)) {
            console.log("checkAndUpdateToken - updateUser")

            store.updateUser({
                user_id: user.user_id,
                fcm_token: token,
                pwa_install_id: utilService.getPWAInstallId(),
                // push_notification_tokens: [
                //     {
                //         device_id: utilService.getPWAInstallId(),
                //         token,
                //         created_at: new Date().toISOString(),
                //         is_pwa: utilService.isPWA(),
                //         branch: import.meta.env.VITE_BRANCH,
                //     },
                // ],
                receive_notifications: true,
            })
        }
    } catch (error) {
        console.error("Error:", error)
    }
}
