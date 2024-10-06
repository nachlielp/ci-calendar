import { useState } from "react"
import TeacherForm from "../UI/UserForms/TeacherForm"
import BioSelfPreview from "../UI/DisplayUsers/BioSelfPreview"
import { Card } from "antd"

export default function BioPage() {
    const [editProfile, setEditProfile] = useState(false)
    const handleSubmitEdit = () => {
        console.log("handleSubmitEdit")
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
                <TeacherForm closeEditProfile={handleSubmitEdit} />
            ) : (
                <Card style={{ marginTop: "1rem" }}>
                    <BioSelfPreview />
                </Card>
            )}
        </div>
    )
}
