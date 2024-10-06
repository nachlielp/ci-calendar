declare global {
  interface Window {
    cloudinary: any; // Use a more specific type if the Cloudinary type definitions are available
  }
}
