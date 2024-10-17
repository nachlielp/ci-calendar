import MenuButtons from "../Other/MenuButtons"
// import Tag from "antd/es/tag"
// import { utilService } from "../../../util/utilService"
import { Icon } from "../Other/Icon"
import Button from "antd/es/button"

export default function EventsPageHeader() {
    return (
        <div
            className="app-content"
            style={{ width: "100%", maxWidth: "500px" }}
        >
            <div className="events-display">
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
                            <Button
                                onClick={() => {}}
                                className={`anchor-btn `}
                                disabled
                            >
                                <p className="text">סינון</p>
                                <Icon
                                    icon="instantMix"
                                    className="filter-model-icon"
                                />
                            </Button>
                        </div>
                    </main>
                    {/* <article className="selected-filters">
                        {[1, 3]?.map((eventType: any) => (
                            <Tag
                                className="filter-tag"
                                color="#913e2f"
                                key={eventType}
                                onClick={() => {}}
                            >
                                {utilService.getLabelByValue(eventType)}
                                <Icon icon="close" />
                            </Tag>
                        ))}
                    </article> */}
                </section>
            </div>
        </div>
    )
}
