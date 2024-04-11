import { useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, InputRef } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuth } from "./AuthContext";
import { ButtonLink } from "../UI/LinkButton";
enum Error {
  none = "",
  wrongPassword = "Password does not match email",
  default = "Failed to sign in",
}

export default function Login() {
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const { login, googleLogin } = useAuth();
  const [error, setError] = useState<Error>(Error.none);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const onFinish = async () => {
    try {
      setError(Error.none);
      setLoading(true);
      await login(
        emailRef.current?.input?.value,
        passwordRef.current?.input?.value
      );
      navigate(`/`);
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (
          e.code === "auth/wrong-password" ||
          e.code === "auth/user-not-found"
        ) {
          setError(Error.wrongPassword);
        }
        console.error(`Firebase Error: ${e.code}`);
      } else {
        setError(Error.default);
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
        <ButtonLink to="/reset-password">Rest Password</ButtonLink>
        <div className="w-5"></div>
        <ButtonLink to="/signup">Sign Up</ButtonLink>
      </div>
    </Card>
  );
}
