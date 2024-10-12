import { Checkbox, Form, type FormProps, Input, Card, Select } from "antd"

import { districtOptions, eventTypes } from "../../util/options"
import { useState } from "react"
import { useUser } from "../../context/UserContext"
import { usersService } from "../../supabase/usersService"
import { District, EventlyType, IMailingList } from "../../util/interfaces"

type FieldType = {
    name: string
    active: boolean
    phone?: string
    districts?: string[]
    ciEvents?: string[]
}

export default function NewsletterPage() {
    const { user } = useUser()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const [mailingList, setMailingList] = useState<IMailingList>(
        user.newsletter
    )
    const [form] = Form.useForm()

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        const updatedUser = { ...user }
        updatedUser.full_name = values.name || user.full_name

        const newNewsletter: IMailingList = {
            ...mailingList,
            active: values.active,
            districts: (values.districts as District[]) || [],
            eventTypes: (values.ciEvents as EventlyType[]) || [],
        }

        updatedUser.newsletter = newNewsletter

        updatedUser.phone = values.phone || ""

        try {
            await usersService.updateUser(user.user_id, updatedUser)
        } catch (error) {
            console.error("UserForm.onFinish.error: ", error)
        }
    }

    return (
        <div className="user-form">
            <Card style={{ width: 300, marginTop: "1rem" }} id="user-form-card">
                <Form
                    form={form}
                    onFinish={onFinish}
                    autoComplete="off"
                    initialValues={{
                        name: user.full_name,
                        active: user.newsletter.active,
                        phone: user.phone,
                        ciEvents: user.newsletter.eventTypes,
                        districts: user.newsletter.districts,
                    }}
                >
                    <Form.Item<FieldType>
                        label="קבלת הודעות וואצאפ שבועיות"
                        name="active"
                        valuePropName="checked"
                    >
                        <Checkbox
                            checked={user.newsletter.active}
                            onChange={(e) =>
                                setMailingList({
                                    ...mailingList,
                                    active: e.target.checked,
                                })
                            }
                        />
                    </Form.Item>

                    {/* <Form.Item<FieldType>
                        name="phone"
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.active !== currentValues.active
                        }
                        rules={[
                            () => ({
                                required: mailingList.active,
                                message: "נא להזין מספר טלפון",
                            }),
                            {
                                pattern:
                                    /^(?:\+972-?|0)([23489]|5[0248]|7[234679])[0-9]{7}$/,
                                message: "נא להזין מספר טלפון ישראלי תקני",
                            },
                        ]}
                    >
                        <Input placeholder="מספר פלאפון" />
                    </Form.Item> */}

                    <Form.Item<FieldType> name="districts">
                        <Select
                            mode="multiple"
                            placeholder="אזורים"
                            style={{ width: "100%" }}
                            options={districtOptions}
                            showSearch={false}
                            allowClear
                            disabled={!mailingList.active}
                        />
                    </Form.Item>

                    <Form.Item<FieldType> name="ciEvents">
                        <Select
                            mode="multiple"
                            placeholder="ארועים"
                            style={{ width: "100%" }}
                            options={eventTypes.filter(
                                (event) => event.value !== "warmup"
                            )}
                            showSearch={false}
                            allowClear
                            disabled={!mailingList.active}
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
                        <button type="submit" className="general-action-btn">
                            שמירה
                        </button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
