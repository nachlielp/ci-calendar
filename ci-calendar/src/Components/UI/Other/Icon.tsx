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


export const Icon = ({ icon, className, title }: { icon: string; className?: string, title?: string }) => {
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
    };
    return <div className="flex inline-flex items-center gap-2"><img src={icons[icon]} alt="Icon" className={className} />{title}</div>;
};
