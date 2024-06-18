import { Button, Card, Image } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { useGetTeacher } from "../../../hooks/useGetTeacher";
import Title from "antd/es/typography/Title";
import { Typography } from 'antd';
const { Text } = Typography;

function BioCard() {
  const { currentUser } = useAuthContext();
  if (!currentUser) throw new Error("BioCard: No user found");
  const teacher = useGetTeacher(currentUser.id);

  const imgComponent = teacher?.img ? (
    <Image
      alt="example"
      src={teacher.img}
      key={teacher.img}
      preview={false}
      width={200}
      height={200}
      className="bio-card-img"
    />
  ) : (
    ""
  );

  return (
    <>
      {teacher &&
        <Card
          hoverable
          className="bio-card"
        >
          <div className="bio-card-content">
            {imgComponent}
            <Title level={3} className="bio-card-title">
              {teacher.fullName}
            </Title>
            <Text>{teacher.bio}</Text>
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
          </div>
        </Card>
      }
    </>
  );
}

export default BioCard;
