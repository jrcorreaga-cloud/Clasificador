import os
import uuid
from fastapi import UploadFile, HTTPException, status

# Tipos de imagen permitidos
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")

# Directorio local donde se guardarán las imágenes
LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads")


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


def _upload_s3(file: UploadFile, content: bytes) -> str:
    """Sube el archivo a Amazon S3 y retorna la URL pública."""
    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="boto3 no está instalado. Agrega 'boto3' a requirements.txt."
        )

    bucket = os.getenv("AWS_S3_BUCKET")
    region = os.getenv("AWS_REGION", "us-east-1")

    if not bucket:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Variable de entorno AWS_S3_BUCKET no configurada."
        )

    ext = _get_extension(file.content_type)
    filename = f"republicas/{uuid.uuid4().hex}{ext}"

    try:
        s3 = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        s3.put_object(
            Bucket=bucket,
            Key=filename,
            Body=content,
            ContentType=file.content_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al subir imagen a S3: {str(e)}"
        )

    return f"https://{bucket}.s3.{region}.amazonaws.com/{filename}"


async def upload_image(file: UploadFile) -> str:
    """
    Punto de entrada principal. Valida el archivo y lo sube según
    la variable de entorno STORAGE_BACKEND ('local' o 's3').
    Retorna la URL final donde quedó guardada la imagen.
    """
    content = await file.read()
    _validate_image(file, content)

    if STORAGE_BACKEND == "s3":
        return _upload_s3(file, content)
    else:
        return _upload_local(file, content)
