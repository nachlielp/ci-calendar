import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useViewer } from "../../app/viewer"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { FormAlert, Switch } from "../../ui/form/fields"
import { BioCard } from "../calendar/details/BioCard"
import { toPublicBio } from "../calendar/publicEvent"
import { REQUEST_WORDS } from "../requests/requestWords"
// The cropper's own styles (app/images/cropper.tsx), ~0.4 KB.
import "react-easy-crop/react-easy-crop.css"
import "./BioPage.scss"
import { myBioQuery, useSaveBio, type MyBio } from "./myBio"
import { ProfileForm } from "./ProfileForm"

// Legacy BioPage (Hebrew only there). Legacy's form had the "show profile"
// switch commented out; story 50 asks for it, so it sits with the tagging
// switch under the settings.
const COPY = defineCopy({
    he: {
        title: "הפרופיל שלי",
        show: "הצגת פרופיל",
        edit: "עריכת פרופיל",
        publicProfile: "פרופיל ציבורי",
        noProfile: "לא נמצא פרופיל",
        settings: "הגדרות",
        role: "הרשאה:",
        allowTagging: "אפשרות לתיוג על ידי מורים אחרים",
        showProfile: "הצגת הפרופיל לציבור",
        on: "גלוי",
        off: "מוסתר",
        saveFirst: "ההגדרות יפתחו אחרי שמירת הפרופיל",
        settingFailed: "שמירת ההגדרה נכשלה, נסו שוב",
        loadFailed: "לא הצלחנו לטעון את הפרופיל שלך",
    },
    en: {
        title: "My profile",
        show: "Show profile",
        edit: "Edit profile",
        publicProfile: "Public profile",
        noProfile: "No profile found",
        settings: "Settings",
        role: "Role:",
        allowTagging: "Other teachers can tag me",
        showProfile: "Show my profile to the public",
        on: "Visible",
        off: "Hidden",
        saveFirst: "Settings open once the profile is saved",
        settingFailed: "Saving the setting failed, please try again",
        loadFailed: "We couldn't load your profile",
    },
    ru: {
        title: "Мой профиль",
        show: "Показать профиль",
        edit: "Редактировать профиль",
        publicProfile: "Публичный профиль",
        noProfile: "Профиль не найден",
        settings: "Настройки",
        role: "Роль:",
        allowTagging: "Другие учителя могут отмечать меня",
        showProfile: "Показывать мой профиль всем",
        on: "Виден",
        off: "Скрыт",
        saveFirst: "Настройки откроются после сохранения профиля",
        settingFailed: "Не удалось сохранить настройку, попробуйте снова",
        loadFailed: "Не удалось загрузить ваш профиль",
    },
})

/**
 * `/bio` (profiles, creators, orgs, admins): the user's public bio as
 * visitors see it, or its form (at first when it has no name, as legacy),
 * and the settings: the role, who may tag them and whether the bio is
 * shown. The bio loads when the page opens.
 */
export default function BioPage() {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const userId = useUserId()
    const { data, isSuccess, isError, refetch } = useQuery({
        ...myBioQuery(services, userId),
        enabled: !!userId,
    })
    const [editing, setEditing] = useState<boolean | null>(null)
    const bio = data ?? null
    const isEditing = editing ?? !bio?.bio_name

    return (
        <main className="bio-page">
            <h1 className="bio-page-title">{copy.title}</h1>
            {isSuccess ? (
                <>
                    <div className="bio-page-container">
                        <header className="bio-page-header">
                            <button
                                type="button"
                                className="text-button"
                                onClick={() => setEditing(!isEditing)}
                            >
                                {isEditing ? copy.show : copy.edit}
                            </button>
                            <h2 className="bio-page-header-title">
                                {copy.publicProfile}
                            </h2>
                        </header>
                        <hr className="hr" />
                        {isEditing ? (
                            <ProfileForm
                                userId={userId}
                                bio={bio}
                                onDone={() => setEditing(false)}
                            />
                        ) : (
                            <section className="bio-page-card">
                                {bio?.bio_name ? (
                                    <BioCard bio={toPublicBio(bio)} />
                                ) : (
                                    <p className="bio-page-empty">
                                        {copy.noProfile}
                                    </p>
                                )}
                            </section>
                        )}
                    </div>
                    <BioSettings userId={userId} bio={bio} />
                </>
            ) : isError ? (
                <div className="card bio-page-status" role="alert">
                    <p>{copy.loadFailed}</p>
                    <button
                        type="button"
                        className="text-button"
                        onClick={() => void refetch()}
                    >
                        {common.retry}
                    </button>
                </div>
            ) : (
                <p className="bio-page-status" role="status">
                    {common.loading}
                </p>
            )}
        </main>
    )
}

/**
 * Legacy's settings: the role, and switches saved at once (one column
 * each). They need a bio to write to: until one is saved they are off.
 */
function BioSettings({ userId, bio }: { userId: string; bio: MyBio | null }) {
    const copy = useCopy(COPY)
    const words = useCopy(REQUEST_WORDS)
    const viewer = useViewer()
    const save = useSaveBio(userId)
    const role = bio?.user_type ?? viewer.role

    const setting = (
        column: "allow_tagging" | "show_profile",
        label: string,
    ) => {
        const sent = save.isPending ? save.variables.patch[column] : undefined
        return (
            <article className="bio-page-footer-article">
                <Switch
                    label={label}
                    checked={sent ?? bio?.[column] === true}
                    onText={copy.on}
                    offText={copy.off}
                    disabled={!bio || save.isPending}
                    onChange={(checked) =>
                        save.mutate({ patch: { [column]: checked } })
                    }
                />
            </article>
        )
    }

    return (
        <section className="bio-page-footer">
            <h2 className="bio-page-footer-title">{copy.settings}</h2>
            <hr className="hr" />
            <article className="bio-page-footer-article">
                <span>{copy.role}</span>
                <span className="bio-page-role">{words.role(role)}</span>
            </article>
            {setting("allow_tagging", copy.allowTagging)}
            {setting("show_profile", copy.showProfile)}
            {!bio && <FormAlert kind="info">{copy.saveFirst}</FormAlert>}
            {save.isError && (
                <FormAlert kind="error">{copy.settingFailed}</FormAlert>
            )}
        </section>
    )
}
