import { useState } from "react"
import { observer } from "mobx-react-lite"
import ProfileForm from "../Users/ProfileForm"
import BioCard from "../Users/BioCard"
import { store } from "../../Store/store"
import { useNavigate } from "react-router-dom"

const BioPage = () => {
    const navigate = useNavigate()
    const [editProfile, setEditProfile] = useState(false)
    const handleSubmitEdit = () => {
        setEditProfile(false)
    }

    return (
        <div className="bio-page page">
            <div className="button-container">
                <button
                    className="general-action-btn black-btn large-btn"
                    onClick={() => navigate("/bio/request")}
                >
                    שינוי סוג משתמש
                </button>

                {editProfile ? (
                    <button
                        className="general-action-btn large-btn"
                        onClick={() => setEditProfile(false)}
                    >
                        הצגת הפרופיל
                    </button>
                ) : (
                    <button
                        className="general-action-btn large-btn"
                        onClick={() => setEditProfile(true)}
                    >
                        עריכת הפרופיל
                    </button>
                )}
            </div>

            {editProfile ? (
                <ProfileForm closeEditProfile={handleSubmitEdit} />
            ) : (
                <section className="bio-page-card">
                    <BioCard teacher={store.getBio} />
                </section>
            )}
        </div>
    )
}

export default observer(BioPage)
