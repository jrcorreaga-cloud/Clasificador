import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavoritos, getRepublica, removeFavorito } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import RepublicaCard from '../components/RepublicaCard';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/login.css';

export default function ProfileView() {
    const { authUser, updateUser } = useAuth();
    
    // Profile Edit State
    const [profileEditMode, setProfileEditMode] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ name: "", phone: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const esDuenho = authUser?.role === 'dueño';
    
    // Favorites State
    const [favoriteRepublicas, setFavoriteRepublicas] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    useEffect(() => {
        if (authUser) {
            setProfileFormData({
                name: authUser.name || "",
                phone: authUser.phone || ""
            });
            loadFavorites();
        }
    }, [authUser]);

    const loadFavorites = async () => {
        setLoadingFavorites(true);
        try {
            const favs = await getFavoritos(); // Returns list of objects with id_republica
            const ids = favs.map(f => f.id_republica);
            
            // Fetch full details for each favorite since backend only returns IDs
            const detailedFavs = await Promise.all(
                ids.map(id => getRepublica(id).catch(() => null))
            );
            
            const validFavs = detailedFavs.filter(r => r !== null);
            setFavoriteRepublicas(Republica.fromList(validFavs));
        } catch (e) {
            console.error("Error loading favorites", e);
        }
        setLoadingFavorites(false);
    };

    const toggleFavorite = async (rep) => {
        // En profile view, toggle siempre removerá porque solo mostramos favoritos
        try {
            await removeFavorito(rep.id);
            setFavoriteRepublicas(prev => prev.filter(r => r.id !== rep.id));
            setStatus({ type: "success", message: "República removida dos favoritos." });
        } catch (e) {
            setStatus({ type: "error", message: e.message });
        }
        setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    };

    const handleProfileEditToggle = () => {
        if (profileEditMode) {
            setProfileFormData({
                name: authUser?.name || "",
                phone: authUser?.phone || ""
            });
        }
        setProfileEditMode(!profileEditMode);
    };

    const handleProfileFormChange = (e) => {
        setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
    };

    const handleProfileSave = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Lógica simulada ya que no hay endpoint de actualizar perfil en el backend aún
        const updatedUser = {
            ...authUser,
            name: profileFormData.name,
            phone: profileFormData.phone
        };
        updateUser(updatedUser);
        setProfileEditMode(false);
        setIsSubmitting(false);
    };

    const userInitials = authUser?.name ? authUser.name.charAt(0).toUpperCase() : "U";
    const isUfopEmail = authUser?.email?.endsWith("@aluno.ufop.edu.br");
    const roleLabel = authUser?.role === 'dueño' ? 'Decano (Dono)' : 'Buscador';
    const roleIcon = authUser?.role === 'dueño' ? '👑' : '🔍';

    return (
        <div className="dashboard-page">
            {status.message && (
                <div style={{ padding: '10px', background: status.type === 'error' ? '#f8d7da' : '#d4edda', color: status.type === 'error' ? '#721c24' : '#155724', textAlign: 'center', marginBottom: '1rem' }}>
                    {status.message}
                </div>
            )}

            <section className="dashboard-section dashboard-section--profile" id="meu-perfil" aria-labelledby="perfil-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section" id="perfil-heading">Meu Perfil</span>
                    <h2>Informações da conta</h2>
                </div>

                <article className="profile-hero-card" aria-label="Resumo do perfil">
                    <div className="profile-hero-card__left">
                        <div className="profile-hero-card__avatar" aria-hidden="true">
                            {userInitials}
                        </div>
                        <div className="profile-hero-card__info">
                            <strong>{authUser?.name ?? "Usuário logado"}</strong>
                            <span className="profile-hero-card__email">{authUser?.email}</span>
                            <div className="profile-hero-card__badges">
                                <span className="badge badge--role">
                                    {roleIcon} {roleLabel}
                                </span>
                                {isUfopEmail ? (
                                    <span className="badge badge--ufop">✓ UFOP Verificado</span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div className="profile-hero-card__right">
                        {!profileEditMode ? (
                            <button type="button" className="btn btn--small" onClick={handleProfileEditToggle} aria-label="Editar perfil">
                                ✎ Editar
                            </button>
                        ) : null}
                    </div>
                </article>

                {!profileEditMode ? (
                    <div className="profile-details-grid">
                        <div className="profile-detail-item">
                            <span className="profile-detail-item__label">Nome completo</span>
                            <span className="profile-detail-item__value">{authUser?.name || "—"}</span>
                        </div>
                        <div className="profile-detail-item">
                            <span className="profile-detail-item__label">Email</span>
                            <span className="profile-detail-item__value">{authUser?.email || "—"}</span>
                        </div>
                        <div className="profile-detail-item">
                            <span className="profile-detail-item__label">Telefone</span>
                            <span className="profile-detail-item__value">{authUser?.phone || "Não informado"}</span>
                        </div>
                        <div className="profile-detail-item">
                            <span className="profile-detail-item__label">Função</span>
                            <span className="profile-detail-item__value">{roleIcon} {roleLabel}</span>
                        </div>
                    </div>
                ) : (
                    <form className="profile-edit-form" onSubmit={handleProfileSave} noValidate>
                        <div className="profile-edit-form__grid">
                            <label className="field">
                                <span className="field__label">Nome completo</span>
                                <input
                                    className="field__input"
                                    type="text"
                                    name="name"
                                    value={profileFormData.name}
                                    onChange={handleProfileFormChange}
                                    placeholder="Seu nome completo"
                                    autoComplete="name"
                                />
                            </label>
                            <label className="field">
                                <span className="field__label">Telefone</span>
                                <input
                                    className="field__input"
                                    type="tel"
                                    name="phone"
                                    value={profileFormData.phone}
                                    onChange={handleProfileFormChange}
                                    placeholder="+55 31 99999-9999"
                                    autoComplete="tel"
                                />
                            </label>
                        </div>
                        <div className="profile-edit-form__actions">
                            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando..." : "Salvar alterações"}
                            </button>
                            <button type="button" className="btn" onClick={handleProfileEditToggle}>Cancelar</button>
                        </div>
                    </form>
                )}
            </section>

            {!esDuenho && (
                <section className="dashboard-section" aria-labelledby="favoritos-heading">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Favoritos</span>
                        <h2 id="favoritos-heading">Repúblicas que você salvou</h2>
                    </div>
                    {loadingFavorites ? (
                        <LoadingIndicator message="Carregando favoritos..." />
                    ) : favoriteRepublicas.length === 0 ? (
                        <div className="empty-state" role="status">
                            <p>Você ainda não salvou nenhuma república como favorita.</p>
                        </div>
                    ) : (
                        <div className="republicas-grid" role="list" aria-label="Lista de favoritos">
                            {favoriteRepublicas.map((rep) => (
                                <RepublicaCard 
                                    key={rep.id} 
                                    rep={rep} 
                                    isFavorite={true} 
                                    toggleFavorite={toggleFavorite} 
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
