import httpx
import logging

logger = logging.getLogger(__name__)

async def get_coordinates(address: str):
    """
    Usa Nominatim API para obtener latitud y longitud.
    Añade el contexto de Ouro Preto, MG, Brasil para asegurar resultados precisos.
    """
    query = f"{address}, Ouro Preto, Minas Gerais, Brasil"
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "RepOP_Student_Housing_App/1.0"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            if data and len(data) > 0:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        logger.error(f"Error en geocoding: {e}")
    
    # Valores por defecto en el centro de Ouro Preto si falla
    return -20.385574, -43.503578
