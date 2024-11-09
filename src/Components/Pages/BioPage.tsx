import { useState } from "react"

import Card from "antd/es/card"
import BioSelfPreview from "../Users/BioSelfPreview"
import ProfileForm from "../Users/ProfileForm"

export default function BioPage() {
    const [editProfile, setEditProfile] = useState(false)
    const handleSubmitEdit = () => {
        setEditProfile(false)
    }
    return (
        <div className="bio-page">
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
                <Card style={{ marginTop: "1rem" }}>
                    <BioSelfPreview />
                </Card>
            )}
        </div>
    )
}
