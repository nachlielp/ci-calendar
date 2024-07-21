import { ReactSVG } from "react-svg";

import expand from '../../../assets/svgs/expand.svg';
import collapse from '../../../assets/svgs/collapse.svg';
import calendar from '../../../assets/svgs/calendar.svg';
import viewDay from '../../../assets/svgs/viewDay.svg';
import instantMix from '../../../assets/svgs/instantMix.svg';
import logout from '../../../assets/svgs/logout.svg';
import login from '../../../assets/svgs/login.svg';
import settings from '../../../assets/svgs/settings.svg';
import account from '../../../assets/svgs/account.svg';
import home from '../../../assets/svgs/home.svg';
import event from '../../../assets/svgs/event.svg';
import map from '../../../assets/svgs/map.svg';
import hov from '../../../assets/svgs/hov.svg';
import description from '../../../assets/svgs/description.svg';
import recycle from '../../../assets/svgs/recycle.svg';
import visibility from '../../../assets/svgs/visibility.svg';
import visibilityOff from '../../../assets/svgs/visibilityOff.svg';
import edit from '../../../assets/svgs/edit.svg';
import deleteIcon from '../../../assets/svgs/delete.svg';
import warning from '../../../assets/svgs/warning.svg';
import doNotDisturb from '../../../assets/svgs/doNotDisturb.svg';
import info from '../../../assets/svgs/info.svg';
import addCircle from '../../../assets/svgs/addCircle.svg';
import openInNew from '../../../assets/svgs/openInNew.svg';
import schedule from '../../../assets/svgs/schedule.svg';
import pinDrop from '../../../assets/svgs/pin_drop.svg';
import person from '../../../assets/svgs/person.svg';
import chevron_right from '../../../assets/svgs/chevron_right.svg';


export const Icon = ({ icon, className, title, onClick }: { icon: string; className?: string, title?: string, onClick?: () => void }) => {
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
    };
    return <div className="icon-component" onClick={onClick}><ReactSVG src={icons[icon]} className={className} />{title}</div>;
};
