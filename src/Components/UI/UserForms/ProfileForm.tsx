import { useEffect, useRef, useState } from "react"
import Form from "antd/es/form"
import Input from "antd/es/input"
import Card from "antd/es/card"
import Image from "antd/es/image"
import Switch from "antd/es/switch"
import { useUser } from "../../../context/UserContext"
import { usersService } from "../../../supabase/usersService"
import { DbUser } from "../../../util/interfaces"
import { useIsMobile } from "../../../hooks/useIsMobile"
import CloudinaryUpload from "../Other/CloudinaryUpload"
import Alert from "antd/es/alert"
import AsyncButton from "../Other/AsyncButton"

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
    const originalImageUrl = useRef<string>(user?.img || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    if (!user) throw new Error("TeacherForm.user")

    const [imageUrl, setImageUrl] = useState<string>(user?.img || "")

    const [form] = Form.useForm()

    useEffect(() => {
        setImageUrl(user?.img || "")
        originalImageUrl.current = user?.img || ""
    }, [user])

    const uploadNewImage = (url: string) => {
        setImageUrl(url)
    }
    const getCurrentFormValues = () => {
        const values = form.getFieldsValue()
        console.log("Current form values: ", values)
        return values
    }

    const handleSubmit = async () => {
        const values = getCurrentFormValues()
        if (!values.full_name) {
            setInputErrors(true)
            return
        }
        if (!user) return

        setIsSubmitting(true)

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
            // try {
            //     cloudinary.config({
            //         cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
            //         api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
            //         api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
            //     })
            //     const res = await cloudinary.uploader.destroy(
            //         "t45nwiz4gzk8vms2pta0"
            //     )
            //     console.log("res: ", res)
            // } catch (error) {
            //     console.error("ProfileForm.handleSubmit.error: ", error)
            // }

            const updatedUser = await usersService.updateUser(
                user.user_id,
                newTeacher
            )
            setUser(updatedUser)

            closeEditProfile()
        } catch (error) {
            console.error("UserForm.onFinish.error: ", error)
        } finally {
            setIsSubmitting(false)
        }
    }

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
                        form={form}
                        autoComplete="off"
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
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation() // Prevent form submission
                                }}
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
                        <AsyncButton
                            isSubmitting={isSubmitting}
                            callback={handleSubmit}
                        >
                            שמירת שינויים
                        </AsyncButton>
                    </Form>
                </Card>
            )}
        </>
    )
}
