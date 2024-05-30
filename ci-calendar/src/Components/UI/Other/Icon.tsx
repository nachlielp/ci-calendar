import expand from '../../../assets/expand.svg';
import collapse from '../../../assets/collapse.svg';
import calendar from '../../../assets/calendar.svg';
import viewDay from '../../../assets/viewDay.svg';
import instantMix from '../../../assets/instantMix.svg';
import logout from '../../../assets/logout.svg';
import login from '../../../assets/login.svg';
import settings from '../../../assets/settings.svg';
import account from '../../../assets/account.svg';
import home from '../../../assets/home.svg';
import event from '../../../assets/event.svg';
import map from '../../../assets/map.svg';
import hov from '../../../assets/hov.svg';
import description from '../../../assets/description.svg';
import recycle from '../../../assets/recycle.svg';
import visibility from '../../../assets/visibility.svg';
import visibilityOff from '../../../assets/visibilityOff.svg';
import edit from '../../../assets/edit.svg';
import deleteIcon from '../../../assets/delete.svg';
import warning from '../../../assets/warning.svg';
import doNotDisturb from '../../../assets/doNotDisturb.svg';
import info from '../../../assets/info.svg';
import addCircle from '../../../assets/addCircle.svg';

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
    };
    return <div className="flex inline-flex items-center gap-2"><img src={icons[icon]} alt="Icon" className={className} />{title}</div>;
};
