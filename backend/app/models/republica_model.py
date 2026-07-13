from sqlalchemy import Column, Integer, String, Numeric, Enum, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Republica(Base):
    __tablename__ = "republica"

    id_republica = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_duenho = Column(Integer, ForeignKey("usuario.id_usuario"), unique=True, nullable=False)
    nombre_republica = Column(String(100), nullable=False)
    direccion = Column(String(255), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False, index=True)
    num_habitaciones = Column(Integer, nullable=False, index=True)
    genero_permitido = Column(Enum('solo hombres', 'solo mujeres', 'mixto', name='genero_enum'), nullable=False, index=True)
    foto_url = Column(String(255), nullable=True)
    descripcion = Column(Text, nullable=True)
    latitud = Column(Numeric(10, 8), nullable=True)
    longitud = Column(Numeric(11, 8), nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.current_timestamp())

    # Relación con usuario (dueño)
    duenho = relationship("Usuario")

    # Relación con fotos
    fotos = relationship("RepublicaFoto", back_populates="republica", cascade="all, delete-orphan")
