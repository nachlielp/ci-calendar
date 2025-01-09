import { observer } from "mobx-react-lite"
import '../../styles/newsletter-filter.scss'
import Form from "antd/es/form"
import Select from "antd/es/select"
import { eventOptions } from "../../util/options"
import { districtOptions } from "../../util/options"
import { Icon } from "../Common/Icon"
import Alert from "antd/es/alert/Alert"
import AsyncFormSubmitButton from "../Common/AsyncFormSubmitButton"
// import { newsletterFilterVM as vm } from "./NewsletterFilterVM"

const NewsletterFilter = () => {
    return (
        <section className="newsletter-filter">
            <hr className="divider" />
            <h3 className="title"> ניוזלטר וואצאפ</h3>
            <Alert
                message="ניתן לבנות עדכון שבועי בהתאמה אישית, לדוגמה ג׳אמים ושיעורים במרכז, וסדנאות וריטרטים במרכז ובירושלים. העדכון ישלח ביום חמישי בבוקר עם עדכון לסופש הקרוב ולשבוע הבא. איזורים או אירועים ריק - כול האזורים וכול האירועים."
                type="info"
            />
            <div className="filter-container">
                <Form>
                    <Form.List name="filters">
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
                                        <Form.Item
                                            {...restField}
                                            className="filter-form-item"
                                            name={[name, "event-type"]}
                                        >
                                            <Select
                                                options={eventOptions}
                                                placeholder="ארועים"
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
                                                <Icon icon="doNotDisturb" />
                                                <span className="remove-button-label">
                                                    הסרת פילטר
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
                                            icon="addCircle"
                                            className="add-icon"
                                        />
                                        <span className="add-button-label">
                                            הוספת פילטר
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </Form.List>
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
