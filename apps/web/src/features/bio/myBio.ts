import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServices } from "../../app/services"
import {
    BioMissingError,
    cacheSavedBio,
    myBioKey,
    saveBio,
    type BioSave,
} from "@ci-calendar/core/features/bio/myBio"

/** Saves the user's bio (`saveBio`) and puts it in the cache. */
export function useSaveBio(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (save: BioSave) =>
            saveBio(services, queryClient, userId, save),
        onSuccess: (result) => cacheSavedBio(queryClient, userId, result),
        onError: (error) => {
            if (error instanceof BioMissingError) {
                void queryClient.invalidateQueries({
                    queryKey: myBioKey(userId),
                })
            }
            services.telemetry.captureError(error, { source: "bio-save" })
        },
    })
}
