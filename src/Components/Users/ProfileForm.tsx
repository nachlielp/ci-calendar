import { useEffect, useRef, useState } from "react"
import Form from "antd/es/form"
import Input from "antd/es/input"
import Card from "antd/es/card"
import Image from "antd/es/image"
import Switch from "antd/es/switch"
import { EventPayloadType, UserBio } from "../../util/interfaces"
import { useIsMobile } from "../../hooks/useIsMobile"
import CloudinaryUpload from "../Common/CloudinaryUpload"
import Alert from "antd/es/alert"
import AsyncButton from "../Common/AsyncButton"
import { publicBioService } from "../../supabase/publicBioService"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

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
const ProfileForm = ({ closeEditProfile }: ProfileFormProps) => {
    const isMobile = useIsMobile()

    const originalImageUrl = useRef<string>(store.getBio.img || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)

    const [imageUrl, setImageUrl] = useState<string>(store.getBio.img || "")

    const [form] = Form.useForm()

    useEffect(() => {
        setImageUrl(store.getBio.img || "")
        originalImageUrl.current = store.getBio.img || ""
    }, [store.getBio])

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
            bio_name: bio_name || "",
            about: about || "",
            img: imageUrl || "",
            page_url: page_url || "",
            page_title: page_title || "",
            show_profile: Boolean(show_profile),
            allow_tagging: Boolean(allow_tagging),
            user_id: store.getUserId,
            user_type: store.getUser.user_type,
        }
        try {
            const updatedUser = await publicBioService.updateTeacherBio(
                newTeacher
            )
            if (updatedUser) {
                store.setBio(updatedUser, EventPayloadType.UPDATE)
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

    return (
        <Card className={`teacher-form ${isMobile ? "mobile" : "desktop"}`}>
            <Form
                form={form}
                autoComplete="off"
                initialValues={{
                    bio_name: store.getBio.bio_name,
                    about: store.getBio.about,
                    img: store.getBio.img,
                    page_url: store.getBio.page_url,
                    page_title: store.getBio.page_title,
                    show_profile: store.getBio.show_profile,
                    allow_tagging: store.getBio.allow_tagging,
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
                                        new Error("נא להזין כתובת תקינה")
                                    )
                                }
                                if (
                                    getFieldValue("page_url") &&
                                    !getFieldValue("page_title")
                                ) {
                                    return Promise.reject(
                                        new Error("נא להזין קישור לדף פרופיל")
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

                <Alert
                    message="על מנת לאפשר למשמתשים לקבל עדכונים על ארועים חדשים שלכם, צריך שיהיה לכם פרופיל ציבורי"
                    type="info"
                />
                <Form.Item<FieldType>
                    label="הצגת פרופיל"
                    name="show_profile"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="גלוי"
                        unCheckedChildren="מוסתר"
                        defaultChecked={store.getBio.show_profile}
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
                        defaultChecked={store.getBio.allow_tagging}
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
    )
}

export default observer(ProfileForm)
