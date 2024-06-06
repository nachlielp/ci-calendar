import { useState } from 'react';
import { Button, Modal, Tag } from 'antd';
import { formatHebrewDate, getEventTeachersIds, getTag, isWhiteSpace } from './SingleDayEventCard';
import { useGetTeachers } from '../../../hooks/useGetTeachers';
import { Icon } from '../Other/Icon';
import dayjs from 'dayjs';
import { EventlyType, IEvently } from '../../../util/interfaces';
import BioModal from '../DisplayUsers/BioModal';
import React from 'react';
import { eventTypes } from '../../../util/options';
import { groupAndSortSubEvents } from './MultiDayEventCard';

interface MultiDayModalCardProps {
    event: IEvently,
}

export default function MultiDayModalCard({ event }: MultiDayModalCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };


    const handleCancel = () => {
        setIsModalOpen(false);
    };


    const openGoogleMaps = (placeId: string, address: string) => {
        const iosUrl = `comgooglemaps://?q=${encodeURIComponent(address)}`;
        const androidUrl = `geo:0,0?q=${encodeURIComponent(address)}`;
        const fallbackUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

        if (/(iPhone|iPad|iPod)/.test(navigator.userAgent)) {
            setTimeout(() => {
                window.location.href = fallbackUrl;
            }, 25);
            window.open(iosUrl, '_blank');
        } else if (/Android/.test(navigator.userAgent)) {
            setTimeout(() => {
                window.location.href = fallbackUrl;
            }, 25);
            window.open(androidUrl, '_blank');
        } else {
            window.open(fallbackUrl, '_blank');
        }
    };

    const teachersIds = getEventTeachersIds(event);
    const { teachers } = useGetTeachers({ ids: teachersIds });

    const groupedSubEvents = groupAndSortSubEvents(event.subEvents);
    return (
        <>
            <div className="modal-card-header" onClick={showModal}>
                <div className="modal-card-title">{event.title}&nbsp;</div>
                <Icon icon="expand" className="modal-card-icon" />
            </div>

            <Modal open={isModalOpen} onCancel={handleCancel} footer={null} className='multi-day-modal-card'>
                <div className="modal-content">
                    <div className="modal-title">{event.title}&nbsp;</div>
                    <div className="modal-tag">
                        <Tag color="blue">{getType(event.type)}</Tag>
                    </div>
                </div>

                <br />
                <div className="modal-dates">
                    <Icon icon="event" className="modal-icon" />
                    <p>
                        <b>{formatHebrewDate(event.dates.startDate)}</b>&nbsp;עד ה-
                        <b>{formatHebrewDate(event.dates.endDate)}</b>
                    </p>
                </div>

                {Object.entries(groupedSubEvents).map(([date, subEvents]) => (
                    <div key={date}>
                        <p className="sub-event-date">{formatHebrewDate(date)}</p>
                        {subEvents.map((subEvent, index) => (
                            <div className="sub-event" key={index}>
                                <Icon icon="hov" className="sub-event-icon" />
                                <span>
                                    {dayjs(subEvent.startTime).format("HH:mm")}&nbsp;-&nbsp;
                                    {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;
                                    {getType(subEvent.type as EventlyType)}
                                    {subEvent.teachers.length > 0 && (
                                        <span>&nbsp;עם {
                                            subEvent.teachers.map((teacher, index, array) => {
                                                const isTeacher = teachers.find((t) => t.id === teacher.value);
                                                return (
                                                    <React.Fragment key={teacher.value}>
                                                        {isTeacher ? <BioModal teacher={isTeacher} /> : teacher.label}
                                                        {index < array.length - 1 ? ', ' : ''}
                                                    </React.Fragment>
                                                );
                                            })
                                        }</span>
                                    )}
                                    {subEvent.tags && (
                                        <span>
                                            &nbsp;
                                            {subEvent.tags.map((tag) => (
                                                <Tag key={tag} color="green">
                                                    {getTag(tag)}
                                                </Tag>
                                            ))}
                                        </span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}

                <div className="modal-location">
                    <Icon icon="map" className="modal-icon" />
                    <button
                        onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}
                        className="modal-location-button"
                    >
                        {event.address.label}
                    </button>
                </div>

                {
                    !isWhiteSpace(event.description) && (
                        <div className="modal-description">
                            <Icon icon="description" className="modal-icon" />
                            <p>{event.description}</p>
                        </div>
                    )}

                {event.price.length > 0 && (
                    <div className="modal-price">
                        <span className="modal-price-currency">&#8362;</span>
                        <ul>
                            {event.price.map((price, index) => (
                                <li key={`${price.title}-${index}`}>
                                    {price.title} - {price.sum}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="modal-links">
                    {event.links.length > 0 &&
                        event.links.map((link) => (
                            <Button
                                key={link.title}
                                type="default"
                                href={link.link}
                                target="_blank"
                                className="modal-link-button"
                            >
                                <Icon icon="openInNew" className="modal-link-icon" title={link.title} />
                            </Button>
                        ))}
                </div>
            </Modal>
        </>
    );
};

const getType = (type: string) => {
    return eventTypes.find((et) => et.value === type)?.label;
};