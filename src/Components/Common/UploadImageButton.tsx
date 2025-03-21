import { observer } from "mobx-react-lite"
import { useCallback, useEffect, useState, useRef } from "react"
import Cropper from "react-easy-crop"
import '../../styles/upload-image-button.scss'
import Modal from "antd/es/modal"
const MAX_FILE_SIZE = 30 * 1024 // 30KB in bytes

const defaultImage = null
const defaultCrop = { x: 0, y: 0 }
const defaultRotation = 0
const defaultZoom = 1
const defaultCroppedAreaPixels = null

const STORAGE_KEY = "upload-image-temp"
const MAX_STORAGE_TIME = 1000 * 60 * 5 // 5 minutes

// Add these helper functions
const saveToStorage = (imageData: string) => {
    try {
        const storageItem = {
            timestamp: Date.now(),
            imageData,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageItem))
    } catch (error) {
        console.error("Error saving to storage:", error)
    }
}

const getFromStorage = (): string | null => {
    try {
        const item = localStorage.getItem(STORAGE_KEY)
        if (!item) return null

        const { timestamp, imageData } = JSON.parse(item)

        // Check if the stored data is still valid (less than MAX_STORAGE_TIME old)
        if (Date.now() - timestamp > MAX_STORAGE_TIME) {
            localStorage.removeItem(STORAGE_KEY)
            return null
        }

        return imageData
    } catch (error) {
        console.error("Error reading from storage:", error)
        return null
    }
}

const clearStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
        console.error("Error clearing storage:", error)
    }
}

const UploadImageButton = observer(
    ({ onImageSave }: { onImageSave: (image: Blob) => void }) => {
        const [open, setOpen] = useState(false)
        const [image, setImage] = useState<string | null>(defaultImage)
        const [crop, setCrop] = useState(defaultCrop)
        const [rotation, setRotation] = useState(defaultRotation)
        const [zoom, setZoom] = useState(defaultZoom)
        const [croppedAreaPixels, setCroppedAreaPixels] = useState(
            defaultCroppedAreaPixels
        )
        const mounted = useRef(true)

        useEffect(() => {
            const storedImage = getFromStorage()
            if (storedImage) {
                safeSetState(setImage, storedImage)
                safeSetState(setOpen, true)
            }

            return () => {
                mounted.current = false
            }
        }, [])

        const safeSetState = (setter: Function, value: any) => {
            if (mounted.current) {
                setter(value)
            }
        }

        useEffect(() => {
            console.log(
                "Image state changed:",
                image?.slice(0, 50),
                "... length:",
                image?.length
            )
        }, [image])

        useEffect(() => {
            console.log(
                "Modal open state changed:",
                open,
                "at:",
                new Date().toISOString()
            )
        }, [open])

        const onCropComplete = useCallback(
            (_croppedArea: any, croppedAreaPixels: any) => {
                setCroppedAreaPixels(croppedAreaPixels)
            },
            []
        )

        const compressImage = async (file: Blob): Promise<Blob> => {
            return new Promise((resolve) => {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")
                const img = new Image()

                img.onload = () => {
                    // Start with original dimensions
                    let width = img.width
                    let height = img.height
                    let quality = 0.7 // Starting quality

                    // If either dimension is greater than 800, scale down proportionally
                    const MAX_DIMENSION = 800
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        const ratio = Math.min(
                            MAX_DIMENSION / width,
                            MAX_DIMENSION / height
                        )
                        width *= ratio
                        height *= ratio
                    }

                    canvas.width = width
                    canvas.height = height
                    ctx?.drawImage(img, 0, 0, width, height)

                    const compress = (q: number) => {
                        const compressedData = canvas.toDataURL("image/jpeg", q)
                        // Convert base64 to blob
                        fetch(compressedData)
                            .then((res) => res.blob())
                            .then((blob) => {
                                if (blob.size > MAX_FILE_SIZE && q > 0.1) {
                                    // If still too large, try with lower quality
                                    compress(q - 0.1)
                                } else {
                                    resolve(blob)
                                }
                            })
                    }

                    compress(quality)
                }

                img.src = URL.createObjectURL(file)
            })
        }

        const getProcessedImage = async () => {
            if (image && croppedAreaPixels) {
                const croppedImage = await getCroppedImg(
                    image,
                    croppedAreaPixels,
                    rotation
                )

                const compressedBlob = await compressImage(croppedImage.file)

                const imageFile = new File(
                    [compressedBlob],
                    `img-${Date.now()}.jpg`,
                    {
                        type: "image/jpg",
                    }
                )
                console.log(
                    "Compressed file size:",
                    imageFile.size / 1024,
                    "KB"
                )

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

        const handleFileChange = async (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            e.preventDefault()
            e.stopPropagation()

            const file = e.target.files?.[0]
            console.log("handleFileChange.file", file)
            if (!file) {
                console.error("No file selected")
                return
            }

            try {
                const reader = new FileReader()
                reader.addEventListener("loadend", function () {
                    console.log("FileReader loadend event triggered")

                    if (this.result) {
                        const imageUrl = this.result as string
                        console.log("Image loaded, length:", imageUrl.length)
                        saveToStorage(imageUrl)
                        // Use a Promise to ensure state updates are sequential
                        Promise.resolve()
                            .then(() => {
                                safeSetState(setImage, imageUrl)
                                return new Promise((resolve) =>
                                    setTimeout(resolve, 50)
                                )
                            })
                            .then(() => {
                                console.log("Attempting to open modal...")
                                safeSetState(setOpen, true)
                            })
                            .catch((error) => {
                                console.error("Error updating states:", error)
                            })
                    } else {
                        console.error("FileReader result is null")
                    }
                })

                reader.addEventListener("error", (error) => {
                    console.error("FileReader error:", error)
                })

                console.log("Starting to read file...")
                reader.readAsDataURL(file)
            } catch (error) {
                console.error("Error in handleFileChange:", error)
            }

            e.target.value = ""
        }

        const handleSave = async () => {
            const processedImage = await getProcessedImage()
            if (processedImage) {
                if (onImageSave) {
                    onImageSave(processedImage)
                } else {
                    console.error(
                        "UploadImageButton.handleSave.error: ",
                        "no onImageSave prop"
                    )
                }
            }
            setOpen(false)
            resetStates()
            clearStorage()
        }

        const handleCancel = () => {
            clearStorage()
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

                <Modal
                    open={open}
                    onCancel={() => {
                        console.log("Modal cancel triggered")
                        safeSetState(setOpen, false)
                    }}
                    footer={null}
                >
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
                                    onChange={(e) =>
                                        setZoom(Number(e.target.value))
                                    }
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
                </Modal>
            </>
        )
    }
)

export default UploadImageButton

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
