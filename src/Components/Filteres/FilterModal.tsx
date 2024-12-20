import "../../styles/filter-modal.css"
import { useState } from "react"
import { Modal } from "../Common/Modal"
import Tag from "antd/es/tag"
import { eventOptions, districtOptions } from "../../util/options"
import { useParamsFilterHandler } from "../../hooks/useParamsFilterHandler"
import { Icon } from "../Common/Icon"

export default function FilterModal() {
    const [modalOpen, setModalOpen] = useState(false)

    const { currentValues, selectOption, removeOption } =
        useParamsFilterHandler()

    const isSelectedFilter = currentValues.length

    return (
        <div className="filter-modal">
            <button
                onClick={() => setModalOpen(true)}
                className={`anchor-btn ${isSelectedFilter && "active"}`}
            >
                <p className="text">סינון</p>
                <Icon icon="instantMix" className="filter-model-icon" />
            </button>

            <Modal
                className="filter-model"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
            >
                <article className="filter-tags-container">
                    <h3 className="sub-title">סוג אירוע</h3>
                    <div className="filter-model-tags">
                        {eventOptions
                            .filter((eventType) => eventType.value !== "warmup")
                            .map((eventType) => {
                                return currentValues.includes(
                                    eventType.value
                                ) ? (
                                    <Tag
                                        className="selected tag"
                                        key={eventType.value}
                                        onClick={() =>
                                            removeOption(eventType.value)
                                        }
                                    >
                                        {eventType.label}
                                    </Tag>
                                ) : (
                                    <Tag
                                        className="un-selected tag"
                                        key={eventType.value}
                                        onClick={() =>
                                            selectOption(eventType.value)
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
                            return currentValues.includes(district.value) ? (
                                <Tag
                                    className="selected tag"
                                    key={district.value}
                                    onClick={() => removeOption(district.value)}
                                >
                                    {district.label}
                                </Tag>
                            ) : (
                                <Tag
                                    className="un-selected tag"
                                    key={district.value}
                                    onClick={() => selectOption(district.value)}
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
