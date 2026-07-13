from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Resena(Base):
    __tablename__ = "resena"

    id_resena = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_republica = Column(Integer, ForeignKey("republica.id_republica"), nullable=False, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    calificacion = Column(Integer, nullable=False)  # 1-5 stars
    comentario = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.current_timestamp())

    # Relaciones
    republica = relationship("Republica", backref="resenas")
    usuario = relationship("Usuario")