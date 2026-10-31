import type { ReactNode } from "react"
import { useCopy } from "../app/language"
import { defineCopy } from "../lib/copy"
import { StaticPage } from "./StaticPage"

const EMAIL_SUPPORT = "info@ci-events.org"
const PAYBOX_URL = "https://payboxapp.page.link/32yzdN1D1gix4AR37"

// Legacy AboutPage was Hebrew only; the English and Russian are new.
const COPY = defineCopy({
    he: {
        title: "אודות הפרוייקט",
        supportUs:
            "לוח אירועי הקונטקט הינו מיזם התנדבותי. עיזרו לנו לכסות הוצאות ולשמור על השרות ללא עלות לטובת הקהילה ❤️",
        donate: "תרומה בפייבוקס",
        intro: "לוח אירועי הקונטקט הישראלי -Contact Improvisation Calendar Israel - CICI, נוצר מהצורך של הקהילה הישראלית המתרחבת למקום אחד שמרכז את כלל האירועים המתרחשים בישראל.",
        whatItOffers:
            "הלוח מציע רשימה של שיעורים, ג'אמים, סדנאות, פסטיבלים ואירועים המתקיימים בקהילת הקונטקט-אימפרוביזציה הישראלית, המפורסמים באופן עצמאי על ידי מארגני האירועים והמורים, מפוקח ע״ צוות מתנדבים ונתמך ע\"י עמותת הקונטקט הישראלית.",
        donationTitle: "תרומה - עזרו לנו לעודד את התנועה",
        volunteers:
            "לוח השנה האירועים הישראלי פותח על בסיס התנדבותי. מתנדבים רבים הקדישו שעות עבודה רבות ויקרות לחקר ופיתוח לוח האירועים הישראלי של הקונטקט.",
        free: "לוח האירועים, המנוהל כולו על ידי מתנדבים, מיועד להיות שירות חינמי לחלוטין עבור משתמשיו מקהילת הקונטקט הישראלית ולפעול על בסיס תרומה.",
        needYouTitle: "אנחנו צריכים אתכם!",
        needYou:
            "מעט כסף יכול לעזור רבות ולסייע לנו לכסות את עלויות התפעול הבלתי נמנעות של הפרויקט. העלויות הללו כוללות שרתים, אחסון נתונים, תשלום על שם האתר, משימות ניהול ומערכת, הדפסות וכו', והחזרת עלויות ראשוניות שהיו קשורות למימוש הפרויקט, כמו תכנות האתר ועיצובו.",
        teamTitle: "צוות הקמה",
        manager: "מנהל: דניאל רם",
        developer: "מתכנת: נחליאל פוקרוי",
        design: "חווית משתמש ועיצוב: עפרי אפק",
        advice: "ייעוץ ותמיכה: יונתן אייזן, ירון ביטן",
        contact: (email: ReactNode) => <>ניתן לפנות אלינו במייל: {email}</>,
        hope: "אנו מקווים שלוח האירועים של קונטקט-אימפרוביזציה בישראל ישרת את הקהילה המיוחדת שלנו וואת כל האנשים המעורבים בעשייה.",
        thanks: "תודה!",
    },
    en: {
        title: "About the project",
        supportUs:
            "The contact calendar is a volunteer project. Help us cover its costs and keep the service free for the community ❤️",
        donate: "Donate with PayBox",
        intro: "The Israeli contact calendar – Contact Improvisation Calendar Israel (CICI) – grew out of the expanding Israeli community's need for one place that gathers all the events happening in Israel.",
        whatItOffers:
            "The calendar lists classes, jams, workshops, festivals and events in the Israeli contact improvisation community. Organisers and teachers publish them independently; a team of volunteers oversees it, and the Israeli Contact Improvisation Association supports it.",
        donationTitle: "Donate – help us keep the movement going",
        volunteers:
            "The Israeli events calendar was developed by volunteers. Many of them gave long, valuable hours to researching and building the Israeli contact events calendar.",
        free: "Run entirely by volunteers, the calendar is meant to be completely free for its users in the Israeli contact community, and to run on donations.",
        needYouTitle: "We need you!",
        needYou:
            "A little money goes a long way towards the project's unavoidable running costs: servers, data storage, the site's domain name, administration and system work, printing and so on, and paying back the initial costs of building the project, such as programming and designing the site.",
        teamTitle: "Founding team",
        manager: "Manager: Daniel Ram",
        developer: "Developer: Nachliel Pokroy",
        design: "User experience and design: Ofri Afek",
        advice: "Advice and support: Yonatan Eisen, Yaron Bitan",
        contact: (email: ReactNode) => <>You can email us at {email}</>,
        hope: "We hope the contact improvisation calendar in Israel serves our special community and everyone involved in it.",
        thanks: "Thank you!",
    },
    ru: {
        title: "О проекте",
        supportUs:
            "Календарь контакта — волонтёрский проект. Помогите нам покрыть расходы и сохранить его бесплатным для сообщества ❤️",
        donate: "Пожертвовать через PayBox",
        intro: "Израильский календарь контакта — Contact Improvisation Calendar Israel (CICI) — появился из потребности растущего израильского сообщества в одном месте, где собраны все события в Израиле.",
        whatItOffers:
            "В календаре — уроки, джемы, мастерские, фестивали и события израильского сообщества контактной импровизации. Их публикуют сами организаторы и преподаватели; за календарём следит команда волонтёров, а поддерживает его Израильская ассоциация контактной импровизации.",
        donationTitle: "Пожертвования — помогите нам поддерживать движение",
        volunteers:
            "Израильский календарь событий создан волонтёрами. Многие из них посвятили долгие и ценные часы исследованию и разработке израильского календаря контакта.",
        free: "Календарь целиком ведут волонтёры. Он задуман как полностью бесплатный сервис для израильского сообщества контакта и существует на пожертвования.",
        needYouTitle: "Вы нам нужны!",
        needYou:
            "Даже небольшая сумма очень помогает покрыть неизбежные расходы проекта: серверы, хранение данных, доменное имя сайта, администрирование и обслуживание системы, печать и т. д., а также вернуть начальные затраты на создание проекта — программирование и дизайн сайта.",
        teamTitle: "Команда основателей",
        manager: "Руководитель: Даниэль Рам",
        developer: "Разработчик: Нахлиэль Покрой",
        design: "UX и дизайн: Офри Афек",
        advice: "Консультации и поддержка: Йонатан Айзен, Ярон Битан",
        contact: (email: ReactNode) => <>Пишите нам на почту: {email}</>,
        hope: "Мы надеемся, что календарь контактной импровизации в Израиле послужит нашему особенному сообществу и всем, кто в нём участвует.",
        thanks: "Спасибо!",
    },
})

/** `/about` (legacy AboutPage): the project, donations, team and contact. */
export default function AboutPage() {
    const copy = useCopy(COPY)
    const donate = (
        <a
            className="action-btn"
            href={PAYBOX_URL}
            target="_blank"
            rel="noreferrer"
        >
            <PayboxIcon />
            {copy.donate}
        </a>
    )

    return (
        <StaticPage title={copy.title}>
            <div className="info-box">
                <p className="list-item">{copy.supportUs}</p>
                {donate}
            </div>
            <p className="text-box">{copy.intro}</p>
            <p className="text-box">{copy.whatItOffers}</p>
            <hr className="hr" />
            <h2 className="section-title">{copy.donationTitle}</h2>
            <p className="text-box">
                {copy.volunteers}
                <br />
                {copy.free}
            </p>
            <div className="text-box">
                <h3 className="section-sub-title">{copy.needYouTitle}</h3>
                <p className="list-item">{copy.needYou}</p>
            </div>
            {donate}
            <hr className="hr" />
            <div className="text-box">
                <h3 className="section-sub-title">{copy.teamTitle}</h3>
                <p className="list-item">{copy.manager}</p>
                <p className="list-item">{copy.developer}</p>
                <p className="list-item">{copy.design}</p>
                <p className="list-item">{copy.advice}</p>
            </div>
            <hr className="hr" />
            <div className="text-box">
                <p className="list-item">
                    {copy.contact(
                        <a href={`mailto:${EMAIL_SUPPORT}`}>{EMAIL_SUPPORT}</a>,
                    )}
                </p>
                <br />
                <p className="list-item">{copy.hope}</p>
                <br />
                <p className="list-item">{copy.thanks}</p>
            </div>
        </StaticPage>
    )
}

// The old client's assets/svgs/paybox.svg
function PayboxIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 16 15" fill="none">
            <path
                d="M14.7758 2.88281L12.095 7.05301V14.4998H3.75456V7.05301L1.22266 2.88281"
                stroke="currentColor"
                strokeLinecap="round"
            />
            <circle
                cx="7.92793"
                cy="3.47871"
                r="2.47871"
                stroke="currentColor"
            />
        </svg>
    )
}
