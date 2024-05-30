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

export const Icon = ({ icon, className }: { icon: string; className: string }) => {
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
    };
    return <img src={icons[icon]} alt="Icon" className={className} />;
};
