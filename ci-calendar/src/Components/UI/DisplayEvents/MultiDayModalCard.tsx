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
            <div className="block font-bold text-lg  w-full sm:w-auto flex flex-row items-start justify-between cursor-pointer" onClick={showModal}>
                <div className="block font-bold text-lg  w-full sm:w-auto">{event.title}&nbsp;</div>
                <Icon icon="expand" className="w-6 h-6 text-black rotate-90" />
            </div>

            <Modal open={isModalOpen} onCancel={handleCancel} footer={null}>
                <div className="flex flex-col sm:flex-col sm:items-right">
                    <div className="block font-bold text-lg break-words w-full sm:w-auto">{event.title}&nbsp;</div>
                    <div className="block w-full sm:w-auto">
                        <Tag color="blue" className="ml-1 mt-1 sm:mt-0">{getType(event.type)}</Tag>
                    </div>
                </div>

                <br />
                <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
                    <Icon icon="event" className="w-5 h-5 mt-1 align-middle" />
                    <p>
                        <b>{formatHebrewDate(event.subEvents[0].startTime)}</b>&nbsp;עד ה-
                        <b>{formatHebrewDate(event.subEvents[event.subEvents.length - 1].endTime)}</b>
                    </p>
                </div>

                {Object.entries(groupedSubEvents).map(([date, subEvents]) => (
                    <div key={date}>
                        <p className="mr-6">{formatHebrewDate(date)}</p>
                        {subEvents.map((subEvent, index) => (
                            <div className="grid grid-cols-[auto,1fr] gap-2 mb-2 pr-6" key={index}>
                                <Icon icon="hov" className="w-3 h-3 mt-1 mr-1 align-middle" />
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

                <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
                    <Icon icon="map" className="w-5 h-5 mt-1 align-middle" />
                    <button
                        onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}
                        className="text-blue-500 underline text-right"
                    >
                        {event.address.label}
                    </button>
                </div>

                {
                    !isWhiteSpace(event.description) && (
                        <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
                            <Icon icon="description" className="w-5 h-5 mt-1align-middle" />
                            <p>{event.description}</p>
                        </div>
                    )}

                {event.price.length > 0 && (
                    <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
                        <span className="text-lg align-middle">&#8362;</span>
                        <ul>
                            {event.price.map((price, index) => (
                                <li key={`${price.title}-${index}`}>
                                    {price.title} - {price.sum}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div style={{ marginTop: 16 }}>
                    {event.links.length > 0 &&
                        event.links.map((link) => (
                            <Button
                                key={link.title}
                                type="default"
                                href={link.link}
                                target="_blank"
                                className="mb-2"
                            >
                                {link.title}
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