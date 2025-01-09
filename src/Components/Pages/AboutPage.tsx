import { EMAIL_SUPPORT, PAYBOX_URL } from "../../App"
import '../../styles/about-page.scss'
import PageFooter from "../Common/PageFooter"
import { Icon } from "../Common/Icon"

export function AboutPage() {
    return (
        <section className="about-page ">
            <section className="about-page-card card">
                <h1 className="about-page-title">אודות הפרוייקט</h1>
                <article className="info-box">
                    <label>
                        לוח אירועי הקונטקט הינו מיזם התנדבותי. עיזרו לנו לכסות
                        הוצאות ולשמור על השרות ללא עלות לטובת הקהילה ❤️
                    </label>
                    <button
                        className="general-action-btn paybox-btn"
                        onClick={() => window.open(PAYBOX_URL, "_blank")}
                    >
                        <Icon icon="paybox" />
                        תרומה בפייבוקס
                    </button>
                </article>
                <article className="text-box">
                    לוח אירועי הקונטקט הישראלי -Contact Improvisation Calendar
                    Israel - CICI, נוצר מהצורך של הקהילה הישראלית המתרחבת למקום
                    אחד שמרכז את כלל האירועים המתרחשים בישראל.
                </article>
                <article className="text-box">
                    הלוח מציע רשימה של שיעורים, ג'אמים, סדנאות, פסטיבלים
                    ואירועים המתקיימים בקהילת הקונטקט-אימפרוביזציה הישראלית,
                    המפורסמים באופן עצמאי על ידי מארגני האירועים והמורים, מפוקח
                    ע״ צוות מתנדבים ונתמך ע"י עמותת הקונטקט הישראלית.
                </article>
                <hr className="hr" />
                <label className="section-title">
                    תרומה - עזרו לנו לעודד את התנועה
                </label>
                <article className="text-box">
                    לוח השנה האירועים הישראלי פותח על בסיס התנדבותי. מתנדבים
                    רבים הקדישו שעות עבודה רבות ויקרות לחקר ופיתוח לוח האירועים
                    הישראלי של הקונטקט.
                    <br />
                    לוח האירועים, המנוהל כולו על ידי מתנדבים, מיועד להיות שירות
                    חינמי לחלוטין עבור משתמשיו מקהילת הקונטקט הישראלית ולפעול על
                    בסיס תרומה.
                </article>
                <article className="text-box">
                    <label className="section-sub-title">
                        אנחנו צריכים אתכם!{" "}
                    </label>
                    <br />
                    מעט כסף יכול לעזור רבות ולסייע לנו לכסות את עלויות התפעול
                    הבלתי נמנעות של הפרויקט. העלויות הללו כוללות שרתים, אחסון
                    נתונים, תשלום על שם האתר, משימות ניהול ומערכת, הדפסות וכו',
                    והחזרת עלויות ראשוניות שהיו קשורות למימוש הפרויקט, כמו תכנות
                    האתר ועיצובו.
                </article>
                <button
                    className="general-action-btn paybox-btn"
                    onClick={() => window.open(PAYBOX_URL, "_blank")}
                >
                    <Icon icon="paybox" />
                    תרומה בפייבוקס
                </button>
                <hr className="hr" />
                <article className="text-box">
                    <label className=" section-sub-title">צוות הקמה</label>
                    <label className="list-item">מנהל: דניאל רם</label>
                    <label className="list-item">מתכנת: נחליאל פוקרוי</label>
                    <label className="list-item">
                        חווית משתמש ועיצוב: עפרי אפק
                    </label>
                    <label className="list-item">
                        ייעוץ ותמיכה: יונתן אייזן, ירון ביטן
                    </label>
                </article>
                <hr className="hr" />
                <article className="text-box">
                    <label className="list-item">
                        ניתן לפנות אלינו במייל:&nbsp;
                        <a href={`mailto:${EMAIL_SUPPORT}`} target="_blank">
                            {EMAIL_SUPPORT}
                        </a>
                    </label>
                    <br />
                    <label className="list-item">
                        אנו מקווים שלוח האירועים של קונטקט-אימפרוביזציה בישראל
                        ישרת את הקהילה המיוחדת שלנו וואת כל האנשים המעורבים
                        בעשייה.
                    </label>
                    <br />
                    <label className="list-item">תודה!</label>
                </article>
            </section>
            <PageFooter />
        </section>
    )
}
