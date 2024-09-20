import { Button, Form, type FormProps, Input, Card, Image, Switch } from "antd";
import { useEffect, useState } from "react";
import CloudinaryUpload from "../Other/CloudinaryUpload";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { useUser } from "../../../context/UserContext";
import { userService } from "../../../supabase/userService";
import { DbUser } from "../../../util/interfaces";

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
  closeEditProfile: () => void;
}

//TODO add cropper (react-easy-crop)
export default function TeacherForm({ closeEditProfile }: ITeacherFormProps) {
  const { width } = useWindowSize();
  const { user, setUser } = useUser();
  if (!user) throw new Error("TeacherForm.user");

  const [imageUrl, setImageUrl] = useState<string>(user?.img || "");
  const [form] = Form.useForm();
  useEffect(() => {
    setImageUrl(user?.img || "");
  }, [user]);

  const uploadNewImage = (url: string) => {
    setImageUrl(url);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    if (!user) return;
    const { name, bio, pageUrl, pageUrlTitle, showProfile, allowTagging } =
      values;
    const newTeacher: Partial<DbUser> = {
      fullName: name || user.fullName,
      bio: bio || "",
      img: imageUrl || "",
      pageUrl: pageUrl || "",
      pageTitle: pageUrlTitle || "",
      showProfile: showProfile?.toString() === "true",
      allowTagging: allowTagging?.toString() === "true",
      updatedAt: new Date().toISOString(),
    };
    try {
      // await updateTeacher(newTeacher);
      const updatedUser = await userService.updateUser(user.id, newTeacher);
      console.log("updatedUser: ", updatedUser);
      setUser(updatedUser);
      closeEditProfile();
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
      {user && (
        <Card className={`teacher-form ${width > 600 ? "desktop" : "mobile"}`}>
          <Form
            // onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            form={form}
            autoComplete="off"
            initialValues={{
              name: user.fullName,
              bio: user.bio,
              img: user.img,
              pageUrl: user.pageUrl,
              pageUrlTitle: user.pageTitle,
              showProfile: user.showProfile,
              allowTagging: user.allowTagging,
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
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      value &&
                      !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
                        value
                      )
                    ) {
                      return Promise.reject(new Error("נא להזין כתובת תקינה"));
                    }
                    if (
                      getFieldValue("pageUrl") &&
                      !getFieldValue("pageUrlTitle")
                    ) {
                      return Promise.reject(
                        new Error("נא להזין כותרת קישור לדף פרופיל")
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input placeholder="קישור לדף פרופיל" />
            </Form.Item>
            <Form.Item<FieldType> name="pageUrlTitle">
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
                  alt="example"
                  src={imageUrl}
                  key={imageUrl}
                  preview={false}
                  width={250}
                  height={250}
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
                defaultChecked={user?.showProfile}
              />
            </Form.Item>

            <Button
              htmlType="submit"
              className="teacher-form-submit"
              onClick={() => form.validateFields().then(onFinish)}
            >
              שמירת שינויים
            </Button>
          </Form>
        </Card>
      )}
    </>
  );
}
