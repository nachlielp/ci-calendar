import Image from "antd/es/image"
import Typography from "antd/es/typography"
import { Icon } from "../Common/Icon"
import { UserBio } from "../../util/interfaces"
import { observer } from "mobx-react-lite"
const { Text } = Typography

const BioCard = ({ teacher }: { teacher: UserBio }) => {
    if (!teacher.bio_name) {
        return <h2>לא נמצא 4</h2>
    }
    return (
        <section className="bio-card" style={{ direction: "rtl" }}>
            <div className="bio-card-content">
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
                    אודות {teacher.bio_name}
                </label>
                <Text>{teacher.about}</Text>
            </div>
        </section>
    )
}

export default observer(BioCard)
