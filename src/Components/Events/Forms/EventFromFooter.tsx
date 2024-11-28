import Alert from "antd/es/alert"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import Form from "antd/es/form"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"

interface EventFromFooterProps {
    inputErrors: boolean
    isSubmitting: boolean
    submitText: string
}

export default function EventFromFooter({
    inputErrors,
    isSubmitting,
    submitText,
}: EventFromFooterProps) {
    return (
        <section>
            <AddLinksForm />
            <AddPricesForm />
            {inputErrors && (
                <Alert
                    message="ערכים שגויים, נא לבדוק את הטופס"
                    type="error"
                    style={{ margin: "10px 0" }}
                />
            )}
            <Form.Item
                wrapperCol={{ span: 24 }}
                className="submit-button-container"
                style={{
                    display: "flex",
                    justifyContent: "flex-start",
                }}
            >
                <AsyncFormSubmitButton isSubmitting={isSubmitting}>
                    {submitText}
                </AsyncFormSubmitButton>
            </Form.Item>
        </section>
    )
}
