import MenuButtons from "../../Common/MenuButtons"
import { Icon } from "../../Common/Icon"
import Skeleton from "antd/es/skeleton"
import Card from "antd/es/card"

export default function EventsPageHeader() {
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
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "32px",
                        }}
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
                                className={`anchor-btn `}
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
                    <Card
                        className="single-day-event-card"
                        style={{ width: "100%", marginBottom: "16px" }}
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
