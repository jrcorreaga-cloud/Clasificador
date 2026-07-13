from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.storage import upload_image
from app.models.republica_model import Republica
from app.models.republica_foto_model import RepublicaFoto
from app.models.usuario_model import Usuario
from app.schemas.republica_schema import RepublicaCreate, RepublicaUpdate, RepublicaResponse, GeneroPermitido, PaginatedRepublicaResponse
from app.core.geocoding import get_coordinates
from sqlalchemy import func

router = APIRouter(prefix="/republicas", tags=["Repúblicas"])


@router.post(
    "/",
    response_model=RepublicaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una nueva república",
    description=(
        "Crea una república asociada al dueño autenticado. "
        "Cada dueño solo puede registrar una república. "
        "Requiere rol **dueño**."
    ),
    responses={
        400: {"description": "El dueño ya tiene una república registrada"},
        403: {"description": "El usuario no tiene rol de dueño"},
    },
)
async def create_republica(
    republica_in: RepublicaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Verificamos que solo los dueños puedan publicar
    if current_user.rol != 'dueño':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los dueños pueden registrar repúblicas"
        )

    # Validamos la regla de negocio: 1 dueño = 1 república
    existing_republica = db.query(Republica).filter(Republica.id_duenho == current_user.id_usuario).first()
    if existing_republica:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes una república registrada. Solo se permite promocionar una propiedad por dueño."
        )

    # Obtenemos coordenadas
    lat, lon = await get_coordinates(republica_in.direccion)

    republica_data = republica_in.model_dump(exclude={"latitud", "longitud"})

    new_republica = Republica(
        **republica_data,
        id_duenho=current_user.id_usuario,
        latitud=lat,
        longitud=lon
    )


    db.add(new_republica)
    db.commit()
    db.refresh(new_republica)

    return new_republica


@router.get(
    "/",
    response_model=PaginatedRepublicaResponse,
    summary="Listar repúblicas con filtros opcionales y paginación",
    description=(
        "Retorna repúblicas paginadas. "
        "Filtros: precio, habitaciones, género. "
        "Si se envía user_lat y user_lon, se ordenan por distancia ('cerca de mí')."
    ),
)
def get_republicas(
    min_precio: Optional[float] = Query(None, description="Precio mínimo en BRL"),
    max_precio: Optional[float] = Query(None, description="Precio máximo en BRL"),
    habitaciones: Optional[int] = Query(None, description="Cantidad mínima de habitaciones"),
    genero: Optional[GeneroPermitido] = Query(None, description="Género permitido"),
    user_lat: Optional[float] = Query(None, description="Latitud del buscador"),
    user_lon: Optional[float] = Query(None, description="Longitud del buscador"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=50, description="Resultados por página"),
    db: Session = Depends(get_db)
):
    # Query Builder dinámico (Senior approach)
    query = db.query(Republica)

    if min_precio is not None:
        query = query.filter(Republica.precio >= min_precio)
    if max_precio is not None:
        query = query.filter(Republica.precio <= max_precio)
    if habitaciones is not None:
        query = query.filter(Republica.num_habitaciones >= habitaciones)
    if genero is not None:
        query = query.filter(Republica.genero_permitido == genero)

    if user_lat is not None and user_lon is not None:
        # Ordenar por distancia euclidiana aproximada (ya que es solo una ciudad)
        # (lat1 - lat2)^2 + (lon1 - lon2)^2
        distancia = func.pow(Republica.latitud - user_lat, 2) + func.pow(Republica.longitud - user_lon, 2)
        query = query.order_by(distancia.asc())
    else:
        query = query.order_by(Republica.id_republica.desc())

    total = query.count()
    pages = (total + limit - 1) // limit
    offset = (page - 1) * limit

    items = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit,
        "items": items
    }


@router.get(
    "/me",
    response_model=RepublicaResponse,
    summary="Obtener la república del dueño autenticado"
)
def get_my_republica(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    rol_str = current_user.rol.value if hasattr(current_user.rol, 'value') else current_user.rol
    if rol_str != 'dueño':
        raise HTTPException(status_code=403, detail="Solo los dueños tienen repúblicas")
    
    republica = db.query(Republica).filter(Republica.id_duenho == current_user.id_usuario).first()
    if not republica:
        raise HTTPException(status_code=404, detail="No tienes una república registrada")
    return republica

@router.get(
    "/{republica_id}",
    response_model=RepublicaResponse,
    summary="Obtener una república por ID",
    responses={
        404: {"description": "República no encontrada"},
    },
)
def get_republica(republica_id: int, db: Session = Depends(get_db)):
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()
    if not republica:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="República no encontrada")
    return republica


@router.put(
    "/{republica_id}",
    response_model=RepublicaResponse,
    summary="Actualizar datos de una república",
    description="Permite al dueño de la república modificar sus datos. Solo el dueño propietario puede editar.",
    responses={
        403: {"description": "No tienes permisos para editar esta república"},
        404: {"description": "República no encontrada"},
    },
)
async def update_republica(
    republica_id: int,
    republica_in: RepublicaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()

    if not republica:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="República no encontrada")

    # Validamos que el dueño que edita es el verdadero dueño
    if republica.id_duenho != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar esta república"
        )

    update_data = republica_in.model_dump(exclude_unset=True)
    
    if "direccion" in update_data:
        lat, lon = await get_coordinates(update_data["direccion"])
        republica.latitud = lat
        republica.longitud = lon
    
    for field, value in update_data.items():
        setattr(republica, field, value)

    db.commit()
    db.refresh(republica)
    return republica


@router.delete(
    "/{republica_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una república",
    description="Elimina permanentemente una república. Solo el dueño propietario puede realizar esta acción.",
    responses={
        403: {"description": "No tienes permisos para eliminar esta república"},
        404: {"description": "República no encontrada"},
    },
)
def delete_republica(
    republica_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()

    if not republica:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="República no encontrada")

    # Seguridad: solo el dueño la borra
    if republica.id_duenho != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta república"
        )

    db.delete(republica)
    db.commit()
    return None


@router.post(
    "/{republica_id}/foto",
    response_model=RepublicaResponse,
    summary="Subir foto de una república",
    description=(
        "Sube una imagen para la república especificada y actualiza su `foto_url`. "
        "Formatos aceptados: **JPEG, PNG, WebP**. Tamaño máximo: **5 MB**. "
        "El destino de almacenamiento (local o S3) se controla con la variable de entorno `STORAGE_BACKEND`. "
        "Solo el dueño de la república puede subir la foto."
    ),
    responses={
        403: {"description": "No tienes permisos para subir foto a esta república"},
        404: {"description": "República no encontrada"},
        413: {"description": "El archivo supera el límite de 5 MB"},
        415: {"description": "Tipo de archivo no permitido (solo jpeg, png, webp)"},
    },
)
async def upload_republica_foto(
    republica_id: int,
    foto: UploadFile = File(..., description="Imagen de la república (jpeg, png o webp, máx. 5 MB)"),
    categoria: str = Form(..., description="Categoría de la foto (casa, sala, cuartos, cocina, patio, banhos)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    republica = db.query(Republica).filter(Republica.id_republica == republica_id).first()

    if not republica:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="República no encontrada")

    # Solo el dueño puede subir la foto
    if republica.id_duenho != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para subir foto a esta república"
        )

    valid_categorias = ['casa', 'sala', 'cuartos', 'cocina', 'patio', 'banhos']
    if categoria not in valid_categorias:
        raise HTTPException(status_code=400, detail=f"Categoría inválida. Debe ser una de: {', '.join(valid_categorias)}")

    # Subimos la imagen (valida tipo y tamaño internamente)
    foto_url = await upload_image(foto)

    # Buscar si ya existe una foto para esa categoría (opcional: reemplazarla o añadir nueva)
    # Aquí vamos a reemplazar si el usuario sube otra de la misma categoría para evitar acumulación infinita
    foto_existente = db.query(RepublicaFoto).filter(
        RepublicaFoto.id_republica == republica_id,
        RepublicaFoto.categoria == categoria
    ).first()

    if foto_existente:
        foto_existente.foto_url = foto_url
    else:
        nueva_foto = RepublicaFoto(
            id_republica=republica_id,
            categoria=categoria,
            foto_url=foto_url
        )
        db.add(nueva_foto)

    # Mantenemos foto_url para compatibilidad si la categoría es 'casa'
    if categoria == 'casa':
        republica.foto_url = foto_url

    db.commit()
    db.refresh(republica)

    return republica