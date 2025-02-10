import { observer } from "mobx-react-lite"
import "../../styles/newsletter-filter.scss"
import Form from "antd/es/form"
import Select from "antd/es/select"
import { eventOptions } from "../../util/options"
import { districtOptions } from "../../util/options"
import Alert from "antd/es/alert/Alert"
import AsyncFormSubmitButton from "../Common/AsyncFormSubmitButton"

const NewsletterFilter = () => {
    return (
        <section className="newsletter-filter">
            <hr className="divider" />
            <h3 className="title"> ניוזלטר וואצאפ</h3>
            <Alert
                message="ניתן לבנות עדכון שבועי בהתאמה אישית, של אירועים בשבוע הקרוב וקורסים, סדנאות וריטרטים בחודש הקרוב לפי אזור. העדכון ישלח ביום חמישי בבוקר עם עדכון לסופש הקרוב ולשבוע הבא."
                type="info"
            />
            <div className="filter-container">
                <Form>
                    {/* <Form.List name="filters">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <section
                                        className="price-card card boardered-card"
                                        key={key}
                                    >
                                        <Form.Item
                                            {...restField}
                                            className="filter-form-item"
                                            name={[name, "district"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: "אנא בחרו אזור",
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={[
                                                    {
                                                        value: "all",
                                                        label: "כול הארץ",
                                                    },
                                                    ...districtOptions,
                                                ]}
                                                placeholder="איזורים"
                                                size="large"
                                                className="form-input-large"
                                                popupClassName="form-input-large"
                                                allowClear
                                                mode="tags"
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            className="filter-form-item"
                                            name={[name, "event-type"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: "אנא בחרו ארוע",
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={[
                                                    {
                                                        value: "all",
                                                        label: "כול סוגי הארועים",
                                                    },
                                                    ...eventOptions,
                                                ]}
                                                placeholder="סוגי ארועים"
                                                size="large"
                                                className="form-input-large"
                                                popupClassName="form-input-large"
                                                allowClear
                                                mode="tags"
                                            />
                                        </Form.Item>

                                        <div className="remove-button-container">
                                            <button
                                                className="remove-button"
                                                onClick={() => remove(name)}
                                            >
                                                <Icon icon={do_not_disturb} />
                                                <span className="remove-button-label">
                                                    הסרת התראה
                                                </span>
                                            </button>
                                        </div>
                                    </section>
                                ))}
                                <div className="add-button-container">
                                    <button
                                        className="add-button"
                                        onClick={() => add()}
                                    >
                                        <Icon
                                            icon={add_circle}
                                            className="add-icon"
                                        />
                                        <span className="add-button-label">
                                            הוספת התראה
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </Form.List> */}
                    <div className="filter-form-section">
                        <label className="filter-form-label">
                            אירועים בשבוע הקרוב
                        </label>
                        <Form.Item
                            className="filter-form-item"
                            name={"district"}
                            rules={[
                                {
                                    required: true,
                                    message: "אנא בחרו אזור",
                                },
                            ]}
                        >
                            <Select
                                options={[
                                    {
                                        value: "all",
                                        label: "כול הארץ",
                                    },
                                    ...districtOptions,
                                ]}
                                placeholder="איזורים"
                                size="large"
                                className="form-input-large"
                                popupClassName="form-input-large"
                                allowClear
                                mode="tags"
                            />
                        </Form.Item>
                        <Form.Item
                            className="filter-form-item"
                            name={"event-type"}
                            rules={[
                                {
                                    required: true,
                                    message: "אנא בחרו ארוע",
                                },
                            ]}
                        >
                            <Select
                                options={[
                                    {
                                        value: "all",
                                        label: "כול סוגי הארועים",
                                    },
                                    ...eventOptions.filter(
                                        (option) => option.value !== "warmup"
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
                            קורסים, סדנאות וריטרטים בחודש הקרוב
                        </label>
                        <Form.Item
                            className="filter-form-item"
                            name={"district"}
                        >
                            <Select
                                options={[
                                    {
                                        value: "all",
                                        label: "כול הארץ",
                                    },
                                    ...districtOptions,
                                ]}
                                placeholder="איזורים"
                                size="large"
                                className="form-input-large"
                                popupClassName="form-input-large"
                                allowClear
                                mode="tags"
                            />
                        </Form.Item>
                        {/* <Form.Item
                                className="filter-form-item"
                                name={"event-type"}
                                rules={[
                                    {
                                        required: true,
                                        message: "אנא בחרו ארוע",
                                    },
                                ]}
                            >
                                <Select
                                    options={[
                                        {
                                            value: "all",
                                            label: "כול סוגי הארועים",
                                        },
                                        ...eventOptions.filter(
                                            (option) => option.value !== "warmup"
                                        ),
                                    ]}
                                    placeholder="סוגי ארועים"
                                    size="large"
                                    className="form-input-large"
                                    popupClassName="form-input-large"
                                    allowClear
                                    mode="tags"
                                />
                            </Form.Item> */}
                    </div>
                    <AsyncFormSubmitButton
                        className="general-action-btn large-btn"
                        isSubmitting={false}
                        // isSubmitting={vm.isSubmitting}
                        // callback={vm.saveSubscriptions}
                        // disabled={vm.subscriptionsEqual}
                    >
                        שמירה
                    </AsyncFormSubmitButton>
                </Form>
            </div>
        </section>
    )
}

export default observer(NewsletterFilter)
