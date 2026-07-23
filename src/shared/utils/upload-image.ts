import { UploadApiResponse } from "cloudinary";
import cloudinary from "../../config/cloudinary";

export async function uploadImage(
  buffer: Buffer,
  folder = "shopkb/products"
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          transformation: [
            {
              width: 1000,
              height: 1000,
              crop: "limit",
            },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result as UploadApiResponse);
        }
      )
      .end(buffer);
  });
}