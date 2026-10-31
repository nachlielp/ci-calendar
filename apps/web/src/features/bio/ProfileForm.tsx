import { useMemo, useState } from "react"
import { useCopy } from "../../app/language"
import { useBlockReload } from "../../app/updates/reloadGuard"
import { useForm } from "../../app/useForm"
import { useFormDraft } from "../../app/useFormDraft"
import { COMMON_COPY } from "../../lib/commonCopy"
import { defineCopy } from "../../lib/copy"
import { FormAlert, TextAreaField, TextField } from "../../ui/form/fields"
import {
    ABOUT_MAX,
    bioPatch,
    bioValuesOf,
    isBioValues,
    newBioColumns,
    validateBio,
    type BioError,
} from "./bioValues"
import {
    BIO_DRAFT_KEY,
    PhotoUploadError,
    useSaveBio,
    type MyBio,
} from "./myBio"
import { PhotoField } from "./PhotoField"

// Legacy ProfileForm (Hebrew only there).
const COPY = defineCopy({
    he: {
        name: "*שם מלא",
        about: "אודות",
        aboutCount: (count: number) => `${count} / ${ABOUT_MAX}`,
        link: () => (
            <>
                <b>קישור</b> (יופיע ככפתור בעמוד הפרופיל)
            </>
        ),
        secondLink: "קישור נוסף",
        title: "כותרת",
        url: "קישור לדף פרופיל",
        photo: () => (
            <>
                <b>תמונת פרופיל</b>
                <span>התמונה תופיע בפרופיל שלך באתר</span>
            </>
        ),
        nameRequired: "נא להזין שם",
        titleTooLong: "כותרת יכולה להכיל עד 30 תווים",
        titleIsLink: "כותרת לא יכולה להיות קישור",
        titleRequired: "נא להזין כותרת לקישור",
        invalidUrl: "נא להזין כתובת אתר תקינה",
        invalid: "ערכים שגויים, נא לבדוק את הטופס",
        submit: "שמירת שינויים",
        saveFailed: "שמירת הפרופיל נכשלה, נסו שוב",
        photoFailed: "העלאת התמונה נכשלה, נסו שוב",
        photoDenied:
            "לחשבון שלך עדיין אין הרשאה להעלות תמונה. התמונה הוסרה, ואפשר לשמור את שאר הפרופיל בלעדיה.",
    },
    en: {
        name: "*Full name",
        about: "About",
        aboutCount: (count: number) => `${count} / ${ABOUT_MAX}`,
        link: () => (
            <>
                <b>Link</b> (shown as a button on your profile)
            </>
        ),
        secondLink: "Another link",
        title: "Title",
        url: "Link to a profile page",
        photo: () => (
            <>
                <b>Profile photo</b>
                <span>The photo appears on your profile on the site</span>
            </>
        ),
        nameRequired: "Please enter a name",
        titleTooLong: "A title can have up to 30 characters",
        titleIsLink: "A title can't be a link",
        titleRequired: "Please enter a title for the link",
        invalidUrl: "Please enter a valid web address",
        invalid: "Some values are wrong, please check the form",
        submit: "Save changes",
        saveFailed: "Saving the profile failed, please try again",
        photoFailed: "Uploading the photo failed, please try again",
        photoDenied:
            "Your account can't upload photos yet. The photo was removed; you can save the rest of the profile without it.",
    },
    ru: {
        name: "*Полное имя",
        about: "О себе",
        aboutCount: (count: number) => `${count} / ${ABOUT_MAX}`,
        link: () => (
            <>
                <b>Ссылка</b> (появится кнопкой в вашем профиле)
            </>
        ),
        secondLink: "Ещё одна ссылка",
        title: "Название",
        url: "Ссылка на страницу профиля",
        photo: () => (
            <>
                <b>Фото профиля</b>
                <span>Фото появится в вашем профиле на сайте</span>
            </>
        ),
        nameRequired: "Пожалуйста, введите имя",
        titleTooLong: "Название — не более 30 символов",
        titleIsLink: "Название не может быть ссылкой",
        titleRequired: "Пожалуйста, введите название ссылки",
        invalidUrl: "Пожалуйста, введите правильный адрес сайта",
        invalid: "Неверные значения, проверьте форму",
        submit: "Сохранить изменения",
        saveFailed: "Не удалось сохранить профиль, попробуйте снова",
        photoFailed: "Не удалось загрузить фото, попробуйте снова",
        photoDenied:
            "Вашему аккаунту пока нельзя загружать фото. Фото убрано; остальной профиль можно сохранить без него.",
    },
})

/**
 * Legacy ProfileForm: name, about, two links (title and address) and the
 * photo. Unsaved text is kept as a draft on the device (legacy's
 * `profile-form` draft; never the photo). Saving sends only the changed
 * columns, plus the cropped photo, and creates the bio if the user has
 * none.
 */
export function ProfileForm({
    userId,
    bio,
    onDone,
}: {
    userId: string
    /** The stored bio; `null` for a user without one yet. */
    bio: MyBio | null
    /** Saved (or nothing to save): back to the profile card. */
    onDone: () => void
}) {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const saved = useMemo(() => bioValuesOf(bio), [bio])
    const form = useForm<ReturnType<typeof bioValuesOf>, BioError>({
        saved,
        validate: validateBio,
    })
    const discardDraft = useFormDraft({
        key: BIO_DRAFT_KEY,
        userId,
        saved,
        form,
        isValues: isBioValues,
    })
    const [photo, setPhoto] = useState<Blob | null>(null)
    // A cropped photo is unsaved work too (useForm blocks for the text).
    useBlockReload(!!photo)
    const save = useSaveBio(userId)
    const saving = form.submitting

    const onSubmit = form.handleSubmit(async ({ values, changes, isDirty }) => {
        if (bio && !isDirty && !photo) {
            onDone()
            return
        }
        try {
            await save.mutateAsync({
                patch: bioPatch(changes),
                create: newBioColumns(values, ""),
                photo,
            })
        } catch (error) {
            // Refused by the bucket (a profile-role user until the storage
            // migration is applied): drop the photo so the rest can be saved.
            if (error instanceof PhotoUploadError && error.denied)
                setPhoto(null)
            throw error
        }
        discardDraft()
        setPhoto(null)
        onDone()
    })

    const { values, errors, set } = form
    const error = (field: keyof typeof values) => {
        const key = errors[field]
        return key && copy[key]
    }
    const invalid = Object.values(errors).some(Boolean)
    const text = (field: keyof typeof values, label: string) => (
        <TextField
            label={label}
            labelAsPlaceholder
            value={values[field]}
            onChange={(value) => set(field, value)}
            onBlur={() => form.touch(field)}
            error={error(field)}
        />
    )

    return (
        <section className="profile-form">
            <form onSubmit={onSubmit} noValidate>
                <TextField
                    label={copy.name}
                    labelAsPlaceholder
                    autoComplete="name"
                    value={values.bio_name}
                    onChange={(value) => set("bio_name", value)}
                    onBlur={() => form.touch("bio_name")}
                    error={error("bio_name")}
                />
                <TextAreaField
                    label={copy.about}
                    labelAsPlaceholder
                    rows={7}
                    maxLength={ABOUT_MAX}
                    hint={copy.aboutCount(values.about.length)}
                    value={values.about}
                    onChange={(value) => set("about", value)}
                />

                <hr className="bio-card-hr" />
                <fieldset className="profile-form-links">
                    <legend className="bio-card-subtitle">{copy.link()}</legend>
                    {text("page_title", copy.title)}
                    {text("page_url", copy.url)}
                </fieldset>
                <hr className="bio-card-hr mini-hr" />
                <fieldset className="profile-form-links">
                    <legend className="visually-hidden">
                        {copy.secondLink}
                    </legend>
                    {text("page_title_2", copy.title)}
                    {text("page_url_2", copy.url)}
                </fieldset>

                <hr className="bio-card-hr" />
                <p className="bio-card-subtitle">{copy.photo()}</p>
                <PhotoField
                    current={bio?.img ?? ""}
                    photo={photo}
                    onPhoto={setPhoto}
                    disabled={saving}
                />

                <hr className="bio-card-hr" />
                {invalid && <FormAlert kind="error">{copy.invalid}</FormAlert>}
                {save.isError && (
                    <FormAlert kind="error">
                        {save.error instanceof PhotoUploadError
                            ? save.error.denied
                                ? copy.photoDenied
                                : copy.photoFailed
                            : copy.saveFailed}
                    </FormAlert>
                )}
                <button
                    type="submit"
                    className="action-button profile-form-submit"
                    disabled={saving}
                    aria-busy={saving || undefined}
                >
                    {saving ? common.loading : copy.submit}
                </button>
            </form>
        </section>
    )
}
