import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getRepublicas, getFavoritos, addFavorito, removeFavorito } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import RepublicaCard from '../components/RepublicaCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { useAuth } from '../contexts/AuthContext';

const RepublicaMap = lazy(() => import('../components/RepublicaMap'));

export default function DashboardView() {
    const { authUser } = useAuth();
    
    // Republica states
    const [republicas, setRepublicas] = useState([]);
    const [allRepublicas, setAllRepublicas] = useState([]);
    const [favoriteRepublicaIds, setFavoriteRepublicaIds] = useState([]);
    const [loadingRepublicas, setLoadingRepublicas] = useState(false);
    const [filters, setFilters] = useState({ minPrecio: "", maxPrecio: "", habitaciones: "", genero: "" });

    // Map & Pagination states
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [viewMode, setViewMode] = useState("list");
    const [userLocation, setUserLocation] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    useEffect(() => {
        if (authUser) {
            cargarRepublicas(1);
            loadFavoritos();
        }
    }, [authUser]);

    const loadFavoritos = async () => {
        try {
            const favs = await getFavoritos();
            setFavoriteRepublicaIds(favs.map(f => f.id_republica));
        } catch (e) {
            setFavoriteRepublicaIds([]);
        }
    };

    const toggleFavorite = async (rep) => {
        const repId = rep.id;
        const alreadyFavorite = favoriteRepublicaIds.includes(repId);
        try {
            if (alreadyFavorite) {
                await removeFavorito(repId);
                setFavoriteRepublicaIds((prev) => prev.filter((id) => id !== repId));
                setStatus({ type: "success", message: "República removida dos favoritos." });
            } else {
                await addFavorito(repId);
                setFavoriteRepublicaIds((prev) => [...prev, repId]);
                setStatus({ type: "success", message: "República adicionada aos favoritos." });
            }
        } catch (e) {
            setStatus({ type: "error", message: e.message });
        }
        
        // Limpiar mensaje tras 3 segundos
        setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    };

    const cargarRepublicas = async (pageNumber = 1, locationOverride = null) => {
        const isFirstPage = pageNumber === 1;
        if (isFirstPage) {
            setLoadingRepublicas(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const reqFilters = { page: pageNumber, limit: 10 };
            if (filters.minPrecio) reqFilters.minPrecio = Number(filters.minPrecio);
            if (filters.maxPrecio) reqFilters.maxPrecio = Number(filters.maxPrecio);
            if (filters.habitaciones) reqFilters.habitaciones = Number(filters.habitaciones);
            if (filters.genero) reqFilters.genero = filters.genero;

            const loc = locationOverride !== undefined ? locationOverride : userLocation;
            if (loc) {
                reqFilters.userLat = loc.lat;
                reqFilters.userLon = loc.lng;
            }

            const data = await getRepublicas(reqFilters);
            const items = data.items || data;
            const mapped = Republica.fromList(Array.isArray(items) ? items : []);
            
            if (isFirstPage) {
                setAllRepublicas(mapped);
                setRepublicas(mapped);
            } else {
                setAllRepublicas(prev => [...prev, ...mapped]);
                setRepublicas(prev => [...prev, ...mapped]);
            }
            
            const currentPage = data.page || 1;
            const pages = data.pages || 1;
            setPage(currentPage);
            setTotalPages(pages);
            setHasMore(currentPage < pages);
        } catch (e) {
            console.error("Error cargando repúblicas:", e);
        }
        
        setLoadingRepublicas(false);
        setLoadingMore(false);
    };

    const aplicarFiltros = async () => {
        setPage(1);
        cargarRepublicas(1);
    };

    const limpiarFiltros = () => {
        setFilters({ minPrecio: "", maxPrecio: "", habitaciones: "", genero: "" });
        setUserLocation(null);
        setPage(1);
        setTimeout(() => cargarRepublicas(1, null), 0);
    };

    const handleLocationToggle = () => {
        if (userLocation) {
            setUserLocation(null);
            setPage(1);
            cargarRepublicas(1, null);
        } else {
            if (!("geolocation" in navigator)) {
                setStatus({ type: "error", message: "Seu navegador não suporta geolocalização." });
                return;
            }
            setStatus({ type: "idle", message: "Obtendo sua localização..." });
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                    setPage(1);
                    setStatus({ type: "success", message: "📍 Ordenando por proximidade..." });
                    cargarRepublicas(1, loc);
                    setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
                },
                (err) => {
                    setStatus({ type: "error", message: "Não foi possível obter sua localização." });
                    setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    };

    return (
        <div className="dashboard-page">
            {status.message && (
                <div style={{ padding: '10px', background: status.type === 'error' ? '#f8d7da' : '#d4edda', color: status.type === 'error' ? '#721c24' : '#155724', textAlign: 'center', marginBottom: '1rem' }}>
                    {status.message}
                </div>
            )}

            {/* Buscador + Filtros */}
            <section className="dashboard-section" id="buscador-grid" aria-labelledby="buscador-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Buscar</span>
                    <h2 id="buscador-heading">Encontre a república ideal</h2>
                </div>

                <div className="filtros-grid" role="search" aria-label="Filtros de búsqueda">
                    <div className="filtro-item">
                        <label htmlFor="filtro-minPrecio">Preço mín.</label>
                        <input
                            id="filtro-minPrecio"
                            className="field__input"
                            type="number"
                            placeholder="R$ 0"
                            value={filters.minPrecio}
                            onChange={(e) => setFilters(f => ({ ...f, minPrecio: e.target.value }))}
                        />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-maxPrecio">Preço máx.</label>
                        <input
                            id="filtro-maxPrecio"
                            className="field__input"
                            type="number"
                            placeholder="R$ 5000"
                            value={filters.maxPrecio}
                            onChange={(e) => setFilters(f => ({ ...f, maxPrecio: e.target.value }))}
                        />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-habitaciones">Quartos mín.</label>
                        <input
                            id="filtro-habitaciones"
                            className="field__input"
                            type="number"
                            placeholder="1"
                            value={filters.habitaciones}
                            onChange={(e) => setFilters(f => ({ ...f, habitaciones: e.target.value }))}
                        />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-genero">Gênero</label>
                        <select
                            id="filtro-genero"
                            className="field__select"
                            value={filters.genero}
                            onChange={(e) => setFilters(f => ({ ...f, genero: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            <option value="solo hombres">Solo hombres</option>
                            <option value="solo mujeres">Solo mujeres</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </div>
                    <div className="filtro-actions">
                        <button className="btn btn--primary" onClick={aplicarFiltros} aria-label="Aplicar filtros">Filtrar</button>
                        <button className="btn" onClick={limpiarFiltros} aria-label="Limpiar filtros">Limpar</button>
                        <button 
                            className={`btn ${userLocation ? 'btn--active-location' : 'btn--secondary'}`} 
                            onClick={handleLocationToggle}
                        >
                            {userLocation ? '📍 Perto de mim ✓' : '📍 Perto de mim'}
                        </button>
                        <button className="btn btn--secondary" onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')}>
                            {viewMode === 'list' ? '🗺️ Ver Mapa' : '📄 Ver Lista'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Grid de repúblicas */}
            <section className="dashboard-section" aria-labelledby="resultados-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Resultados</span>
                    <h2 id="resultados-heading">{republicas.length} república{republicas.length !== 1 ? "s" : ""} encontrada{republicas.length !== 1 ? "s" : ""}</h2>
                </div>

                {loadingRepublicas && page === 1 ? (
                    <LoadingIndicator message="Buscando repúblicas..." />
                ) : republicas.length === 0 ? (
                    <div className="empty-state" role="status" aria-live="polite">
                        <p>Nenhuma república encontrada com esses filtros.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div className="republicas-grid" role="list" aria-label="Lista de repúblicas">
                                {republicas.map((rep) => (
                                    <RepublicaCard 
                                        key={rep.id} 
                                        rep={rep} 
                                        isFavorite={favoriteRepublicaIds.includes(rep.id)}
                                        toggleFavorite={toggleFavorite}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Suspense fallback={<LoadingIndicator message="Carregando mapa..." />}>
                                <RepublicaMap republicas={republicas} userLocation={userLocation} />
                            </Suspense>
                        )}

                        {hasMore && (
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <button 
                                    className="btn btn--primary" 
                                    onClick={() => cargarRepublicas(page + 1)}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Carregando...' : 'Carregar Mais'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
