import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRepublicas, createRepublica, updateRepublica, deleteRepublica, uploadRepublicaFoto } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import RepublicaCard from '../components/RepublicaCard';
import LoadingIndicator from '../components/LoadingIndicator';
import RepublicaForm from '../components/RepublicaForm'; // We'll create this next

export default function DashboardView() {
    const { authUser } = useAuth();
    const location = useLocation();
    const esDuenho = authUser?.role === "dueño";

    const [republicas, setRepublicas] = useState([]);
    const [allRepublicas, setAllRepublicas] = useState([]);
    const [favoriteRepublicaIds, setFavoriteRepublicaIds] = useState([]);
    const [loadingRepublicas, setLoadingRepublicas] = useState(false);
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [filters, setFilters] = useState({ minPrecio: "", maxPrecio: "", habitaciones: "", genero: "" });

    // Dueño states
    const [showRepublicaForm, setShowRepublicaForm] = useState(false);
    const [editingRepublica, setEditingRepublica] = useState(null);

    // Cargar favoritos del localstorage
    useEffect(() => {
        const storageKey = `repop-favorites-${authUser?.id ?? "guest"}`;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setFavoriteRepublicaIds(JSON.parse(saved));
            } else {
                setFavoriteRepublicaIds([]);
            }
        } catch (e) {
            setFavoriteRepublicaIds([]);
        }
    }, [authUser?.id]);

    useEffect(() => {
        const storageKey = `repop-favorites-${authUser?.id ?? "guest"}`;
        try {
            localStorage.setItem(storageKey, JSON.stringify(favoriteRepublicaIds));
        } catch (e) {}
    }, [favoriteRepublicaIds, authUser?.id]);

    useEffect(() => {
        cargarRepublicas();
    }, []);

    // Desplazamiento por anclas en la URL (?section=favoritos)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const section = params.get('section');
        if (section) {
            const el = document.getElementById(section);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location]);

    const cargarRepublicas = async () => {
        setLoadingRepublicas(true);
        try {
            const data = await getRepublicas();
            const mapped = Republica.fromList(data);
            setAllRepublicas(mapped);
            setRepublicas(mapped);
        } catch (e) {
            // Fallback content...
            const fallbackData = [
                { id_republica: 1, nombre_republica: "República Horizonte", direccion: "Rua do Ouvidor, 123", precio: 850.00, num_habitaciones: 3, genero_permitido: "mixto", descripcion: "Próximo ao centro, ambiente tranquilo e regras claras para convivência." },
                { id_republica: 2, nombre_republica: "Casa das Ladeiras", direccion: "Rua dos Inconfidentes, 45", precio: 650.00, num_habitaciones: 2, genero_permitido: "solo mujeres", descripcion: "Quartos individuais, internet estável e perfil ideal para quem estuda à noite." },
                { id_republica: 3, nombre_republica: "Solar do Pilar", direccion: "Rua do Pilar, 789", precio: 720.00, num_habitaciones: 4, genero_permitido: "solo hombres", descripcion: "Espaço compartilhado com boa mobilidade e preferência para calouros." },
            ];
            const mappedFallback = Republica.fromList(fallbackData);
            setAllRepublicas(mappedFallback);
            setRepublicas(mappedFallback);
        }
        setLoadingRepublicas(false);
    };

    const aplicarFiltros = async () => {
        setLoadingRepublicas(true);
        try {
            const filtros = {};
            if (filters.minPrecio) filtros.minPrecio = Number(filters.minPrecio);
            if (filters.maxPrecio) filtros.maxPrecio = Number(filters.maxPrecio);
            if (filters.habitaciones) filtros.habitaciones = Number(filters.habitaciones);
            if (filters.genero) filtros.genero = filters.genero;
            const data = await getRepublicas(filtros);
            setRepublicas(Republica.fromList(data));
        } catch (e) {
            let filtradas = [...allRepublicas];
            if (filters.minPrecio) filtradas = filtradas.filter(r => r.precio >= Number(filters.minPrecio));
            if (filters.maxPrecio) filtradas = filtradas.filter(r => r.precio <= Number(filters.maxPrecio));
            if (filters.habitaciones) filtradas = filtradas.filter(r => r.habitaciones >= Number(filters.habitaciones));
            if (filters.genero) filtradas = filtradas.filter(r => r.genero === filters.genero);
            setRepublicas(filtradas);
        }
        setLoadingRepublicas(false);
    };

    const limpiarFiltros = () => {
        setFilters({ minPrecio: "", maxPrecio: "", habitaciones: "", genero: "" });
        setRepublicas(allRepublicas);
    };

    const toggleFavorite = (rep) => {
        const repId = rep.id;
        const alreadyFavorite = favoriteRepublicaIds.includes(repId);
        setFavoriteRepublicaIds((prev) => alreadyFavorite
            ? prev.filter((id) => id !== repId)
            : [...prev, repId]);
        setStatus({
            type: "success",
            message: alreadyFavorite ? "República removida dos favoritos." : "República adicionada aos favoritos.",
        });
    };

    const favoriteRepublicas = useMemo(() =>
        allRepublicas.filter((rep) => favoriteRepublicaIds.includes(rep.id)),
        [allRepublicas, favoriteRepublicaIds]
    );

    const handleDeleteRepublica = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar esta república?")) return;
        try {
            await deleteRepublica(id);
            setStatus({ type: "success", message: "República eliminada." });
            cargarRepublicas();
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        }
    };

    const renderBuscadorView = () => (
        <div className="dashboard-page">
            <section className="dashboard-section" id="buscador-grid" aria-labelledby="buscador-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Buscar</span>
                    <h2 id="buscador-heading">Encontre a república ideal</h2>
                </div>

                <div className="filtros-grid" role="search" aria-label="Filtros de búsqueda">
                    <div className="filtro-item">
                        <label htmlFor="filtro-minPrecio">Preço mín.</label>
                        <input id="filtro-minPrecio" className="field__input" type="number" placeholder="R$ 0" value={filters.minPrecio} onChange={(e) => setFilters(f => ({ ...f, minPrecio: e.target.value }))} />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-maxPrecio">Preço máx.</label>
                        <input id="filtro-maxPrecio" className="field__input" type="number" placeholder="R$ 5000" value={filters.maxPrecio} onChange={(e) => setFilters(f => ({ ...f, maxPrecio: e.target.value }))} />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-habitaciones">Quartos mín.</label>
                        <input id="filtro-habitaciones" className="field__input" type="number" placeholder="1" value={filters.habitaciones} onChange={(e) => setFilters(f => ({ ...f, habitaciones: e.target.value }))} />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-genero">Gênero</label>
                        <select id="filtro-genero" className="field__select" value={filters.genero} onChange={(e) => setFilters(f => ({ ...f, genero: e.target.value }))}>
                            <option value="">Todos</option>
                            <option value="solo hombres">Solo hombres</option>
                            <option value="solo mujeres">Solo mujeres</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </div>
                    <div className="filtro-actions">
                        <button className="btn btn--primary" onClick={aplicarFiltros}>Filtrar</button>
                        <button className="btn" onClick={limpiarFiltros}>Limpar</button>
                    </div>
                </div>
            </section>

            <section className="dashboard-section" aria-labelledby="resultados-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Resultados</span>
                    <h2 id="resultados-heading">{republicas.length} república{republicas.length !== 1 ? "s" : ""} encontrada{republicas.length !== 1 ? "s" : ""}</h2>
                </div>

                {loadingRepublicas ? (
                    <LoadingIndicator message="Buscando repúblicas..." />
                ) : republicas.length === 0 ? (
                    <div className="empty-state"><p>Nenhuma república encontrada.</p></div>
                ) : (
                    <div className="republicas-grid">
                        {republicas.map((rep) => <RepublicaCard key={rep.id} rep={rep} isFavorite={favoriteRepublicaIds.includes(rep.id)} toggleFavorite={toggleFavorite} />)}
                    </div>
                )}
            </section>

            <section className="dashboard-section" id="favoritos" aria-labelledby="favoritos-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Favoritos</span>
                    <h2 id="favoritos-heading">Repúblicas que você salvou</h2>
                </div>
                {favoriteRepublicas.length === 0 ? (
                    <div className="empty-state"><p>Você ainda não salvou nenhuma república como favorita.</p></div>
                ) : (
                    <div className="republicas-grid">
                        {favoriteRepublicas.map((rep) => <RepublicaCard key={rep.id} rep={rep} isFavorite={true} toggleFavorite={toggleFavorite} />)}
                    </div>
                )}
            </section>

            {status.message && (
                <div className={`status-box status-box--${status.type}`}>{status.message}</div>
            )}
        </div>
    );

    const renderDuenhoDashboard = () => {
        const miRepublica = allRepublicas.find(r => r.idDuenho === authUser?.id);

        return (
            <div className="dashboard-page">
                <section className="dashboard-hero">
                    <div className="dashboard-hero__copy">
                        <span className="dashboard-hero__eyebrow">Painel do Decano</span>
                        <h1>Gerencie sua república</h1>
                        <p>Bem-vindo, {authUser?.name}.</p>
                    </div>
                </section>

                <section className="dashboard-section" id="minha-republica">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Minha Rep</span>
                        <h2>{miRepublica ? "Sua república" : "Cadastre sua república"}</h2>
                    </div>

                    {loadingRepublicas ? (
                        <LoadingIndicator message="Carregando..." />
                    ) : miRepublica && !showRepublicaForm ? (
                        <div className="duenho-republica-card">
                             {miRepublica.fotoSrc && (
                                <div className="duenho-republica-card__foto">
                                    <img src={miRepublica.fotoSrc} alt="Foto da república" />
                                </div>
                            )}
                            <div className="duenho-republica-card__header">
                                <h3>{miRepublica.nombre}</h3>
                                <div className="duenho-republica-card__actions">
                                    <button className="btn btn--small" onClick={() => { setEditingRepublica(miRepublica); setShowRepublicaForm(true); }}>✎ Editar</button>
                                    <button className="btn btn--small btn--danger" onClick={() => handleDeleteRepublica(miRepublica.id)}>Excluir</button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {showRepublicaForm ? (
                        <RepublicaForm 
                            editingRepublica={editingRepublica} 
                            onCancel={() => { setShowRepublicaForm(false); setEditingRepublica(null); }}
                            onSuccess={() => { setShowRepublicaForm(false); setEditingRepublica(null); cargarRepublicas(); }}
                            setStatus={setStatus}
                        />
                    ) : !miRepublica ? (
                        <div className="empty-state">
                            <button className="btn btn--primary" onClick={() => setShowRepublicaForm(true)}>Cadastrar minha república</button>
                        </div>
                    ) : null}
                </section>

                <section className="dashboard-section" id="gerenciar">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Gerenciar</span>
                        <h2>Candidatos e mensagens</h2>
                    </div>
                    <div className="empty-state"><p>Nenhum candidato ainda.</p></div>
                </section>

                {status.message && (
                    <div className={`status-box status-box--${status.type}`}>{status.message}</div>
                )}
            </div>
        );
    };

    return esDuenho ? renderDuenhoDashboard() : renderBuscadorView();
}
