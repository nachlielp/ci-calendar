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
import { useEffect } from "react"
import Input from "antd/es/input"
import { utilService } from "../../util/utilService"
import { newsletterFilterVM } from "./NewsletterFilterVM"

const EventTypeOptionsToRemove = [
    "warmup",
    ...multiDayEventOptions.map((option) => option.value),
]

const NewsletterFilter = () => {
    const [form] = Form.useForm()

    // Reset form changed state when store values change
    useEffect(() => {
        const currentValues = form.getFieldsValue()
        newsletterFilterVM.setIsFormChanged(
            newsletterFilterVM.checkFormChanged(currentValues)
        )
    }, [store.getWeeklyScheduleFilters])

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
                    checked={newsletterFilterVM.receiveWeeklySchedule}
                    checkedChildren="כן"
                    unCheckedChildren="לא"
                    onChange={(checked) =>
                        newsletterFilterVM.toggleReceiveWeeklySchedule(checked)
                    }
                />
            </article>
            {newsletterFilterVM.receiveWeeklySchedule && (
                <>
                    <article className="filter-container">
                        <Form
                            form={form}
                            onFinish={(values) =>
                                newsletterFilterVM.submitForm(values)
                            }
                            initialValues={newsletterFilterVM.initialFormValues}
                            onValuesChange={(_, allValues) => {
                                newsletterFilterVM.setIsFormChanged(
                                    newsletterFilterVM.checkFormChanged(
                                        allValues
                                    )
                                )
                            }}
                        >
                            <div className="filter-form-section">
                                <label className="filter-form-label">
                                    מספר פלאפון
                                </label>
                                <Form.Item
                                    className="filter-form-item"
                                    name={"phone"}
                                    rules={[
                                        {
                                            required: true,
                                            pattern: /^(\+|05)\d+$/,
                                            message:
                                                'מספר פלאפון חייב להתחיל עם "+" או "05"',
                                            validator: (_, value) => {
                                                if (
                                                    !value ||
                                                    /^(\+|05)\d+$/.test(value)
                                                ) {
                                                    return Promise.resolve()
                                                }
                                                return Promise.reject(
                                                    new Error(
                                                        'מספר פלאפון חייב להתחיל עם "+" או "05"'
                                                    )
                                                )
                                            },
                                        },
                                    ]}
                                >
                                    <Input
                                        onKeyDown={
                                            utilService.handlePhoneNumberInput
                                        }
                                        placeholder="הזינו מספר פלאפון שמתחיל ב + או 05"
                                        allowClear
                                        type="tel"
                                    />
                                </Form.Item>
                                <label className="filter-form-label">
                                    איזורים - ניתן להשאיר ריק לכל הארץ
                                </label>
                                <Form.Item
                                    className="filter-form-item"
                                    name={"district-weekly"}
                                >
                                    <Select
                                        options={[...districtOptions]}
                                        placeholder="איזורים"
                                        size="large"
                                        className="form-input-large"
                                        popupClassName="form-input-large"
                                        allowClear
                                        mode="tags"
                                    />
                                </Form.Item>
                                <label className="filter-form-label">
                                    סוגי ארועים - ניתן להשאיר ריק לכל הסוגים
                                </label>
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
                                        placeholder="סוגי ארועים"
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
                                    סדנאות וקורסים בחודש הקרוב - ניתן להשאיר ריק
                                    לכל הארץ
                                </label>
                                <Form.Item
                                    className="filter-form-item"
                                    name={"district-monthly"}
                                >
                                    <Select
                                        options={districtOptions}
                                        placeholder="איזורים"
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
                                isSubmitting={newsletterFilterVM.isSubmitting}
                                disabled={!newsletterFilterVM.isFormChanged}
                            >
                                שמירה
                            </AsyncFormSubmitButton>
                        </Form>
                    </article>
                </>
            )}
        </section>
    )
}

export default observer(NewsletterFilter)
