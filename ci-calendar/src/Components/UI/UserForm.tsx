import { Button, Checkbox, Form, type FormProps, Input, Card } from "antd";
import { DbUser } from "../../util/interfaces";
import { useAuthContext } from "../Auth/AuthContext";

type FieldType = {
  name?: string;
  mailingList?: string;
};

interface IUserForm {
  user: DbUser;
}
export default function UserForm({ user }: IUserForm) {
  const { updateUser } = useAuthContext();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    user.name = values.name || user.name;
    user.newsletter = values.mailingList?.toString() === "true";
    try {
      await updateUser(user);
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
          name: user.name,
          mailingList: user.newsletter,
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

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            שמור
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
