import { useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, InputRef } from "antd";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuthContext } from "./AuthContext";
import { LinkButton } from "../UI/Other/LinkButton";
enum LoginError {
  none = "",
  wrongPassword = "Password does not match email",
  default = "Failed to sign in",
}

export default function Login() {
  const { googleLogin, emailLogin } = useAuthContext();
  if (!googleLogin || !emailLogin) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const [error, setError] = useState<LoginError>(LoginError.none);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const onFinish = async () => {
    try {
      setError(LoginError.none);
      setLoading(true);
      const email = emailRef.current?.input?.value;
      const password = passwordRef.current?.input?.value;
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      await emailLogin(email, password);
      navigate(`/`);
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (
          e.code === "auth/wrong-password" ||
          e.code === "auth/user-not-found"
        ) {
          setError(LoginError.wrongPassword);
        }
        console.error(`Firebase Error: ${e.code}`);
      } else {
        setError(LoginError.default);
        console.error(`Other Error: ${e}`);
      }
    }
    setLoading(false);
  };

  const googleSignIn = async () => {
    try {
      await googleLogin();
    } catch (error) {
      console.error(`Signup.googleSignIn.error: ${error}`);
    }
  };

  return (
    <Card id="login-form" className="mx-auto max-w-sm mt-4">
      <h1 className="text-2xl font-bold text-center mb-2">Log In</h1>
      <Form
        name="basic"
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 24 }}
        style={{ maxWidth: 500 }}
        onFinish={onFinish}
      >
        <Form.Item>
          <Input type="email" placeholder="Email" ref={emailRef} required />
        </Form.Item>
        <Form.Item>
          <Input.Password
            status={error ? "error" : undefined}
            placeholder="Password"
            ref={passwordRef}
            required
          />
        </Form.Item>
        {error ? (
          <Form.Item>
            <Alert description={error} type="error" />
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
            Log In
          </Button>
        </Form.Item>
      </Form>
      <div>
        <Button
          type="default"
          onClick={googleSignIn}
          disabled={loading}
          style={{ width: "100%" }}
        >
          Sign In with Google
        </Button>
      </div>

      <div className="flex justify-center pt-4 inline-block">
        <LinkButton to="/reset-password">Rest Password</LinkButton>
        <div className="w-5"></div>
        <LinkButton to="/signup">Sign Up</LinkButton>
      </div>
    </Card>
  );
}
