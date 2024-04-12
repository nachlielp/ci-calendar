import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, InputRef } from "antd";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuthContext } from "./AuthContext";

enum SignupError {
  none = "",
  passwordsDontMatch = "Passwords do not match",
  passwordToShort = "Password must be at least 6 characters",
}

export default function Signup() {
  const authContext = useAuthContext();
  if (!authContext) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const { currentUser, signup, googleLogin } = authContext;
  const nameRef = useRef<InputRef>(null);
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const passwordConfRef = useRef<InputRef>(null);
  const [error, setError] = useState<SignupError>(SignupError.none);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser != null) {
      navigate("/");
    }
  }, [currentUser]);

  const onFinish = async () => {
    if (
      passwordRef.current?.input?.value !==
      passwordConfRef.current?.input?.value
    ) {
      // console.log(`${passwordRef.current?.input?.value} !==
      // ${passwordConfRef.current?.input?.value}`);
      return setError(SignupError.passwordsDontMatch);
    }
    try {
      setError(SignupError.none);
      setLoading(true);
      const email = emailRef.current?.input?.value;
      const password = passwordRef.current?.input?.value;
      const name = nameRef.current?.input?.value;
      if (!email || !password || !name) {
        throw new Error("Email or password is null");
      }
      await signup({ email, password, name });
      navigate("/");
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (e.code === "auth/weak-password") {
          setError(SignupError.passwordToShort);
        }
        console.error(`Firebase Error: ${e.code}`);
      } else {
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
    <Card id="signup-form" className="mx-auto max-w-sm mt-4">
      <h1 className="text-2xl font-bold text-center mb-2">Sign Up</h1>

      <Form
        title="Sing Up"
        name="basic"
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 24 }}
        style={{ maxWidth: 400 }}
        onFinish={onFinish}
      >
        <Form.Item>
          <Input type="text" placeholder="Name" ref={nameRef} required />
        </Form.Item>
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
        <Form.Item>
          <Input.Password
            status={error ? "error" : undefined}
            placeholder="Password Confirmation"
            ref={passwordConfRef}
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

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            Sign up
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
    </Card>
  );
}
