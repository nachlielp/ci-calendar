import { Image } from "antd"
import { Typography } from "antd"
import { Icon } from "../Other/Icon"
import { UserBio } from "../../../util/interfaces"
const { Text } = Typography

function BioCard({ teacher }: { teacher: UserBio }) {
    return (
        <section className="bio-card" style={{ direction: "rtl" }}>
            <div className="bio-card-content">
                <label className="bio-card-title">{teacher.fullName}</label>

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
                {teacher.pageUrl && (
                    <a
                        className="teacher-page-link"
                        key={teacher.pageUrl}
                        href={teacher.pageUrl}
                        target="_blank"
                    >
                        {teacher.pageTitle || "דף פרופיל"}
                        <Icon icon="openInNew" className="event-link-icon" />
                    </a>
                )}

                <hr className="bio-card-hr" />
                <label className="bio-card-subtitle">
                    אודות {teacher.fullName}
                </label>
                <Text>{teacher.bio}</Text>
            </div>
        </section>
    )
}

export default BioCard
