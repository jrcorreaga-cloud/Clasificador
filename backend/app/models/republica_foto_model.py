from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class RepublicaFoto(Base):
    __tablename__ = "republica_foto"

    id_foto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_republica = Column(Integer, ForeignKey("republica.id_republica", ondelete="CASCADE"), nullable=False, index=True)
    categoria = Column(Enum('casa', 'sala', 'cuartos', 'cocina', 'patio', 'banhos', name='foto_categoria_enum'), nullable=False)
    foto_url = Column(String(255), nullable=False)
    fecha_subida = Column(DateTime, server_default=func.current_timestamp())

    republica = relationship("Republica", back_populates="fotos")
