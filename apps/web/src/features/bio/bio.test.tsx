import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "@ci-calendar/core/app/deviceStorage"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import { PHOTO_MAX_SIDE } from "@ci-calendar/core/lib/photo"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { FAKE_BUCKET, FAKE_SUPABASE_URL } from "../../test/fakeFiles"
import { renderApp } from "../../test/renderApp"
import { liveObjectUrls } from "../../test/setup"
import { testUser } from "../../test/testUsers"
import { bio, event, tagging } from "../../test/testEvents"
import { MY_BIO_COLUMNS } from "@ci-calendar/core/features/bio/myBio"

const NOW = new Date("2026-10-30T09:00:00Z")
const COLUMNS = MY_BIO_COLUMNS.replace(/\s+/g, "")

type Fake = ReturnType<typeof createFakeDataClient>

/** Device storage that records every value written to it. */
function recordingStorage() {
    const storage = createMemoryStorage()
    const writes: { key: string; value: string }[] = []
    const recording: DeviceStorage = {
        ...storage,
        get length() {
            return storage.length
        },
        setItem: (key, value) => {
            writes.push({ key, value: String(value) })
            storage.setItem(key, value)
        },
    }
    return { storage: recording, writes }
}

/**
 * A teacher (with a public bio unless `ownBio` is null) tagged on a jam,
 * plus another teacher's bio.
 */
function setup(
    role: SignedInRole = "profile",
    ownBio: Record<string, unknown> | null = {},
) {
    const user = testUser(role)
    const fake = createFakeDataClient()
    const other = bio({ bio_name: "מורה אחר" })
    fake.rows("public_bio").push(other)
    const jam = event({ title: "ג'אם עם דנה" })
    fake.rows("ci_events").push(jam)
    fake.rows("ci_events_users_junction").push(tagging(jam, other))
    if (ownBio) {
        const own = bio({
            user_id: user.id,
            bio_name: "דנה",
            about: "מלמדת בחיפה",
            img: `${FAKE_SUPABASE_URL}/storage/v1/object/public/${FAKE_BUCKET}/${user.id}/1.png`,
            ...ownBio,
        })
        fake.rows("public_bio").push(own)
        fake.rows("ci_events_users_junction").push(
            tagging(jam, { user_id: user.id }),
        )
    }
    return { user, fake }
}

const bioReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "public_bio" &&
            request.method === "select" &&
            request.select === COLUMNS,
    )
const bioWrites = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "public_bio" && request.method !== "select",
    )
const windowReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" && request.method === "select",
    )
const ownRow = (fake: Fake, userId: string) =>
    fake.rows("public_bio").find((row) => row.user_id === userId)!

async function openEditor() {
    await userEvent.click(
        await screen.findByRole("button", { name: "עריכת פרופיל" }),
    )
    return screen.findByRole("button", { name: "שמירת שינויים" })
}

async function pickPhoto(name = "me.png", type = "image/png") {
    const file = new File([new Uint8Array(2_000_000)], name, { type })
    await userEvent.upload(screen.getByLabelText("העלאת תמונה"), file)
    return file
}

describe("bio editor (/bio)", () => {
    it("is for profiles, creators, orgs and admins only", async () => {
        const { user, fake } = setup("user", null)
        const { router } = renderApp({ fake, signedInAs: user, path: "/bio" })
        await waitFor(() => expect(router.state.location.pathname).toBe("/"))

        const out = renderApp({ path: "/bio" })
        await waitFor(() =>
            expect(out.router.state.location.pathname).toBe("/login"),
        )
    })

    it.each(["profile", "creator", "org", "admin"] as const)(
        "opens for %s",
        async (role) => {
            const { user, fake } = setup(role)
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            expect(
                await screen.findByRole("heading", { name: "דנה" }),
            ).toBeInTheDocument()
        },
    )

    it("loads only the user's own bio, with their token, when the page opens", async () => {
        const { user, fake } = setup()
        const { router } = renderApp({ fake, signedInAs: user, now: NOW })
        await screen.findByRole("button", { name: "פתח תפריט" })
        expect(bioReads(fake)).toHaveLength(0)

        await act(() => router.navigate("/bio"))
        const card = await screen.findByRole("heading", { name: "דנה" })
        expect(card.closest("section")).toHaveTextContent("מלמדת בחיפה")
        expect(bioReads(fake)).toHaveLength(1)
        expect(bioReads(fake)[0]).toMatchObject({
            filters: [{ op: "eq", column: "user_id", value: user.id }],
            returns: "maybeSingle",
            token: fake.auth.accessToken(),
        })
        expect(screen.queryByText("מורה אחר")).not.toBeInTheDocument()
        // The settings show the role and the switches as stored.
        expect(screen.getByText("מורה")).toBeInTheDocument()
        expect(
            screen.getByRole("switch", { name: "הצגת הפרופיל לציבור" }),
        ).toBeChecked()
    })

    it("saves only the changed columns of the user's own row, and shows them", async () => {
        const { user, fake } = setup()
        renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
        await openEditor()

        const about = screen.getByRole("textbox", { name: "אודות" })
        await userEvent.clear(about)
        await userEvent.type(about, "מלמדת בתל אביב")
        const [, firstUrl] = within(
            screen.getByRole("group", { name: /יופיע ככפתור/ }),
        ).getAllByRole("textbox")
        await userEvent.type(firstUrl, "dana.example.com")
        await userEvent.click(
            screen.getByRole("button", { name: "שמירת שינויים" }),
        )
        // A link needs its title (legacy's rule): nothing was sent.
        expect(
            await screen.findByText("נא להזין כותרת לקישור"),
        ).toBeInTheDocument()
        expect(bioWrites(fake)).toHaveLength(0)

        const [firstTitle] = within(
            screen.getByRole("group", { name: /יופיע ככפתור/ }),
        ).getAllByRole("textbox")
        await userEvent.type(firstTitle, "האתר שלי")
        await userEvent.click(
            screen.getByRole("button", { name: "שמירת שינויים" }),
        )

        const link = await screen.findByRole("link", { name: /האתר שלי/ })
        expect(link).toHaveAttribute("href", "https://dana.example.com")
        expect(screen.getByText("מלמדת בתל אביב")).toBeInTheDocument()
        expect(bioWrites(fake)).toEqual([
            expect.objectContaining({
                method: "update",
                body: {
                    about: "מלמדת בתל אביב",
                    page_title: "האתר שלי",
                    page_url: "https://dana.example.com",
                },
                filters: [{ op: "eq", column: "user_id", value: user.id }],
                token: fake.auth.accessToken(),
            }),
        ])
        // From the response: no refetch.
        expect(bioReads(fake)).toHaveLength(1)
    })

    it("creates the bio when the user has none, as legacy did", async () => {
        const { user, fake } = setup("creator", null)
        renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })

        // No name yet: the form first, the switches waiting for a bio.
        const name = await screen.findByRole("textbox", { name: "*שם מלא" })
        expect(
            screen.getByRole("switch", {
                name: "אפשרות לתיוג על ידי מורים אחרים",
            }),
        ).toBeDisabled()
        await userEvent.click(
            screen.getByRole("button", { name: "שמירת שינויים" }),
        )
        expect(await screen.findByText("נא להזין שם")).toBeInTheDocument()

        await userEvent.type(name, "נועה")
        await userEvent.click(
            screen.getByRole("button", { name: "שמירת שינויים" }),
        )
        expect(
            await screen.findByRole("heading", { name: "נועה" }),
        ).toBeInTheDocument()
        expect(bioWrites(fake)).toEqual([
            expect.objectContaining({
                method: "insert",
                body: {
                    bio_name: "נועה",
                    about: "",
                    page_title: "",
                    page_url: "",
                    page_title_2: "",
                    page_url_2: "",
                    img: "",
                    user_id: user.id,
                },
            }),
        ])
        expect(ownRow(fake, user.id).bio_name).toBe("נועה")
        expect(
            screen.getByRole("switch", {
                name: "אפשרות לתיוג על ידי מורים אחרים",
            }),
        ).toBeEnabled()
    })

    it("updates the row another tab created meanwhile instead of a second one", async () => {
        const { user, fake } = setup("profile", null)
        renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*שם מלא" }),
            "נועה",
        )
        fake.rows("public_bio").push(bio({ user_id: user.id, bio_name: "" }))
        await userEvent.click(
            screen.getByRole("button", { name: "שמירת שינויים" }),
        )
        expect(
            await screen.findByRole("heading", { name: "נועה" }),
        ).toBeInTheDocument()
        expect(bioWrites(fake).map((write) => write.method)).toEqual([
            "insert",
            "update",
        ])
        expect(
            fake.rows("public_bio").filter((row) => row.user_id === user.id),
        ).toHaveLength(1)
    })

    it("shows a new name on the calendar's cached events at once", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        const { router } = renderApp({
            fake,
            signedInAs: user,
            storage,
            now: NOW,
        })
        await screen.findByText("ג'אם עם דנה")
        const reads = windowReads(fake).length

        await act(() => router.navigate("/bio"))
        await openEditor()
        const name = screen.getByRole("textbox", { name: "*שם מלא" })
        await userEvent.clear(name)
        await userEvent.type(name, "דנה כהן")
        await userEvent.click(
            screen.getByRole("button", { name: "שמירת שינויים" }),
        )
        await screen.findByRole("heading", { name: "דנה כהן" })

        const persisted = JSON.stringify(
            Object.fromEntries(
                Array.from({ length: storage.length ?? 0 }, (_, i) => {
                    const key = storage.key!(i)!
                    return [key, storage.getItem(key)]
                }),
            ),
        )
        expect(persisted).toContain("דנה כהן")
        expect(windowReads(fake)).toHaveLength(reads)
    })

    it("takes a bio switched off out of the calendar's data and the persisted cache", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        const { router } = renderApp({
            fake,
            signedInAs: user,
            storage,
            now: NOW,
        })
        await screen.findByText("ג'אם עם דנה")
        const stored = () =>
            JSON.stringify(storage.getItem("ci-calendar:query-cache:v1"))
        expect(stored()).toContain("מלמדת בחיפה")
        const reads = windowReads(fake).length

        await act(() => router.navigate("/bio"))
        const visible = await screen.findByRole("switch", {
            name: "הצגת הפרופיל לציבור",
        })
        await userEvent.click(visible)
        await waitFor(() => expect(visible).not.toBeChecked())
        expect(bioWrites(fake)).toEqual([
            expect.objectContaining({
                method: "update",
                body: { show_profile: false },
                filters: [{ op: "eq", column: "user_id", value: user.id }],
            }),
        ])
        // In place, from the response: no window request.
        expect(stored()).not.toContain("מלמדת בחיפה")
        expect(stored()).toContain("מורה אחר")
        expect(windowReads(fake)).toHaveLength(reads)

        // Back on: it returns to the events tagging it (they're refetched).
        await userEvent.click(visible)
        await waitFor(() => expect(visible).toBeChecked())
        await act(() => router.navigate("/"))
        await waitFor(() => expect(stored()).toContain("מלמדת בחיפה"))
    })

    it("saves the tagging switch at once", async () => {
        const { user, fake } = setup()
        renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
        const tagging = await screen.findByRole("switch", {
            name: "אפשרות לתיוג על ידי מורים אחרים",
        })
        await userEvent.click(tagging)
        await waitFor(() =>
            expect(ownRow(fake, user.id).allow_tagging).toBe(false),
        )
        expect(bioWrites(fake)[0].body).toEqual({ allow_tagging: false })
        expect(tagging).not.toBeChecked()
    })

    it("keeps unsaved text as a draft on the device, never the photo", async () => {
        const { user, fake } = setup()
        const { storage, writes } = recordingStorage()
        const first = renderApp({
            fake,
            signedInAs: user,
            storage,
            path: "/bio",
            now: NOW,
        })
        await openEditor()
        await userEvent.type(
            screen.getByRole("textbox", { name: "אודות" }),
            "!",
        )
        await pickPhoto()
        await userEvent.click(
            await screen.findByRole("button", { name: "שמירה" }),
        )
        await screen.findByText("התמונה החדשה תישמר בלחיצה על שמירת שינויים")
        first.unmount()

        expect(writes.some(({ key }) => key === "personal:bio-draft")).toBe(
            true,
        )
        renderApp({ fake, signedInAs: user, storage, path: "/bio", now: NOW })
        await openEditor()
        expect(screen.getByRole("textbox", { name: "אודות" })).toHaveValue(
            "מלמדת בחיפה!",
        )
        expect(screen.queryByText(/התמונה החדשה/)).not.toBeInTheDocument()
    })

    it("removes legacy's base64 photo and profile draft from the device", async () => {
        const storage = createMemoryStorage()
        storage.setItem(
            "upload-image-temp",
            JSON.stringify({
                timestamp: 1,
                imageData: "data:image/png;base64,AAAA",
            }),
        )
        storage.setItem("profile-form", JSON.stringify({ bio_name: "דנה" }))
        renderApp({ storage, now: NOW })
        await screen.findByRole("button", { name: "פתח תפריט" })
        expect(storage.getItem("upload-image-temp")).toBeNull()
        expect(storage.getItem("profile-form")).toBeNull()
    })

    describe("photo", () => {
        it("doesn't load the cropper until a photo is picked", async () => {
            const { user, fake } = setup()
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            expect(fake.images.cropperLoads).toBe(0)

            await pickPhoto()
            expect(
                await screen.findByRole("dialog", { name: "חיתוך תמונה" }),
            ).toBeInTheDocument()
            expect(fake.images.cropperLoads).toBe(1)
        })

        it("uploads the crop resized, then points the bio at it", async () => {
            const { user, fake } = setup()
            const { storage, writes } = recordingStorage()
            // sessionStorage too (`services.session`).
            const tab = recordingStorage()
            const { router } = renderApp({
                fake,
                signedInAs: user,
                storage,
                session: tab.storage,
                now: NOW,
            })
            await screen.findByText("ג'אם עם דנה")
            await act(() => router.navigate("/bio"))
            await openEditor()
            const file = await pickPhoto()
            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )

            // The crop, drawn at the capped size, in memory until saved.
            expect(fake.images.renders).toHaveLength(1)
            const [render] = fake.images.renders
            expect(render.image).toBe(file)
            expect(render.area).toEqual(fake.images.cropArea)
            expect(render.size).toEqual({
                width: PHOTO_MAX_SIDE,
                height: PHOTO_MAX_SIDE,
            })
            const preview = await screen.findByRole("img", {
                name: "תמונת פרופיל",
            })
            expect(preview.getAttribute("src")).toMatch(/^blob:/)
            expect(fake.files.uploads).toHaveLength(0)
            expect(bioWrites(fake)).toHaveLength(0)

            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            await screen.findByRole("heading", { name: "דנה" })

            const path = `${user.id}/${NOW.getTime()}.jpg`
            const url = `${FAKE_SUPABASE_URL}/storage/v1/object/public/${FAKE_BUCKET}/${path}`
            // JPEG, sent as legacy's (non-standard) `image/jpg`.
            expect(fake.files.uploads).toEqual([
                {
                    path,
                    file: render.output,
                    contentType: "image/jpg",
                    token: fake.auth.accessToken(),
                },
            ])
            expect(bioWrites(fake)).toEqual([
                expect.objectContaining({
                    method: "update",
                    body: { img: url },
                }),
            ])
            expect(screen.getByRole("img", { name: "דנה" })).toHaveAttribute(
                "src",
                url,
            )
            // The old photo stays (cached events elsewhere still show it).
            expect(fake.files.removals).toEqual([])
            // Every object URL was let go; nothing image-like was stored.
            expect(liveObjectUrls.size).toBe(0)
            expect(writes.length).toBeGreaterThan(0)
            for (const { value } of [...writes, ...tab.writes]) {
                expect(value).not.toMatch(/data:image|blob:/)
                expect(value).not.toMatch(/[A-Za-z0-9+/=]{2000,}/)
            }
            expect(JSON.stringify(writes)).toContain(url)
        })

        it("sizes a small crop as it is (never up)", async () => {
            const { user, fake } = setup()
            fake.images.cropArea = { x: 0, y: 0, width: 320, height: 320 }
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await pickPhoto()
            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )
            await waitFor(() => expect(fake.images.renders).toHaveLength(1))
            expect(fake.images.renders[0].size).toEqual({
                width: 320,
                height: 320,
            })
        })

        it("writes nothing when the upload fails, and says so", async () => {
            const { user, fake } = setup()
            fake.files.fail()
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await pickPhoto()
            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )
            await screen.findByText(/התמונה החדשה/)
            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            expect(
                await screen.findByText("העלאת התמונה נכשלה, נסו שוב"),
            ).toBeInTheDocument()
            expect(bioWrites(fake)).toHaveLength(0)
            // The photo is still there to try again.
            expect(screen.getByText(/התמונה החדשה/)).toBeInTheDocument()
        })

        it("says clearly when the bucket refuses the user, and saves the rest without the photo", async () => {
            const { user, fake } = setup()
            fake.files.fail("new row violates row-level security policy", {
                denied: true,
            })
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await userEvent.type(
                screen.getByRole("textbox", { name: "אודות" }),
                "!",
            )
            await pickPhoto()
            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )
            await screen.findByText(/התמונה החדשה/)
            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            expect(
                await screen.findByText(/עדיין אין הרשאה להעלות תמונה/),
            ).toBeInTheDocument()
            expect(screen.queryByText(/התמונה החדשה/)).not.toBeInTheDocument()
            expect(bioWrites(fake)).toHaveLength(0)

            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            await screen.findByText("מלמדת בחיפה!")
            expect(bioWrites(fake)).toEqual([
                expect.objectContaining({ body: { about: "מלמדת בחיפה!" } }),
            ])
            expect(fake.files.uploads).toHaveLength(1)
        })

        it("removes the uploaded photo if the server refused the bio write", async () => {
            const { user, fake } = setup()
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await pickPhoto()
            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )
            await screen.findByText(/התמונה החדשה/)
            fake.failTable("public_bio", "boom")
            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            expect(
                await screen.findByText("שמירת הפרופיל נכשלה, נסו שוב"),
            ).toBeInTheDocument()
            await waitFor(() =>
                expect(fake.files.removals).toEqual([
                    [`${user.id}/${NOW.getTime()}.jpg`],
                ]),
            )
            expect(fake.files.objects.size).toBe(0)
        })

        it("keeps the uploaded photo when the bio write got no answer (it may have been stored)", async () => {
            const { user, fake } = setup()
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await pickPhoto()
            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )
            await screen.findByText(/התמונה החדשה/)
            fake.failTable("public_bio", "Failed to fetch", { network: true })
            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            expect(
                await screen.findByText("שמירת הפרופיל נכשלה, נסו שוב"),
            ).toBeInTheDocument()
            expect(fake.files.removals).toEqual([])
            expect([...fake.files.objects.keys()]).toEqual([
                `${user.id}/${NOW.getTime()}.jpg`,
            ])
        })

        it("takes a HEIC (no type, as Chrome gives one): crops and uploads it as prepared", async () => {
            const { user, fake } = setup()
            const jpeg = new Blob([new Uint8Array(900_000)], {
                type: "image/jpeg",
            })
            fake.images.convert = () => jpeg
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            expect(screen.getByLabelText("העלאת תמונה")).toHaveAttribute(
                "accept",
                "image/*,.heic,.heif",
            )
            const file = await pickPhoto("IMG_0001.HEIC", "")
            await screen.findByTestId("cropper")
            expect(fake.images.prepared).toEqual([{ file, output: jpeg }])

            await userEvent.click(
                await screen.findByRole("button", { name: "שמירה" }),
            )
            await waitFor(() => expect(fake.images.renders).toHaveLength(1))
            expect(fake.images.renders[0].image).toBe(jpeg)
            await userEvent.click(
                screen.getByRole("button", { name: "שמירת שינויים" }),
            )
            await screen.findByRole("heading", { name: "דנה" })
            expect(fake.files.uploads).toEqual([
                expect.objectContaining({
                    file: fake.images.renders[0].output,
                    contentType: "image/jpg",
                }),
            ])
            expect(liveObjectUrls.size).toBe(0)
        })

        it("says so when the photo can't be opened, and can't save it", async () => {
            const { user, fake } = setup()
            fake.images.failPrepare()
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await pickPhoto("IMG_0001.heic", "image/heic")
            expect(
                await screen.findByText(
                    "לא הצלחנו לפתוח את התמונה, נסו תמונה אחרת",
                ),
            ).toBeInTheDocument()
            expect(screen.queryByTestId("cropper")).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: "שמירה" })).toBeDisabled()
            expect(fake.images.renders).toHaveLength(0)
        })

        it("cancelling the crop keeps the saved photo and lets the image go", async () => {
            const { user, fake } = setup()
            renderApp({ fake, signedInAs: user, path: "/bio", now: NOW })
            await openEditor()
            await pickPhoto()
            await screen.findByRole("dialog", { name: "חיתוך תמונה" })
            await userEvent.click(screen.getByRole("button", { name: "ביטול" }))
            await waitFor(() =>
                expect(
                    screen.queryByRole("dialog", { name: "חיתוך תמונה" }),
                ).not.toBeInTheDocument(),
            )
            expect(fake.images.renders).toHaveLength(0)
            expect(liveObjectUrls.size).toBe(0)
            expect(
                screen.getByRole("img", { name: "תמונת פרופיל" }),
            ).toHaveAttribute(
                "src",
                expect.stringContaining(`${user.id}/1.png`),
            )
        })
    })
})
