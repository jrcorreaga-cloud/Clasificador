from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario_model import Usuario
from app.models.favorito_model import Favorito
from app.schemas.favorito_schema import FavoritoListResponse

router = APIRouter()


@router.get("/favoritos", response_model=FavoritoListResponse)
def list_favoritos(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna los IDs de las repúblicas favoritas del usuario autenticado."""
    favoritos = (
        db.query(Favorito)
        .filter(Favorito.id_usuario == current_user.id_usuario)
        .all()
    )
    ids = [f.id_republica for f in favoritos]
    return FavoritoListResponse(favoritos=ids)


@router.post("/favoritos/{republica_id}", status_code=status.HTTP_201_CREATED)
def add_favorito(
    republica_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Agrega una república a favoritos del usuario autenticado."""
    from app.models.republica_model import Republica

    # Verificar que la república existe
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()
    if not republica:
        raise HTTPException(status_code=404, detail="República no encontrada")

    # Verificar que no esté ya en favoritos
    existente = (
        db.query(Favorito)
        .filter(
            Favorito.id_usuario == current_user.id_usuario,
            Favorito.id_republica == republica_id,
        )
        .first()
    )
    if existente:
        raise HTTPException(status_code=409, detail="La república ya está en tus favoritos")

    favorito = Favorito(
        id_usuario=current_user.id_usuario,
        id_republica=republica_id,
    )
    db.add(favorito)
    db.commit()
    return {"message": "República agregada a favoritos", "id_republica": republica_id}


@router.delete("/favoritos/{republica_id}", status_code=status.HTTP_200_OK)
def remove_favorito(
    republica_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina una república de favoritos del usuario autenticado."""
    favorito = (
        db.query(Favorito)
        .filter(
            Favorito.id_usuario == current_user.id_usuario,
            Favorito.id_republica == republica_id,
        )
        .first()
    )
    if not favorito:
        raise HTTPException(status_code=404, detail="La república no está en tus favoritos")

    db.delete(favorito)
    db.commit()
    return {"message": "República eliminada de favoritos", "id_republica": republica_id}