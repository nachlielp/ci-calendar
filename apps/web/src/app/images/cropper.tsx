import Cropper from "react-easy-crop"
import type { CropperProps } from "./images"

/**
 * react-easy-crop without the `<style>` tag it would inject (no inline
 * styles for the CSP to allow): its stylesheet comes with the bio page
 * (features/bio/BioPage.tsx), which is small enough not to need a file of
 * its own. Loaded through ./photoTools.ts only.
 */
export function PhotoCropper(props: CropperProps) {
    return <Cropper {...props} disableAutomaticStylesInjection />
}
