from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from pydantic import ValidationError
from typing import Optional

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.usuario_model import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Usuario:
    try:
        # Usamos PyJWT para decodificar
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido, falta el 'sub'",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        # Error al decodificar o token expirado
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscamos en la DB
    user = db.query(Usuario).filter(Usuario.correo == correo).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario del token no encontrado")
        
    return user
