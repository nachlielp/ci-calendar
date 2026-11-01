import { useMemo, useState } from "react"
import { useCopy } from "../../app/language"
import { useForm } from "../../app/useForm"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import type { FormErrors } from "@ci-calendar/core/lib/form"
import { isIsraeliMobile, phoneInput } from "@ci-calendar/core/lib/phone"
import {
    FormAlert,
    SelectField,
    TextAreaField,
    TextField,
} from "../../ui/form/fields"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import { useCreateRequest, useEditRequest } from "./myRequests"
import {
    OpenRequestExistsError,
    RequestClosedError,
    offeredRequestTypes,
    type RequestType,
    type RequestValues,
    type UserRequest,
} from "@ci-calendar/core/features/requests/myRequests"
import { REQUEST_WORDS } from "@ci-calendar/core/features/requests/requestWords"

// Legacy RequestForm (Hebrew only there; its "Please select a request
// type" was English only).
const COPY = defineCopy({
    he: {
        requestType: "סוג הבקשה",
        creatorOption: "הרשמה כמורה",
        orgOption: "הרשמה כארגון",
        creatorAbout: () => (
            <>
                <b>מורים עם הרשאה לפרסום אירועים</b> יכולים ליצור פרופיל ציבורי
                עם פרטים אישיים ומידע נוסף עבור חברי הקהילה. בנוסף, יש אפשרות
                להוסיף אירועים ללוח שנה הציבורי.
            </>
        ),
        orgAbout: () => (
            <>
                <b>ארגון</b> יכולים ליצור פרופיל ציבורי עם פרטים אישיים ומידע
                נוסף עבור חברי הקהילה. בנוסף, יש אפשרות להוסיף אירועים ללוח שנה
                הציבורי.
            </>
        ),
        phone: "מספר פלאפון",
        message: "קצת עליי והערות נוספות",
        typeRequired: "נא לבחור סוג בקשה",
        phoneRequired: "נא להזין מספר פלאפון",
        phoneInvalid: "נא להזין מספר פלאפון ישראלי תקין",
        messageRequired: "נא להזין תיאור",
        invalid: "ערכים שגויים, נא לבדוק את הטופס",
        submit: "הגשה",
        update: "עדכון",
        saveFailed: "שליחת הבקשה נכשלה, נסו שוב",
    },
    en: {
        requestType: "Request type",
        creatorOption: "Register as a teacher",
        orgOption: "Register as an organisation",
        creatorAbout: () => (
            <>
                <b>Teachers who may publish events</b> can create a public
                profile with personal details and more information for the
                community. They can also add events to the public calendar.
            </>
        ),
        orgAbout: () => (
            <>
                <b>Organisations</b> can create a public profile with details
                and more information for the community. They can also add events
                to the public calendar.
            </>
        ),
        phone: "Phone number",
        message: "A little about me, and any notes",
        typeRequired: "Please select a request type",
        phoneRequired: "Please enter a phone number",
        phoneInvalid: "Please enter a valid Israeli mobile number",
        messageRequired: "Please enter a description",
        invalid: "Some values are wrong, please check the form",
        submit: "Submit",
        update: "Update",
        saveFailed: "Sending the request failed, please try again",
    },
    ru: {
        requestType: "Тип заявки",
        creatorOption: "Регистрация как учитель",
        orgOption: "Регистрация как организация",
        creatorAbout: () => (
            <>
                <b>Учителя с правом публикации событий</b> могут создать
                публичный профиль с личными данными и информацией для
                сообщества. Также они могут добавлять события в общий календарь.
            </>
        ),
        orgAbout: () => (
            <>
                <b>Организации</b> могут создать публичный профиль с данными и
                информацией для сообщества. Также они могут добавлять события в
                общий календарь.
            </>
        ),
        phone: "Номер телефона",
        message: "Немного о себе и дополнительные заметки",
        typeRequired: "Пожалуйста, выберите тип заявки",
        phoneRequired: "Пожалуйста, введите номер телефона",
        phoneInvalid: "Пожалуйста, введите правильный израильский номер",
        messageRequired: "Пожалуйста, введите описание",
        invalid: "Неверные значения, проверьте форму",
        submit: "Отправить",
        update: "Обновить",
        saveFailed: "Не удалось отправить заявку, попробуйте снова",
    },
})

type ErrorKey =
    "typeRequired" | "phoneRequired" | "phoneInvalid" | "messageRequired"

const NEW_REQUEST: RequestValues = { type: "", phone: "", message: "" }

/** Legacy RequestForm's rules (antd `required` and the phone pattern). */
function validate(values: RequestValues): FormErrors<ErrorKey> {
    const errors: Partial<Record<keyof RequestValues, ErrorKey>> = {}
    if (!values.type) errors.type = "typeRequired"
    if (!values.phone) errors.phone = "phoneRequired"
    else if (!isIsraeliMobile(values.phone)) errors.phone = "phoneInvalid"
    if (!values.message.trim()) errors.message = "messageRequired"
    return errors
}

/** Why the form gave up: the request closed, or one is open already. */
export type Abandoned = "closed" | "alreadyOpen"

/**
 * Legacy RequestForm: a new role request, or the open one edited. The
 * types offered leave out the user's own role; the rest of the form shows
 * once a type is chosen. A new request's id is made once, so sending it
 * twice stores it once.
 */
export function RequestForm({
    userId,
    role,
    name,
    request,
    onDone,
    onAbandon,
}: {
    userId: string
    role: SignedInRole
    name: string
    /** The open request to edit, as it was when editing began. */
    request?: UserRequest
    /** The request was sent, or the form cancelled. */
    onDone: () => void
    /** The server turned the request down (closed, or one is open). */
    onAbandon: (reason: Abandoned) => void
}) {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const words = useCopy(REQUEST_WORDS)
    const saved = useMemo(
        (): RequestValues =>
            request
                ? {
                      type: request.type as RequestType,
                      phone: request.phone,
                      message: request.message,
                  }
                : NEW_REQUEST,
        [request],
    )
    const form = useForm({ saved, validate })
    const [id] = useState(() => crypto.randomUUID())
    const create = useCreateRequest(userId)
    const edit = useEditRequest(userId)
    const saving = form.submitting
    const failed =
        (create.isError && !(create.error instanceof OpenRequestExistsError)) ||
        (edit.isError && !(edit.error instanceof RequestClosedError))

    const optionLabels: Record<string, string> = {
        creator: copy.creatorOption,
        org: copy.orgOption,
    }
    const offered: string[] = offeredRequestTypes(role)
    // An older request's type that isn't offered still shows as chosen.
    if (request && !offered.includes(request.type)) offered.push(request.type)
    const options = offered.map((type) => ({
        value: type as RequestType,
        label: optionLabels[type] ?? words.type(type),
    }))

    const onSubmit = form.handleSubmit(async ({ values, changes, isDirty }) => {
        try {
            if (request) {
                if (isDirty) {
                    await edit.mutateAsync({ id: request.id, patch: changes })
                }
            } else {
                await create.mutateAsync({
                    id,
                    type: values.type as "creator" | "org",
                    phone: values.phone,
                    message: values.message,
                    name,
                })
            }
            onDone()
        } catch (error) {
            if (error instanceof RequestClosedError) onAbandon("closed")
            else if (error instanceof OpenRequestExistsError) {
                onAbandon("alreadyOpen")
            } else throw error
        }
    })

    const { values, errors, set } = form
    const invalid = Object.values(errors).some(Boolean)
    return (
        <section className="request-form card">
            <form onSubmit={onSubmit} noValidate>
                <SelectField
                    label={copy.requestType}
                    labelAsPlaceholder
                    options={options}
                    value={values.type}
                    onChange={(type) => set("type", type)}
                    error={errors.type && copy[errors.type]}
                />
                {values.type && (
                    <>
                        {values.type === "creator" && (
                            <p className="text">{copy.creatorAbout()}</p>
                        )}
                        {values.type === "org" && (
                            <p className="text">{copy.orgAbout()}</p>
                        )}
                        <TextField
                            label={copy.phone}
                            labelAsPlaceholder
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={values.phone}
                            onChange={(phone) =>
                                set("phone", phoneInput(phone))
                            }
                            error={errors.phone && copy[errors.phone]}
                        />
                        <TextAreaField
                            label={copy.message}
                            labelAsPlaceholder
                            rows={6}
                            value={values.message}
                            onChange={(message) => set("message", message)}
                            error={errors.message && copy[errors.message]}
                        />
                    </>
                )}
                {invalid && <FormAlert kind="error">{copy.invalid}</FormAlert>}
                {failed && (
                    <FormAlert kind="error">{copy.saveFailed}</FormAlert>
                )}
                <div className="submit-button-container">
                    {values.type && (
                        <button
                            type="submit"
                            className="action-button"
                            disabled={saving}
                            aria-busy={saving || undefined}
                        >
                            {saving
                                ? common.loading
                                : request
                                  ? copy.update
                                  : copy.submit}
                        </button>
                    )}
                    <button
                        type="button"
                        className="text-button"
                        disabled={saving}
                        onClick={onDone}
                    >
                        {common.cancel}
                    </button>
                </div>
            </form>
        </section>
    )
}
