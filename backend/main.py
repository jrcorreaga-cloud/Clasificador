import os
from typing import Optional
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.controllers.auth_controller import router as auth_router
from app.controllers.republica_controller import router as republica_router
from app.core.database import get_db, engine, Base
from app.models.usuario_model import Usuario
from app.models.republica_model import Republica
from app.models.republica_foto_model import RepublicaFoto

app = FastAPI(
    title="RepOP API",
    description=(
        "API RESTful para el sistema **RepOP** — buscador de repúblicas estudiantiles en Ouro Preto.\n\n"
        "## Funcionalidades\n"
        "- 🔐 **Autenticación** con JWT (registro e inicio de sesión)\n"
        "- 🏠 **Gestión de repúblicas** con filtros de búsqueda\n"
        "- 📸 **Subida de imágenes** con soporte local y Amazon S3\n\n"
        "## Autenticación\n"
        "Los endpoints protegidos requieren un token Bearer obtenido desde `POST /api/auth/login`.\n"
        "En Swagger, haz clic en **Authorize** e ingresa: `Bearer <tu_token>`."
    ),
    version="1.0.0",
    contact={
        "name": "Equipo RepOP",
    },
    openapi_tags=[
        {
            "name": "Auth",
            "description": "Registro de nuevos usuarios e inicio de sesión. Retorna el JWT necesario para los endpoints protegidos.",
        },
        {
            "name": "Repúblicas",
            "description": "Operaciones sobre repúblicas: listado, búsqueda, creación, edición, eliminación y subida de fotos.",
        },
        {
            "name": "Health",
            "description": "Endpoints de salud y verificación de conexión.",
        },
    ],
)

# Permitimos que nuestro amigo el frontend (React) nos hable sin que CORS nos bloquee la vida
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiar por localhost:5173 o dominio real
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servimos las imágenes subidas localmente desde /static/uploads/ solo si la carpeta existe
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
if os.path.exists(STATIC_DIR):
    app.mount("/static/uploads", StaticFiles(directory=STATIC_DIR), name="uploads")

# Conectamos nuestras rutas
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(republica_router, prefix="/api")

Base.metadata.create_all(bind=engine)


def require_status_header(x_api_key: Optional[str] = Header(None, alias="X-API-KEY")):
    if x_api_key != "demo-health-key":
        raise HTTPException(status_code=401, detail="X-API-KEY inválido")
    return x_api_key


@app.get("/api/status", tags=["Health"])
def read_status(api_key: str = Depends(require_status_header)):
    return {
        "status": "ok",
        "api": "RepOP",
        "message": "Backend conectado con frontend via header basico",
    }


@app.get("/", tags=["Health"])
def read_root():
    return {"status": "ok", "message": "API está encendida y lista para el login demo."}


@app.get("/api/check-db", tags=["Health"])
def check_db(db: Session = Depends(get_db)):
    try:
        # Intentamos contar los usuarios para verificar conexión
        count = db.query(Usuario).count()
        return {
            "status": "connected",
            "database": "republicas_db",
            "usuarios_registrados": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")
