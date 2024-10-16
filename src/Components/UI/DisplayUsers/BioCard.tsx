import Image from "antd/es/image"
import Typography from "antd/es/typography"
import { Icon } from "../Other/Icon"
import { UserBio } from "../../../util/interfaces"
const { Text } = Typography

function BioCard({ teacher }: { teacher: UserBio }) {
    return (
        <section className="bio-card" style={{ direction: "rtl" }}>
            <div className="bio-card-content">
                <label className="bio-card-title">{teacher.full_name}</label>

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

                <hr className="bio-card-hr" />
                <label className="bio-card-subtitle">
                    אודות {teacher.full_name}
                </label>
                <Text>{teacher.bio}</Text>
            </div>
        </section>
    )
}

export default BioCard
