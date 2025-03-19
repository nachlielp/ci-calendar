import { observer } from "mobx-react-lite"
import "../../styles/newsletter-filter.scss"
import Form from "antd/es/form"
import Select from "antd/es/select"
import { eventOptions, multiDayEventOptions } from "../../util/options"
import { districtOptions } from "../../util/options"
import Alert from "antd/es/alert/Alert"
import AsyncFormSubmitButton from "../Common/AsyncFormSubmitButton"
import { store } from "../../Store/store"
import Switch from "antd/es/switch"
import { useState } from "react"
const EventTypeOptionsToRemove = [
    "warmup",
    ...multiDayEventOptions.map((option) => option.value),
]
const NewsletterFilter = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onSubmit(values: any) {
        setIsSubmitting(true)
        const weeklyScheduleFilters = {
            "district-weekly": values["district-weekly"] || [],
            "weekly-event-type": values["weekly-event-type"] || [],
            "district-monthly": values["district-monthly"] || [],
        }
        await store.setWeeklyScheduleFilters(weeklyScheduleFilters)
        setIsSubmitting(false)
    }
    return (
        <section className="newsletter-filter">
            <hr className="divider" />
            <h3 className="title"> ניוזלטר וואצאפ</h3>
            <Alert
                message="ניתן לבנות עדכון שבועי בהתאמה אישית, של אירועים בשבוע הקרוב וקורסים, סדנאות וריטרטים בחודש הקרוב לפי אזור. העדכון ישלח ביום חמישי בבוקר עם עדכון לסופש הקרוב ולשבוע הבא."
                type="info"
            />
            <article className="filter-toggle">
                <label className="filter-toggle-label">
                    האם תרצו לקבל עדכון שבועי בווצאפ?
                </label>
                <Switch
                    checked={store.getReceiveWeeklySchedule}
                    checkedChildren="כן"
                    unCheckedChildren="לא"
                    onChange={(checked) => {
                        store.toggleUserReceiveWeeklySchedule(
                            store.user.id,
                            checked
                        )
                    }}
                />
            </article>
            {store.getReceiveWeeklySchedule && (
                <article className="filter-container">
                    <Form
                        onFinish={onSubmit}
                        initialValues={{
                            "district-weekly":
                                store.getWeeklyScheduleFilters[
                                    "district-weekly"
                                ],
                            "weekly-event-type":
                                store.getWeeklyScheduleFilters[
                                    "weekly-event-type"
                                ],
                            "district-monthly":
                                store.getWeeklyScheduleFilters[
                                    "district-monthly"
                                ],
                        }}
                    >
                        <div className="filter-form-section">
                            <label className="filter-form-label">
                                אירועים בשבוע הקרוב
                            </label>
                            <Form.Item
                                className="filter-form-item"
                                name={"district-weekly"}
                            >
                                <Select
                                    options={[...districtOptions]}
                                    placeholder="איזורים - ניתן להשאיר ריק לכל הארץ"
                                    size="large"
                                    className="form-input-large"
                                    popupClassName="form-input-large"
                                    allowClear
                                    mode="tags"
                                />
                            </Form.Item>
                            <Form.Item
                                className="filter-form-item"
                                name={"weekly-event-type"}
                            >
                                <Select
                                    options={[
                                        ...eventOptions.filter(
                                            (option) =>
                                                !EventTypeOptionsToRemove.includes(
                                                    option.value
                                                )
                                        ),
                                    ]}
                                    placeholder="סוגי ארועים - ניתן להשאיר ריק לכל הסוגים"
                                    size="large"
                                    className="form-input-large"
                                    popupClassName="form-input-large"
                                    allowClear
                                    mode="tags"
                                />
                            </Form.Item>
                        </div>
                        <div className="filter-form-section">
                            <label className="filter-form-label">
                                קורסים, סדנאות וריטרטים בחודש הקרוב
                            </label>
                            <Form.Item
                                className="filter-form-item"
                                name={"district-monthly"}
                            >
                                <Select
                                    options={districtOptions}
                                    placeholder="איזורים - ניתן להשאיר ריק לכל הארץ"
                                    size="large"
                                    className="form-input-large"
                                    popupClassName="form-input-large"
                                    allowClear
                                    mode="tags"
                                />
                            </Form.Item>
                        </div>
                        <AsyncFormSubmitButton
                            className="general-action-btn large-btn"
                            isSubmitting={isSubmitting}
                            disabled={false}
                        >
                            שמירה
                        </AsyncFormSubmitButton>
                    </Form>
                </article>
            )}
        </section>
    )
}

export default observer(NewsletterFilter)
