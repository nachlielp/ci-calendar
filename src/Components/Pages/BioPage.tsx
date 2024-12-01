import { useState } from "react"
import { observer } from "mobx-react-lite"
import Card from "antd/es/card"
import BioSelfPreview from "../Users/BioSelfPreview"
import ProfileForm from "../Users/ProfileForm"
import BioCard from "../Users/BioCard"
import { store } from "../../Store/store"

const BioPage = () => {
    const [editProfile, setEditProfile] = useState(false)
    const handleSubmitEdit = () => {
        setEditProfile(false)
    }

    return (
        <div className="bio-page page">
            <div className="button-container">
                {editProfile ? (
                    <button
                        className="btn"
                        onClick={() => setEditProfile(false)}
                    >
                        הצגת הפרופיל
                    </button>
                ) : (
                    <button
                        className="btn"
                        onClick={() => setEditProfile(true)}
                    >
                        עריכת הפרופיל
                    </button>
                )}
            </div>
            {editProfile ? (
                <ProfileForm closeEditProfile={handleSubmitEdit} />
            ) : (
                <BioCard teacher={store.getBio} />
            )}
        </div>
    )
}

export default observer(BioPage)
