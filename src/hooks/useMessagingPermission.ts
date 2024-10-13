import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { useUser } from "../context/UserContext"
import { getToken } from "firebase/messaging"
import { usersService } from "../supabase/usersService"
import { messaging } from "../firebase.messaging"
import { PushNotificationPromission } from "../util/interfaces"

export default function useMessagingPermission() {
    const [permissionStatus, setPermissionStatus] =
        useState<PushNotificationPromission>(null)

    const { user } = useUser()

    // TODO: use local storage to check if the user has already granted permission
    useEffect(() => {
        if (utilService.isFirstNotificationPermissionRequest()) {
            setPermissionStatus("default")
        } else {
            checkPermissionsAndToken()
        }
    }, [])

    const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        utilService.setFirstNotificationPermissionRequest(permission)
        setPermissionStatus(permission)
    }

    const checkPermissionsAndToken = async () => {
        try {
            if (!user) {
                console.log("no user")
                setPermissionStatus(null)
                return
            }
            const { permission } = Notification
            setPermissionStatus(permission)
            utilService.setFirstNotificationPermissionRequest(permission)
            if (permission === "granted") {
                const token = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_VAPID_PUBLIC_FIREBASE_KEY,
                })

                const deviceId = utilService.getDeviceId()

                const existingToken = user.push_notification_tokens?.find(
                    (token) => token.device_id === deviceId
                )?.token

                console.log(
                    "does need update: ",
                    token && token !== existingToken
                )

                if (token && token !== existingToken) {
                    await usersService.updateUser(user.user_id, {
                        push_notification_tokens: [
                            ...(user.push_notification_tokens || []),
                            {
                                device_id: utilService.getDeviceId(),
                                token,
                                created_at: new Date().toISOString(),
                                is_pwa: utilService.isPWA(),
                            },
                        ],
                    })
                }
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
