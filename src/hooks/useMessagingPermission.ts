import { useEffect, useState } from "react"
import { utilService } from "../util/utilService"
import { useUser } from "../context/UserContext"
import { getToken } from "firebase/messaging"
import { usersService } from "../supabase/usersService"
import { messaging } from "../firebase.messaging"

export default function useMessagingPermission() {
    const [notificationPermissionGranted, setNotificationPermissionGranted] =
        useState<boolean>(false)

    const { user } = useUser()
    useEffect(() => {
        checkPermissionsAndToken()
    }, [])

    const checkPermissionsAndToken = async () => {
        try {
            if (!user) return
            const permission = await Notification.requestPermission()
            if (permission === "granted") {
                setNotificationPermissionGranted(true)

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
                            ...(user.push_notification_tokens || []),
                            {
                                device_id: utilService.getDeviceId(),
                                token,
                                created_at: new Date().toISOString(),
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

    return { notificationPermissionGranted }
}
