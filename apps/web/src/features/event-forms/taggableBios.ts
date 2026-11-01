import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useServices } from "../../app/services"
import { useSession, useViewer } from "../../app/viewer"
import {
    taggableBiosQuery,
    taggableOptions,
    type Taggable,
} from "@ci-calendar/core/features/event-forms/taggableBios"

/** Who the user's event form can tag (empty lists until the bios load). */
export function useTaggable(userId: string): Taggable {
    const services = useServices()
    const viewer = useViewer()
    const session = useSession()
    const bios = useQuery({
        ...taggableBiosQuery(services, userId),
        enabled: !!userId,
    })
    const email = session?.user.email ?? ""
    return useMemo(
        () =>
            taggableOptions(bios.data ?? [], {
                id: userId,
                role: viewer.role,
                email,
            }),
        [bios.data, userId, viewer.role, email],
    )
}
