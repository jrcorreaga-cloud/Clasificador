import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRepublicas } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import LoadingIndicator from '../components/LoadingIndicator';

const CATEGORIA_LABELS = {
    casa: 'Fachada',
    sala: 'Sala de Estar',
    cuartos: 'Habitaciones',
    cocina: 'Cocina',
    patio: 'Patio / Exterior',
    banhos: 'Baños',
};

export default function RepublicaDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [republica, setRepublica] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRepublica = async () => {
            try {
                const data = await getRepublicas();
                const mapped = Republica.fromList(data);
                const found = mapped.find(r => r.id === parseInt(id));
                if (found) {
                    setRepublica(found);
                } else {
                    setError("República no encontrada.");
                }
            } catch (err) {
                setError("Ocurrió un error al cargar la república.");
            } finally {
                setLoading(false);
            }
        };

        fetchRepublica();
    }, [id]);

    if (loading) {
        return <div className="dashboard-page"><LoadingIndicator message="Cargando detalles..." /></div>;
    }

    if (error || !republica) {
        return (
            <div className="dashboard-page">
                <section className="dashboard-section">
                    <button className="btn btn--secondary" onClick={() => navigate(-1)}>← Volver</button>
                    <div className="empty-state"><p>{error}</p></div>
                </section>
            </div>
        );
    }

    // Preparar lista de fotos disponibles
    const fotosDisponibles = [];
    if (republica.fotosPorCategoria) {
        ['casa', 'sala', 'cuartos', 'cocina', 'patio', 'banhos'].forEach(cat => {
            const f = republica.fotosPorCategoria[cat];
            if (f && f.foto_url) {
                fotosDisponibles.push({
                    categoria: cat,
                    label: CATEGORIA_LABELS[cat],
                    url: republica.resolveFotoUrl(f.foto_url)
                });
            }
        });
    } else if (republica.fotoSrc) {
        // Fallback si no hay array estructurado pero hay url
        fotosDisponibles.push({ categoria: 'casa', label: 'Fachada', url: republica.fotoSrc });
    }

    return (
        <div className="dashboard-page">
            <section className="dashboard-section" aria-labelledby="republica-detalle-heading">
                <div className="dashboard-section__header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                    <button className="btn btn--secondary" type="button" onClick={() => navigate(-1)} aria-label="Volver a la lista de repúblicas">
                        ← Volver
                    </button>
                </div>

                <div className="republica-detail-header" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                    <h1 id="republica-detalle-heading" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{republica.nombre}</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>📍 {republica.direccion}</p>
                </div>

                {/* Galería (Bento Grid) */}
                {fotosDisponibles.length > 0 ? (
                    <div className="republica-gallery" style={{
                        display: "grid",
                        gridTemplateColumns: fotosDisponibles.length === 1 ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "1rem",
                        marginBottom: "2.5rem",
                        borderRadius: "12px",
                        overflow: "hidden"
                    }}>
                        {fotosDisponibles.map((f, idx) => (
                            <div key={idx} style={{
                                position: "relative",
                                gridColumn: idx === 0 && fotosDisponibles.length > 2 ? "span 2" : "auto",
                                gridRow: idx === 0 && fotosDisponibles.length > 2 ? "span 2" : "auto",
                                height: idx === 0 && fotosDisponibles.length > 2 ? "400px" : "192px"
                            }}>
                                <img 
                                    src={f.url} 
                                    alt={f.label} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} 
                                />
                                <span style={{
                                    position: "absolute", bottom: "10px", left: "10px",
                                    backgroundColor: "rgba(0,0,0,0.7)", color: "white", padding: "4px 10px",
                                    borderRadius: "4px", fontSize: "0.85rem", fontWeight: "600"
                                }}>
                                    {f.label}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="republica-detail-card__placeholder" style={{ marginBottom: "2rem", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-secondary)", borderRadius: "12px" }}>
                        <span style={{ fontSize: "4rem" }}>🏠</span>
                    </div>
                )}

                {/* Información en dos columnas */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
                    <div className="republica-info-main">
                        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Sobre esta república</h2>
                        <p style={{ lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "2rem", whiteSpace: "pre-line" }}>
                            {republica.descripcion || "El dueño no ha proporcionado una descripción detallada aún."}
                        </p>
                        
                        <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Características</h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>🛏️</span> <strong>{republica.habitaciones}</strong> cuartos
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>🚻</span> Género: <strong>{republica.generoLabel}</strong>
                            </li>
                        </ul>
                    </div>

                    <div className="republica-info-sidebar">
                        <div style={{ padding: "1.5rem", border: "1px solid var(--border-color)", borderRadius: "12px", position: "sticky", top: "2rem" }}>
                            <h3 style={{ fontSize: "1.8rem", color: "var(--primary-color)", margin: "0 0 1rem 0" }}>
                                {republica.precioFormateado} <span style={{ fontSize: "1rem", color: "var(--text-tertiary)", fontWeight: "normal" }}>/mes</span>
                            </h3>
                            <button type="button" className="btn btn--primary btn--full" style={{ marginBottom: "0.75rem" }}>
                                Contactar por WhatsApp
                            </button>
                            <button type="button" className="btn btn--full">
                                Enviar Email
                            </button>
                        </div>
                    </div>
                </div>

            </section>
        </div>
    );
}
