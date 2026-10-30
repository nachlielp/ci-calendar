import { OpenInNewIcon } from "../../../ui/icons"
import type { PublicBio } from "../publicEvent"
import "./BioCard.scss"

const COPY = {
    profilePage: "דף פרופיל",
    about: (name: string) => `אודות ${name}`,
}

/** A teacher's or organisation's public bio (legacy BioCard). */
export function BioCard({ bio }: { bio: PublicBio }) {
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
            {bio.links.length > 0 && (
                <p className="bio-card-links">
                    {bio.links.map((link) => (
                        <a
                            key={link.url}
                            className="teacher-page-link"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {link.title || COPY.profilePage}
                            <OpenInNewIcon className="link-icon" />
                        </a>
                    ))}
                </p>
            )}
            <hr className="bio-card-hr" />
            <h3 className="bio-card-subtitle">{COPY.about(bio.name)}</h3>
            <p className="bio-card-about">{bio.about}</p>
        </section>
    )
}
