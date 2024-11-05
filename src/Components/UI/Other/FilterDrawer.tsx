import { useState } from "react"
import Drawer from "antd/es/drawer"
import Tag from "antd/es/tag"
import { eventOptions, districtOptions } from "../../../util/options"
import { useParamsFilterHandler } from "../../../hooks/useParamsFilterHandler"
import { Icon } from "./Icon"

export default function FilterDrawer() {
    const [modalOpen, setModalOpen] = useState(false)

    const { currentValues, selectOption, removeOption } =
        useParamsFilterHandler()

    const isSelectedFilter = currentValues.length

    return (
        <div className="filter-drawer">
            <button
                onClick={() => setModalOpen(true)}
                className={`anchor-btn ${isSelectedFilter && "active"}`}
            >
                <p className="text">סינון</p>
                <Icon icon="instantMix" className="filter-drawer-icon" />
            </button>

            <Drawer
                title={<h2 className="filter-drawer-title">סינון</h2>}
                className="filter-drawer custom-drawer"
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                height="440px"
                placement="bottom"
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
            </Drawer>
        </div>
    )
}
