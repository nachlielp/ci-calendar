import { useState } from 'react';
import { Button, Card, Modal, Tag } from 'antd';
import { formatHebrewDate, getEventTeachersIds, getTag, getType, getTypes, isWhiteSpace } from './SingleDayEventCard';
import { useTeacherBio } from '../../../hooks/useTeacherBio';
import { Icon } from '../Other/Icon';
import dayjs from 'dayjs';
import { EventlyType, IEvently } from '../../../util/interfaces';
import BioModal from '../DisplayUsers/BioModal';
import React from 'react';

interface SingleDayModalCardProps {
    event: IEvently,
    cardWidth: number
}

export default function SingleDayModalCard({ event, cardWidth }: SingleDayModalCardProps) {
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
    const { teachers } = useTeacherBio({ ids: teachersIds });


    return (
        <>
            <div className="block font-bold text-lg  w-full sm:w-auto flex flex-row items-start justify-between cursor-pointer" onClick={showModal}>
                <div className="block font-bold text-lg  w-full sm:w-auto">{event.title}&nbsp;</div>
                <Icon icon="expand" className="w-6 h-6 text-black rotate-90" />
            </div>

            <Modal open={isModalOpen} onCancel={handleCancel} footer={null}>
                <div className="flex justify-center items-center w-full ">
                    <Card
                        className="mt-4"
                        style={{ width: cardWidth }}
                    >
                        <div className="flex flex-col sm:flex-col sm:items-right">
                            <header className="flex flex-row justify-between" >
                                <div className="block font-bold text-lg break-words w-full sm:w-auto">{event.title}&nbsp;</div>

                            </header>
                            <div className="block w-full sm:w-auto">
                                {getTypes(
                                    Object.values(event.subEvents).flatMap((subEvent) => subEvent.type as EventlyType)
                                ).map((type, index) => (
                                    <Tag color="blue" key={`${type}-${index}`} className="inline-block mb-1">
                                        {type}
                                    </Tag>
                                ))}
                            </div>
                        </div>

                        <br />
                        <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
                            <Icon icon="event" className="w-5 h-5 mt-1 align-middle" />
                            <p>
                                {subEventLen > 0 ? (
                                    <>
                                        <b>{formatHebrewDate(event.subEvents[0].startTime)}</b>&nbsp;
                                        {dayjs(event.subEvents[0].startTime).format("HH:mm")}-
                                        {dayjs(event.subEvents[subEventLen - 1].endTime).format("HH:mm")}
                                        {<>&nbsp; עם {subEventLen > 1 && event.subEvents.map(subEvent => subEvent.teachers).flat().map(teacher => {
                                            const isTeacher = teachers.find((t) => t.id === teacher.value);
                                            return isTeacher ? <BioModal user={isTeacher} /> : teacher.label;
                                        })}</>}
                                    </>
                                ) : (
                                    <span>No event times available</span>
                                )}
                            </p>
                        </div>

                        {subEventLen > 0 &&
                            Object.values(event.subEvents).map((subEvent, index) => (
                                <div className="grid grid-cols-[auto,1fr] gap-2 mb-2 pr-6" key={index}>
                                    <Icon icon="hov" className="w-3 h-3 mt-1 mr-1 align-middle" />
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
                                                            {isTeacher ? <BioModal user={isTeacher} /> : teacher.label}
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

                        <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
                            <Icon icon="map" className="w-5 h-5 mt-1 align-middle" />
                            <button
                                onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}
                                className="text-blue-500 underline text-right"
                            >
                                {event.address.label}
                            </button>
                        </div>

                        {!isWhiteSpace(event.description) && (
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
                    </Card>
                </div>
            </Modal>
        </>
    );
};

