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
import { useEffect, useState } from "react";
import CloudinaryUpload from "../Other/CloudinaryUpload";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { useGetTeacher } from "../../../hooks/useGetTeacher";

type FieldType = {
  name?: string;
  bio?: string;
  img?: string;
  pageUrl?: string;
  pageUrlTitle?: string;
  upload?: string;
  showProfile?: string;
  allowTagging?: string;
};

interface ITeacherFormProps {
  showBioInTeacherPage: () => void;
}
//TODO add cropper (react-easy-crop)
export default function TeacherForm({ showBioInTeacherPage }: ITeacherFormProps) {
  const { width } = useWindowSize();
  const { currentUser, updateTeacher } = useAuthContext();
  if (!currentUser) throw new Error("TeacherForm.currentUser");
  const teacher = useGetTeacher(currentUser.id);


  const [imageUrl, setImageUrl] = useState<string>(teacher?.img || "");

  useEffect(() => {
    setImageUrl(teacher?.img || "");
  }, [teacher]);

  const uploadNewImage = (url: string) => {
    setImageUrl(url);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    if (!teacher) return;
    const { name, bio, pageUrl, pageUrlTitle, showProfile, allowTagging, } =
      values;
    const newTeacher = {
      id: teacher.id,
      createdAt: teacher.createdAt,
      fullName: name || currentUser.fullName,
      bio: bio || "",
      img: imageUrl || "",
      pageUrl: pageUrl || "",
      pageTitle: pageUrlTitle || "",
      showProfile: showProfile?.toString() === "true",
      allowTagging: allowTagging?.toString() === "true",
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateTeacher(newTeacher);
      showBioInTeacherPage();
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
      {teacher &&
        <Card className={`teacher-form`}>
          <Form
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            initialValues={{
              name: teacher.fullName,
              bio: teacher.bio,
              img: teacher.img,
              pageUrl: teacher.pageUrl,
              pageUrlTitle: teacher.pageTitle,
              showProfile: teacher.showProfile,
              allowTagging: teacher.allowTagging,
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
            <Form.Item<FieldType> label="תמונה" name="img">
              <div className="img-container">
                <Image width={200} src={imageUrl} />
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
            {/* <Form.Item<FieldType>
              label="אפשר תיוג"
              name="allowTagging"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item> */}
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                שמור
              </Button>
            </Form.Item>
          </Form>
        </Card>}
    </>
  );
}
