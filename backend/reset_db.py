import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
# Import all models to ensure they are registered with Base metadata
from app.models.usuario_model import Usuario
from app.models.republica_model import Republica
from app.models.republica_foto_model import RepublicaFoto
from app.models.favorito_model import Favorito
from app.models.resena_model import Resena

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Database reset successfully.")
