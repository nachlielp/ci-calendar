import { useState } from "react"
import { Button, Modal, Tag } from "antd"
import { eventTypes, districtOptions } from "../../../util/options"
import { useParamsHandler } from "../../../hooks/useParamsHandler"
import { Icon } from "./Icon"

export default function FilterModel() {
    const [modalOpen, setModalOpen] = useState(false)

    const {
        currentValues: currentEventTypeValues,
        selectOption: onEventTypeOptionsChange,
        removeOption: onEventTypeOptionsRemove,
        clearSearchParams,
    } = useParamsHandler({
        title: "eventType",
        options: eventTypes.filter((eventType) => eventType.value !== "warmup"),
    })

    const {
        currentValues: currentDistrictValues,
        selectOption: onDistrictOptionsChange,
        removeOption: onDistrictOptionsRemove,
    } = useParamsHandler({ title: "district", options: districtOptions })

    const isEmptyFilter =
        !currentEventTypeValues.length && !currentDistrictValues.length

    const clearAllSearchParams = () => {
        clearSearchParams(["eventType", "district"])
    }
    const isSelectedFilter =
        currentEventTypeValues.length || currentDistrictValues.length

    return (
        <div className="filter-model-container">
            <Button
                onClick={() => setModalOpen(true)}
                className={`anchor-btn ${isSelectedFilter && "active"}`}
            >
                <p className="text">סינון</p>
                <Icon icon="instantMix" className="filter-model-icon" />
            </Button>

            <Modal
                className="filter-model"
                open={modalOpen}
                onOk={() => setModalOpen(false)}
                onCancel={() => setModalOpen(false)}
                // title={<h2 className="filter-modal-title">סינון</h2>}
                footer={
                    <Button
                        onClick={clearAllSearchParams}
                        className={`footer-btn ${isEmptyFilter && "disabled"}`}
                    >
                        נקה הכל
                    </Button>
                }
            >
                <article className="filter-tags-container">
                    <h3 className="sub-title">סוג אירוע</h3>
                    <div className="filter-model-tags">
                        {eventTypes
                            .filter((eventType) => eventType.value !== "warmup")
                            .map((eventType) => {
                                return currentEventTypeValues.includes(
                                    eventType.value
                                ) ? (
                                    <Tag
                                        className="selected tag"
                                        key={eventType.value}
                                        onClick={() =>
                                            onEventTypeOptionsRemove(
                                                "eventType",
                                                eventType.value
                                            )
                                        }
                                    >
                                        {eventType.label}
                                    </Tag>
                                ) : (
                                    <Tag
                                        className="un-selected tag"
                                        key={eventType.value}
                                        onClick={() =>
                                            onEventTypeOptionsChange(
                                                "eventType",
                                                eventType.value
                                            )
                                        }
                                    >
                                        {eventType.label}
                                    </Tag>
                                )
                            })}
                    </div>
                    <h3 className="sub-title">אזור</h3>
                    <div className="filter-model-tags">
                        {districtOptions.map((district) => {
                            return currentDistrictValues.includes(
                                district.value
                            ) ? (
                                <Tag
                                    className="selected tag"
                                    key={district.value}
                                    onClick={() =>
                                        onDistrictOptionsRemove(
                                            "district",
                                            district.value
                                        )
                                    }
                                >
                                    {district.label}
                                </Tag>
                            ) : (
                                <Tag
                                    className="un-selected tag"
                                    key={district.value}
                                    onClick={() =>
                                        onDistrictOptionsChange(
                                            "district",
                                            district.value
                                        )
                                    }
                                >
                                    {district.label}
                                </Tag>
                            )
                        })}
                    </div>
                </article>
            </Modal>
        </div>
    )
}
