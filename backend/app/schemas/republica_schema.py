from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class GeneroPermitido(str, Enum):
    solo_hombres = 'solo hombres'
    solo_mujeres = 'solo mujeres'
    mixto = 'mixto'


class RepublicaBase(BaseModel):
    nombre_republica: str = Field(..., min_length=3, max_length=100, description="Nombre de la república", example="República das Flores")
    direccion: str = Field(..., min_length=3, max_length=255, description="Dirección completa de la república", example="Rua das Pedras, 42 - Centro, Ouro Preto - MG")
    precio: float = Field(..., gt=0, le=100000.00, description="Precio mensual del alquiler en BRL", example=850.00)
    num_habitaciones: int = Field(..., gt=0, le=50, description="Número total de habitaciones disponibles", example=4)
    genero_permitido: GeneroPermitido = Field(..., description="Género de inquilinos permitido en la república")
    foto_url: Optional[str] = Field(None, description="URL de la foto principal de la república (se actualiza vía POST /{id}/foto)", example="https://bucket.s3.amazonaws.com/republicas/abc123.jpg")
    descripcion: Optional[str] = Field(None, description="Descripción libre de la república, comodidades e información adicional", example="República con piscina, churrasqueira y área de estudio compartida. Muy cerca del campus.")
    latitud: Optional[float] = Field(None, description="Latitud (generada automáticamente por geocoding)", example=-20.385574)
    longitud: Optional[float] = Field(None, description="Longitud (generada automáticamente por geocoding)", example=-43.503578)


class RepublicaCreate(RepublicaBase):
    pass


class RepublicaUpdate(BaseModel):
    nombre_republica: Optional[str] = Field(None, min_length=3, max_length=100, description="Nuevo nombre de la república")
    direccion: Optional[str] = Field(None, min_length=3, max_length=255, description="Nueva dirección")
    precio: Optional[float] = Field(None, gt=0, le=100000.00, description="Nuevo precio mensual en BRL")
    num_habitaciones: Optional[int] = Field(None, gt=0, le=50, description="Nuevo número de habitaciones")
    genero_permitido: Optional[GeneroPermitido] = Field(None, description="Nuevo género permitido")
    foto_url: Optional[str] = Field(None, description="URL directa de foto (preferir usar el endpoint POST /{id}/foto)")
    descripcion: Optional[str] = Field(None, description="Nueva descripción de la república")


class RepublicaFotoResponse(BaseModel):
    id_foto: int
    id_republica: int
    categoria: str
    foto_url: str
    fecha_subida: datetime

    class Config:
        from_attributes = True

class RepublicaResponse(RepublicaBase):
    id_republica: int = Field(..., description="ID único de la república")
    id_duenho: int = Field(..., description="ID del usuario dueño de la república")
    fecha_creacion: datetime = Field(..., description="Fecha y hora de registro de la república")
    fotos: list[RepublicaFotoResponse] = Field(default=[], description="Lista de fotos categorizadas")

    class Config:
        from_attributes = True


from typing import List

class PaginatedRepublicaResponse(BaseModel):
    total: int = Field(..., description="Total de repúblicas que coinciden con los filtros")
    page: int = Field(..., description="Página actual")
    pages: int = Field(..., description="Total de páginas disponibles")
    limit: int = Field(..., description="Límite de resultados por página")
    items: List[RepublicaResponse] = Field(..., description="Lista de repúblicas en esta página")
