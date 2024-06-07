import { Button } from "antd";
import { useState } from "react";
import TeacherForm from "../UserForms/TeacherForm";
import BioCard from "./BioCard";

export default function BioPage() {
  const [editProfile, setEditProfile] = useState(false);
  const handleSubmitEdit = () => {
    setEditProfile(false);
  };
  return (
    <div className="bio-page">
      <div className="button-container">
        {editProfile ? (
          <Button onClick={() => setEditProfile(false)}>חזרה פרופיל</Button>
        ) : (
          <Button onClick={() => setEditProfile(true)}>עריכת פרופיל</Button>
        )}
      </div>
      {editProfile ? (
        <TeacherForm showBioInTeacherPage={handleSubmitEdit} />
      ) : (
        <BioCard />
      )}
    </div>
  );
}
