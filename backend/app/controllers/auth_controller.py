# Auth controllers: Manejo real de JWT y registro de usuarios en DB.

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.usuario_model import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioResponse
from app.schemas.auth_schema import LoginRequest, LoginResponse

router = APIRouter()


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UsuarioCreate, db: Session = Depends(get_db)):
    # Evitamos duplicados, el correo es la llave para el login
    user_exists = db.query(Usuario).filter(Usuario.correo == user_in.correo).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado en el sistema")

    # Guardamos siempre el hash, nunca el plain text
    hashed_password = get_password_hash(user_in.contrasenia)
    
    new_user = Usuario(
        nombre=user_in.nombre,
        correo=user_in.correo,
        contrasenia=hashed_password,
        telefono=user_in.telefono,
        rol=user_in.rol
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Buscamos al usuario por correo
    user = db.query(Usuario).filter(Usuario.correo == payload.email).first()
    
    # Validamos password contra el hash
    if not user or not verify_password(payload.password, user.contrasenia):
        # 401 para evitar enumeración de usuarios
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales inválidas"
        )

    # JWT payload
    access_token = create_access_token(data={"sub": user.correo})

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id_usuario,
            "name": user.nombre,
            "email": user.correo,
            "role": user.rol,
        },
        message="Login exitoso"
    )

from fastapi.security import OAuth2PasswordRequestForm

@router.post("/swagger-login", summary="Login exclusivo para Swagger UI")
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Swagger envía el email en el campo "username"
    user = db.query(Usuario).filter(Usuario.correo == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.contrasenia):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales inválidas"
        )

    access_token = create_access_token(data={"sub": user.correo})
    
    # Swagger espera que se retorne exactamente access_token y token_type
    return {"access_token": access_token, "token_type": "bearer"}