import os
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
from ..config import settings

def validate_and_save_upload(file: UploadFile) -> Tuple[str, str, str]:
    """
    Validates uploaded land document image:
    1. Generates unique UUID document_id
    2. Validates file extension
    3. Validates file size
    4. Validates image readability via PIL
    5. Saves original file to uploads/{document_id}_original.jpg
    Returns: (document_id, original_filename, saved_file_path)
    """
    document_id = str(uuid.uuid4())
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename provided")
        
    ext = file.filename.split(".")[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
        
    filename = f"{document_id}_original.{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save file contents
    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")
        
    # Validate file size
    file_size_mb = os.path.getsize(target_path) / (1024 * 1024)
    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(
            status_code=413, 
            detail=f"File size ({file_size_mb:.1f}MB) exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB"
        )
        
    # Validate image integrity with PIL
    try:
        with Image.open(target_path) as img:
            img.verify()
    except Exception:
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=400, detail="Uploaded file is corrupted or not a valid image")
        
    return document_id, file.filename, target_path
