import { useEffect, useState } from "react"
import Form, { FormProps } from "antd/es/form"
import Input from "antd/es/input"
import Card from "antd/es/card"
import Image from "antd/es/image"
import Switch from "antd/es/switch"
import { useUser } from "../../../context/UserContext"
import { usersService } from "../../../supabase/usersService"
import { DbUser } from "../../../util/interfaces"
import { useIsMobile } from "../../../hooks/useIsMobile"
import CloudinaryUpload from "../Other/CloudinaryUpload"
import AsyncFormSubmitButton from "../Other/AsyncFormSubmitButton"
import Alert from "antd/es/alert"

type FieldType = {
    full_name: string
    bio: string
    img: string
    page_url?: string
    page_title?: string
    upload: string
    show_profile: string
}

interface ProfileFormProps {
    closeEditProfile: () => void
}

//TODO add cropper (react-easy-crop)
export default function ProfileForm({ closeEditProfile }: ProfileFormProps) {
    const isMobile = useIsMobile()
    const { user, setUser } = useUser()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    if (!user) throw new Error("TeacherForm.user")

    const [imageUrl, setImageUrl] = useState<string>(user?.img || "")
    const [form] = Form.useForm()

    useEffect(() => {
        setImageUrl(user?.img || "")
    }, [user])

    const uploadNewImage = (url: string) => {
        setImageUrl(url)
    }

    const handleSubmit: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!user) return

        setIsSubmitting(true)
        console.log("values: ", values)
        const { full_name, bio, page_url, page_title, show_profile } = values
        const newTeacher: Partial<DbUser> = {
            full_name: full_name || user.full_name,
            bio: bio || "",
            img: imageUrl || "",
            page_url: page_url || "",
            page_title: page_title || "",
            show_profile: show_profile?.toString() === "true",
            updated_at: new Date().toISOString(),
        }
        try {
            // await updateTeacher(newTeacher);
            const updatedUser = await usersService.updateUser(
                user.user_id,
                newTeacher
            )
            console.log("updatedUser: ", updatedUser)
            setUser(updatedUser)
            closeEditProfile()
        } catch (error) {
            console.error("UserForm.onFinish.error: ", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    //TODO handle error - image to large!!
    const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
        errorInfo
    ) => {
        console.log("Failed:", errorInfo)
        setInputErrors(true)
    }

    //TODO clear form service !!!
    const clearImage = () => {
        setImageUrl("")
    }

    return (
        <>
            {user && (
                <Card
                    className={`teacher-form ${
                        isMobile ? "mobile" : "desktop"
                    }`}
                >
                    <Form
                        // onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        form={form}
                        autoComplete="off"
                        onFinish={handleSubmit}
                        initialValues={{
                            full_name: user.full_name,
                            bio: user.bio,
                            img: user.img,
                            page_url: user.page_url,
                            page_title: user.page_title,
                            show_profile: user.show_profile,
                            allow_tagging: user.allow_tagging,
                        }}
                    >
                        <Form.Item<FieldType>
                            name="full_name"
                            rules={[{ required: true, message: "נא להזין שם" }]}
                        >
                            <Input placeholder="*שם מלא" />
                        </Form.Item>
                        <Form.Item<FieldType> name="bio">
                            <Input.TextArea
                                rows={7}
                                placeholder="אודות"
                                maxLength={300}
                                showCount
                            />
                        </Form.Item>

                        <hr className="bio-card-hr" />

                        <label className="bio-card-subtitle">
                            <b>קישור</b> (יופיע ככפתור בעמוד הפרופיל)
                        </label>
                        <Form.Item<FieldType>
                            name="page_url"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (
                                            value &&
                                            !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
                                                value
                                            )
                                        ) {
                                            return Promise.reject(
                                                new Error(
                                                    "נא להזין כתובת תקינה"
                                                )
                                            )
                                        }
                                        if (
                                            getFieldValue("page_url") &&
                                            !getFieldValue("page_title")
                                        ) {
                                            return Promise.reject(
                                                new Error(
                                                    "נא להזין קישור לדף פרופיל"
                                                )
                                            )
                                        }
                                        return Promise.resolve()
                                    },
                                }),
                            ]}
                        >
                            <Input placeholder="קישור לדף פרופיל" />
                        </Form.Item>
                        <Form.Item<FieldType> name="page_title">
                            <Input placeholder="כותרת קישור לדף פרופיל" />
                        </Form.Item>

                        <hr className="bio-card-hr" />

                        <label className="bio-card-subtitle">
                            <b>תמונת פרופיל</b>
                            <label>התמונה תופיע בפרופיל שלך באתר</label>
                        </label>
                        <Form.Item<FieldType> name="img">
                            <div className="img-container">
                                <Image
                                    alt="example"
                                    src={imageUrl}
                                    key={imageUrl}
                                    preview={false}
                                    width={250}
                                    height={250}
                                    className="teacher-form-img"
                                />
                            </div>
                        </Form.Item>
                        <Form.Item<FieldType> name="upload">
                            <CloudinaryUpload
                                uploadNewImage={uploadNewImage}
                                clearImage={clearImage}
                            />
                        </Form.Item>

                        <hr className="bio-card-hr" />

                        <Form.Item<FieldType>
                            label="הצגת פרופיל"
                            name="show_profile"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="גלוי"
                                unCheckedChildren="מוסתר"
                                defaultChecked={user?.show_profile}
                            />
                        </Form.Item>
                        {inputErrors && (
                            <Alert
                                message="ערכים שגויים, נא לבדוק את הטופס"
                                type="error"
                                style={{ marginBottom: 10 }}
                            />
                        )}
                        <AsyncFormSubmitButton isSubmitting={isSubmitting}>
                            שמירת שינויים
                        </AsyncFormSubmitButton>
                    </Form>
                </Card>
            )}
        </>
    )
}
