import { useCopy } from "../../app/language"
import { defineCopy } from "../../lib/copy"
import { RefreshIcon } from "../../ui/icons/RefreshIcon"

// New: legacy's admin lists updated over realtime, so it had no refresh.
const COPY = defineCopy({
    he: { refresh: "רענון", refreshing: "מרענן…" },
    en: { refresh: "Refresh", refreshing: "Refreshing…" },
    ru: { refresh: "Обновить", refreshing: "Обновление…" },
})

/**
 * An admin page's manual refresh (spec story 56): `onRefresh` refetches
 * the page's lists (`refreshFirstPage` for paginated ones); off while
 * `refreshing`.
 */
export function RefreshButton({
    refreshing,
    onRefresh,
}: {
    refreshing: boolean
    onRefresh: () => void
}) {
    const copy = useCopy(COPY)
    return (
        <button
            type="button"
            className="refresh-button"
            disabled={refreshing}
            onClick={onRefresh}
        >
            <RefreshIcon className="refresh-button-icon" />
            {refreshing ? copy.refreshing : copy.refresh}
        </button>
    )
}
