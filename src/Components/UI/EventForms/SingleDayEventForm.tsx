import { useNavigate } from "react-router-dom"
import { Col, Form, Input, Row, Select } from "antd"
import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { SelectOption, tagOptions } from "../../../util/options"
import { CITemplate, IAddress, UserType } from "../../../util/interfaces"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import { useEffect, useState } from "react"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import EventSegmentsForm from "./EventSegmentsForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { useUser } from "../../../context/UserContext"
import {
    cieventsService,
    CIEventWithoutId,
} from "../../../supabase/cieventsService"
import {
    CITemplateWithoutId,
    templateService,
} from "../../../supabase/templateService"
import useTemplates from "../../../hooks/useTemplates"
import { reverseFormatTeachers } from "./EditSingleDayEventForm"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

const initialValues = {
    "event-date": dayjs.tz(dayjs(), "Asia/Jerusalem"),
    "event-tags": [tagOptions[0].value],
}

export default function SingleDayEventForm({
    closeForm,
    isTemplate,
}: {
    closeForm: () => void
    isTemplate?: boolean
}) {
    const [form] = Form.useForm()
    const { teachers } = useTeachersList()
    // const [repeatOption, setRepeatOption] = useState<EventFrequency>(
    //     EventFrequency.none
    // )
    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    // const [submitted, setSubmitted] = useState(false)
    const navigate = useNavigate()
    const { user } = useUser()
    const { templates } = useTemplates({ isMultiDay: false })
    const [templateOptions, setTemplateOptions] = useState<SelectOption[]>([])
    const [address, setAddress] = useState<IAddress | undefined>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )

    useEffect(() => {
        setTemplateOptions(
            templates.map((template) => ({
                value: template.template_id,
                label: template.name,
            }))
        )
    }, [templates])

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    if (
        user.user_type !== UserType.admin &&
        user.user_type !== UserType.creator
    ) {
        navigate("/")
    }

    const handleAddressSelect = (place: IGooglePlaceOption | null) => {
        if (!place) {
            setAddress(undefined)
            form.setFieldValue("address", undefined)
            return
        }
        const selectedAddress = {
            label: place.label,
            place_id: place.value.place_id,
        }
        setAddress(selectedAddress)
        form.setFieldValue("address", selectedAddress)
    }

    const handleDateChange = (date: dayjs.Dayjs) => {
        setEventDate(date)
    }

    const handleEndDateChange = (date: dayjs.Dayjs) => {
        setEndDate(date)
    }

    const clearForm = () => {
        form.resetFields()
        // setSubmitted(false)
        setSourceTemplateId(null)
        handleAddressSelect(null)
    }

    const handleTemplateChange = (value: string) => {
        const template = templates.find((t) => t.template_id === value)
        if (template) {
            const { currentFormValues, address } =
                singleDayTemplateToFormValues(template)
            form.setFieldsValue(currentFormValues)
            setAddress(address)
            setSourceTemplateId(template.template_id)
        } else {
            setSourceTemplateId(null)
        }
    }

    const handleSubmit = async (values: any) => {
        const baseDate = dayjs(values["event-date"]) // Clone the base date for consistent date manipulation

        const segmentsArray = [
            {
                startTime: baseDate
                    .clone()
                    .hour(values["event-time"][0].hour())
                    .minute(values["event-time"][0].minute())
                    .toISOString(),
                endTime: baseDate
                    .clone()
                    .hour(values["event-time"][1].hour())
                    .minute(values["event-time"][1].minute())
                    .toISOString(),
                type: values["event-types"],
                tags: values["event-tags"] || [],
                teachers: formatTeachers(values["teachers"], teachers),
            },
        ]

        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                segmentsArray.push({
                    type: segment.type,
                    tags: segment.tags || [],
                    teachers: formatTeachers(segment.teachers, teachers),
                    startTime: baseDate
                        .clone()
                        .hour(segment.time[0].hour())
                        .minute(segment.time[0].minute())
                        .toISOString(),
                    endTime: baseDate
                        .clone()
                        .hour(segment.time[1].hour())
                        .minute(segment.time[1].minute())
                        .toISOString(),
                })
            })
        }

        if (!address) {
            return
        }

        try {
            if (!isTemplate) {
                const event: CIEventWithoutId = {
                    start_date: eventDate
                        .hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss"),
                    end_date: eventDate
                        .hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss"),
                    type: "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: dayjs().toISOString(),
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.full_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: segmentsArray,
                    district: values["district"],
                    creator_id: user.user_id,
                    creator_name: user.full_name,
                    source_template_id: sourceTemplateId,
                    is_multi_day: false,
                    multi_day_teachers: null,
                }
                // setSubmitted(true)
                await cieventsService.createCIEvent(event)
                clearForm()
                closeForm()
            } else {
                const template: CITemplateWithoutId = {
                    type: "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: null,
                    name: values["template-name"],
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.full_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: segmentsArray,
                    district: values["district"],
                    is_multi_day: false,
                    multi_day_teachers: null,
                }
                // setSubmitted(true)
                await templateService.createTemplate(template)
                clearForm()
                closeForm()
            }
        } catch (error) {
            console.error("EventForm.handleSubmit.error: ", error)
            throw error
        }
    }

    return (
        <div className="single-day-event-form">
            <section className="event-card">
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    variant="filled"
                    initialValues={initialValues}
                >
                    {isTemplate && (
                        <Form.Item name="template-name">
                            <Row gutter={8}>
                                <Col span={16}>
                                    <Form.Item name="template-name">
                                        <Input
                                            placeholder="שם התבנית"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <button
                                        type="button"
                                        onClick={() => clearForm()}
                                        className="general-clear-btn"
                                    >
                                        ניקוי טופס
                                    </button>
                                </Col>
                            </Row>
                        </Form.Item>
                    )}
                    {!isTemplate && (
                        <Form.Item>
                            <Row gutter={8}>
                                <Col span={16}>
                                    <Form.Item name="template-description">
                                        <Select
                                            options={templateOptions}
                                            onChange={handleTemplateChange}
                                            allowClear
                                            placeholder="בחירת תבנית"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <button
                                        type="button"
                                        onClick={() => clearForm()}
                                        className="general-clear-btn"
                                    >
                                        ניקוי טופס
                                    </button>
                                </Col>
                            </Row>
                        </Form.Item>
                    )}
                    <SingleDayEventFormHead
                        form={form}
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        handleEndDateChange={handleEndDateChange}
                        address={address}
                        eventDate={eventDate}
                        endDate={endDate}
                        isEdit={false}
                        teachers={teachers}
                        isTemplate={isTemplate}
                    />
                    <EventSegmentsForm form={form} day="" teachers={teachers} />
                    <hr className="divider" />
                    <label>
                        <b>קישור</b> (יופיע ככפתור בעמוד האירוע)
                    </label>
                    <AddLinksForm />
                    <hr className="divider" />
                    <label>
                        <b>מחיר</b>
                    </label>
                    <AddPricesForm />

                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        <button type="submit" className={`general-action-btn`}>
                            <label>
                                {isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                            </label>
                            {/* <Spin percent="auto" spinning={submitted} /> */}
                        </button>
                    </Form.Item>
                </Form>
            </section>
        </div>
    )
}

export const formatTeachers = (
    selectedTeachers: string[],
    teachers: { label: string; value: string }[]
) => {
    if (!selectedTeachers) return []
    return selectedTeachers.map((teacher) => {
        const teacherObj = teachers.find((t) => t.value === teacher)
        if (teacherObj) {
            return teacherObj
        } else {
            return { label: teacher, value: "NON_EXISTENT" }
        }
    })
}

export enum EventFrequency {
    none = "none",
    weekly = "weekly",
    byWeek = "by-week",
    monthly = "monthly",
}

export const repeatOptions = [
    { value: EventFrequency.none, label: "אף פעם" },
    { value: EventFrequency.weekly, label: "כל  שבוע" },
    { value: EventFrequency.byWeek, label: "כל כמה שבועות" },
    { value: EventFrequency.monthly, label: "כל חודש" },
]

export const repeatEventTooltip = (
    <>
        <p>* כל כמה שבועות - לדוגמה, כל שבועים ביום שלישי </p>
        <p>* כל חודש - לדוגמה, השבת השניה של כל חודש</p>
    </>
)

export function getDayAndWeekOfMonth(date: dayjs.Dayjs) {
    const dayOfWeek = date.day() // 0 (Sunday) to 6 (Saturday)
    const dayOfMonth = date.date()
    const weekOfMonth = Math.ceil(dayOfMonth / 7)

    return { dayOfWeek, weekOfMonth }
}

export function listOfDates(
    start_date: dayjs.Dayjs,
    end_date: dayjs.Dayjs,
    repeatOption: EventFrequency,
    repeatInterval?: number
) {
    const dates = []
    let date = start_date
    if (repeatOption === EventFrequency.weekly) {
        while (!date.isAfter(end_date.add(1, "day"))) {
            dates.push(date)
            date = date.add(1, "week")
        }
    } else if (repeatOption === EventFrequency.byWeek && repeatInterval) {
        while (!date.isAfter(end_date.add(1, "day"))) {
            dates.push(date)
            date = date.add(repeatInterval, "week")
        }
    } else if (repeatOption === EventFrequency.monthly) {
        const { dayOfWeek, weekOfMonth } = getDayAndWeekOfMonth(start_date)
        while (!date.isAfter(end_date)) {
            dates.push(date)
            date = date.add(1, "month")
            date = moveToSameWeekAndDay(date, dayOfWeek, weekOfMonth)
        }
    }
    return dates
}

export function moveToSameWeekAndDay(
    date: dayjs.Dayjs,
    dayOfWeek: number,
    weekOfMonth: number
): dayjs.Dayjs {
    const monthStart = date.startOf("month")
    let adjustedDate = monthStart.add((weekOfMonth - 1) * 7, "day")
    while (adjustedDate.day() !== dayOfWeek) {
        adjustedDate = adjustedDate.add(1, "day")
    }
    if (adjustedDate.month() !== monthStart.month()) {
        adjustedDate = adjustedDate.subtract(1, "week")
    }
    return adjustedDate
}

export const formatMonthlyDate = (date: dayjs.Dayjs) => {
    const { dayOfWeek, weekOfMonth } = getDayAndWeekOfMonth(date)
    let day
    switch (dayOfWeek) {
        case 0:
            day = "ראשון"
            break
        case 1:
            day = "שני"
            break
        case 2:
            day = "שלישי"
            break
        case 3:
            day = "רביעי"
            break
        case 4:
            day = "חמישי"
            break
        case 5:
            day = "שישי"
            break
        case 6:
            day = "שבת"
            break
    }

    let frequency
    switch (weekOfMonth) {
        case 1:
            frequency = "ראשונה"
            break
        case 2:
            frequency = "שניה"
            break
        case 3:
            frequency = "שלישית"
            break
        case 4:
            frequency = "רביעית"
            break
        default:
            frequency = "חמישית"
            break
    }
    return `יום ${day} ה${frequency} בחודש`
}

export function singleDayTemplateToFormValues(template: CITemplate) {
    const currentFormValues = {
        "event-title": template.title,
        "event-description": template.description,
        address: template.address,
        district: template.district,
        "event-types": template.segments[0]?.type,
        "event-tags": template.segments[0]?.tags,
        teachers: reverseFormatTeachers(template.segments[0]?.teachers),
        "event-date": dayjs.tz(
            dayjs(template.segments[0]?.startTime),
            "Asia/Jerusalem"
        ),
        "event-time": [
            dayjs(template.segments[0]?.startTime).tz("Asia/Jerusalem"),
            dayjs(template.segments[0]?.endTime).tz("Asia/Jerusalem"),
        ],
        segments: template.segments.slice(1).map((segment) => ({
            type: segment.type,
            tags: segment.tags,
            teachers: reverseFormatTeachers(segment.teachers),
            time: [
                dayjs(segment.startTime).tz("Asia/Jerusalem"),
                dayjs(segment.endTime).tz("Asia/Jerusalem"),
            ],
        })),
        links: template.links.map((link) => ({
            title: link.title,
            link: link.link,
        })),
        prices: template.price.map((price) => ({
            title: price.title,
            sum: price.sum,
        })),
    }
    // console.log("currentFormValues: ", currentFormValues);
    return { currentFormValues, address: template.address }
}
