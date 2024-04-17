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
  img?: string;
  pageUrl?: string;
  pageUrlTitle?: string;
  upload?: string;
  phoneNumber?: string;
};

export default function TeacherForm() {
  const { currentUser, updateUser } = useAuthContext();
  if (!currentUser) throw new Error("TeacherForm.currentUser");
  const [imageUrl, setImageUrl] = useState<string>(currentUser.img);

  const uploadNewImage = (url: string) => {
    setImageUrl(url);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    currentUser.fullName = values.name || currentUser.fullName;
    currentUser.newsletter = values.mailingList?.toString() === "true";
    currentUser.subscribedForUpdatesAt = currentUser.newsletter
      ? new Date().toISOString()
      : "";
    currentUser.bio = values.bio || currentUser.bio;
    currentUser.img = imageUrl || currentUser.img;
    currentUser.pageUrl = {
      link: values.pageUrl || currentUser.pageUrl.link,
      title: values.pageUrlTitle || currentUser.pageUrl.title,
    };
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
          name: currentUser.fullName,
          mailingList: currentUser.newsletter,
          bio: currentUser.bio,
          img: currentUser.img,
          pageUrl: currentUser.pageUrl?.link,
          pageUrlTitle: currentUser.pageUrl?.title,
          phoneNumber: currentUser.phoneNumber,
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

        <Form.Item<FieldType> label="ביוגרפיה" name="bio">
          <Input.TextArea rows={6} />
        </Form.Item>

        <Form.Item<FieldType>
          label="מספר פלאפון"
          name="phoneNumber"
          rules={[
            { required: true, message: "נא להזין מספר טלפון" },
            {
              pattern: /^(?:\+972-?|0)([23489]|5[0248]|7[234679])[0-9]{7}$/,
              message: "נא להזין מספר טלפון ישראלי תקני",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item<FieldType> label="תמונה" name="img">
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
