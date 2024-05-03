import { Button } from "antd";
import { useState } from "react";
import TeacherForm from "../UserForms/TeacherForm";
import BioCard from "./BioCard";

function BioPage() {
  const [editProfile, setEditProfile] = useState(false);
  const handleSubmitEdit = () => {
    setEditProfile(false);
  };
  return (
    <div>
      <div className="flex justify-center mt-2">
        {editProfile ? (
          <Button onClick={() => setEditProfile(false)}>חזרה פרופיל</Button>
        ) : (
          <Button onClick={() => setEditProfile(true)}>עריכת פרופיל</Button>
        )}
      </div>
      {editProfile ? (
        <TeacherForm handleSubmit={handleSubmitEdit} />
      ) : (
        <BioCard />
      )}
    </div>
  );
}

export default BioPage;
