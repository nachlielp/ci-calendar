import {
  Button,
  Checkbox,
  Form,
  type FormProps,
  Input,
  Card,
  Image,
} from "antd";
import { useAuthContext } from "../Auth/AuthContext";
import { useState } from "react";
import CloudinaryUpload from "./CloudinaryUpload";

type FieldType = {
  name?: string;
  mailingList?: string;
  bio?: string;
  image?: string;
  page?: string;
  upload?: string;
};

export default function TeacherForm() {
  const { currentUser, updateUser } = useAuthContext();
  if (!currentUser) throw new Error("TeacherForm.currentUser");
  const [imageUrl, setImageUrl] = useState<string>(currentUser.image);

  const uploadNewImage = (url: string) => {
    setImageUrl(url);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    currentUser.name = values.name || currentUser.name;
    currentUser.newsletter = values.mailingList?.toString() === "true";
    currentUser.bio = values.bio || currentUser.bio;
    currentUser.image = imageUrl || currentUser.image;
    currentUser.page = values.page || currentUser.page;
    try {
      await updateUser(currentUser);
    } catch (error) {
      console.error("UserForm.onFinish.error: ", error);
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Card className="max-w-[500px] mx-auto  mt-4">
      <Form
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        initialValues={{
          name: currentUser.name,
          mailingList: currentUser.newsletter,
          bio: currentUser.bio,
          image: currentUser.image,
          page: currentUser.page,
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
          label="הרשמה לרשימת תפוצה"
          name="mailingList"
          valuePropName="checked"
        >
          <Checkbox />
        </Form.Item>

        <Form.Item<FieldType>
          label="קישור לדף פרופיל"
          name="page"
          rules={[{ type: "url", warningOnly: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> label="ביוגרפיה" name="bio">
          <Input.TextArea rows={6} />
        </Form.Item>

        <Form.Item<FieldType> label="תמונה" name="image">
          <Image width={200} src={imageUrl} />
        </Form.Item>
        <Form.Item<FieldType> label="תמונה" name="upload">
          <CloudinaryUpload uploadNewImage={uploadNewImage} />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            שמור
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
