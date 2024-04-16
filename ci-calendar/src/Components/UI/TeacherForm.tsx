import {
  Button,
  Checkbox,
  Form,
  type FormProps,
  Input,
  Card,
  Upload,
  GetProp,
  UploadProps,
  message,
} from "antd";
import { useAuthContext } from "../Auth/AuthContext";
import { useState } from "react";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { CloudinaryUpload } from "./CloudinaryUpload";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (img: FileType, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const beforeUpload = (file: FileType) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("You can only upload JPG/PNG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Image must smaller than 2MB!");
  }
  return isJpgOrPng && isLt2M;
};
type FieldType = {
  name?: string;
  mailingList?: string;
  bio?: string;
  image?: string;
  page?: string;
};

export default function TeacherForm() {
  const { currentUser, updateUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  if (!currentUser) throw new Error("TeacherForm.currentUser");

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    currentUser.name = values.name || currentUser.name;
    currentUser.newsletter = values.mailingList?.toString() === "true";
    currentUser.bio = values.bio || currentUser.bio;
    currentUser.image = values.image || currentUser.image;
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

  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as FileType, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

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

        {/* <Form.Item<FieldType> label="תמונה" name="image">
          <Input type="url" />
        </Form.Item> */}
        <Form.Item<FieldType> label="תמונה" name="image">
          {/* <Upload
            name="avatar"
            listType="picture-circle"
            className="avatar-uploader"
            showUploadList={false}
            action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
            beforeUpload={beforeUpload}
            onChange={handleChange}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="avatar" style={{ width: "100%" }} />
            ) : (
              uploadButton
            )}
          </Upload> */}
          <CloudinaryUpload />
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
