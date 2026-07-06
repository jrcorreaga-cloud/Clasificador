from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class RolUsuario(str, Enum):
    duenho = "dueño"
    buscador = "buscador"

class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre completo del usuario")
    correo: EmailStr = Field(..., description="Correo electrónico válido")
    telefono: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$", description="Teléfono formato E.164")
    rol: RolUsuario = Field(..., description="Rol del usuario (dueño o buscador)")

class UsuarioCreate(UsuarioBase):
    contrasenia: str = Field(..., min_length=8, description="Contraseña segura (mínimo 8 caracteres)")

class UsuarioResponse(UsuarioBase):
    id_usuario: int = Field(..., description="ID único del usuario")
    fecha_registro: datetime = Field(..., description="Fecha de registro")

    class Config:
        from_attributes = True
