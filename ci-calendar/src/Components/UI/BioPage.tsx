import { Button } from "antd";
import { useState } from "react";
import TeacherForm from "./TeacherForm";
import BioCard from "./BioCard";

function BioPage() {
  const [editProfile, setEditProfile] = useState(false);
  return (
    <div>
      <div className="flex justify-center mt-2">
        {editProfile ? (
          <Button onClick={() => setEditProfile(false)}>חזרה פרופיל</Button>
        ) : (
          <Button onClick={() => setEditProfile(true)}>עריכת פרופיל</Button>
        )}
      </div>
      {editProfile ? <TeacherForm /> : <BioCard />}
    </div>
  );
}

export default BioPage;
