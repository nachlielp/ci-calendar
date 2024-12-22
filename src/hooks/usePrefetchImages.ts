import { CIEvent, UserBio } from "../util/interfaces"
import { store } from "../Store/store"
import { useEffect } from "react"

// Fallback for browsers that don't support requestIdleCallback
const requestIdleCallbackPolyfill = (callback: IdleRequestCallback) => {
    return setTimeout(() => {
        const start = Date.now()
        callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        })
    }, 1)
}

const cancelIdleCallback = (id: number) => clearTimeout(id)

const requestIdle = window.requestIdleCallback || requestIdleCallbackPolyfill
const cancelIdle = window.cancelIdleCallback || cancelIdleCallback

export const usePrefetchImages = ({
    app_public_bios,
    ci_events,
}: {
    app_public_bios: UserBio[]
    ci_events: CIEvent[]
}) => {
    useEffect(() => {
        if (!store.isOnline) return

        const imageURLs = [
            ...ci_events.flatMap((event) =>
                event.segments.flatMap((segment) =>
                    segment.teachers.map((teacher) => {
                        const teacherBio = app_public_bios.find(
                            (t) => t.user_id === teacher.value
                        )
                        return teacherBio?.img
                    })
                )
            ),
        ].filter(Boolean) // Remove undefined/null values

        if (imageURLs.length === 0) return

        // Create chunks of URLs to process in batches
        const chunkSize = 5
        const urlChunks = Array(Math.ceil(imageURLs.length / chunkSize))
            .fill(0)
            .map((_, i) => imageURLs.slice(i * chunkSize, (i + 1) * chunkSize))

        let currentChunkIndex = 0

        const processNextChunk = (deadline: IdleDeadline) => {
            while (
                currentChunkIndex < urlChunks.length &&
                (deadline.timeRemaining() > 0 || deadline.didTimeout)
            ) {
                const chunk = urlChunks[currentChunkIndex]
                chunk.forEach((imageUrl) => {
                    if (imageUrl) {
                        const img = new Image()
                        img.onerror = () =>
                            console.error(`Failed to load image: ${imageUrl}`)
                        img.src = imageUrl
                    }
                })
                currentChunkIndex++
            }

            if (currentChunkIndex < urlChunks.length) {
                idleCallbackId = requestIdle(processNextChunk, {
                    timeout: 1000,
                })
            }
        }

        let idleCallbackId = requestIdle(processNextChunk, { timeout: 1000 })

        return () => {
            if (idleCallbackId) {
                cancelIdle(idleCallbackId)
            }
        }
    }, [ci_events, app_public_bios])
}
