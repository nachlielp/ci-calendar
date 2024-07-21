import { useState } from 'react';
import { Button, Modal, Tag } from 'antd';
import { formatHebrewDate, getEventTeachersIds, getTag, getType, getTypes, isWhiteSpace } from './SingleDayEventCard';
import { useGetTeachers } from '../../../hooks/useGetTeachers';
import { Icon } from '../Other/Icon';
import dayjs from 'dayjs';
import { EventlyType, IEvently } from '../../../util/interfaces';
import BioModal from '../DisplayUsers/BioModal';
import React from 'react';

interface SingleDayModalCardProps {
    event: IEvently,
    anchorEl: any | null
}

export default function SingleDayModalCard({ event, anchorEl }: SingleDayModalCardProps) {
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

    const subEventLen = Object.values(event.subEvents).length;
    const teachersIds = getEventTeachersIds(event);
    const { teachers } = useGetTeachers({ ids: teachersIds });


    return (
        <>
            <div className="modal-card-header" onClick={showModal}>
                {anchorEl}
            </div>

            <Modal open={isModalOpen} onCancel={handleCancel} footer={null} className='single-day-modal-card'>
                <div className="modal-content">
                    <div className="modal-title">{event.title}&nbsp;</div>
                    <div className="event-tags">
                        {getTypes(
                            Object.values(event.subEvents).flatMap((subEvent) => subEvent.type as EventlyType)
                        ).map((type, index) => (
                            <Tag color="blue" key={`${type}-${index}`} className="event-tag">
                                {type}
                            </Tag>
                        ))}
                    </div>
                </div>

                <br />
                <div className="modal-dates">
                    <Icon icon="event" className="modal-icon" />
                    <p>
                        {subEventLen > 0 ? (
                            <>
                                <b>{formatHebrewDate(event.subEvents[0].startTime)}</b>&nbsp;
                                {dayjs(event.subEvents[0].startTime).format("HH:mm")}-
                                {dayjs(event.subEvents[subEventLen - 1].endTime).format("HH:mm")}
                            </>
                        ) : (
                            <span>No event times available</span>
                        )}
                    </p>
                </div>

                {subEventLen > 0 &&
                    Object.values(event.subEvents).map((subEvent, index) => (
                        <div className="sub-event" key={index}>
                            <Icon icon="hov" className="sub-event-icon" />
                            <span>
                                {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;-&nbsp;
                                {dayjs(subEvent.startTime).format("HH:mm")}&nbsp;
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

                <div className="modal-location">
                    <Icon icon="map" className="modal-icon" />
                    <button
                        onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}
                        className="modal-location-button"
                    >
                        {event.address.label}
                    </button>
                </div>

                {!isWhiteSpace(event.description) && (
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

