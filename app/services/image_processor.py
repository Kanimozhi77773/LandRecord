import os
import cv2
import numpy as np
from PIL import Image, ImageOps
from ..config import settings

class ImageProcessor:
    @staticmethod
    def enhance_document_image(arg1: str, arg2: str) -> str:
        """
        Conservative OpenCV image enhancement pipeline for degraded historical Tamil records.
        Handles either (original_path, document_id) or (document_id, original_path).
        """
        if os.path.exists(arg1):
            original_path = arg1
            document_id = arg2
        else:
            document_id = arg1
            original_path = arg2

        enhanced_filename = f"{document_id}_enhanced.jpg"
        enhanced_path = os.path.join(settings.PROCESSED_DIR, enhanced_filename)
        
        try:
            # 1. Orientation correction with PIL
            with Image.open(original_path) as pil_img:
                pil_img = ImageOps.exif_transpose(pil_img)
                # Convert PIL to OpenCV format (RGB -> BGR)
                cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

            # 2. Grayscale conversion
            if len(cv_img.shape) == 3:
                gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            else:
                gray = cv_img

            # 3. CLAHE Contrast Enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            clahe_img = clahe.apply(gray)

            # 4. Light Bilateral Denoising (cleans paper degradation while preserving sharp edges)
            denoised = cv2.bilateralFilter(clahe_img, d=5, sigmaColor=35, sigmaSpace=35)

            # 5. Subtle Unsharp Masking for crisp Tamil character loops
            gaussian = cv2.GaussianBlur(denoised, (0, 0), 2.0)
            sharpened = cv2.addWeighted(denoised, 1.3, gaussian, -0.3, 0)

            # 6. Conservative Deskewing
            angle = ImageProcessor._compute_skew_angle(sharpened)
            if abs(angle) > 0.4 and abs(angle) < 15.0:
                (h, w) = sharpened.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                final_img = cv2.warpAffine(
                    sharpened, M, (w, h), 
                    flags=cv2.INTER_CUBIC, 
                    borderMode=cv2.BORDER_REPLICATE
                )
            else:
                final_img = sharpened

            # 7. Write enhanced JPEG
            cv2.imwrite(enhanced_path, final_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            return enhanced_path

        except Exception as e:
            # If OpenCV fails, copy original as safe fallback
            print(f"Warning: Image enhancement failed ({str(e)}), falling back to original image.")
            with Image.open(original_path) as img:
                img.save(enhanced_path, "JPEG", quality=90)
            return enhanced_path

    @staticmethod
    def _compute_skew_angle(image: np.ndarray) -> float:
        """
        Estimates skew angle of text lines using Hough Line Transform or MinAreaRect.
        """
        try:
            # Threshold to find text lines
            _, thresh = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            coords = np.column_stack(np.where(thresh > 0))
            if len(coords) < 50:
                return 0.0
                
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            else:
                angle = -angle
                
            return angle
        except Exception:
            return 0.0
