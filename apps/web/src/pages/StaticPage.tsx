import type { ReactNode } from "react"
import { PageFooter } from "../app/PageFooter"
import "./StaticPage.scss"

/**
 * The layout of the text pages (about, privacy, terms; legacy
 * `about-page`): a white card with the title, then the footer. The header's
 * home button is the way back.
 */
export function StaticPage({
    title,
    children,
}: {
    title: string
    children: ReactNode
}) {
    return (
        <main className="static-page">
            <article className="static-page-card card">
                <h1 className="static-page-title">{title}</h1>
                {children}
            </article>
            <PageFooter />
        </main>
    )
}
