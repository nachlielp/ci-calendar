// import Modal from "antd/es/modal"
import { observer } from "mobx-react-lite"
import { useCallback, useState } from "react"
import Cropper from "react-easy-crop"

const defaultImage = null
const defaultCrop = { x: 0, y: 0 }
const defaultRotation = 0
const defaultZoom = 1
const defaultCroppedAreaPixels = null

const UploadImageButton = ({
    onImageSave,
}: {
    onImageSave: (event: any, image: Blob) => void
}) => {
    const [open, setOpen] = useState(false)
    const [image, setImage] = useState<string | null>(defaultImage)
    const [crop, setCrop] = useState(defaultCrop)
    const [rotation, setRotation] = useState(defaultRotation)
    const [zoom, setZoom] = useState(defaultZoom)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(
        defaultCroppedAreaPixels
    )
    console.log("open", open)

    const onCropComplete = useCallback(
        (_croppedArea: any, croppedAreaPixels: any) => {
            setCroppedAreaPixels(croppedAreaPixels)
        },
        []
    )

    const getProcessedImage = async () => {
        if (image && croppedAreaPixels) {
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels,
                rotation
            )

            const targetSize = 250 // Fixed size for width and height
            let quality = 0.8

            // Create a fixed size canvas
            const canvas = document.createElement("canvas")
            canvas.width = targetSize
            canvas.height = targetSize

            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("No 2d context")

            const img = await createImage(croppedImage.url)

            // Draw image at fixed size
            ctx.drawImage(img, 0, 0, targetSize, targetSize)

            // Convert to blob with compression
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob(
                    (blob) => (blob ? resolve(blob) : null),
                    "image/jpeg",
                    quality
                )
            })

            const imageFile = new File([blob], `img-${Date.now()}.jpg`, {
                type: "image/jpeg",
            })
            return imageFile
        }
    }

    const resetStates = () => {
        setImage(defaultImage)
        setCrop(defaultCrop)
        setRotation(defaultRotation)
        setZoom(defaultZoom)
        setCroppedAreaPixels(defaultCroppedAreaPixels)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const file = e.target.files?.[0]
        if (!file) return

        try {
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.result) {
                    // Add a small delay before opening the modal
                    setTimeout(() => {
                        setImage(reader.result as string)
                        setOpen(true)
                    }, 100)
                }
            }
            reader.readAsDataURL(file)

            // Reset the input value to ensure it triggers on selecting the same file again
            e.target.value = ""
        } catch (error) {
            console.error("Error reading file:", error)
        }
    }

    const handleSave = async (event: any) => {
        event.preventDefault()
        event.stopPropagation()
        const processedImage = await getProcessedImage()
        if (processedImage) {
            if (onImageSave) {
                onImageSave(event, processedImage)
            } else {
                // Default handling if no onImageSave prop is provided
                // You could save it locally, trigger a download, etc.
                const imageUrl = URL.createObjectURL(processedImage)
                const link = document.createElement("a")
                link.href = imageUrl
                link.download = processedImage.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(imageUrl)
            }
        }
        setOpen(false)
        resetStates()
    }

    const handleCancel = () => {
        setOpen(false)
        resetStates()
    }
    return (
        <>
            <article className="upload-image-button">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    id="imageInput"
                    style={{ display: "none" }}
                />
                <label htmlFor="imageInput" className="upload-button">
                    העלאת תמונה
                </label>
            </article>

            {/* <Modal
                open={open}
                onCancel={handleCancel}
                footer={null}
                maskClosable={false} // Prevent closing when clicking outside
                keyboard={false}
            > */}
            <section className="upload-image-button">
                <div className="cropper-container">
                    {image && (
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                        />
                    )}
                </div>

                <div className="slider-controls">
                    <div className="control-group">
                        <div className="control-buttons">
                            <span>Zoom</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                    </div>
                </div>

                <footer>
                    <button
                        key="cancel"
                        onClick={handleCancel}
                        className="modal-button cancel"
                    >
                        ביטול
                    </button>
                    <button
                        key="save"
                        className="modal-button save"
                        onClick={handleSave}
                    >
                        שמירה
                    </button>
                </footer>
            </section>
            {/* </Modal> */}
        </>
    )
}

export default observer(UploadImageButton)

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener("load", () => resolve(image))
        image.addEventListener("error", (error) => reject(error))
        image.src = url
    })

const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180
    const absRotRad = Math.abs(rotRad)
    const newWidth =
        Math.abs(width * Math.cos(absRotRad)) +
        Math.abs(height * Math.sin(absRotRad))
    const newHeight =
        Math.abs(width * Math.sin(absRotRad)) +
        Math.abs(height * Math.cos(absRotRad))
    return { width: newWidth, height: newHeight }
}

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { width: number; height: number; x: number; y: number },
    rotation = 0
): Promise<{ file: Blob; url: string }> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
        throw new Error("No 2d context")
    }

    // Calculate bounding box of the rotated image
    const rotRad = (rotation * Math.PI) / 180
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // Translate canvas context to center of canvas
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.translate(-image.width / 2, -image.height / 2)

    // Draw the rotated image
    ctx.drawImage(image, 0, 0)

    // Extract the cropped region
    const croppedCanvas = document.createElement("canvas")
    const croppedCtx = croppedCanvas.getContext("2d")

    if (!croppedCtx) {
        throw new Error("No 2d context")
    }

    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    // Convert canvas to blob
    return new Promise((resolve) => {
        croppedCanvas.toBlob((file) => {
            if (file) {
                resolve({
                    file,
                    url: URL.createObjectURL(file),
                })
            }
        }, "image/png")
    })
}
