import "../../styles/filter-modal.scss"
import { useState } from "react"
import Tag from "antd/es/tag"
import { eventOptions, districtOptions } from "../../util/options"
import { useParamsFilterHandler } from "../../hooks/useParamsFilterHandler"
import { Icon } from "../Common/Icon"
import Modal from "antd/es/modal"
import { isTranslationKey, translations } from "../../util/translations"
import { store } from "../../Store/store"
import instant_mix from "../../assets/svgs/instantMix.svg"
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
                <p className="text">{translations[store.getLanguage].filter}</p>
                <Icon icon={instant_mix} className="filter-model-icon" />
            </button>

            <Modal
                className="filter-model"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                <article className="filter-tags-container">
                    <h3 className="sub-title">
                        {translations[store.getLanguage].eventType}
                    </h3>
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
                                        {isTranslationKey(eventType.value)
                                            ? translations[store.getLanguage][
                                                  eventType.value
                                              ]
                                            : eventType.value}
                                    </Tag>
                                ) : (
                                    <Tag
                                        className="un-selected tag"
                                        key={eventType.value}
                                        onClick={() =>
                                            selectOption(eventType.value)
                                        }
                                    >
                                        {isTranslationKey(eventType.value)
                                            ? translations[store.getLanguage][
                                                  eventType.value
                                              ]
                                            : eventType.value}
                                    </Tag>
                                )
                            })}
                    </div>
                    <h3 className="sub-title">
                        {translations[store.getLanguage].region}
                    </h3>
                    <div className="filter-model-tags">
                        {districtOptions.map((district) => {
                            return currentValues.includes(district.value) ? (
                                <Tag
                                    className="selected tag"
                                    key={district.value}
                                    onClick={() => removeOption(district.value)}
                                >
                                    {isTranslationKey(district.value)
                                        ? translations[store.getLanguage][
                                              district.value
                                          ]
                                        : district.label}
                                </Tag>
                            ) : (
                                <Tag
                                    className="un-selected tag"
                                    key={district.value}
                                    onClick={() => selectOption(district.value)}
                                >
                                    {isTranslationKey(district.value)
                                        ? translations[store.getLanguage][
                                              district.value
                                          ]
                                        : district.label}
                                </Tag>
                            )
                        })}
                    </div>
                </article>
            </Modal>
        </div>
    )
}
