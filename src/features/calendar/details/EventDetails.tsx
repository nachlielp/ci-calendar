import { Fragment, useEffect, useState } from "react"
import { useCopy, useLanguage } from "../../../app/language"
import { defineCopy } from "../../../lib/copy"
import { Dialog } from "../../../ui/Dialog"
import {
    CalendarAddOnIcon,
    CalendarIcon,
    CheckIcon,
    ContentCopyIcon,
    DomainIcon,
    IosShareIcon,
    MapIcon,
    OpenInNewIcon,
    PersonIcon,
    PinDropIcon,
    ScheduleIcon,
    ShareIcon,
} from "../../../ui/icons"
import {
    bioOf,
    eventDateLabel,
    eventPath,
    eventTimeRange,
    googleCalendarUrl,
    mapsUrl,
    pickAddress,
    pickTitle,
    priceLabel,
    segmentTimeRange,
    tagLabel,
    typeLabel,
    typeLabels,
} from "../eventFormat"
import { EVENT_LOCALES } from "../eventLocales"
import type { PublicBio, PublicEvent, Tag } from "../publicEvent"
import { BioCard } from "./BioCard"
import "./EventDetails.scss"

const COPY = defineCopy({
    he: {
        additionalInfo: "פרטים נוספים",
        price: "מחיר",
        link: "קישור",
        copied: "הועתק",
        addToCalendar: "הוספה ליומן גוגל",
        navigate: "ניווט",
        share: "שיתוף",
        shareTitle: "כדאי לבדוק את האירוע הזה!",
    },
    en: {
        additionalInfo: "Additional Information",
        price: "Price",
        link: "Link",
        copied: "Copied",
        addToCalendar: "Add to Google Calendar",
        navigate: "Navigate",
        share: "Share",
        shareTitle: "Check out this event!",
    },
    ru: {
        additionalInfo: "Дополнительная информация",
        price: "Цена",
        link: "Ссылка",
        copied: "Скопировано",
        addToCalendar: "Добавить в Google Календарь",
        navigate: "Маршрут",
        share: "Поделиться",
        shareTitle: "Посмотрите это событие!",
    },
})

/** An event's full details (legacy FullEventCard). */
export function EventDetails({ event }: { event: PublicEvent }) {
    const copy = useCopy(COPY)
    const locale = useCopy(EVENT_LOCALES)
    const timeRange = eventTimeRange(event)
    return (
        <section className="full-event-card">
            <h2 className="event-title">{pickTitle(event, locale.language)}</h2>
            {event.cancelled && (
                <p className="event-cancelled" role="status">
                    {locale.copy.cancelled}
                    {event.cancelledText && ` – ${event.cancelledText}`}
                </p>
            )}
            {event.organisations.length > 0 && (
                <p className="event-row">
                    <DomainIcon className="event-icon" />
                    <People event={event} tags={event.organisations} />
                </p>
            )}
            <p className="event-row">
                <CalendarIcon className="event-icon" />
                <span className="event-label">
                    {eventDateLabel(event, locale)}
                </span>
                {timeRange && (
                    <>
                        <ScheduleIcon className="event-icon" />
                        <span className="event-label event-time">
                            {timeRange}
                        </span>
                    </>
                )}
            </p>
            <p className="event-row">
                <PinDropIcon className="event-icon" />
                <span className="event-label">
                    {pickAddress(event.address, locale.language)}
                </span>
            </p>
            {event.multiDayTeachers.length > 0 && (
                <p className="event-row">
                    <PersonIcon className="event-icon" />
                    <People event={event} tags={event.multiDayTeachers} />
                </p>
            )}
            {event.segments.map((segment, index) => (
                <p className="sub-event" key={index}>
                    {segmentTimeRange(segment)}{" "}
                    {typeLabel(segment.type, locale)}
                    {segment.teachers.length > 0 && (
                        <>
                            {" "}
                            {locale.copy.with}{" "}
                            <People event={event} tags={segment.teachers} />
                        </>
                    )}
                    {segment.tags.map((tag) => (
                        <span key={tag} className="segment-tag">
                            {tagLabel(tag, locale)}
                        </span>
                    ))}
                </p>
            ))}
            <p className="event-tags">
                {typeLabels(event, locale).map((type) => (
                    <span key={type} className="event-tag">
                        {type}
                    </span>
                ))}
            </p>
            {event.links.length > 0 && (
                <p className="event-links">
                    {event.links.map((link) => (
                        <a
                            key={link.url}
                            className="link-button"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {link.title}
                            <OpenInNewIcon className="link-icon" />
                        </a>
                    ))}
                </p>
            )}
            {event.description && (
                <>
                    <hr className="hr" />
                    <h3 className="section-title">{copy.additionalInfo}</h3>
                    <p className="event-description">{event.description}</p>
                </>
            )}
            {event.prices.length > 0 && (
                <>
                    <hr className="hr" />
                    <h3 className="section-title">{copy.price}</h3>
                    <p className="event-price">
                        {event.prices.map(priceLabel).join(", ")}
                    </p>
                </>
            )}
            <EventActions event={event} />
        </section>
    )
}

/** Names, comma separated; those with a public bio open it. */
function People({ event, tags }: { event: PublicEvent; tags: Tag[] }) {
    return (
        <span className="event-labels">
            {tags.map((tag, index) => {
                const bio = bioOf(event, tag)
                return (
                    <Fragment key={`${tag.value}-${index}`}>
                        {index > 0 && ", "}
                        {bio ? (
                            <BioButton bio={bio} />
                        ) : (
                            <span className="teacher-name-label">
                                {tag.label}
                            </span>
                        )}
                    </Fragment>
                )
            })}
        </span>
    )
}

function BioButton({ bio }: { bio: PublicBio }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <button
                type="button"
                className="bio-modal-label"
                onClick={() => setOpen(true)}
            >
                {bio.name}
            </button>
            {open && (
                <Dialog
                    label={bio.name}
                    className="bio-dialog"
                    onClose={() => setOpen(false)}
                >
                    <BioCard bio={bio} />
                </Dialog>
            )}
        </>
    )
}

/**
 * Add to Google Calendar; then, in the installed app, navigate and share,
 * and in the browser, copy the event's link (as the legacy app offered).
 */
function EventActions({ event }: { event: PublicEvent }) {
    const copy = useCopy(COPY)
    const { language } = useLanguage()
    const url = `${window.location.origin}${eventPath(event)}`
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
    return (
        <p className="event-card-footer">
            <a
                className="secondary-action-btn"
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                aria-label={copy.addToCalendar}
            >
                <CalendarAddOnIcon className="action-icon" />
            </a>
            {isInstalledApp() ? (
                <>
                    <a
                        className="secondary-action-btn"
                        href={mapsUrl(event.address, navigator.userAgent)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={copy.navigate}
                    >
                        <MapIcon className="action-icon" />
                    </a>
                    {"share" in navigator && (
                        <button
                            type="button"
                            className="secondary-action-btn"
                            aria-label={copy.share}
                            onClick={() =>
                                navigator
                                    .share({
                                        title: copy.shareTitle,
                                        text: pickTitle(event, language),
                                        url,
                                    })
                                    // Dismissing the share sheet rejects.
                                    .catch(() => {})
                            }
                        >
                            {isIos ? (
                                <IosShareIcon className="action-icon" />
                            ) : (
                                <ShareIcon className="action-icon" />
                            )}
                        </button>
                    )}
                </>
            ) : (
                <CopyLinkButton url={url} />
            )}
        </p>
    )
}

function CopyLinkButton({ url }: { url: string }) {
    const copy = useCopy(COPY)
    const [copied, setCopied] = useState(false)
    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), 2000)
        return () => clearTimeout(timer)
    }, [copied])
    return (
        <button
            type="button"
            className="secondary-action-btn"
            onClick={() =>
                navigator.clipboard
                    .writeText(url)
                    .then(() => setCopied(true))
                    .catch(() => {})
            }
        >
            <span className="label">{copied ? copy.copied : copy.link}</span>
            {copied ? (
                <CheckIcon className="action-icon" />
            ) : (
                <ContentCopyIcon className="action-icon" />
            )}
        </button>
    )
}

/** Running as the installed app (home-screen PWA), not in a browser tab. */
function isInstalledApp(): boolean {
    return (
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true
    )
}
