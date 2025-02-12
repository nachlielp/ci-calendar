import { ReactSVG } from "react-svg"
import "../../styles/icon.scss"
import expand from "../../assets/svgs/expand.svg"
import collapse from "../../assets/svgs/collapse.svg"
import calendar from "../../assets/svgs/calendar.svg"
import viewDay from "../../assets/svgs/viewDay.svg"
import instantMix from "../../assets/svgs/instantMix.svg"
import logout from "../../assets/svgs/logout.svg"
import login from "../../assets/svgs/login.svg"
import settings from "../../assets/svgs/settings.svg"
import account from "../../assets/svgs/account.svg"
import home from "../../assets/svgs/home.svg"
import event from "../../assets/svgs/event.svg"
import map from "../../assets/svgs/map.svg"
import hov from "../../assets/svgs/hov.svg"
import description from "../../assets/svgs/description.svg"
import recycle from "../../assets/svgs/recycle.svg"
import visibility from "../../assets/svgs/visibility.svg"
import visibilityOff from "../../assets/svgs/visibilityOff.svg"
import edit from "../../assets/svgs/edit.svg"
import deleteIcon from "../../assets/svgs/delete.svg"
import warning from "../../assets/svgs/warning.svg"
import doNotDisturb from "../../assets/svgs/doNotDisturb.svg"
import info from "../../assets/svgs/info.svg"
import addCircle from "../../assets/svgs/addCircle.svg"
import openInNew from "../../assets/svgs/openInNew.svg"
import schedule from "../../assets/svgs/schedule.svg"
import pinDrop from "../../assets/svgs/pin_drop.svg"
import person from "../../assets/svgs/person.svg"
import chevron_right from "../../assets/svgs/chevron_right.svg"
import translate from "../../assets/svgs/translate.svg"
import menu from "../../assets/svgs/menu.svg"
import group from "../../assets/svgs/group.svg"
import calendar_add_on from "../../assets/svgs/calendar_add_on.svg"
import addBox from "../../assets/svgs/add_box.svg"
import noteStackAdd from "../../assets/svgs/note_stack_add.svg"
import contentCopy from "../../assets/svgs/content_copy.svg"
import support_agent from "../../assets/svgs/support_agent.svg"
import google_color from "../../assets/svgs/google_color.svg"
import lock_reset from "../../assets/svgs/lock_reset.svg"
import search from "../../assets/svgs/search.svg"
import search_off from "../../assets/svgs/search_off.svg"
import close from "../../assets/svgs/close.svg"
import notifications from "../../assets/svgs/notifications.svg"
import notificationsOff from "../../assets/svgs/notifications_off.svg"
import edit_otifications from "../../assets/svgs/edit_notifications.svg"
import add_alert from "../../assets/svgs/add_alert.svg"
import notifications_active from "../../assets/svgs/notifications_active.svg"
import ios_share from "../../assets/svgs/ios_share.svg"
import share from "../../assets/svgs/share.svg"
import check from "../../assets/svgs/check.svg"
import domain from "../../assets/svgs/domain.svg"
import more_vert from "../../assets/svgs/more_vert.svg"
import cancel from "../../assets/svgs/cancel.svg"
import check_circle from "../../assets/svgs/check_circle.svg"
import verified_user from "../../assets/svgs/verified_user.svg"
import mail from "../../assets/svgs/mail.svg"
import lock from "../../assets/svgs/lock.svg"
import ad_units from "../../assets/svgs/ad_units.svg"
import cloud_offline from "../../assets/svgs/cloud_offline.svg"
import paybox from "../../assets/svgs/paybox.svg"
import signal_cellular_connected_no_internet_0_bar from "../../assets/svgs/signal_cellular_connected_no_internet_0_bar.svg"
import touch_app from "../../assets/svgs/touch_app.svg"
export const Icon = ({
    icon,
    className,
    title,
    pretitle,
    onClick,
}: {
    icon: string
    className?: string
    title?: string
    pretitle?: string
    onClick?: () => void
}) => {
    const icons: { [key: string]: string } = {
        expand,
        hov,
        collapse,
        calendar,
        viewDay,
        instantMix,
        logout,
        login,
        settings,
        account,
        home,
        event,
        map,
        description,
        recycle,
        visibility,
        visibilityOff,
        edit,
        deleteIcon,
        warning,
        doNotDisturb,
        info,
        addCircle,
        openInNew,
        schedule,
        pinDrop,
        person,
        chevron_right,
        menu,
        group,
        calendar_add_on,
        addBox,
        noteStackAdd,
        contentCopy,
        mail,
        support_agent,
        google_color,
        lock_reset,
        search,
        search_off,
        close,
        notifications,
        notificationsOff,
        edit_otifications,
        add_alert,
        notifications_active,
        ios_share,
        share,
        check,
        domain,
        more_vert,
        cancel,
        check_circle,
        verified_user,
        lock,
        ad_units,
        cloud_offline,
        paybox,
        signal_cellular_connected_no_internet_0_bar,
        touch_app,
        translate,
    }
    return (
        <label className="icon-component" onClick={onClick}>
            {pretitle && <span className="icon-title">{pretitle} &nbsp;</span>}
            <ReactSVG src={icons[icon]} className={className} />
            {title && <span className="icon-title">{title}</span>}
        </label>
    )
}
