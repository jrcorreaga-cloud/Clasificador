from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class GeneroPermitido(str, Enum):
    solo_hombres = 'solo hombres'
    solo_mujeres = 'solo mujeres'
    mixto = 'mixto'


class RepublicaBase(BaseModel):
    nombre_republica: str = Field(..., max_length=100, description="Nombre de la república", example="República das Flores")
    direccion: str = Field(..., max_length=255, description="Dirección completa de la república", example="Rua das Pedras, 42 - Centro, Ouro Preto - MG")
    precio: float = Field(..., gt=0, description="Precio mensual del alquiler en BRL", example=850.00)
    num_habitaciones: int = Field(..., gt=0, description="Número total de habitaciones disponibles", example=4)
    genero_permitido: GeneroPermitido = Field(..., description="Género de inquilinos permitido en la república")
    foto_url: Optional[str] = Field(None, description="URL de la foto principal de la república (se actualiza vía POST /{id}/foto)", example="https://bucket.s3.amazonaws.com/republicas/abc123.jpg")
    descripcion: Optional[str] = Field(None, description="Descripción libre de la república, comodidades e información adicional", example="República con piscina, churrasqueira y área de estudio compartida. Muy cerca del campus.")


class RepublicaCreate(RepublicaBase):
    pass


class RepublicaUpdate(BaseModel):
    nombre_republica: Optional[str] = Field(None, max_length=100, description="Nuevo nombre de la república")
    direccion: Optional[str] = Field(None, max_length=255, description="Nueva dirección")
    precio: Optional[float] = Field(None, gt=0, description="Nuevo precio mensual en BRL")
    num_habitaciones: Optional[int] = Field(None, gt=0, description="Nuevo número de habitaciones")
    genero_permitido: Optional[GeneroPermitido] = Field(None, description="Nuevo género permitido")
    foto_url: Optional[str] = Field(None, description="URL directa de foto (preferir usar el endpoint POST /{id}/foto)")
    descripcion: Optional[str] = Field(None, description="Nueva descripción de la república")


class RepublicaResponse(RepublicaBase):
    id_republica: int = Field(..., description="ID único de la república")
    id_duenho: int = Field(..., description="ID del usuario dueño de la república")
    fecha_creacion: datetime = Field(..., description="Fecha y hora de registro de la república")

    class Config:
        from_attributes = True

