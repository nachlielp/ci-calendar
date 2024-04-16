import { Button } from "antd";
import { useEffect, useRef } from "react";

interface Cloudinary {
  createUploadWidget: (
    options: {
      cloud_name: string;
      upload_preset?: string;
      api_key?: string;
      api_secret?: string;
      max_file_size?: number;
      client_allowed_formats?: string[];
    },
    callback: (error: any, result: any) => void
  ) => void;
}

interface ICloudinaryUpload {
  uploadNewImage: (url: string) => void;
}
export default function CloudinaryUpload({
  uploadNewImage,
}: ICloudinaryUpload) {
  const cloudinaryRef = useRef<Cloudinary>();
  const widgetRef = useRef<any>();
  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;

    if (cloudinaryRef.current) {
      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        {
          cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
          upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
          api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
          api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
          max_file_size: 5242880, // 5MB limit
          client_allowed_formats: ["image"],
        },
        (error, result) => {
          if (error) {
            console.error("CloudinaryUpload.createUploadWidget.error: ", error);
            throw error;
          } else if (result && result.event === "success") {
            console.log("CloudinaryUpload.result: ", result.info.url);
            uploadNewImage(result.info.url);
          }
        }
      );
    }
  }, []);
  return <Button onClick={() => widgetRef.current.open()}>Upload</Button>;
}
