import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../models/userProfileModel';

export default function ProfileView() {
    const { authUser, updateUser } = useAuth();
    
    const [profileEditMode, setProfileEditMode] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ name: authUser?.name || "", phone: authUser?.phone || "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const userProfile = useMemo(() => UserProfile.fromAuthUser(authUser), [authUser]);

    const userInitials = useMemo(() => {
        if (!authUser?.name) return "R";
        const nameParts = authUser.name.trim().split(/\s+/).filter(Boolean);
        const firstInitial = nameParts[0]?.[0] ?? "R";
        const secondInitial = nameParts[1]?.[0] ?? authUser.name.trim()[1] ?? "";
        return `${firstInitial}${secondInitial}`.toUpperCase();
    }, [authUser]);

    const handleProfileEditToggle = () => {
        if (!profileEditMode) {
            setProfileFormData({
                name: authUser?.name || "",
                phone: authUser?.phone || "",
            });
        }
        setProfileEditMode((prev) => !prev);
    };

    const handleProfileFormChange = (event) => {
        const { name, value } = event.target;
        setProfileFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulated API update (Assuming updating local state is enough for now based on original code)
            const updatedUser = {
                ...authUser,
                name: profileFormData.name.trim() || authUser.name,
                phone: profileFormData.phone.trim(),
            };
            
            updateUser(updatedUser);
            setProfileEditMode(false);
            setStatus({ type: "success", message: "Perfil atualizado com sucesso." });
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dashboard-page">
            <section className="dashboard-section dashboard-section--profile" id="meu-perfil">
                <div className="dashboard-section__header">
                    <span className="badge-section" id="perfil-heading">Meu Perfil</span>
                    <h2>Informações da conta</h2>
                </div>

                <article className="profile-hero-card" aria-label="Resumo do perfil">
                    <div className="profile-hero-card__left">
                        <div className="profile-hero-card__avatar" aria-hidden="true">
                            {userProfile?.initials || userInitials}
                        </div>
                        <div className="profile-hero-card__info">
                            <strong>{authUser?.name ?? "Usuário logado"}</strong>
                            <span className="profile-hero-card__email">{authUser?.email}</span>
                            <div className="profile-hero-card__badges">
                                <span className="badge badge--role">
                                    {userProfile?.roleIcon} {userProfile?.roleLabel || authUser?.role || "Sem função"}
                                </span>
                                {userProfile?.isUfopEmail && (
                                    <span className="badge badge--ufop">✓ UFOP Verificado</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="profile-hero-card__right">
                        {!profileEditMode && (
                            <button type="button" className="btn btn--small" onClick={handleProfileEditToggle}>
                                ✎ Editar
                            </button>
                        )}
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
                            <span className="profile-detail-item__value">{userProfile?.roleIcon} {userProfile?.roleLabel || "—"}</span>
                        </div>
                        <div className="profile-detail-item profile-detail-item--wide">
                            <span className="profile-detail-item__label">Membro desde</span>
                            <span className="profile-detail-item__value">{userProfile?.formattedRegistrationDate || "—"}</span>
                        </div>
                    </div>
                ) : (
                    <form className="profile-edit-form" onSubmit={handleProfileSave} noValidate>
                        <div className="profile-edit-form__grid">
                            <label className="field">
                                <span className="field__label">Nome completo</span>
                                <input className="field__input" type="text" name="name" value={profileFormData.name} onChange={handleProfileFormChange} placeholder="Seu nome completo" />
                            </label>
                            <label className="field">
                                <span className="field__label">Telefone</span>
                                <input className="field__input" type="tel" name="phone" value={profileFormData.phone} onChange={handleProfileFormChange} placeholder="+55 31 99999-9999" />
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

                {status.message && (
                    <div style={{marginTop: '1rem'}} className={`status-box status-box--${status.type}`}>{status.message}</div>
                )}
            </section>
        </div>
    );
}
