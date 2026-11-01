import type { ReactNode } from "react"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { Dialog } from "../../ui/Dialog"
import { AddBoxIcon } from "../../ui/icons/AddBoxIcon"
import { AddToHomeScreenIcon } from "../../ui/icons/AddToHomeScreenIcon"
import { IosShareIcon } from "../../ui/icons/IosShareIcon"
import { MoreVertIcon } from "../../ui/icons/MoreVertIcon"
import { useCopy } from "../language"
import { isIos } from "../device"
import "./InstallInstructions.scss"

// Legacy translations.ts (PWAinstallOnIOS, installOnAndroid, PWAins1–10,
// PWAFooter), its numbering kept in the words.
const COPY = defineCopy({
    he: {
        iosTitle: "התקנה על iOS",
        androidTitle: "התקנה על Android",
        iosOpen: "1. פיתחו את האתר ב- Safari",
        iosTap: (icon: ReactNode) => <>2. לחצו על {icon} בסרגל הכרטיסיות</>,
        androidOpen: "1. פיתחו את האתר ב- Chrome",
        androidTap: (icon: ReactNode) => <>2. לחצו על {icon} בסרגל כלים</>,
        choose: (action: ReactNode) => <>3. גללו מטה ובחרו ב{action}</>,
        addToHomeScreen: "הוספה למסך הבית",
        footer: "הוסיפו את האתר לעמוד הבית בטלפון",
    },
    en: {
        iosTitle: "Install on iOS",
        androidTitle: "Install on Android",
        iosOpen: "1. Open the site in Safari",
        iosTap: (icon: ReactNode) => <>2. Click on {icon} in the toolbar</>,
        androidOpen: "1. Open the site in Chrome",
        androidTap: (icon: ReactNode) => <>2. Click on {icon} in the toolbar</>,
        choose: (action: ReactNode) => <>3. Scroll down and select {action}</>,
        addToHomeScreen: "Add to Home Screen",
        footer: "Add the site to your home screen on your phone",
    },
    ru: {
        iosTitle: "Установить на iOS",
        androidTitle: "Установить на Android",
        iosOpen: "1. Откройте сайт в Safari",
        iosTap: (icon: ReactNode) => (
            <>2. Нажмите на {icon} в панели инструментов</>
        ),
        androidOpen: "1. Откройте сайт в Chrome",
        androidTap: (icon: ReactNode) => (
            <>2. Нажмите на {icon} в панели инструментов</>
        ),
        choose: (action: ReactNode) => (
            <>3. Прокрутите вниз и выберите {action}</>
        ),
        addToHomeScreen: "Добавить на главный экран",
        footer: "Добавьте сайт на главный экран в телефоне",
    },
})

/**
 * How to add the site to the home screen by hand, for iPhones (Safari's
 * share menu) and for Android browsers that made no install offer (legacy
 * InstallPWABanner's modal).
 */
export default function InstallInstructions({
    onClose,
}: {
    onClose: () => void
}) {
    const copy = useCopy(COPY)
    const ios = isIos()
    const title = ios ? copy.iosTitle : copy.androidTitle

    return (
        <Dialog label={title} onClose={onClose} className="install-dialog">
            <h2 className="install-dialog-title">{title}</h2>
            <ol className="install-dialog-steps">
                <li>{ios ? copy.iosOpen : copy.androidOpen}</li>
                <li>
                    {ios
                        ? copy.iosTap(<Key Icon={IosShareIcon} />)
                        : copy.androidTap(<Key Icon={MoreVertIcon} />)}
                </li>
                <li>
                    {copy.choose(
                        <span className="install-dialog-action">
                            {copy.addToHomeScreen}
                            {ios ? (
                                <AddBoxIcon className="install-dialog-icon" />
                            ) : (
                                <AddToHomeScreenIcon className="install-dialog-icon" />
                            )}
                        </span>,
                    )}
                </li>
            </ol>
            <hr className="install-dialog-rule" />
            <p className="install-dialog-footer">{copy.footer}</p>
        </Dialog>
    )
}

/** The browser button to press, drawn as a small key. */
function Key({ Icon }: { Icon: (props: { className?: string }) => ReactNode }) {
    return (
        <span className="install-dialog-key">
            <Icon className="install-dialog-icon" />
        </span>
    )
}
