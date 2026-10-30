import { Link, Outlet } from "react-router"
import { useRemoveInitialLoader } from "./useRemoveInitialLoader"

export function RootLayout() {
    useRemoveInitialLoader()

    return (
        <div className="app">
            <Outlet />
        </div>
    )
}

export function RouteError() {
    useRemoveInitialLoader()

    return (
        <main className="app" role="alert">
            <h1>משהו השתבש</h1>
            <Link to="/">חזרה ללוח האירועים</Link>
        </main>
    )
}
