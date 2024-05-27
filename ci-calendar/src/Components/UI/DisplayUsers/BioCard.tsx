import { Button, Card } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import Meta from "antd/es/card/Meta";

function BioCard() {
  const { currentUser } = useAuthContext();
  if (!currentUser) throw new Error("BioCard: No user found");

  const imgComponent = currentUser.img ? (
    <img alt="example" src={currentUser.img} key={currentUser.img} />
  ) : (
    ""
  );
  return (
    <div className="bio-page">
      <Card
        className=" mt-6  w-full"
        hoverable
        style={{ width: 340 }}
        cover={imgComponent}
      >
        <Meta title={currentUser.fullName} description={currentUser.bio} />
        {currentUser.pageUrl?.link && (
          <Button
            className="mt-5 w-full"
            key={currentUser.pageUrl.link}
            type="default"
            href={currentUser.pageUrl.link}
            target="_blank"
          >
            דף פרופיל
          </Button>
        )}
      </Card>
    </div>
  );
}

export default BioCard;
