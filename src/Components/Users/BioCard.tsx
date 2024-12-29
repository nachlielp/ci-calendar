import Image from "antd/es/image"
import "../../styles/bio-card.css"
import "../../styles/profile-form.css"
import Typography from "antd/es/typography"
import { Icon } from "../Common/Icon"
import { UserBio } from "../../util/interfaces"
import { observer } from "mobx-react-lite"
import { useIsMobile } from "../../hooks/useIsMobile"
const { Text } = Typography

const BioCard = ({ teacher }: { teacher: UserBio }) => {
    const isMobile = useIsMobile()
    if (!teacher.bio_name) {
        return (
            <section className="bio-card">
                <h2
                    className={`profile-form ${
                        isMobile ? "mobile" : "desktop"
                    }`}
                >
                    לא נמצא פרופיל
                </h2>
            </section>
        )
    }
    return (
        <section className="bio-card">
            <label className="bio-card-title">{teacher.bio_name}</label>

            {teacher?.img && (
                <Image
                    alt="example"
                    src={teacher.img}
                    key={teacher.img}
                    preview={false}
                    width={250}
                    height={250}
                    className="bio-card-img"
                />
            )}
            <article className="bio-card-links">
                {teacher.page_url && (
                    <a
                        className="teacher-page-link"
                        key={teacher.page_url}
                        href={teacher.page_url}
                        target="_blank"
                    >
                        {teacher.page_title || "דף פרופיל"}
                        <Icon icon="openInNew" className="event-link-icon" />
                    </a>
                )}
                {teacher.page_url_2 && (
                    <a
                        className="teacher-page-link"
                        key={teacher.page_url_2}
                        href={teacher.page_url_2}
                        target="_blank"
                    >
                        {teacher.page_title_2 || "דף פרופיל"}
                        <Icon icon="openInNew" className="event-link-icon" />
                    </a>
                )}
            </article>
            <hr className="bio-card-hr" />
            <label className="bio-card-subtitle">
                אודות {teacher.bio_name}
            </label>
            <Text>{teacher.about}</Text>
        </section>
    )
}

export default observer(BioCard)
