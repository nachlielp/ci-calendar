import { useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, InputRef } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ResetPassword() {
  const emailRef = useRef<InputRef>(null);

  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"info" | "error">();
  const onFinish = async () => {
    try {
      setMessage("");
      setLoading(true);
      await resetPassword(emailRef.current?.input?.value);
      setMessage("Check your inbox for further instructions");
      setMessageType("info");
    } catch (e) {
      setMessage("Failed to reset password");
      setMessageType("error");
      console.error(`Failed to reset password: ${e}`);
    }
    setLoading(false);
  };

  return (
    <Card style={{ marginTop: "1rem" }}>
      <h2> Reset Password</h2>

      <Form
        title=" Reset Password"
        name="basic"
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 24 }}
        style={{ maxWidth: 400 }}
        onFinish={onFinish}
      >
        <Form.Item>
          <Input type="email" placeholder="Email" ref={emailRef} required />
        </Form.Item>
        {message ? (
          <Form.Item>
            <Alert description={message} type={messageType} />
          </Form.Item>
        ) : (
          <></>
        )}
        <Form.Item style={{ marginBottom: "8px" }}>
          <Button
            type="primary"
            htmlType="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            Reset Password
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: "center", paddingTop: "12px" }}>
        <Link to="/login">Log In</Link>
      </div>
    </Card>
  );
}

export default ResetPassword;
