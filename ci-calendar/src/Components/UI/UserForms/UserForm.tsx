import { Button, Checkbox, Form, type FormProps, Input, Card } from "antd";
import { DbUser } from "../../../util/interfaces";
import { useAuthContext } from "../../Auth/AuthContext";

type FieldType = {
  name: string;
  mailingList: string;
  phoneNumber?: string;
};

interface IUserFormProps {
  user: DbUser;
}
export default function UserForm({ user }: IUserFormProps) {
  const { updateUser } = useAuthContext();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    user.fullName = values.name || user.fullName;
    user.newsletter = values.mailingList?.toString() === "true";
    user.subscribedForUpdatesAt = user.newsletter
      ? new Date().toISOString()
      : "";
    user.phoneNumber = values.phoneNumber || "";
    console.log(user)
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
    <div className="flex justify-center">
      <Card style={{ width: 300, marginTop: '1rem' }} id="user-form">
        <Form
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          initialValues={{
            name: user.fullName,
            mailingList: user.newsletter,
            phoneNumber: user.phoneNumber,
          }}
        >
          <Form.Item<FieldType>
            label="שם"
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

          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.mailingList !== currentValues.mailingList}>
            {({ getFieldValue }) =>
              getFieldValue("mailingList") ? (
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
              ) : null
            }
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              שמור
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
