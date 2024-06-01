import {
  Button,
  Checkbox,
  Form,
  type FormProps,
  Input,
  Card,
  Image,
} from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { useState } from "react";
import CloudinaryUpload from "../Other/CloudinaryUpload";
import { useWindowSize } from "../../../hooks/useWindowSize";

type FieldType = {
  name?: string;
  mailingList?: string;
  bio?: string;
  img?: string;
  pageUrl?: string;
  pageUrlTitle?: string;
  upload?: string;
  phoneNumber?: string;
  showProfile?: string;
};

interface ITeacherFormProps {
  handleSubmit: () => void;
}
//TODO add cropper (react-easy-crop)
export default function TeacherForm({ handleSubmit }: ITeacherFormProps) {
  const { width } = useWindowSize();
  const { currentUser, updateUser } = useAuthContext();
  if (!currentUser) throw new Error("TeacherForm.currentUser");
  const [imageUrl, setImageUrl] = useState<string>(currentUser.img);

  const uploadNewImage = (url: string) => {
    setImageUrl(url);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const { name, mailingList, bio, pageUrl, pageUrlTitle, phoneNumber, showProfile } =
      values;
    currentUser.fullName = name || currentUser.fullName;
    currentUser.newsletter = mailingList?.toString() === "true";
    currentUser.subscribedForUpdatesAt =
      !currentUser.newsletter && mailingList?.toString() === "true"
        ? new Date().toISOString()
        : "";
    currentUser.bio = bio || "";
    currentUser.img = imageUrl || "";
    currentUser.pageUrl = {
      link: pageUrl || "",
      title: pageUrlTitle || "",
    };
    currentUser.phoneNumber = phoneNumber || "";
    currentUser.showProfile = showProfile?.toString() === "true";
    try {
      await updateUser(currentUser);
      handleSubmit();
    } catch (error) {
      console.error("UserForm.onFinish.error: ", error);
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  const clearImage = () => {
    setImageUrl("");
  };

  const cardWidth = width > 600 ? 500 : 300;

  return (
    <>
      <Card className={`max-w-[${cardWidth}px] mx-auto  mt-4`}>
        <Form
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          initialValues={{
            name: currentUser.fullName,
            mailingList: currentUser.newsletter,
            bio: currentUser.bio,
            img: currentUser.img,
            pageUrl: currentUser.pageUrl?.link,
            pageUrlTitle: currentUser.pageUrl?.title,
            phoneNumber: currentUser.phoneNumber,
            showProfile: currentUser.showProfile,
          }}
        >
          <Form.Item<FieldType>
            label="שם מלא"
            name="name"
            rules={[{ required: true, message: "נא להזין שם" }]}
          >
            <Input />
          </Form.Item>



          <Form.Item<FieldType>
            label="קישור לדף פרופיל"
            name="pageUrl"
            rules={[{ type: "url", warningOnly: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item<FieldType>
            label="כותרת קישור לדף פרופיל"
            name="pageUrlTitle"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue("pageUrl") && !value) {
                    return Promise.reject(
                      new Error("נא להזין כותרת קישור לדף פרופיל")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType> label="אודות" name="bio">
            <Input.TextArea rows={6} />
          </Form.Item>

          {/* <Form.Item<FieldType>
          label="מספר פלאפון"
          name="phoneNumber"
          rules={[
            {
              pattern: /^(?:\+972-?|0)([23489]|5[0248]|7[234679])[0-9]{7}$/,
              message: "נא להזין מספר טלפון ישראלי תקני",
            },
          ]}
        >
          <Input />
        </Form.Item> */}
          <Form.Item<FieldType> label="תמונה" name="img">
            <div className="flex flex-col items-center space-y-2">
              <Image width={200} src={imageUrl} />
              {/* <Button
              type="default"
              onClick={() => setImageUrl("")}
              className="bg-red-400 text-white"
            >
              Clear
            </Button> */}
            </div>
          </Form.Item>
          <Form.Item<FieldType> name="upload">
            <CloudinaryUpload uploadNewImage={uploadNewImage} clearImage={clearImage} />
          </Form.Item>
          <Form.Item<FieldType>
            label="הצגת פרופיל"
            name="showProfile"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item<FieldType>
            label="הרשמה לרשימת תפוצה"
            name="mailingList"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              שמור
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <div className="flex justify-center items-center w-full h-12">

      </div>
    </>
  );
}
