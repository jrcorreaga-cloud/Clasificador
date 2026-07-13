import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRepublica, getResenas, createResena, updateMiResena, deleteMiResena } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/login.css';

export default function RepublicaDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authUser } = useAuth();
    
    const [selectedRepublica, setSelectedRepublica] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reseñas state
    const [resenasData, setResenasData] = useState({ resenas: [], promedio: null, total: 0 });
    const [loadingResenas, setLoadingResenas] = useState(false);
    const [miResena, setMiResena] = useState(null);
    const [editandoResena, setEditandoResena] = useState(false);
    const [nuevaResena, setNuevaResena] = useState({ calificacion: 5, comentario: "" });

    const esDuenho = authUser?.role === 'dueño';

    useEffect(() => {
        const fetchRepublica = async () => {
            setLoading(true);
            try {
                const data = await getRepublica(id);
                setSelectedRepublica(new Republica(data));
            } catch (err) {
                setStatus({ type: "error", message: "Error al cargar la república" });
            }
            setLoading(false);
        };
        fetchRepublica();
    }, [id]);

    useEffect(() => {
        if (selectedRepublica && !esDuenho) {
            cargarResenas(selectedRepublica.id);
        }
    }, [selectedRepublica, esDuenho]);

    const cargarResenas = async (republicaId) => {
        setLoadingResenas(true);
        try {
            const data = await getResenas(republicaId);
            setResenasData(data);
            const miResenaEncontrada = data.resenas?.find(r => r.id_usuario === authUser?.id);
            setMiResena(miResenaEncontrada || null);
            if (miResenaEncontrada) {
                setNuevaResena({ calificacion: miResenaEncontrada.calificacion, comentario: miResenaEncontrada.comentario || "" });
            } else {
                setNuevaResena({ calificacion: 5, comentario: "" });
            }
        } catch (e) {
            setResenasData({ resenas: [], promedio: null, total: 0 });
            setMiResena(null);
        }
        setLoadingResenas(false);
    };

    const handleResenaChange = (field, value) => {
        setNuevaResena(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmitResena = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (miResena) {
                await updateMiResena(selectedRepublica.id, nuevaResena);
                setStatus({ type: "success", message: "Reseña actualizada correctamente." });
            } else {
                await createResena(selectedRepublica.id, nuevaResena);
                setStatus({ type: "success", message: "Reseña agregada correctamente." });
            }
            await cargarResenas(selectedRepublica.id);
            setEditandoResena(false);
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        }
        setIsSubmitting(false);
        setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    };

    const handleDeleteResena = async () => {
        if (!window.confirm("¿Estás seguro de eliminar tu reseña?")) return;
        setIsSubmitting(true);
        try {
            await deleteMiResena(selectedRepublica.id);
            setStatus({ type: "success", message: "Reseña eliminada correctamente." });
            await cargarResenas(selectedRepublica.id);
            setEditandoResena(false);
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        }
        setIsSubmitting(false);
        setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    };

    const handleEditResenaToggle = () => {
        if (!editandoResena && miResena) {
            setNuevaResena({ calificacion: miResena.calificacion, comentario: miResena.comentario || "" });
        }
        setEditandoResena(prev => !prev);
    };

    const handleBackToList = () => {
        navigate('/');
    };

    const renderEstrellas = (calificacion) => {
        return "★".repeat(calificacion) + "☆".repeat(5 - calificacion);
    };

    if (loading) {
        return (
            <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LoadingIndicator message="Carregando detalhes..." />
            </div>
        );
    }

    if (!selectedRepublica) {
        return (
            <div className="dashboard-page">
                <div className="empty-state">
                    <p>Não foi possível encontrar a república.</p>
                    <button className="btn btn--primary" onClick={handleBackToList}>Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {status.message && (
                <div style={{ padding: '10px', background: status.type === 'error' ? '#f8d7da' : '#d4edda', color: status.type === 'error' ? '#721c24' : '#155724', textAlign: 'center', marginBottom: '1rem' }}>
                    {status.message}
                </div>
            )}

            <section className="dashboard-section" aria-labelledby="republica-detalle-heading">
                <div className="dashboard-section__header">
                    <button className="btn btn--secondary" type="button" onClick={handleBackToList} aria-label="Voltar à lista de repúblicas">
                        ← Voltar
                    </button>
                    <span className="badge-section" style={{ marginLeft: "1rem" }}>Detalhes</span>
                    <h2 id="republica-detalle-heading">{selectedRepublica.nombre}</h2>
                </div>

                <div className="republica-detail-card">
                    {selectedRepublica.fotoSrc ? (
                        <img src={selectedRepublica.fotoSrc} alt={`Foto de ${selectedRepublica.nombre}`} className="republica-detail-card__img" />
                    ) : (
                        <div className="republica-detail-card__placeholder">🏠</div>
                    )}

                    <div className="republica-detail-card__content">
                        <p><strong>Endereço:</strong> {selectedRepublica.direccion}</p>
                        <p><strong>Preço:</strong> {selectedRepublica.precioFormateado}</p>
                        <p><strong>Quartos:</strong> {selectedRepublica.habitaciones}</p>
                        <p><strong>Gênero permitido:</strong> {selectedRepublica.generoLabel}</p>
                        <p><strong>Descrição:</strong> {selectedRepublica.descripcion || "Informações da república em breve."}</p>
                        <div className="republica-detail-card__actions">
                            <button type="button" className="btn btn--secondary">
                                Email
                            </button>
                            <button type="button" className="btn btn--secondary">
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="dashboard-section" aria-labelledby="resenas-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Avaliações</span>
                    <h2 id="resenas-heading">
                        {resenasData.promedio !== null ? (
                            <>Avaliação: {renderEstrellas(Math.round(resenasData.promedio))} {resenasData.promedio.toFixed(1)} ({resenasData.total} avaliação{resenasData.total !== 1 ? "ões" : "ão"})</>
                        ) : (
                            "Avaliações"
                        )}
                    </h2>
                </div>

                {loadingResenas ? (
                    <LoadingIndicator message="Carregando avaliações..." />
                ) : (
                    <>
                        {!esDuenho && (
                            <div className="resena-form-container">
                                {!editandoResena ? (
                                    <div className="resena-actions">
                                        {miResena ? (
                                            <div className="resena-mi-resena">
                                                <p><strong>Sua avaliação:</strong> {renderEstrellas(miResena.calificacion)} {miResena.comentario && `— ${miResena.comentario}`}</p>
                                                <div className="resena-actions__buttons">
                                                    <button type="button" className="btn btn--small" onClick={handleEditResenaToggle}>
                                                        ✎ Editar
                                                    </button>
                                                    <button type="button" className="btn btn--small btn--danger" onClick={handleDeleteResena}>
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button type="button" className="btn btn--primary" onClick={() => setEditandoResena(true)}>
                                                Fazer uma avaliação
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <form className="resena-form" onSubmit={handleSubmitResena}>
                                        <div className="resena-form__field">
                                            <label><strong>Nota:</strong></label>
                                            <div className="resena-estrellas">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className={`resena-estrella ${star <= nuevaResena.calificacion ? "resena-estrella--activa" : ""}`}
                                                        onClick={() => handleResenaChange("calificacion", star)}
                                                        aria-label={`${star} estrela${star !== 1 ? "s" : ""}`}
                                                    >
                                                        {star <= nuevaResena.calificacion ? "★" : "☆"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="resena-form__field">
                                            <label htmlFor="resena-comentario"><strong>Comentário (opcional):</strong></label>
                                            <textarea
                                                id="resena-comentario"
                                                className="field__textarea"
                                                rows="3"
                                                value={nuevaResena.comentario}
                                                onChange={(e) => handleResenaChange("comentario", e.target.value)}
                                                placeholder="Compartilhe sua experiência nesta república..."
                                            />
                                        </div>
                                        <div className="resena-form__actions">
                                            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                                                {isSubmitting ? "Salvando..." : miResena ? "Atualizar avaliação" : "Publicar avaliação"}
                                            </button>
                                            <button type="button" className="btn" onClick={() => { setEditandoResena(false); if (miResena) setNuevaResena({ calificacion: miResena.calificacion, comentario: miResena.comentario || "" }); }}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {resenasData.resenas.length === 0 ? (
                            <div className="empty-state" role="status">
                                <p>Esta república ainda não tem avaliações. Seja o primeiro a avaliar!</p>
                            </div>
                        ) : (
                            <div className="resenas-list">
                                {resenasData.resenas.map((resena) => (
                                    <div key={resena.id_resena} className="resena-item">
                                        <div className="resena-item__header">
                                            <span className="resena-item__usuario">{resena.nombre_usuario}</span>
                                            <span className="resena-item__estrellas">{renderEstrellas(resena.calificacion)}</span>
                                            <span className="resena-item__fecha">
                                                {new Date(resena.fecha_creacion).toLocaleDateString("pt-BR", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        {resena.comentario && (
                                            <p className="resena-item__comentario">{resena.comentario}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
