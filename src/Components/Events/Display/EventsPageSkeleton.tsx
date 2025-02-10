import MenuButtons from "../../Common/MenuButtons"
import { Icon } from "../../Common/Icon"
import Skeleton from "antd/es/skeleton"
import { utilService } from "../../../util/utilService"
import Tag from "antd/es/tag"
import { ReactSVG } from "react-svg"
import close from "../../../assets/svgs/close.svg"
import "../../../styles/events-page-skeleton.scss"
import instantMix from "../../../assets/svgs/instantMix.svg"
import viewDay from "../../../assets/svgs/viewDay.svg"
import calendar from "../../../assets/svgs/calendar.svg"
export default function EventsPageSkeleton({
    withHeader = true,
}: {
    withHeader?: boolean
}) {
    const eventTypes = localStorage.getItem("eventType") || "[]"
    const districts = localStorage.getItem("district") || "[]"
    const defaultFilter = [
        ...(JSON.parse(eventTypes).map((t: string) =>
            utilService.getLabelByValue(t)
        ) || []),
        ...(JSON.parse(districts).map((t: string) =>
            utilService.getLabelByValue(t)
        ) || []),
    ]

    return (
        <div
            className="app-content events-page-skeleton"
            style={{ width: "100%", maxWidth: "500px" }}
        >
            <div
                style={{
                    padding: "0 16px",
                    alignSelf: "center",
                    position: "relative",
                    height: "calc(100vh - 56px)",
                    overflowY: "auto",
                    color: "#000",
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                    maskImage:
                        "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 1) 16px)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 1) 16px)",
                }}
            >
                <div
                    className="header-skeleton"
                    style={{ height: withHeader ? "56px" : "0" }}
                ></div>
                <section
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: withHeader ? "1.25rem" : "0",
                    }}
                >
                    {withHeader && (
                        <>
                            <h1
                                style={{
                                    fontSize: "1.5rem",
                                    textAlign: "center",
                                    width: "70%",
                                    margin: 0,
                                }}
                            >
                                קונטקט אימפרוביזציה ישראל
                            </h1>
                            <p
                                style={{
                                    fontSize: "1.25rem",
                                    textAlign: "center",
                                    width: "70%",
                                    margin: "0 0 2rem 0",
                                }}
                            >
                                כל האירועים במקום אחד
                            </p>
                            <main
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    justifySelf: "center",
                                    gap: "1rem",
                                    width: "100%",
                                }}
                            >
                                <MenuButtons
                                    onSelectKey={() => {}}
                                    options={[
                                        { key: "list", icon: viewDay },
                                        { key: "calendar", icon: calendar },
                                    ]}
                                    defaultKey="list"
                                />
                                <div className="filter-model-container">
                                    <button
                                        onClick={() => {}}
                                        className={`anchor-btn ${
                                            defaultFilter?.length > 0 &&
                                            "active"
                                        }`}
                                        disabled
                                        style={{ borderRadius: "6px" }}
                                    >
                                        <p className="text">סינון</p>
                                        <Icon
                                            icon={instantMix}
                                            className="filter-model-icon"
                                        />
                                    </button>
                                </div>
                            </main>
                            <article
                                style={{
                                    width: "90%",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "end",
                                    gap: "5px",
                                    flexWrap: "wrap",
                                    marginTop: "1rem",
                                }}
                            >
                                {defaultFilter?.map((eventType: any) => (
                                    <Tag
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            padding: "2px 14px 0 10px",
                                            borderRadius: "20px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                        color="#913e2f"
                                        key={eventType}
                                        onClick={() => {}}
                                    >
                                        {eventType}
                                        <ReactSVG
                                            src={close}
                                            beforeInjection={(svg) => {
                                                svg.style.paddingTop = "3px"
                                                svg.style.paddingRight = "4px"
                                                svg.style.width = "16px"
                                                svg.style.height = "16px"
                                            }}
                                        />
                                    </Tag>
                                ))}
                            </article>
                        </>
                    )}
                    <section
                        className="skeleton-card skeleton-card-top card"
                        style={{ marginTop: "16px" }}
                    >
                        <Skeleton active />
                    </section>
                    <section
                        className="skeleton-card skeleton-card-bottom card"
                        style={{ marginBottom: "16px" }}
                    >
                        <Skeleton active />
                    </section>
                </section>
            </div>
        </div>
    )
}
