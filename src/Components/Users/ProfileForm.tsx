import { useEffect, useRef, useState } from "react"
import Form from "antd/es/form"
import Input from "antd/es/input"
import Card from "antd/es/card"
import Image from "antd/es/image"
import Switch from "antd/es/switch"
import { useUser } from "../../context/UserContext"
import { UserBio } from "../../util/interfaces"
import { useIsMobile } from "../../hooks/useIsMobile"
import CloudinaryUpload from "../Common/CloudinaryUpload"
import Alert from "antd/es/alert"
import AsyncButton from "../Common/AsyncButton"
import { publicBioService } from "../../supabase/publicBioService"

type FieldType = {
    bio_name: string
    about: string
    img: string
    page_url?: string
    page_title?: string
    upload: string
    show_profile: string
    allow_tagging: string
}

interface ProfileFormProps {
    closeEditProfile: () => void
}

//TODO add cropper (react-easy-crop)
export default function ProfileForm({ closeEditProfile }: ProfileFormProps) {
    const isMobile = useIsMobile()
    const { user, updateUser } = useUser()
    const originalImageUrl = useRef<string>(user?.bio?.img || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    if (!user) throw new Error("TeacherForm.user")

    const [imageUrl, setImageUrl] = useState<string>(user?.bio?.img || "")

    const [form] = Form.useForm()

    useEffect(() => {
        setImageUrl(user?.bio?.img || "")
        originalImageUrl.current = user?.bio?.img || ""
    }, [user])

    if (!user) return

    const uploadNewImage = (url: string) => {
        setImageUrl(url)
    }
    const getCurrentFormValues = () => {
        const values = form.getFieldsValue()
        return values
    }

    const handleSubmit = async () => {
        const values = getCurrentFormValues()
        if (!values.bio_name) {
            setInputErrors(true)
            return
        }
        if (!user) return
        setIsSubmitting(true)
        const {
            bio_name,
            about,
            page_url,
            page_title,
            show_profile,
            allow_tagging,
        } = values
        const newTeacher: UserBio = {
            bio_name: bio_name || user.user_name,
            about: about || "",
            img: imageUrl || "",
            page_url: page_url || "",
            page_title: page_title || "",
            show_profile: Boolean(show_profile),
            allow_tagging: Boolean(allow_tagging),
            user_id: user.user_id,
            user_type: user.user_type,
        }
        try {
            const updatedUser = await publicBioService.updateTeacherBio(
                newTeacher
            )
            if (updatedUser) {
                updateUser({ bio: updatedUser })
            }
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

    if (!user) return <></>

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
                            bio_name: user.bio.bio_name,
                            about: user.bio.about,
                            img: user.bio.img,
                            page_url: user.bio.page_url,
                            page_title: user.bio.page_title,
                            show_profile: user.bio.show_profile,
                            allow_tagging: user.bio.allow_tagging,
                        }}
                    >
                        <Form.Item<FieldType>
                            name="bio_name"
                            rules={[{ required: true, message: "נא להזין שם" }]}
                        >
                            <Input placeholder="*שם מלא" />
                        </Form.Item>
                        <Form.Item<FieldType> name="about">
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
                        <Form.Item<FieldType> name="page_title">
                            <Input placeholder="כותרת" />
                        </Form.Item>
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
                                defaultChecked={user?.bio.show_profile}
                            />
                        </Form.Item>
                        <Form.Item<FieldType>
                            label="אפשרות לתיוג על ידי מורים אחרים"
                            name="allow_tagging"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="גלוי"
                                unCheckedChildren="מוסתר"
                                defaultChecked={user?.bio.allow_tagging}
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
