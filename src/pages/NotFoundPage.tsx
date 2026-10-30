import { Link } from "react-router"

export default function NotFoundPage() {
    return (
        <main className="not-found-page">
            <h1>הדף לא נמצא</h1>
            <Link to="/">חזרה ללוח האירועים</Link>
        </main>
    )
}
