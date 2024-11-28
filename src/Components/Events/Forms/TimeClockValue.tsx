import { TimeClock } from "@mui/x-date-pickers/TimeClock"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { Dayjs } from "dayjs"

type TimeView = "hours" | "minutes"

export default function TimeClockValue({
    value,
    setValue,
    view,
    setView,
}: {
    value: Dayjs | null
    setValue: (value: Dayjs | null) => void
    onClose: () => void
    view: TimeView
    setView: (view: TimeView) => void
}) {
    return (
        <section className="time-clock-value">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimeClock
                    className="time-clock-value-clock"
                    value={value}
                    onChange={(newValue) => {
                        setValue(newValue)
                    }}
                    view={view}
                    onViewChange={(newView) => setView(newView as TimeView)}
                    views={["hours", "minutes"]}
                    ampmInClock={false}
                    focusedView={view}
                    ampm={false}
                    minutesStep={5}
                />
            </LocalizationProvider>

            <button
                className="general-clear-btn "
                onClick={() => setView(view === "hours" ? "minutes" : "hours")}
            >
                {view === "minutes" ? "שעות" : "דקות"}
            </button>
        </section>
    )
}
