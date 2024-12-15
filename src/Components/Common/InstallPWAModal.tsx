import { utilService } from "../../util/utilService"
import Modal from "antd/es/modal"
import ios_share from "../../assets/svgs/ios_share.svg"
import more_vert from "../../assets/svgs/more_vert.svg"
import add_to_home_screen from "../../assets/svgs/add_to_home_screen.svg"
import add_box from "../../assets/svgs/add_box.svg"
import { ReactSVG } from "react-svg"
import { appHeaderVM as vm } from "../Layout/AppHeaderVM"
import "../../styles/install-pwa-button.css"
import { observer } from "mobx-react-lite"

const InstallPWAModal = ({ children }: { children: React.ReactNode }) => {
    const iosContent = (
        <div className="install-pwa-modal-container">
            <h2 className="install-pwa-modal-title">התקנה באייפון</h2>
            <ol>
                <li className="install-pwa-modal-li">
                    1. פיתחו את האתר ב- Safari
                </li>
                <li className="install-pwa-modal-li">
                    2. לחצו על
                    <label className="install-share-icon-wrapper">
                        <ReactSVG src={ios_share} className="ios-share-icon" />
                    </label>
                    בסרגל הכרטיסיות
                </li>
                <li className="install-pwa-modal-li">
                    3. גללו מטה ובחרו ב
                    <label className="install-pwa-action-text ">
                        הוספה למסך הבית
                        <ReactSVG
                            src={add_box}
                            className="add-to-home-screen-icon"
                        />
                    </label>
                </li>
            </ol>
        </div>
    )

    const androidContent = (
        <div className="install-pwa-modal-container">
            <h2 className="install-pwa-modal-title">התקנה באנדרויד</h2>
            <ol>
                <li className="install-pwa-modal-li">
                    1. פיתחו את האתר ב- Chrome
                </li>
                <li className="install-pwa-modal-li">
                    2. לחצו על
                    <label className="install-share-icon-wrapper">
                        <ReactSVG src={more_vert} className="ios-share-icon" />
                    </label>
                    בסרגל כלים
                </li>
                <li className="install-pwa-modal-li">
                    3. גללו מטה ובחרו ב
                    <label className="install-pwa-action-text ">
                        <ReactSVG
                            src={add_to_home_screen}
                            className="add-to-home-screen-icon"
                        />
                        הוספה למסך הבית
                    </label>
                </li>
            </ol>
        </div>
    )
    return (
        <section className="install-pwa-button">
            {/* <button
                id="install-button"
                className="install-pwa-btn"
                style={{ display: !utilService.isPWA() ? "block" : "none" }}
                onClick={() => vm.setShowInstallPWAModal(true)}
            >
                התקנה
            </button> */}
            <div onClick={() => vm.setShowInstallPWAModal(true)}>
                {children}
            </div>
            <Modal
                open={vm.showInstallPWAModal}
                onCancel={() => vm.setShowInstallPWAModal(false)}
                footer={null}
            >
                {utilService.isIos() ? iosContent : androidContent}
            </Modal>
        </section>
    )
}

export default observer(InstallPWAModal)
