import { useCallback, useEffect, useId, useRef, useState } from "react"
import type { CropperComponent } from "../../app/images/images"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { COMMON_COPY } from "../../lib/commonCopy"
import { defineCopy } from "../../lib/copy"
import { PHOTO_ACCEPT } from "../../lib/heic"
import { photoOutputSize, type PixelArea } from "../../lib/photo"
import { Dialog } from "../../ui/Dialog"
import { FormAlert } from "../../ui/form/fields"

// Legacy UploadImageButton and the profile form's photo: pick a photo,
// crop it square in a dialog (react-easy-crop, loaded only now), and keep
// the result, resized for upload, in memory as a Blob until the form is
// saved. Nothing about the photo is ever written to device storage
// (legacy kept the picked image there as base64, #23); previews are object
// URLs, revoked when no longer shown.

const COPY = defineCopy({
    he: {
        photo: "תמונת פרופיל",
        upload: "העלאת תמונה",
        pending: "התמונה החדשה תישמר בלחיצה על שמירת שינויים",
        crop: "חיתוך תמונה",
        zoom: "זום",
        cropperFailed: "לא הצלחנו לפתוח את חיתוך התמונה",
        preparing: "פותחים את התמונה…",
        openFailed: "לא הצלחנו לפתוח את התמונה, נסו תמונה אחרת",
        renderFailed: "לא הצלחנו לעבד את התמונה, נסו תמונה אחרת",
    },
    en: {
        photo: "Profile photo",
        upload: "Upload a photo",
        pending: "The new photo is saved when you save the changes",
        crop: "Crop the photo",
        zoom: "Zoom",
        cropperFailed: "We couldn't open the photo cropper",
        preparing: "Opening the photo…",
        openFailed: "We couldn't open the photo, try another one",
        renderFailed: "We couldn't process the photo, try another one",
    },
    ru: {
        photo: "Фото профиля",
        upload: "Загрузить фото",
        pending: "Новое фото сохранится вместе с изменениями",
        crop: "Обрезать фото",
        zoom: "Масштаб",
        cropperFailed: "Не удалось открыть обрезку фото",
        preparing: "Открываем фото…",
        openFailed: "Не удалось открыть фото, попробуйте другое",
        renderFailed: "Не удалось обработать фото, попробуйте другое",
    },
})

/** An object URL for `blob` while it is shown, revoked after. */
function useObjectUrl(blob: Blob | null): string | null {
    const [url, setUrl] = useState<{ blob: Blob; url: string } | null>(null)
    useEffect(() => {
        if (!blob) return
        const next = URL.createObjectURL(blob)
        setUrl({ blob, url: next })
        return () => URL.revokeObjectURL(next)
    }, [blob])
    return url && url.blob === blob ? url.url : null
}

/**
 * The photo shown (`photo`, the cropped one not saved yet, else the saved
 * `current` URL) and the button to pick another; a picked one opens the
 * crop dialog, whose result goes to `onPhoto`.
 */
export function PhotoField({
    current,
    photo,
    onPhoto,
    disabled,
}: {
    current: string
    photo: Blob | null
    onPhoto: (photo: Blob) => void
    disabled?: boolean
}) {
    const copy = useCopy(COPY)
    const id = useId()
    const [picked, setPicked] = useState<File | null>(null)
    const preview = useObjectUrl(photo)
    const src = photo ? preview : current

    return (
        <div className="photo-field">
            {src ? (
                <img
                    className="photo-field-img"
                    src={src}
                    alt={copy.photo}
                    width={250}
                    height={250}
                />
            ) : (
                <div className="photo-field-empty" />
            )}
            <input
                id={id}
                type="file"
                accept={PHOTO_ACCEPT}
                className="visually-hidden"
                disabled={disabled}
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    // The same file can be picked again after a cancel.
                    event.target.value = ""
                    if (file) setPicked(file)
                }}
            />
            <label htmlFor={id} className="upload-button">
                {copy.upload}
            </label>
            {photo && <p className="photo-field-note">{copy.pending}</p>}
            {picked && (
                <PhotoCropDialog
                    file={picked}
                    onCropped={(cropped) => {
                        setPicked(null)
                        onPhoto(cropped)
                    }}
                    onClose={() => setPicked(null)}
                />
            )}
        </div>
    )
}

/**
 * Legacy's crop modal: the photo in a square frame, a zoom slider, cancel
 * and save. Save draws the crop at its upload size (`photoOutputSize`).
 * The cropper shows the photo as `images.preparePhoto` gives it (a HEIC
 * the browser can't decode, converted to JPEG), and save draws that.
 */
function PhotoCropDialog({
    file,
    onCropped,
    onClose,
}: {
    file: File
    onCropped: (photo: Blob) => void
    onClose: () => void
}) {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const { images, telemetry } = useServices()
    const [Cropper, setCropper] = useState<CropperComponent | null>(null)
    const [loadFailed, setLoadFailed] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const [source, setSource] = useState<Blob | null>(null)
    const [openFailed, setOpenFailed] = useState(false)
    const image = useObjectUrl(source)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const area = useRef<PixelArea | null>(null)
    const [busy, setBusy] = useState(false)
    const [renderFailed, setRenderFailed] = useState(false)

    useEffect(() => {
        let live = true
        images.loadCropper().then(
            (component) => live && setCropper(() => component),
            (error: unknown) => {
                if (!live) return
                telemetry.captureError(error, { source: "bio-cropper" })
                setLoadFailed(true)
            },
        )
        return () => {
            live = false
        }
    }, [images, telemetry, attempt])

    useEffect(() => {
        let live = true
        images.preparePhoto(file).then(
            (prepared) => live && setSource(prepared),
            (error: unknown) => {
                if (!live) return
                telemetry.captureError(error, { source: "bio-photo-open" })
                setOpenFailed(true)
            },
        )
        return () => {
            live = false
        }
    }, [images, telemetry, file])

    const onCropComplete = useCallback(
        (_area: PixelArea, pixels: PixelArea) => {
            area.current = pixels
        },
        [],
    )

    async function save() {
        const chosen = area.current
        if (!chosen || !source || busy) return
        setBusy(true)
        setRenderFailed(false)
        try {
            onCropped(
                await images.renderPhoto(
                    source,
                    chosen,
                    photoOutputSize(chosen),
                ),
            )
        } catch (error) {
            telemetry.captureError(error, { source: "bio-photo" })
            setRenderFailed(true)
            setBusy(false)
        }
    }

    return (
        <Dialog label={copy.crop} onClose={onClose}>
            <section className="photo-crop">
                <div className="cropper-container">
                    {Cropper && image && (
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    )}
                    {!source && !openFailed && (
                        <p className="photo-crop-status" role="status">
                            {copy.preparing}
                        </p>
                    )}
                </div>
                {openFailed && (
                    <FormAlert kind="error">{copy.openFailed}</FormAlert>
                )}
                {loadFailed && (
                    <FormAlert kind="error">
                        {copy.cropperFailed}{" "}
                        <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                                setLoadFailed(false)
                                setAttempt((n) => n + 1)
                            }}
                        >
                            {common.retry}
                        </button>
                    </FormAlert>
                )}
                {renderFailed && (
                    <FormAlert kind="error">{copy.renderFailed}</FormAlert>
                )}
                <label className="photo-crop-zoom">
                    {copy.zoom}
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(event) =>
                            setZoom(Number(event.target.value))
                        }
                    />
                </label>
                <footer className="photo-crop-footer">
                    <button
                        type="button"
                        className="modal-button cancel"
                        onClick={onClose}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="modal-button save"
                        disabled={!Cropper || !source || busy}
                        aria-busy={busy || undefined}
                        onClick={() => void save()}
                    >
                        {common.save}
                    </button>
                </footer>
            </section>
        </Dialog>
    )
}
