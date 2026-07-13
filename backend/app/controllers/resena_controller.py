from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.resena_model import Resena
from app.models.republica_model import Republica
from app.models.usuario_model import Usuario
from app.schemas.resena_schema import ResenaCreate, ResenaUpdate, ResenaResponse, ResenaListResponse

router = APIRouter(prefix="/republicas", tags=["Reseñas"])


@router.post(
    "/{republica_id}/resenas",
    response_model=ResenaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar una reseña a una república",
    description=(
        "Permite a un usuario con rol **buscador** agregar una reseña (calificación + comentario) "
        "a una república. Cada buscador solo puede dejar una reseña por república."
    ),
    responses={
        400: {"description": "Ya dejaste una reseña en esta república o calificación inválida"},
        403: {"description": "Solo los buscadores pueden dejar reseñas"},
        404: {"description": "República no encontrada"},
    },
)
def create_resena(
    republica_id: int,
    resena_in: ResenaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Verificar que la república existe
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()
    if not republica:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="República no encontrada"
        )

    # Solo buscadores pueden dejar reseñas
    if current_user.rol != "buscador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los usuarios con rol buscador pueden dejar reseñas"
        )

    # Verificar que el dueño no puede reseñar su propia república
    if republica.id_duenho == current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El dueño no puede dejar una reseña en su propia república"
        )

    # Verificar que el usuario no haya reseñado ya esta república
    existing_resena = db.query(Resena).filter(
        Resena.id_republica == republica_id,
        Resena.id_usuario == current_user.id_usuario
    ).first()
    if existing_resena:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya dejaste una reseña en esta república. Puedes editarla si deseas."
        )

    new_resena = Resena(
        id_republica=republica_id,
        id_usuario=current_user.id_usuario,
        calificacion=resena_in.calificacion,
        comentario=resena_in.comentario
    )

    db.add(new_resena)
    db.commit()
    db.refresh(new_resena)

    return _format_resena_response(new_resena, current_user.nombre)


@router.get(
    "/{republica_id}/resenas",
    response_model=ResenaListResponse,
    summary="Obtener reseñas de una república",
    description="Retorna todas las reseñas de una república con el promedio de calificaciones.",
    responses={
        404: {"description": "República no encontrada"},
    },
)
def get_resenas(
    republica_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[Usuario] = Depends(get_current_user)
):
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()
    if not republica:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="República no encontrada"
        )

    resenas = db.query(Resena).filter(Resena.id_republica == republica_id).order_by(Resena.fecha_creacion.desc()).all()

    # Calcular promedio
    if resenas:
        promedio = sum(r.calificacion for r in resenas) / len(resenas)
    else:
        promedio = None

    # Formatear respuesta con nombre de usuario
    resenas_response = []
    for r in resenas:
        user = db.query(Usuario).filter(Usuario.id_usuario == r.id_usuario).first()
        resenas_response.append(_format_resena_response(r, user.nombre if user else "Usuario"))

    return ResenaListResponse(
        resenas=resenas_response,
        promedio=round(promedio, 1) if promedio is not None else None,
        total=len(resenas)
    )


@router.put(
    "/{republica_id}/resenas/mi-resena",
    response_model=ResenaResponse,
    summary="Editar mi reseña de una república",
    description="Permite al buscador editar su propia reseña en una república.",
    responses={
        404: {"description": "Reseña no encontrada"},
    },
)
def update_mi_resena(
    republica_id: int,
    resena_in: ResenaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    resena = db.query(Resena).filter(
        Resena.id_republica == republica_id,
        Resena.id_usuario == current_user.id_usuario
    ).first()

    if not resena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes una reseña en esta república"
        )

    update_data = resena_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resena, field, value)

    db.commit()
    db.refresh(resena)

    return _format_resena_response(resena, current_user.nombre)


@router.delete(
    "/{republica_id}/resenas/mi-resena",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar mi reseña de una república",
    description="Permite al buscador eliminar su propia reseña.",
    responses={
        404: {"description": "Reseña no encontrada"},
    },
)
def delete_mi_resena(
    republica_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    resena = db.query(Resena).filter(
        Resena.id_republica == republica_id,
        Resena.id_usuario == current_user.id_usuario
    ).first()

    if not resena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes una reseña en esta república"
        )

    db.delete(resena)
    db.commit()
    return None


def _format_resena_response(resena: Resena, nombre_usuario: str) -> ResenaResponse:
    return ResenaResponse(
        id_resena=resena.id_resena,
        id_republica=resena.id_republica,
        id_usuario=resena.id_usuario,
        calificacion=resena.calificacion,
        comentario=resena.comentario,
        fecha_creacion=resena.fecha_creacion,
        nombre_usuario=nombre_usuario
    )