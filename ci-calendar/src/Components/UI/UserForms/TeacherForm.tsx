import { Button, Form, type FormProps, Input, Card, Image, Switch } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { useEffect, useState } from "react";
import CloudinaryUpload from "../Other/CloudinaryUpload";
// import { useWindowSize } from "../../../hooks/useWindowSize";
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
export default function TeacherForm({
  showBioInTeacherPage,
}: ITeacherFormProps) {
  // const { width } = useWindowSize();
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
    const { name, bio, pageUrl, pageUrlTitle, showProfile, allowTagging } =
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

  //TODO handle error - image to large!!
  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  //TODO clear form service !!!
  const clearImage = () => {
    setImageUrl("");
  };

  // const cardWidth = width > 600 ? 500 : 300;

  return (
    <>
      {teacher && (
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
              name="name"
              rules={[{ required: true, message: "נא להזין שם" }]}
            >
              <Input placeholder="*שם מלא" />
            </Form.Item>
            <Form.Item<FieldType> name="bio">
              <Input.TextArea
                rows={7}
                placeholder="אודות"
                maxLength={300}
                showCount
              />
            </Form.Item>

            <hr className="bio-card-hr" />

            <label className="bio-card-subtitle">
              <b>קישור</b> (יופיע ככפתור בעמוד הפרופיל)
            </label>
            <Form.Item<FieldType>
              name="pageUrl"
              rules={[{ type: "url", warningOnly: true }]}
            >
              <Input placeholder="קישור לדף פרופיל" />
            </Form.Item>
            <Form.Item<FieldType>
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
              <Input placeholder="כותרת קישור לדף פרופיל" />
            </Form.Item>

            <hr className="bio-card-hr" />

            <label className="bio-card-subtitle">
              <b>תמונת פרופיל</b>
              <label>התמונה תופיע בפרופיל שלך באתר</label>
            </label>
            <Form.Item<FieldType> name="img">
              <div className="img-container">
                <Image
                  width={200}
                  src={imageUrl}
                  className="teacher-form-img"
                />
              </div>
            </Form.Item>
            <Form.Item<FieldType> name="upload">
              <CloudinaryUpload
                uploadNewImage={uploadNewImage}
                clearImage={clearImage}
              />
            </Form.Item>

            <hr className="bio-card-hr" />

            <Form.Item<FieldType>
              label="הצגת פרופיל"
              name="showProfile"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="גלוי"
                unCheckedChildren="מוסתר"
                defaultChecked={teacher?.showProfile}
              />
            </Form.Item>
            {/* <Form.Item<FieldType>
              label="אפשר תיוג"
              name="allowTagging"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item> */}
            <Button htmlType="submit" className="teacher-form-submit">
              שמירת שינויים
            </Button>
          </Form>
        </Card>
      )}
    </>
  );
}
