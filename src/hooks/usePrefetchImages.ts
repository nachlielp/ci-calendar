import { useEffect } from "react"
import { CIEvent, UserBio } from "../util/interfaces"

export const usePrefetchImages = ({
    app_public_bios,
    ci_event,
}: {
    app_public_bios: UserBio[]
    ci_event: CIEvent
}) => {
    useEffect(() => {
        const prefetchImages = () => {
            const imageURLs = [
                ...ci_event.segments.flatMap((segment) =>
                    segment.teachers.map((teacher) => {
                        const teacherBio = app_public_bios.find(
                            (t) => t.user_id === teacher.value
                        )
                        return teacherBio?.img
                    })
                ),
            ]
            if (imageURLs.length > 0) {
                imageURLs.forEach((imageUrl) => {
                    if (imageUrl) {
                        console.log("prefetching image", imageUrl)
                        const img = new Image()
                        img.src = imageUrl
                    }
                })
            }
        }

        prefetchImages()
    }, [ci_event])
}
