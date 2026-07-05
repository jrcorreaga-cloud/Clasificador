from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class GeneroPermitido(str, Enum):
    solo_hombres = 'solo hombres'
    solo_mujeres = 'solo mujeres'
    mixto = 'mixto'

class RepublicaBase(BaseModel):
    nombre_republica: str = Field(..., max_length=100)
    direccion: str = Field(..., max_length=255)
    precio: float = Field(..., gt=0)
    num_habitaciones: int = Field(..., gt=0)
    genero_permitido: GeneroPermitido
    foto_url: Optional[str] = None
    descripcion: Optional[str] = None

class RepublicaCreate(RepublicaBase):
    pass

class RepublicaUpdate(BaseModel):
    nombre_republica: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=255)
    precio: Optional[float] = Field(None, gt=0)
    num_habitaciones: Optional[int] = Field(None, gt=0)
    genero_permitido: Optional[GeneroPermitido] = None
    foto_url: Optional[str] = None
    descripcion: Optional[str] = None

class RepublicaResponse(RepublicaBase):
    id_republica: int
    id_duenho: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True
