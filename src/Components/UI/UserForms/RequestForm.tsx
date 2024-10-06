import { Button, Form, type FormProps, Input, Card, Select } from "antd"

import { useUser } from "../../../context/UserContext"
import { requestsService, RequestType } from "../../../supabase/requestsService"

type RequestFieldType = {
    requestType: RequestType
    description?: string
}

const requestOptions = [
    { label: "הרשמה כמורה", value: "make_profile" },
    { label: "הרשמה כמורה ויוצר ארועים", value: "make_creator" },
    { label: "תמיכה", value: "support" },
]

export default function RequestForm() {
    const { user } = useUser()
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
        }
        console.log("requestPayload: ", requestPayload)
        try {
            await requestsService.createRequest(requestPayload)
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
                        />
                    </Form.Item>

                    <Form.Item<RequestFieldType> name="description">
                        <Input.TextArea placeholder="תיאור הבקשה" rows={6} />
                    </Form.Item>

                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        <button type="submit" className="general-action-btn">
                            הגשה
                        </button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
