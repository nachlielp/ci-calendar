import Alert from "antd/es/alert"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"

interface EventFromFooterProps {
    inputErrors: boolean
}

export default function EventFromFooter({ inputErrors }: EventFromFooterProps) {
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
        </section>
    )
}
