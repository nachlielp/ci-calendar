import { Button, Checkbox, Form, type FormProps, Input, Card } from "antd";
import { DbUser } from "../../util/interfaces";

type FieldType = {
  name?: string;
  mailingList?: string;
};

interface IUserForm {
  user: DbUser;
}
export default function UserForm({ user }: IUserForm) {
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    console.log("UserForm.onFinish.values: ", user, values);
    // const newsletter = values.mailingList?.toString() === "true";
    // try {
    //   const res = await updateUserByUid(user.id, {
    //     name: values.name,
    //     receiveWeeklyEmails: receiveWeeklyEmails,
    //   });
    //   console.log("UserForm.onFinish.res: ", res);
    // } catch (error) {
    //   console.error("UserForm.onFinish.error: ", error);
    // }
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
