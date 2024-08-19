import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

interface Cloudinary {
  clearImage: (url: string) => void;
  createUploadWidget: (
    options: {
      cloud_name: string;
      upload_preset?: string;
      api_key?: string;
      api_secret?: string;
      max_file_size?: number;
      client_allowed_formats?: string[];
      eager?: Array<{
        width: number;
        height: number;
        crop: string;
        gravity: string;
      }>;
      eager_async?: boolean;
    },
    callback: (error: any, result: any) => void
  ) => void;
}

interface ICloudinaryUploadProps {
  uploadNewImage: (url: string) => void;
  clearImage: () => void;
}
export default function CloudinaryUpload({
  uploadNewImage,
  clearImage,
}: ICloudinaryUploadProps) {
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
          max_file_size: 10042880, // 10MB limit
          client_allowed_formats: ["image"],
          // eager: [{ width: 250, height: 250, crop: "fill", gravity: "auto" }],
          // eager_async: true,
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

  return (
    <article className="cloudinary-upload-btns">
      <button
        className="cloudinary-upload-btn"
        onClick={() => widgetRef.current.open()}
      >
        <Icon icon="addBox" />
        העלאת תמונה
      </button>
      <button className="cloudinary-upload-btn" onClick={() => clearImage()}>
        <Icon icon="deleteIcon" />
        מחיקת תמונה
      </button>
    </article>
  );
}
