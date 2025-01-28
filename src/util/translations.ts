import { store } from "../Store/store"
import { Language } from "./interfaces"

export type TranslationKeys = {
    // Common
    welcome: string
    loading: string
    error: string
    title: string
    description: string
    filter: string
    eventType: string
    region: string

    //add pwa
    addPWABanner: string
    installOnAndroid: string
    PWAinstallOnIOS: string
    PWAnotification: string
    PWAReminder: string
    PWAFooter: string
    PWAins1: string
    PWAins2: string
    PWAins3: string
    PWAins4: string
    PWAins5: string
    PWAins6: string
    PWAins7: string
    PWAins8: string
    PWAins9: string
    PWAins10: string

    // Login
    login: string
    logout: string
    loginWith: string
    loginTitle: string
    loginSubtitle: string
    loginWithPassword: string
    email: string
    password: string
    signin: string
    signUp: string
    hereForTheFirstTime: string
    forgotPassword: string
    name: string
    repeatPassword: string

    // Navigation
    home: string
    about: string
    settings: string
    myEvents: string
    createEvents: string
    manageAllEvents: string
    manageUsers: string
    profile: string
    notifications: string
    registerAsOrganization: string
    manageSupport: string
    resetPassword: string
    enterTheEmailYouRegisteredWith: string

    //Options
    retreat: string
    warmup: string
    workshop: string
    jam: string
    class: string
    underscore: string
    score: string
    course: string

    // Actions
    save: string
    cancel: string
    confirm: string
    delete: string

    // Messages
    confirmDelete: string
    successSaved: string
    errorOccurred: string

    // Districts

    south: string
    center: string
    jerusalem: string
    haifa: string
    galilee: string
    pardesHanna: string
    carmel: string

    //months
    january: string
    february: string
    march: string
    april: string
    may: string
    june: string
    july: string
    august: string
    september: string
    october: string
    november: string
    december: string

    //days
    sunday: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string

    //event preview
    eventCancelled: string
    with: string

    //event details
    additionalInfo: string
    price: string
    link: string
}

type Translations = {
    [key in Language]: TranslationKeys
}

export const translations: Translations = {
    [Language.en]: {
        // Common
        welcome: "Welcome",
        loading: "Loading...",
        error: "Error",
        title: "Israel Contact Improvisation",
        description: "Everything, everywhere",
        filter: "Filter",
        eventType: "Event Type",
        region: "Region",

        // Login
        login: "Login",
        logout: "Logout",
        loginWith: "Login with",
        loginTitle: "Login",
        loginSubtitle: "To receive reminders for events, please sign up:",
        loginWithPassword: "Login with Password",
        email: "Email",
        password: "Password",
        signin: "Sign In",
        signUp: "Sign Up",
        hereForTheFirstTime: "Here for the first time?",
        forgotPassword: "Forgot Password?",
        name: "Name",
        repeatPassword: "Repeat Password",
        enterTheEmailYouRegisteredWith: "Enter the email you registered with",
        //add pwa
        addPWABanner: "For updates, add to Home Screen",
        installOnAndroid: "Install on Android",
        PWAinstallOnIOS: "Install on iOS",
        PWAnotification:
            "Do you want to receive notifications when your favorite teacher posts a new event?",
        PWAReminder: "Do you want to receive reminders for your favorite jams?",
        PWAFooter: "Add the site to your home screen on your phone",
        PWAins1: "1. Open the site in Safari",
        PWAins2: "2. Click on",
        PWAins3: "in the toolbar",
        PWAins4: "3. Scroll down and select",
        PWAins5: "Add to Home Screen",

        PWAins6: "  1. Open the site in Chrome",
        PWAins7: "2. Click on",
        PWAins8: "in the toolbar",
        PWAins9: "3. Scroll down and select",
        PWAins10: "Add to Home Screen",

        // Navigation
        home: "Home",
        about: "About",
        settings: "Settings",
        myEvents: "My Events",
        createEvents: "Create Events",
        manageAllEvents: "Manage All Events",
        manageUsers: "Manage Users",
        profile: "Profile",
        notifications: "Notifications",
        registerAsOrganization: "Register As Teacher/Org",
        manageSupport: "Manage Support",
        resetPassword: "Reset Password",

        //Options
        retreat: "Retreat",
        warmup: "Warmup",
        workshop: "Workshop",
        jam: "Jam",
        class: "Class",
        underscore: "Underscore",
        score: "Score",
        course: "Course",

        center: "Center",
        jerusalem: "Jerusalem",
        south: "South",
        haifa: "Haifa",
        galilee: "Galilee",
        pardesHanna: "Pardes Hanna",
        carmel: "Hof Hacarmel",

        // Actions
        save: "Save",
        cancel: "Cancel",
        confirm: "Confirm",
        delete: "Delete",

        // Messages
        confirmDelete: "Are you sure you want to delete this?",
        successSaved: "Successfully saved!",
        errorOccurred: "An error occurred",

        //months
        january: "January",
        february: "February",
        march: "March",
        april: "April",
        may: "May",
        june: "June",
        july: "July",
        august: "August",
        september: "September",
        october: "October",
        november: "November",
        december: "December",

        //days
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",

        //event preview
        eventCancelled: "Event Cancelled",
        with: "With",

        //event details
        additionalInfo: "Additional Information",
        price: "Price",
        link: "Link",
    },
    [Language.he]: {
        // Common
        welcome: "ברוך הבא",
        loading: "...טוען",
        error: "שגיאה",
        title: "קונטקט אימפרוביזציה ישראל",
        description: "כל האירועים במקום אחד",
        filter: "סינון",
        eventType: "סוג אירוע",
        region: "אזור",

        //add pwa
        addPWABanner: "לקבלת עדכונים הוסיפו לעמוד הבית",
        installOnAndroid: "התקנה על Android",
        PWAinstallOnIOS: "התקנה על iOS",
        PWAnotification: "רוצים הודעה כשהמורה המועדף מעלה אירוע חדש?",
        PWAReminder: "רוצים תזכורות לג׳אמים האהובים עליכם?",
        PWAFooter: "הוסיפו את האתר לעמוד הבית בטלפון",
        PWAins1: " 1. פיתחו את האתר ב- Safari",
        PWAins2: "2. לחצו על",
        PWAins3: "בסרגל הכרטיסיות",
        PWAins4: "3. גללו מטה ובחרו ב",
        PWAins5: "הוספה למסך הבית",

        PWAins6: "  1. פיתחו את האתר ב- Chrome",
        PWAins7: "2. לחצו על",
        PWAins8: "בסרגל כלים",
        PWAins9: "3. גללו מטה ובחרו ב",
        PWAins10: "הוספה למסך הבית",

        // Login
        login: "התחבר/י",
        logout: "התנתק/י",
        loginWith: "כניסה עם",
        loginTitle: "כניסה והזדהות",
        loginSubtitle: "על מנת לקבל תזכורות על אירועים יש להירשם:",
        loginWithPassword: "כניסה עם סיסמה",
        email: "אימייל",
        password: "סיסמה",
        signin: "כניסה",
        signUp: "הרשם",
        hereForTheFirstTime: "פה בפעם הראשונה?",
        forgotPassword: "שכחת סיסמה?",
        enterTheEmailYouRegisteredWith: "נא להזין את המייל שאיתו נרשמתם:",

        // Navigation
        home: "כל הארועים",
        about: "אודות",
        settings: "הגדרות",
        myEvents: "האירועים שלי",
        createEvents: "יצירת אירוע",
        manageAllEvents: "ניהול אירועים",
        manageUsers: "ניהול משתמשים",
        profile: "פרופיל",
        notifications: "התראות",
        registerAsOrganization: "הרשם כמורה או ארגון",
        manageSupport: "ניהול תמיכה",
        resetPassword: "איפוס סיסמה",
        name: "שם",
        repeatPassword: "אימות סיסמה",

        //Options
        retreat: "רטירט",
        warmup: "חימום",
        workshop: "סדנה",
        jam: "ג'אם",
        class: "שיעור",
        underscore: "אנדרסקור",
        score: "סקור",
        course: "קורס",

        //locations

        // Actions
        save: "שמור",
        cancel: "ביטול",
        confirm: "אישור",
        delete: "מחק",

        // Messages
        confirmDelete: "?האם אתה בטוח שברצונך למחוק",
        successSaved: "!נשמר בהצלחה",
        errorOccurred: "אירעה שגיאה",

        // Districts

        south: "דרום",
        center: "מרכז",
        jerusalem: "ירושלים",
        haifa: "חיפה",
        galilee: "גליל",
        pardesHanna: "פרדס חנה",
        carmel: "חוף הכרמל",

        //months
        january: "ינואר",
        february: "פברואר",
        march: "מרץ",
        april: "אפריל",
        may: "מאי",
        june: "יוני",
        july: "יולי",
        august: "אוגוסט",
        september: "ספטמבר",
        october: "אוקטובר",
        november: "נובמבר",
        december: "דצמבר",

        //days
        sunday: "ראשון",
        monday: "שני",
        tuesday: "שלישי",
        wednesday: "רביעי",
        thursday: "חמישי",
        friday: "שישי",
        saturday: "שבת",

        //event preview
        eventCancelled: "האירוע בוטל",
        with: "עם",

        //event details
        additionalInfo: "פרטים נוספים",
        price: "מחיר",
        link: "קישור",
    },
    [Language.ru]: {
        // Common
        welcome: "Добро пожаловать",
        loading: "Загрузка...",
        error: "Ошибка",
        title: "Контактная импровизация",
        description: "Всё, везде",
        filter: "Фильтр",
        eventType: "Тип события",
        region: "Регион",

        // Login
        login: "Войти",
        logout: "Выйти",
        loginWith: "Войти с",
        loginTitle: "Вход и идентификация",
        loginSubtitle:
            "Чтобы получать напоминания о любимых джаммерах, пожалуйста, зарегистрируйтесь:",
        loginWithPassword: "Вход с паролем",
        email: "Электронная почта",
        password: "Пароль",
        signin: "Войти",
        signUp: "Зарегистрироваться",
        hereForTheFirstTime: "Здесь впервые?",
        forgotPassword: "Забыли пароль?",
        name: "Имя",
        repeatPassword: "Повторите пароль",

        // Navigation
        home: "Главная",
        about: "О нас",
        settings: "Настройки",
        myEvents: "Мои события",
        createEvents: "Создать событие",
        manageAllEvents: "Управление всеми событиями",
        manageUsers: "Управление пользователями",
        profile: "Профиль",
        notifications: "Уведомления",
        registerAsOrganization: "Зарегистрироваться как учитель/организация",
        manageSupport: "Управление поддержкой",
        resetPassword: "Сбросить пароль",
        enterTheEmailYouRegisteredWith:
            "Введите электронную почту, с которой вы зарегистрировались:",
        //PWA
        addPWABanner: "Для обновлений добавьте на главный экран",
        installOnAndroid: "Установить на Android",
        PWAinstallOnIOS: "Установить на iOS",
        PWAnotification: "Хотите получать уведомления о новых событиях?",
        PWAReminder: "Хотите получать напоминания о любимых джаммерах?",
        PWAFooter: "Добавьте сайт на главный экран в телефоне",
        PWAins1: "1. Откройте сайт в Safari",
        PWAins2: "2. Нажмите на",
        PWAins3: "в панели инструментов",
        PWAins4: "3. Прокрутите вниз и выберите",
        PWAins5: "Добавить на главный экран",

        PWAins6: "  1. Откройте сайт в Chrome",
        PWAins7: "2. Нажмите на",
        PWAins8: "в панели инструментов",
        PWAins9: "3. Прокрутите вниз и выберите",
        PWAins10: "Добавить на главный экран",

        //Options
        retreat: "Ретрейт",
        warmup: "Горячий",
        workshop: "Семинар",
        jam: "Гимн",
        class: "Класс",
        underscore: "Подчеркивание",
        score: "Счет",
        course: "Курс",

        // Actions
        save: "Сохранить",
        cancel: "Отмена",
        confirm: "Подтвердить",
        delete: "Удалить",

        // Messages
        confirmDelete: "Вы уверены, что хотите удалить это?",
        successSaved: "Успешно сохранено!",
        errorOccurred: "Произошла ошибка",

        // Districts
        south: "Юг",
        center: "Центр",
        jerusalem: "Иерусалим",
        haifa: "Хайфа",
        galilee: "Галилея",
        pardesHanna: "Пардэс Ханна",
        carmel: "Хоф Хакармэль",

        //months
        january: "Январь",
        february: "Февраль",
        march: "Март",
        april: "Апрель",
        may: "Май",
        june: "Июнь",
        july: "Июль",
        august: "Август",
        september: "Сентябрь",
        october: "Октябрь",
        november: "Ноябрь",
        december: "Декабрь",

        //days
        sunday: "Воскресенье",
        monday: "Понедельник",
        tuesday: "Вторник",
        wednesday: "Среда",
        thursday: "Четверг",
        friday: "Пятница",
        saturday: "Суббота",

        //event preview
        eventCancelled: "Событие отменено",
        with: "С",

        //event details
        additionalInfo: "Дополнительная информация",
        price: "Цена",
        link: "Ссылка",
    },
}

// Helper function to get translations
export const getTranslation = (
    key: keyof TranslationKeys,
    language: Language
): string => {
    return translations[language][key]
}

export function isTranslationKey(key: string): key is keyof TranslationKeys {
    return key in translations[store.getLanguage]
}
