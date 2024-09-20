import { useState } from "react";
import TeacherForm from "../UserForms/TeacherForm";
import BioCard from "./BioCard";

export default function BioPage() {
  const [editProfile, setEditProfile] = useState(false);
  const handleSubmitEdit = () => {
    console.log("handleSubmitEdit");
    setEditProfile(false);
  };
  return (
    <div className="bio-page">
      <div className="button-container">
        {editProfile ? (
          <button className="btn" onClick={() => setEditProfile(false)}>
            הצגת הפרופיל
          </button>
        ) : (
          <button className="btn" onClick={() => setEditProfile(true)}>
            עריכת הפרופיל
          </button>
        )}
      </div>
      {editProfile ? (
        <TeacherForm closeEditProfile={handleSubmitEdit} />
      ) : (
        <BioCard />
      )}
    </div>
  );
}
