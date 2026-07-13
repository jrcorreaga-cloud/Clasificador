from pydantic import BaseModel
from datetime import datetime

class FavoritoResponse(BaseModel):
    id_favorito: int
    id_usuario: int
    id_republica: int
    fecha_agregado: datetime

    class Config:
        from_attributes = True


class FavoritoListResponse(BaseModel):
    favoritos: list[int]