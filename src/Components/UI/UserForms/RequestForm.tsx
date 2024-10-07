import { Form, type FormProps, Input, Card, Select } from "antd"

import { useUser } from "../../../context/UserContext"
import { requestsService, RequestType } from "../../../supabase/requestsService"
import { useState } from "react"

type RequestFieldType = {
    requestType: RequestType
    description?: string
    phone?: string
}

const requestOptions = [
    { label: "הרשמה כמורה", value: "make_profile" },
    { label: "הרשמה כמורה ויוצר ארועים", value: "make_creator" },
    { label: "תמיכה", value: "support" },
]

export default function RequestForm() {
    const { user } = useUser()
    const [type, setType] = useState<RequestType | null>(null)
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

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
        }
        console.log("requestPayload: ", requestPayload)
        try {
            await requestsService.createRequest(requestPayload)

            setIsSubmitted(true)
        } catch (error) {
            console.error("RequestForm.onFinish.error: ", error)
        }
    }

    return (
        <div className="request-form">
            <Card
                style={{ width: 300, marginTop: "1rem" }}
                id="request-form-card"
            >
                {!isSubmitted && (
                    <Form
                        form={form}
                        onFinish={onFinish}
                        autoComplete="off"
                        initialValues={{
                            name: user.fullName,
                            email: user.email,
                        }}
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
                            type === RequestType.make_profile) && (
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
                                <Form.Item<RequestFieldType> name="description">
                                    <Input.TextArea
                                        placeholder={
                                            type === RequestType.support
                                                ? "תיאור הבקשה"
                                                : "קצת עליי והערות נוספות"
                                        }
                                        rows={6}
                                    />
                                </Form.Item>
                                <Form.Item
                                    wrapperCol={{ span: 24 }}
                                    className="submit-button-container"
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="general-action-btn"
                                    >
                                        הגשה
                                    </button>
                                </Form.Item>
                            </>
                        )}
                    </Form>
                )}
                {isSubmitted && (
                    <div>
                        <h2>הבקשה נשלחה בהצלחה</h2>
                    </div>
                )}
            </Card>
        </div>
    )
}
