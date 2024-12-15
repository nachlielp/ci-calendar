import { CACHE_VERSION } from "../../App"
import "../../styles/page-footer.css"
const PageFooter = () => {
    return (
        <footer className="page-footer">
            <label className="footer-item">עמותת הקונטקט בישראל ©️</label>
            <label className="footer-item">v - {CACHE_VERSION} </label>
        </footer>
    )
}

export default PageFooter
