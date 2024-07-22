

import { Drawer } from 'antd';
import FullSingleDayEventCard from './FullSingleDayEventCard';

import { IEvently } from '../../../util/interfaces';
import { Icon } from '../Other/Icon';

interface EventDrawerProps {
    event: IEvently | null;
    onClose: () => void;
}

export default function EventDrawer({ event, onClose }: EventDrawerProps) {
    if (!event) {
        return null;
    }
    return (
        <Drawer
            className='event-drawer'
            onClose={onClose}
            open={!!event}
            closeIcon={<Icon icon="chevron_right" className='event-drawer-close' />}
        >
            <FullSingleDayEventCard event={event} />
        </Drawer>
    );
}