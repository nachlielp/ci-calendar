import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import {
    IPHONE_USER_AGENT,
    offerInstall,
    setStandalone,
    setUserAgent,
    setViewportWidth,
} from "../../test/browser"
import { renderApp } from "../../test/renderApp"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"

const BANNER = "לקבלת עדכונים הוסיפו לעמוד הבית"
const banner = () => screen.queryByRole("button", { name: BANNER })

describe("install banner", () => {
    beforeEach(() => setViewportWidth(390))

    it("invites phone visitors on the calendar to add the app", () => {
        renderApp()
        expect(banner()).toBeInTheDocument()
    })

    it("stays off wider screens and other pages", async () => {
        setViewportWidth(1024)
        const { unmount } = renderApp()
        expect(banner()).not.toBeInTheDocument()
        unmount()

        setViewportWidth(390)
        renderApp({ path: "/about" })
        await screen.findByRole("heading", { name: "אודות הפרוייקט" })
        expect(banner()).not.toBeInTheDocument()
    })

    it("stays out of the installed app", () => {
        setStandalone(true)
        renderApp()
        expect(banner()).not.toBeInTheDocument()
    })

    it("opens the browser's install dialog when it offered one, and goes once accepted", async () => {
        renderApp()
        const offer = offerInstall("accepted")

        await userEvent.click(banner()!)

        expect(offer.prompted).toBe(true)
        expect(offer.defaultPrevented).toBe(true)
        expect(banner()).not.toBeInTheDocument()
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("explains the steps when the browser made no offer", async () => {
        renderApp()

        await userEvent.click(banner()!)

        expect(
            await screen.findByRole("dialog", { name: "התקנה על Android" }),
        ).toHaveTextContent("1. פיתחו את האתר ב- Chrome")
    })

    it("explains Safari's steps on an iPhone", async () => {
        setUserAgent(IPHONE_USER_AGENT)
        renderApp()

        await userEvent.click(banner()!)

        const dialog = await screen.findByRole("dialog", {
            name: "התקנה על iOS",
        })
        expect(dialog).toHaveTextContent("1. פיתחו את האתר ב- Safari")
        expect(dialog).toHaveTextContent("הוספה למסך הבית")
    })

    it("explains the steps after the visitor turned the browser's offer down", async () => {
        renderApp()
        offerInstall("dismissed")

        await userEvent.click(banner()!)
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

        // The offer is spent; a second tap needs the manual steps.
        await userEvent.click(banner()!)
        expect(
            await screen.findByRole("dialog", { name: "התקנה על Android" }),
        ).toBeInTheDocument()
    })

    it("goes once the app is installed", () => {
        renderApp()

        act(() => {
            window.dispatchEvent(new Event("appinstalled"))
        })

        expect(banner()).not.toBeInTheDocument()
    })

    it("stays closed after the visitor closes it, across reloads", async () => {
        const storage = createMemoryStorage()
        const { unmount } = renderApp({ storage })

        await userEvent.click(screen.getByRole("button", { name: "לא תודה" }))
        expect(banner()).not.toBeInTheDocument()
        unmount()

        renderApp({ storage })
        offerInstall()
        expect(banner()).not.toBeInTheDocument()
    })
})
