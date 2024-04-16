import { Button, Card } from "antd";
import { useAuthContext } from "../Auth/AuthContext";
import Meta from "antd/es/card/Meta";

function BioCard() {
  const { currentUser } = useAuthContext();
  if (!currentUser) throw new Error("BioCard: No user found");

  return (
    <div className="flex justify-center items-center w-full ">
      <Card
        className=" mt-6  w-full"
        hoverable
        style={{ width: 340 }}
        cover={<img alt="example" src={currentUser.image} />}
      >
        <Meta title={currentUser.name} description={currentUser.bio} />
        {currentUser.page && (
          <Button
            className="mt-5 w-full"
            key={currentUser.page}
            type="default"
            href={currentUser.page}
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
