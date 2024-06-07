import { Button, Card, Image } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import Meta from "antd/es/card/Meta";
import { useGetTeacher } from "../../../hooks/useGetTeacher";

function BioCard() {
  const { currentUser } = useAuthContext();
  if (!currentUser) throw new Error("BioCard: No user found");
  const teacher = useGetTeacher(currentUser.id);


  const imgComponent = teacher?.img ? (
    <Image
      alt="example"
      src={teacher.img}
      key={teacher.img}
      width={200}
      height={200}
      style={{ objectFit: "cover" }}
      preview={false}
    />
  ) : (
    ""
  );

  return (
    <div className="bio-card">
      {teacher && <Card
        // className=" mt-6  w-full"
        hoverable
        style={{ width: 200 }}
      >
        {imgComponent}
        <Meta title={teacher.fullName} description={teacher.bio} />
        {teacher.pageUrl && (
          <Button
            className="mt-5 w-full"
            key={teacher.pageUrl}
            type="default"
            href={teacher.pageUrl}
            target="_blank"
          >
            {teacher.pageTitle || "דף פרופיל"}
          </Button>
        )}
      </Card>}
    </div>
  );
}

export default BioCard;
