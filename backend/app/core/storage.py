import os
import uuid
import base64
import httpx
from fastapi import UploadFile, HTTPException, status

# Tipos de imagen permitidos
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")

# Directorio local donde se guardarán las imágenes
LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads")

# Configuración ImgBB
IMGBB_API_KEY = os.getenv("IMGBB_API_KEY", "")
IMGBB_API_URL = "https://api.imgbb.com/1/upload"


def _validate_image(file: UploadFile, content: bytes):
    """Valida tipo MIME y tamaño del archivo."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de archivo no permitido: '{file.content_type}'. Solo se aceptan: jpeg, png, webp."
        )
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo supera el límite de 5 MB."
        )


def _get_extension(content_type: str) -> str:
    """Retorna la extensión correcta según el content type."""
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    return mapping.get(content_type, ".jpg")


def _upload_local(file: UploadFile, content: bytes) -> str:
    """Guarda el archivo en disco local y retorna la URL relativa."""
    os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)

    ext = _get_extension(file.content_type)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(LOCAL_UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return f"/static/uploads/{filename}"


def _upload_imgbb(file: UploadFile, content: bytes) -> str:
    """
    Sube la imagen a ImgBB (gratuito, sin almacenamiento en el backend).
    Retorna la URL directa de la imagen.
    """
    if not IMGBB_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="IMGBB_API_KEY no configurada. Obtén una gratis en https://api.imgbb.com/"
        )

    # Codificar la imagen en base64
    img_base64 = base64.b64encode(content).decode("utf-8")

    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                IMGBB_API_URL,
                data={
                    "key": IMGBB_API_KEY,
                    "image": img_base64,
                },
            )
            data = response.json()

            if not data.get("success"):
                error_msg = data.get("error", {}).get("message", "Error desconocido de ImgBB")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Error al subir imagen a ImgBB: {error_msg}"
                )

            # Extraer la URL directa de la imagen
            url_directa = data["data"]["url"]
            return url_directa

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error de conexión con ImgBB: {str(e)}"
        )


async def upload_image(file: UploadFile) -> str:
    """
    Punto de entrada principal. Valida el archivo y lo sube según
    la variable de entorno STORAGE_BACKEND ('local' o 'imgbb').
    Retorna la URL final donde quedó guardada la imagen.
    Con 'imgbb' la imagen nunca toca el disco del backend.
    """
    content = await file.read()
    _validate_image(file, content)

    if STORAGE_BACKEND == "imgbb":
        return _upload_imgbb(file, content)
    else:
        return _upload_local(file, content)