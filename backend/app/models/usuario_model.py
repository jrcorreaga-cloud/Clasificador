from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, nullable=False, index=True)
    contrasenia = Column(String(255), nullable=False)
    telefono = Column(String(20), nullable=True)
    rol = Column(Enum('dueño', 'buscador', name='rol_enum'), nullable=False)
    fecha_registro = Column(DateTime, server_default=func.current_timestamp())
