from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ResenaBase(BaseModel):
    calificacion: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    comentario: Optional[str] = Field(None, max_length=1000, description="Comentario opcional sobre la república")


class ResenaCreate(ResenaBase):
    pass


class ResenaUpdate(BaseModel):
    calificacion: Optional[int] = Field(None, ge=1, le=5)
    comentario: Optional[str] = Field(None, max_length=1000)


class ResenaResponse(ResenaBase):
    id_resena: int
    id_republica: int
    id_usuario: int
    fecha_creacion: datetime
    nombre_usuario: Optional[str] = None

    class Config:
        from_attributes = True


class ResenaListResponse(BaseModel):
    resenas: List[ResenaResponse]
    promedio: Optional[float] = None
    total: int