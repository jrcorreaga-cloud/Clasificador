from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from app.core.database import Base

class Favorito(Base):
    __tablename__ = "favorito"

    id_favorito = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_republica = Column(Integer, ForeignKey("republica.id_republica"), nullable=False)
    fecha_agregado = Column(DateTime, server_default=func.current_timestamp())