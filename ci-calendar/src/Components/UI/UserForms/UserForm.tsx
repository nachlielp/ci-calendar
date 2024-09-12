import {
  Button,
  Checkbox,
  Form,
  type FormProps,
  Input,
  Card,
  Select,
  Switch,
} from "antd";
import { DbUser } from "../../../util/interfaces";
import { useAuthContext } from "../../Auth/AuthContext";
import { districtOptions } from "../../../util/options";
import { useState } from "react";

type FieldType = {
  name: string;
  mailingList: string;
  phoneNumber?: string;
  districts?: string[];
  retreat: boolean;
  workshop: boolean;
  conference: boolean;
};

interface IUserFormProps {
  user: DbUser;
}

export default function UserForm({ user }: IUserFormProps) {
  const [mailingList, setMailingList] = useState(user.newsletter);
  const { updateUser } = useAuthContext();
  const [form] = Form.useForm();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    user.fullName = values.name || user.fullName;
    user.newsletter = values.mailingList?.toString() === "true";
    user.subscribedForUpdatesAt = user.newsletter
      ? new Date().toISOString()
      : "";
    user.phoneNumber = values.phoneNumber || "";
    // user.districts = values.districts || [];
    try {
      await updateUser(user);
    } catch (error) {
      console.error("UserForm.onFinish.error: ", error);
    }
  };

  return (
    <div className="user-form">
      <Card style={{ width: 300, marginTop: "1rem" }} id="user-form-card">
        <Form
          form={form}
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            name: user.fullName,
            mailingList: user.newsletter,
            phoneNumber: user.phoneNumber,
          }}
        >
          <Form.Item<FieldType>
            label="קבלת הודעות וואצאפ שבועיות"
            name="mailingList"
            valuePropName="checked"
          >
            <Checkbox
              checked={mailingList}
              onChange={(e) => setMailingList(e.target.checked)}
            />
          </Form.Item>

          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.mailingList !== currentValues.mailingList
            }
          >
            <Form.Item<FieldType>
              name="phoneNumber"
              rules={[
                () => ({
                  required: mailingList,
                  message: "נא להזין מספר טלפון",
                }),
                {
                  pattern: /^(?:\+972-?|0)([23489]|5[0248]|7[234679])[0-9]{7}$/,
                  message: "נא להזין מספר טלפון ישראלי תקני",
                },
              ]}
            >
              <Input placeholder="מספר פלאפון" />
            </Form.Item>
          </Form.Item>

          <Form.Item<FieldType> name="districts">
            <Select
              mode="multiple"
              placeholder="אזורים"
              style={{ width: "100%" }}
              options={districtOptions}
              showSearch={false}
              allowClear
              disabled={!mailingList}
            />
          </Form.Item>

          <Form.Item<FieldType> name="retreat">
            <Switch
              checkedChildren="ריטריטים"
              unCheckedChildren="ריטריטים"
              disabled={!mailingList}
            />
          </Form.Item>

          <Form.Item<FieldType> name="workshop">
            <Switch
              checkedChildren="סדנאות"
              unCheckedChildren="סדנאות"
              disabled={!mailingList}
            />
          </Form.Item>

          <Form.Item<FieldType> name="conference">
            <Switch
              checkedChildren="כנסים"
              unCheckedChildren="כנסים"
              disabled={!mailingList}
            />
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
