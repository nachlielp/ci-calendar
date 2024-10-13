import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { useUser } from "../context/UserContext"
import { getToken } from "firebase/messaging"
import { usersService } from "../supabase/usersService"
import { messaging } from "../firebase.messaging"
import { PushNotificationPromission } from "../util/interfaces"

export default function useMessagingPermission() {
    const [notificationPermissionGranted, setNotificationPermissionGranted] =
        useState<boolean>(false)

    const { user } = useUser()

    // TODO: use local storage to check if the user has already granted permission
    useEffect(() => {
        if (!utilService.isFirstNotificationPermissionRequest()) {
            checkPermissionsAndToken()
        }
    }, [])

    const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        utilService.setFirstNotificationPermissionRequest(permission)
        return permission
    }

    const checkPermissionsAndToken =
        async (): Promise<PushNotificationPromission> => {
            try {
                if (!user) return null
                const { permission } = Notification
                utilService.setFirstNotificationPermissionRequest(permission)
                if (permission === "granted") {
                    setNotificationPermissionGranted(true)

                    const token = await getToken(messaging, {
                        vapidKey: import.meta.env
                            .VITE_VAPID_PUBLIC_FIREBASE_KEY,
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
                return permission
            } catch (error) {
                console.error("Error:", error)
                return null
            }
        }

    return {
        notificationPermissionGranted,
        requestPermission,
        checkPermissionsAndToken,
    }
}
