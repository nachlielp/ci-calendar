import { useEffect, useState } from "react"
import Form from "antd/es/form"
import Input from "antd/es/input"
import Image from "antd/es/image"
import { UserBio } from "../../util/interfaces"
import Alert from "antd/es/alert"
import AsyncButton from "../Common/AsyncButton"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import UploadImageButton from "../Common/UploadImageButton"
import { storageService } from "../../supabase/storageService"
import Spin from "antd/es/spin"
import "../../styles/profile-form.scss"
import { utilService } from "../../util/utilService"

const DRAFT_KEY = "profile-form"
type FieldType = {
    bio_name: string
    about: string
    img: string
    page_url?: string
    page_title?: string
    page_url_2?: string
    page_title_2?: string
    upload: string
    show_profile: string
    allow_tagging: string
}

interface ProfileFormProps {
    closeEditProfile: () => void
}

const ProfileForm = ({ closeEditProfile }: ProfileFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    const [isUploading, setIsUploading] = useState<boolean>(false)

    const [imageUrl, setImageUrl] = useState<string>(store.getBio.img || "")

    const [form] = Form.useForm()

    useEffect(() => {
        setImageUrl(store.getBio.img || "")

        const currentFormValuesObj = utilService.getDraftEvent(DRAFT_KEY)
        if (currentFormValuesObj) {
            form.setFieldsValue({
                ...currentFormValuesObj,
            })
            const draftImageUrl = currentFormValuesObj?.img || ""
            setImageUrl(draftImageUrl)
        }
    }, [store.getBio])

    const onFormValueChange = (_: any, allFields: any) => {
        const draftProfile = {
            ...allFields,
            img: imageUrl,
        }
        utilService.saveDraftEvent(draftProfile, DRAFT_KEY)
    }

    const uploadNewImage = async (image: Blob) => {
        setIsUploading(true)
        try {
            const filePath = `${store.getUserId}/${Date.now()}.png`
            const data = await storageService.uploadFile(filePath, image)
            const publicUrl = `${
                import.meta.env.VITE_SUPABASE_BIO_STORAGE_PUBLIC_URL
            }/${data?.path}`
            setImageUrl(publicUrl)

            const draftProfile = {
                ...form.getFieldsValue(),
                img: publicUrl,
            }
            utilService.saveDraftEvent(draftProfile, DRAFT_KEY)
        } catch (error) {
            console.error("ProfileForm.uploadNewImage.error: ", error)
            //TODO show error
        } finally {
            setIsUploading(false)
        }
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
            page_url_2,
            page_title_2,
        } = values
        const newTeacher: Partial<UserBio> = {
            bio_name: bio_name || "",
            about: about || "",
            img: imageUrl || "",
            page_url: page_url || "",
            page_title: page_title || "",
            page_url_2: page_url_2 || "",
            page_title_2: page_title_2 || "",
            user_id: store.getUserId || "",
        }
        try {
            await store.updateBio(newTeacher)
            closeEditProfile()
        } catch (error) {
            console.error("UserForm.onFinish.error: ", error)
        } finally {
            setIsSubmitting(false)
            utilService.clearDraftEvent(DRAFT_KEY)
        }
    }

    return (
        <section className="profile-form">
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
                    page_url_2: store.getBio.page_url_2,
                    page_title_2: store.getBio.page_title_2,
                }}
                onValuesChange={onFormValueChange}
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
                <Form.Item<FieldType>
                    name="page_title"
                    validateTrigger={["onChange", "onBlur"]}
                    rules={[
                        {
                            max: 30,
                            message: "כותרת יכולה להכיל עד 30 תווים",
                        },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve()
                                const urlRegex =
                                    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/
                                if (urlRegex.test(value)) {
                                    return Promise.reject(
                                        "כותרת לא יכולה להיות קישור"
                                    )
                                }
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <Input placeholder="כותרת" />
                </Form.Item>
                <Form.Item<FieldType>
                    name="page_url"
                    rules={[
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                // If no URL is entered, it's valid
                                if (!value) {
                                    return Promise.resolve()
                                }

                                // Check if URL has a title when URL is present
                                if (value && !getFieldValue("page_title")) {
                                    return Promise.reject(
                                        new Error("נא להזין כותרת לקישור")
                                    )
                                }

                                // Validate URL format - more permissive regex
                                const urlRegex =
                                    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/
                                if (!urlRegex.test(value)) {
                                    return Promise.reject(
                                        new Error("נא להזין כתובת אתר תקינה")
                                    )
                                }

                                return Promise.resolve()
                            },
                        }),
                    ]}
                >
                    <Input placeholder="קישור לדף פרופיל" />
                </Form.Item>
                <hr className="bio-card-hr mini-hr" />
                <Form.Item<FieldType>
                    name="page_title_2"
                    validateTrigger={["onChange", "onBlur"]}
                    rules={[
                        {
                            max: 30,
                            message: "כותרת יכולה להכיל עד 30 תווים",
                        },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve()
                                const urlRegex =
                                    /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/
                                if (urlRegex.test(value)) {
                                    return Promise.reject(
                                        "כותרת לא יכולה להיות קישור"
                                    )
                                }
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <Input placeholder="כותרת" />
                </Form.Item>
                <Form.Item<FieldType>
                    name="page_url_2"
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
                        {isUploading ? (
                            <article
                                style={{
                                    width: 250,
                                    height: 250,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Spin />
                            </article>
                        ) : (
                            <Image
                                alt="profile image"
                                src={imageUrl}
                                key={imageUrl}
                                preview={false}
                                width={250}
                                height={250}
                                className="teacher-form-img"
                                placeholder={
                                    <article
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 250,
                                            height: 250,
                                        }}
                                    >
                                        <Spin />
                                    </article>
                                }
                            />
                        )}
                    </div>
                </Form.Item>
                <Form.Item<FieldType> name="upload">
                    <UploadImageButton onImageSave={uploadNewImage} />
                </Form.Item>

                <hr className="bio-card-hr" />

                {/* <Alert
                    message="על מנת לאפשר למשמתשים לקבל עדכונים על ארועים חדשים שלכם, צריך שיהיה לכם פרופיל ציבורי"
                    type="info"
                /> */}
                {/* <Form.Item<FieldType>
                    label="הצגת פרופיל"
                    name="show_profile"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="גלוי"
                        unCheckedChildren="מוסתר"
                        defaultChecked={store.getBio.show_profile ?? true}
                    />
                </Form.Item> */}
                {/* <Form.Item<FieldType>
                    label="אפשרות לתיוג על ידי מורים אחרים"
                    name="allow_tagging"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="גלוי"
                        unCheckedChildren="מוסתר"
                        defaultChecked={store.getBio.allow_tagging}
                    />
                </Form.Item> */}
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
                    className="general-action-btn large-btn"
                >
                    שמירת שינויים
                </AsyncButton>
            </Form>
        </section>
    )
}

export default observer(ProfileForm)
