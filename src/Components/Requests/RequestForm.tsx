import Form, { FormProps } from "antd/es/form"
import Input from "antd/es/input"
import Card from "antd/es/card"
import Select from "antd/es/select"

import { useUser } from "../../../context/UserContext"
import { requestsService } from "../../../supabase/requestsService"
import { RequestType } from "../../../util/interfaces"
import { useState } from "react"
import Alert from "antd/es/alert"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"

type RequestFieldType = {
    requestType: RequestType
    description?: string
    phone?: string
}

const requestOptions = [
    { label: "הרשמה כמורה", value: "make_profile" },
    { label: "הרשמה כמורה ויוצר ארועים", value: "make_creator" },
    { label: "הרשמה כארגון", value: "make_org" },
    { label: "תמיכה", value: "support" },
]

const enum RequestResponse {
    success = "הבקשה נשלחה בהצלחה",
    error = "קרה שגיאה בשליחת הבקשה",
}
export default function RequestForm() {
    const { user } = useUser()
    const [type, setType] = useState<RequestType | null>(null)
    const [isSubmitted, setIsSubmitted] = useState<RequestResponse | null>(null)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const [form] = Form.useForm()

    const onFinish: FormProps<RequestFieldType>["onFinish"] = async (
        values
    ) => {
        const requestPayload = {
            type: values.requestType as RequestType,
            message: values.description || "",
            phone: values.phone || user.phone || "",
            email: user.email || "",
            name: user.user_name || "",
            responses: [],
        }
        try {
            setIsSubmitting(true)
            const { data, error } = await requestsService.createRequest(
                requestPayload
            )
            if (error) {
                setIsSubmitted(RequestResponse.error)
                throw new Error(
                    `RequestForm.onFinish.error: ${JSON.stringify(error)}`
                )
            }
            if (data) {
                setIsSubmitted(RequestResponse.success)
            }
        } catch (error) {
            console.error("RequestForm.onFinish.error: ", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const onFinishFailed: FormProps<RequestFieldType>["onFinishFailed"] =
        () => {
            setInputErrors(true)
        }

    return (
        <div className="request-form">
            <Card
                style={{ width: "300px", marginTop: "1rem" }}
                id="request-form-card"
            >
                {!isSubmitted && (
                    <Form
                        form={form}
                        onFinish={onFinish}
                        autoComplete="off"
                        initialValues={{
                            user_name: user.user_name,
                            email: user.email,
                        }}
                        style={{ minHeight: "130px" }}
                        onFinishFailed={onFinishFailed}
                    >
                        <Form.Item<RequestFieldType>
                            name="requestType"
                            rules={[
                                {
                                    required: true,
                                    message: "Please select a request type",
                                },
                            ]}
                        >
                            <Select
                                placeholder="סוג הבקשה"
                                options={requestOptions}
                                onChange={(value) =>
                                    setType(value as RequestType)
                                }
                            />
                        </Form.Item>

                        {(type === RequestType.make_creator ||
                            type === RequestType.make_profile ||
                            type === RequestType.make_org) && (
                            <Form.Item<RequestFieldType>
                                name="phone"
                                rules={[
                                    {
                                        required: true,
                                        message: "נא להזין מספר פלאפון",
                                    },
                                    {
                                        pattern: /^[0-9]+$/,
                                        message: "נא להזין מספר פלאפון תקין",
                                    },
                                ]}
                            >
                                <Input placeholder="מספר פלאפון" />
                            </Form.Item>
                        )}
                        {type && (
                            <>
                                <Form.Item<RequestFieldType>
                                    name="description"
                                    rules={[
                                        {
                                            required: true,
                                            message: "נא להזין תיאור ",
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        placeholder={
                                            type === RequestType.support
                                                ? "תיאור הבקשה"
                                                : "קצת עליי והערות נוספות"
                                        }
                                        rows={6}
                                    />
                                </Form.Item>
                                {inputErrors && (
                                    <Alert
                                        message="ערכים שגויים, נא לבדוק את הטופס"
                                        type="error"
                                        style={{ margin: "10px 0" }}
                                    />
                                )}
                                <Form.Item
                                    wrapperCol={{ span: 24 }}
                                    className="submit-button-container"
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                    }}
                                >
                                    <AsyncFormSubmitButton
                                        isSubmitting={isSubmitting}
                                    >
                                        הגשה
                                    </AsyncFormSubmitButton>
                                </Form.Item>
                            </>
                        )}
                    </Form>
                )}
                {isSubmitted && (
                    <div>
                        <h2>{isSubmitted}</h2>
                    </div>
                )}
            </Card>
        </div>
    )
}
