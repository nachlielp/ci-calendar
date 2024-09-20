import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, InputRef } from "antd";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../supabase/client";

enum SignupError {
  none = "",
  passwordsDontMatch = "הסיסמאות לא תואמות",
  passwordToShort = "סיסמה חייבת להיות לפחות 6 תווים",
}

export default function Signup() {
  const { user } = useUser();
  const nameRef = useRef<InputRef>(null);
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const passwordConfRef = useRef<InputRef>(null);
  const [error, setError] = useState<SignupError>(SignupError.none);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user != null) {
      navigate("/");
    }
  }, [user]);

  const onFinish = async () => {
    if (
      passwordRef.current?.input?.value !==
      passwordConfRef.current?.input?.value
    ) {
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
      //TODO add method that creates user and passes name not create user in supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        throw error;
      }
      console.log("signup data", data);
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

  const onSupabaseGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <Card id="signup-form" className="signup-form">
      <h1 className="signup-title">הרשמה</h1>

      <Form
        title="הרשמה"
        name="basic"
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 24 }}
        className="signup-form-content"
        onFinish={onFinish}
      >
        <Form.Item>
          <Input
            type="text"
            placeholder="שם"
            ref={nameRef}
            required
            className="signup-input"
          />
        </Form.Item>
        <Form.Item>
          <Input
            type="email"
            placeholder="כתובת מייל"
            ref={emailRef}
            required
            className="signup-input"
          />
        </Form.Item>
        <Form.Item>
          <Input.Password
            status={error ? "error" : undefined}
            placeholder="סיסמה"
            ref={passwordRef}
            required
            className="signup-input"
          />
        </Form.Item>
        <Form.Item>
          <Input.Password
            status={error ? "error" : undefined}
            placeholder="אימות סיסמה"
            ref={passwordConfRef}
            required
            className="signup-input"
          />
        </Form.Item>

        {error && (
          <Form.Item>
            <Alert description={error} type="error" className="signup-alert" />
          </Form.Item>
        )}

        <Form.Item className="button-container">
          <Button
            type="primary"
            htmlType="submit"
            disabled={loading}
            className="signup-button"
          >
            הרשמה
          </Button>
        </Form.Item>
      </Form>
      <Form.Item className="button-container">
        <Button
          type="default"
          onClick={onSupabaseGoogleSignIn}
          disabled={loading}
          className="google-signin-button"
        >
          הרשמה עם Google
        </Button>
      </Form.Item>
    </Card>
  );
}
