import Alert from "antd/es/alert"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"

interface EventFromFooterProps {
    inputErrors: boolean
    message?: string | null
}

export default function EventFromFooter({
    inputErrors,
    message = null,
}: EventFromFooterProps) {
    return (
        <section>
            <AddLinksForm />
            <AddPricesForm />

            {inputErrors && (
                <Alert
                    message={message || "ערכים שגויים, נא לבדוק את הטופס"}
                    type="error"
                    style={{ margin: "10px 0" }}
                />
            )}
        </section>
    )
}
