import { createContext, useContext, useEffect } from "react"

/**
 * Whether the app may reload itself onto a new version right now. Anything
 * that would lose the visitor's work on a reload (an unsaved form) blocks it
 * with `useBlockReload` while that work exists; `SafeUpdates` checks it
 * before reloading.
 */
export interface ReloadGuard {
    /** Blocks reloads until the returned release function is called. */
    block(): () => void
    isBlocked(): boolean
}

export function createReloadGuard(): ReloadGuard {
    const blockers = new Set<symbol>()
    return {
        block() {
            const blocker = Symbol("reload blocker")
            blockers.add(blocker)
            return () => {
                blockers.delete(blocker)
            }
        },
        isBlocked: () => blockers.size > 0,
    }
}

export const ReloadGuardContext = createContext<ReloadGuard | null>(null)

/**
 * Keeps the app from reloading onto a new version while `blocked` is true,
 * e.g. `useBlockReload(form.isDirty)` in a form with unsaved changes. The
 * block lifts when `blocked` turns false or the component unmounts.
 */
export function useBlockReload(blocked: boolean) {
    const guard = useContext(ReloadGuardContext)
    if (!guard) throw new Error("useBlockReload outside <AppRoot>")
    useEffect(() => (blocked ? guard.block() : undefined), [guard, blocked])
}
