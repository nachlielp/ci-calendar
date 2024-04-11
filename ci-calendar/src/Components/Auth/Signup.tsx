import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, InputRef } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuth } from "./AuthContext";

enum Error {
  none = "",
  passwordsDontMatch = "Passwords do not match",
  passwordToShort = "Password must be at least 6 characters",
}

function Signup() {
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const passwordConfRef = useRef<InputRef>(null);
  const { currentUser, signup, googleLogin, githubSignIn } = useAuth();
  const [error, setError] = useState<Error>(Error.none);
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
      return setError(Error.passwordsDontMatch);
    }
    try {
      setError(Error.none);
      setLoading(true);
      await signup(
        emailRef.current?.input?.value,
        passwordRef.current?.input?.value
      );
      navigate("/");
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (e.code === "auth/weak-password") {
          setError(Error.passwordToShort);
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
    <Card style={{ marginTop: "1rem" }}>
      <h2>Sign Up</h2>

      <Form
        title="Sing Up"
        name="basic"
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 24 }}
        style={{ maxWidth: 400 }}
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
      <div style={{ paddingTop: "1rem" }}>
        <Button
          type="default"
          onClick={githubSignIn}
          disabled={loading}
          style={{ width: "100%" }}
        >
          Sign In with Github
        </Button>
      </div>
      <div style={{ paddingTop: "1rem" }}>
        Already have an account?<Link to="/login">Log In</Link>
      </div>
    </Card>
  );
}

export default Signup;
