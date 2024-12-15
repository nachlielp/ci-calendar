import { useState } from "react"
import { observer } from "mobx-react-lite"
import ProfileForm from "../Users/ProfileForm"
import BioCard from "../Users/BioCard"
import { store } from "../../Store/store"
import { useNavigate } from "react-router-dom"
import "../../styles/bio-page.css"
import { UserTypeHebrew } from "../../util/interfaces"
import { Icon } from "../Common/Icon"
import Switch from "antd/es/switch"
const BioPage = () => {
    const navigate = useNavigate()
    const [editProfile, setEditProfile] = useState(!store.getBio.bio_name)
    const [isLoading, setIsLoading] = useState(false)
    const handleSubmitEdit = () => {
        setEditProfile(false)
    }

    const handleAllowTaggingChange = async () => {
        setIsLoading(true)
        await store.updateBio({
            ...store.getBio,
            allow_tagging: !store.getBio.allow_tagging,
        })
        setIsLoading(false)
    }

    return (
        <div className="bio-page page">
            <h1> הפרופיל שלי</h1>

            <div className={`bio-page-container `}>
                <header className="bio-page-header">
                    <button
                        className="text-btn "
                        onClick={() => setEditProfile(!editProfile)}
                    >
                        {editProfile ? "הצגת פרופיל" : "עריכת פרופיל"}
                    </button>
                    <label className="bio-page-header-title">
                        פרופיל ציבורי
                    </label>
                </header>
                <hr className="hr" />
                {editProfile ? (
                    <ProfileForm closeEditProfile={handleSubmitEdit} />
                ) : (
                    <section className="bio-page-card">
                        <BioCard teacher={store.getBio} />
                    </section>
                )}
            </div>
            <div className="bio-page-footer">
                <label className="bio-page-footer-title">הגדרות</label>
                <hr className="hr" />
                <article className="bio-page-footer-article">
                    <label className="bio-page-footer-sub-title">הרשאה: </label>
                    &nbsp;
                    <label className="user-type-label">
                        &nbsp;
                        {
                            UserTypeHebrew[
                                store.getBio
                                    .user_type as keyof typeof UserTypeHebrew
                            ]
                        }
                    </label>
                    <button
                        className="edit-user-type-btn"
                        onClick={() => navigate("/bio/request")}
                    >
                        <Icon icon="edit" className="edit-user-type-icon" />
                    </button>
                </article>
                <article className="bio-page-footer-article">
                    <label className="bio-page-footer-sub-title">
                        אפשרות לתיוג על ידי מורים אחרים
                    </label>
                    &nbsp;
                    <Switch
                        checked={store.getBio.allow_tagging}
                        checkedChildren="גלוי"
                        unCheckedChildren="מוסתר"
                        onChange={() => handleAllowTaggingChange()}
                        loading={isLoading}
                    />
                </article>
            </div>
        </div>
    )
}

export default observer(BioPage)
