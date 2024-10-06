import { useState } from "react"
import { Modal } from "antd"
import { CIEvent, UserBio } from "../../../util/interfaces"
import { useWindowSize } from "../../../hooks/useWindowSize"
import FullEventCard from "./FullEventCard"

interface SingleDayModalCardProps {
    event: CIEvent
    viewableTeachers: UserBio[]
    onSelectEvent: (event: CIEvent) => void
    anchorEl: any | null
}

export default function SingleDayModalCard({
    event,
    anchorEl,
    viewableTeachers,
    onSelectEvent,
}: SingleDayModalCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { width } = useWindowSize()

    const showModal = () => {
        if (width > 768) {
            setIsModalOpen(true)
        } else {
            onSelectEvent(event)
        }
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
            <div className="modal-card-header" onClick={showModal}>
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
