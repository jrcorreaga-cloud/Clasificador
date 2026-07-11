import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRepublicas } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import LoadingIndicator from '../components/LoadingIndicator';

export default function RepublicaDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [republica, setRepublica] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRepublica = async () => {
            try {
                // Ideally there should be an endpoint like getRepublicaById(id), 
                // but we fetch all and filter for now as a fallback if the API doesn't have it.
                const data = await getRepublicas();
                const mapped = Republica.fromList(data);
                const found = mapped.find(r => r.id === parseInt(id));
                if (found) {
                    setRepublica(found);
                } else {
                    setError("República no encontrada.");
                }
            } catch (err) {
                // Use fallback data like in DashboardView
                const fallbackData = [
                    { id_republica: 1, nombre_republica: "República Horizonte", direccion: "Rua do Ouvidor, 123", precio: 850.00, num_habitaciones: 3, genero_permitido: "mixto", descripcion: "Próximo ao centro, ambiente tranquilo e regras claras para convivência." },
                    { id_republica: 2, nombre_republica: "Casa das Ladeiras", direccion: "Rua dos Inconfidentes, 45", precio: 650.00, num_habitaciones: 2, genero_permitido: "solo mujeres", descripcion: "Quartos individuais, internet estável e perfil ideal para quem estuda à noite." },
                    { id_republica: 3, nombre_republica: "Solar do Pilar", direccion: "Rua do Pilar, 789", precio: 720.00, num_habitaciones: 4, genero_permitido: "solo hombres", descripcion: "Espaço compartilhado com boa mobilidade e preferência para calouros." },
                ];
                const mapped = Republica.fromList(fallbackData);
                const found = mapped.find(r => r.id === parseInt(id));
                if (found) {
                    setRepublica(found);
                } else {
                    setError("República no encontrada.");
                }
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

    return (
        <div className="dashboard-page">
            <section className="dashboard-section" aria-labelledby="republica-detalle-heading">
                <div className="dashboard-section__header">
                    <button className="btn btn--secondary" type="button" onClick={() => navigate(-1)} aria-label="Volver a la lista de repúblicas">
                        ← Volver
                    </button>
                    <span className="badge-section" style={{ marginLeft: "1rem" }}>Detalle</span>
                    <h2 id="republica-detalle-heading">{republica.nombre}</h2>
                </div>

                <div className="republica-detail-card">
                    {republica.fotoSrc ? (
                        <img src={republica.fotoSrc} alt={`Foto de ${republica.nombre}`} className="republica-detail-card__img" />
                    ) : (
                        <div className="republica-detail-card__placeholder">🏠</div>
                    )}

                    <div className="republica-detail-card__content">
                        <p><strong>Dirección:</strong> {republica.direccion}</p>
                        <p><strong>Precio:</strong> {republica.precioFormateado}</p>
                        <p><strong>Cuartos:</strong> {republica.habitaciones}</p>
                        <p><strong>Género permitido:</strong> {republica.generoLabel}</p>
                        <p><strong>Descripción:</strong> {republica.descripcion || "Información de la república próximamente."}</p>
                        <p><strong>Más detalles:</strong> En construcción. Aquí se mostrará información adicional sobre la república.</p>
                        <div className="republica-detail-card__actions">
                            <button type="button" className="btn btn--secondary">Email</button>
                            <button type="button" className="btn btn--secondary">WhatsApp</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
