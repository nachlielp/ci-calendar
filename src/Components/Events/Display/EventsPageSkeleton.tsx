import MenuButtons from "../../Common/MenuButtons"
import { Icon } from "../../Common/Icon"
import Skeleton from "antd/es/skeleton"
import Card from "antd/es/card"
import { utilService } from "../../../util/utilService"
import { Tag } from "antd"

export default function EventsPageSkeleton() {
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
    console.log(defaultFilter)
    // const defaultFilter = [
    //     ...utilService.removeDuplicates(JSON.parse(eventTypes)),
    //     ...utilService.removeDuplicates(JSON.parse(districts)),
    // ]
    return (
        <div
            className="app-content"
            style={{ width: "100%", maxWidth: "500px" }}
        >
            <div className="events-page">
                <div
                    className="header-skeleton"
                    style={{ height: "56px" }}
                ></div>
                <section className="header">
                    <h1 className="title">קונטקט אימפרוביזציה ישראל</h1>
                    <p className="subtitle">כל האירועים במקום אחד</p>
                    <main
                        className="menu-container"
                        // style={{
                        //     display: "flex",
                        //     flexDirection: "row",
                        //     alignItems: "center",
                        //     justifyContent: "space-between",
                        //     marginBottom: "16px",
                        // }}
                    >
                        <MenuButtons
                            onSelectKey={() => {}}
                            options={[
                                {
                                    key: "list",
                                    icon: "viewDay",
                                },
                                {
                                    key: "calendar",
                                    icon: "calendar",
                                },
                            ]}
                            defaultKey="list"
                        />
                        <div className="filter-model-container">
                            <button
                                onClick={() => {}}
                                className={`anchor-btn ${
                                    defaultFilter?.length > 0 && "active"
                                }`}
                                disabled
                                style={{
                                    borderRadius: "6px",
                                }}
                            >
                                <p className="text">סינון</p>
                                <Icon
                                    icon="instantMix"
                                    className="filter-model-icon"
                                />
                            </button>
                        </div>
                    </main>
                    <article className="selected-filters">
                        {defaultFilter?.map((eventType: any) => (
                            <Tag
                                className="filter-tag"
                                color="#913e2f"
                                key={eventType}
                                onClick={() => {}}
                            >
                                {eventType}
                                <Icon icon="close" />
                            </Tag>
                        ))}
                    </article>
                    <Card
                        className="single-day-event-card"
                        style={{
                            width: "100%",
                            marginBottom: "16px",
                            marginTop: "16px",
                        }}
                    >
                        <Skeleton active />
                    </Card>
                    <Card
                        className="single-day-event-card"
                        style={{ width: "100%", marginBottom: "16px" }}
                    >
                        <Skeleton active />
                    </Card>
                </section>
            </div>
        </div>
    )
}
