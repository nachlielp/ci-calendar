import { useEffect, useState } from "react"
import { Modal } from "antd"
import { CIEvent, UserBio } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"

interface EventCardProps {
    event: CIEvent
    viewableTeachers: UserBio[]
    anchorEl: any | null
    isSelectedCard: boolean
}

export default function FullEventCardModal({
    event,
    anchorEl,
    viewableTeachers,
    isSelectedCard,
}: EventCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(isSelectedCard)

    useEffect(() => {
        setIsModalOpen(isSelectedCard)
    }, [isSelectedCard])

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    // const openGoogleMaps = (placeId: string, address: string) => {
    //     const iosUrl = `comgooglemaps://?q=${encodeURIComponent(address)}`;
    //     const androidUrl = `geo:0,0?q=${encodeURIComponent(address)}`;
    //     const fallbackUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

    //     if (/(iPhone|iPad|iPod)/.test(navigator.userAgent)) {
    //         setTimeout(() => {
    //             window.location.href = fallbackUrl;
    //         }, 25);
    //         window.open(iosUrl, '_blank');
    //     } else if (/Android/.test(navigator.userAgent)) {
    //         setTimeout(() => {
    //             window.location.href = fallbackUrl;
    //         }, 25);
    //         window.open(androidUrl, '_blank');
    //     } else {
    //         window.open(fallbackUrl, '_blank');
    //     }
    // };

    // const subEventLen = Object.values(event.subEvents).length;
    // const teachersIds = getEventTeachersIds(event);

    return (
        <>
            <div
                id={event.id}
                className="modal-card-header"
                onClick={showModal}
            >
                {anchorEl}
            </div>

            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                className="single-day-modal-card"
            >
                <FullEventCard
                    event={event}
                    viewableTeachers={viewableTeachers}
                />
            </Modal>
        </>
    )
}
