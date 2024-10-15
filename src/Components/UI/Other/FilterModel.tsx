import { useState } from "react"
import { Button, Modal, Tag } from "antd"
import { eventOptions, districtOptions } from "../../../util/options"
import { useParamsFilterHandler } from "../../../hooks/useParamsFilterHandler"
import { Icon } from "./Icon"

export default function FilterModel() {
    const [modalOpen, setModalOpen] = useState(false)

    const { currentValues, selectOption, removeOption } =
        useParamsFilterHandler()

    const isEmptyFilter = !currentValues.length

    const clearAllSearchParams = () => {
        clearAllSearchParams()
    }
    const isSelectedFilter = currentValues.length

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
