import { useCopy, useLanguage } from "../../../app/language"
import { useMachineTranslation } from "../../../app/useMachineTranslation"
import { defineCopy } from "../../../lib/copy"
import { OpenInNewIcon } from "../../../ui/icons/OpenInNewIcon"
import type { PublicBio } from "../publicEvent"
import "./BioCard.scss"
import { webLinks } from "./webLinks"

const COPY = defineCopy({
    he: {
        profilePage: "דף פרופיל",
        about: (name: string) => `אודות ${name}`,
    },
    en: {
        profilePage: "Profile page",
        about: (name: string) => `About ${name}`,
    },
    ru: {
        profilePage: "Страница профиля",
        about: (name: string) => `О себе: ${name}`,
    },
})

/**
 * A teacher's or organisation's public bio (legacy BioCard). In English and
 * Russian, the "about" text and link titles are machine-translated (new:
 * legacy showed them as written); the name stays as written.
 */
export function BioCard({ bio }: { bio: PublicBio }) {
    const copy = useCopy(COPY)
    const { language } = useLanguage()
    const links = webLinks(bio.links)
    const translated = useMachineTranslation(
        [bio.about, ...links.map((link) => link.title ?? "")],
        language,
        { onDevice: true },
    )
    return (
        <section className="bio-card">
            <h2 className="bio-card-title">{bio.name}</h2>
            {bio.img && (
                <img
                    className="bio-card-img"
                    src={bio.img}
                    alt={bio.name}
                    width={250}
                    height={250}
                    loading="lazy"
                    decoding="async"
                />
            )}
            {links.length > 0 && (
                <p className="bio-card-links">
                    {links.map((link) => (
                        <a
                            key={link.url}
                            className="teacher-page-link"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {(link.title && translated(link.title)) ||
                                copy.profilePage}
                            <OpenInNewIcon className="link-icon" />
                        </a>
                    ))}
                </p>
            )}
            <hr className="bio-card-hr" />
            <h3 className="bio-card-subtitle">{copy.about(bio.name)}</h3>
            <p className="bio-card-about">{translated(bio.about)}</p>
        </section>
    )
}
