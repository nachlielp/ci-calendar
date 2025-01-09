import { Link } from "react-router"
import '../../styles/page-footer.scss'
import ClearAppStorageButton from "./ClearAppStorage"
const PageFooter = () => {
    return (
        <footer className="page-footer">
            <label className="footer-item">עמותת הקונטקט בישראל ©️</label>
            <label className="footer-item">
                <ClearAppStorageButton />
                |&nbsp;&nbsp;
                <Link to="/privacy-policy">מדיניות הפרטיות</Link>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <Link to="/terms-and-conditions">תנאי השירות והגבלות</Link>
            </label>
        </footer>
    )
}

export default PageFooter
