import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyRepublica, createRepublica, updateRepublica, deleteRepublica, uploadRepublicaFoto } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import LoadingIndicator from '../components/LoadingIndicator';
import LocationPickerMap from '../components/LocationPickerMap';
import '../styles/login.css';

export default function DuenhoDashboardView() {
    const { authUser } = useAuth();
    const [miRepublica, setMiRepublica] = useState(null);
    const [loadingRepublicas, setLoadingRepublicas] = useState(false);
    
    // Dueño form states
    const [showRepublicaForm, setShowRepublicaForm] = useState(false);
    const [editingRepublica, setEditingRepublica] = useState(null);
    const [republicaForm, setRepublicaForm] = useState({
        nombre_republica: "",
        direccion: "",
        precio: "",
        num_habitaciones: "",
        genero_permitido: "mixto",
        descripcion: "",
        latitud: null,
        longitud: null
    });
    
    const initialFotosState = { casa: null, sala: null, cuartos: null, cocina: null, patio: null, banhos: null };
    const [fotoFiles, setFotoFiles] = useState(initialFotosState);
    const [fotoPreviews, setFotoPreviews] = useState(initialFotosState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authUser?.role === 'dueño') {
            cargarRepublicas();
        }
    }, [authUser]);

    const cargarRepublicas = async () => {
        setLoadingRepublicas(true);
        try {
            const data = await getMyRepublica();
            if (data) {
                setMiRepublica(new Republica(data));
            } else {
                setMiRepublica(null);
            }
        } catch (e) {
            console.error("Error loading mi republica:", e);
        }
        setLoadingRepublicas(false);
    };

    const handleRepublicaFormChange = (e) => {
        setRepublicaForm({ ...republicaForm, [e.target.name]: e.target.value });
    };

    const handleFotoFileChange = (categoria, e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFotoFiles(prev => ({ ...prev, [categoria]: file }));
            setFotoPreviews(prev => ({ ...prev, [categoria]: URL.createObjectURL(file) }));
        }
    };

    const handleLocationSelected = (location) => {
        setRepublicaForm(prev => ({
            ...prev,
            direccion: location.address,
            latitud: location.lat,
            longitud: location.lon
        }));
    };

    const openCreateForm = () => {
        setEditingRepublica(null);
        setRepublicaForm({
            nombre_republica: "",
            direccion: "",
            precio: "",
            num_habitaciones: "",
            genero_permitido: "mixto",
            descripcion: "",
            latitud: null,
            longitud: null
        });
        setFotoFiles(initialFotosState);
        setFotoPreviews(initialFotosState);
        setShowRepublicaForm(true);
    };

    const openEditForm = (rep) => {
        setEditingRepublica(rep);
        setRepublicaForm({
            nombre_republica: rep.nombre,
            direccion: rep.direccion,
            precio: rep.precio,
            num_habitaciones: rep.habitaciones,
            genero_permitido: rep.genero,
            descripcion: rep.descripcion || "",
            latitud: rep.latitud || null,
            longitud: rep.longitud || null
        });
        setFotoFiles(initialFotosState);
        
        // Cargar fotos existentes si están disponibles
        const loadedPreviews = { ...initialFotosState };
        if (rep.fotosPorCategoria) {
            Object.keys(rep.fotosPorCategoria).forEach(cat => {
                if (rep.fotosPorCategoria[cat]) {
                    loadedPreviews[cat] = rep.resolveFotoUrl(rep.fotosPorCategoria[cat].foto_url);
                }
            });
        }
        setFotoPreviews(loadedPreviews);
        setShowRepublicaForm(true);
    };

    const cancelRepublicaForm = () => {
        setShowRepublicaForm(false);
        setEditingRepublica(null);
    };

    const handleRepublicaSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { 
                ...republicaForm,
                precio: parseFloat(republicaForm.precio),
                num_habitaciones: parseInt(republicaForm.num_habitaciones, 10)
            };
            let repId;

            if (editingRepublica) {
                await updateRepublica(editingRepublica.id, payload);
                repId = editingRepublica.id;
                alert("República atualizada com sucesso!");
            } else {
                const nuevaRep = await createRepublica(payload);
                repId = nuevaRep.id_republica || nuevaRep.id;
                alert("República cadastrada com sucesso!");
            }

            // Upload de fotos
            let uploadErrors = false;
            for (const categoria of Object.keys(fotoFiles)) {
                if (fotoFiles[categoria]) {
                    try {
                        await uploadRepublicaFoto(repId, fotoFiles[categoria], categoria);
                    } catch (err) {
                        console.error(`Erro no upload da foto ${categoria}`, err);
                        uploadErrors = true;
                    }
                }
            }
            if (uploadErrors) {
                alert("A república foi salva, mas ocorreu um erro no upload de algumas fotos.");
            }

            setShowRepublicaForm(false);
            cargarRepublicas();
        } catch (e) {
            alert(e.message || "Erro ao salvar a república.");
        }
        setIsSubmitting(false);
    };

    const handleDeleteRepublica = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir sua república? Esta ação é irreversível.")) {
            try {
                await deleteRepublica(id);
                alert("República excluída.");
                cargarRepublicas();
            } catch (e) {
                alert(e.message || "Erro ao excluir república.");
            }
        }
    };

    return (
        <div className="dashboard-page">
            <section className="dashboard-hero" aria-labelledby="duenho-hero-heading">
                <div className="dashboard-hero__copy">
                    <span className="dashboard-hero__eyebrow">Painel do Decano</span>
                    <h1 id="duenho-hero-heading">Gerencie sua república</h1>
                    <p>Bem-vindo, {authUser?.name}. Aqui você pode cadastrar, editar e gerenciar sua república em Ouro Preto.</p>
                </div>
                <div className="dashboard-hero__stats">
                    <article>
                        <strong>{miRepublica ? 1 : 0}</strong>
                        <span>República cadastrada</span>
                    </article>
                    <article>
                        <strong>0</strong>
                        <span>Candidatos</span>
                    </article>
                    <article>
                        <strong>0</strong>
                        <span>Novas mensagens</span>
                    </article>
                </div>
            </section>

            <section className="dashboard-section" id="duenho-republica" aria-labelledby="duenho-republica-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Minha Rep</span>
                    <h2 id="duenho-republica-heading">{miRepublica ? "Sua república" : "Cadastre sua república"}</h2>
                </div>

                {loadingRepublicas && !showRepublicaForm ? (
                    <LoadingIndicator message="Carregando informação da república..." />
                ) : miRepublica && !showRepublicaForm ? (
                    <div className="duenho-republica-card">
                        {miRepublica.fotoSrc && (
                            <div className="duenho-republica-card__foto">
                                <img
                                    src={miRepublica.fotoSrc}
                                    alt={`Foto da república ${miRepublica.nombre}`}
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <div className="duenho-republica-card__header">
                            <h3>{miRepublica.nombre}</h3>
                            <div className="duenho-republica-card__actions">
                                <button className="btn btn--small" onClick={() => openEditForm(miRepublica)} aria-label={`Editar república ${miRepublica.nombre}`}>
                                    ✎ Editar
                                </button>
                                <button className="btn btn--small btn--danger" onClick={() => handleDeleteRepublica(miRepublica.id)} aria-label={`Excluir república ${miRepublica.nombre}`}>
                                    Excluir
                                </button>
                            </div>
                        </div>
                        <div className="duenho-republica-card__grid">
                            <div className="duenho-republica-card__item">
                                <span className="duenho-republica-card__label">Endereço</span>
                                <span className="duenho-republica-card__value">{miRepublica.direccion}</span>
                            </div>
                            <div className="duenho-republica-card__item">
                                <span className="duenho-republica-card__label">Preço</span>
                                <span className="duenho-republica-card__value">{miRepublica.precioFormateado}</span>
                            </div>
                            <div className="duenho-republica-card__item">
                                <span className="duenho-republica-card__label">Quartos</span>
                                <span className="duenho-republica-card__value">{miRepublica.habitaciones}</span>
                            </div>
                            <div className="duenho-republica-card__item">
                                <span className="duenho-republica-card__label">Gênero</span>
                                <span className="duenho-republica-card__value">{miRepublica.generoLabel}</span>
                            </div>
                        </div>
                        {miRepublica.descripcion && (
                            <p className="duenho-republica-card__desc">{miRepublica.descripcion}</p>
                        )}
                    </div>
                ) : null}

                {showRepublicaForm ? (
                    <form className="republica-form" onSubmit={handleRepublicaSubmit} noValidate>
                        <div className="republica-form__grid">
                            <label className="republica-form__field republica-form__field--full">
                                <span>Nome da república *</span>
                                <input
                                    className="field__input"
                                    type="text"
                                    name="nombre_republica"
                                    value={republicaForm.nombre_republica}
                                    onChange={handleRepublicaFormChange}
                                    required
                                    placeholder="Ex: República Horizonte"
                                />
                            </label>
                            <label className="republica-form__field republica-form__field--full">
                                <span>Endereço * (Pesquise no mapa ou digite)</span>
                                <input
                                    className="field__input"
                                    type="text"
                                    name="direccion"
                                    value={republicaForm.direccion}
                                    onChange={handleRepublicaFormChange}
                                    required
                                    placeholder="Ex: Rua Direita, 200, Ouro Preto"
                                />
                                <LocationPickerMap 
                                    onLocationSelected={handleLocationSelected} 
                                    initialPosition={republicaForm.latitud && republicaForm.longitud ? [republicaForm.latitud, republicaForm.longitud] : null}
                                />
                            </label>
                            <label className="republica-form__field">
                                <span>Preço (R$) *</span>
                                <input
                                    className="field__input"
                                    type="number"
                                    name="precio"
                                    value={republicaForm.precio}
                                    onChange={handleRepublicaFormChange}
                                    required
                                    placeholder="0"
                                    step="0.01"
                                />
                            </label>
                            <label className="republica-form__field">
                                <span>Quartos *</span>
                                <input
                                    className="field__input"
                                    type="number"
                                    name="num_habitaciones"
                                    value={republicaForm.num_habitaciones}
                                    onChange={handleRepublicaFormChange}
                                    required
                                    placeholder="1"
                                    min="1"
                                />
                            </label>
                            <label className="republica-form__field">
                                <span>Gênero *</span>
                                <select
                                    className="field__select"
                                    name="genero_permitido"
                                    value={republicaForm.genero_permitido}
                                    onChange={handleRepublicaFormChange}
                                    required
                                >
                                    <option value="solo hombres">Somente homens</option>
                                    <option value="solo mujeres">Somente mulheres</option>
                                    <option value="mixto">Misto</option>
                                </select>
                            </label>
                            <div className="republica-form__field republica-form__field--full" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <span>Fotos da República</span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {[
                                        { key: 'casa', label: 'Fachada/Principal' },
                                        { key: 'sala', label: 'Sala' },
                                        { key: 'cuartos', label: 'Quartos' },
                                        { key: 'cocina', label: 'Cozinha' },
                                        { key: 'patio', label: 'Área Externa / Pátio' },
                                        { key: 'banhos', label: 'Banheiros' },
                                    ].map(cat => (
                                        <div key={cat.key} style={{ border: '1px dashed #ccc', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{cat.label}</p>
                                            <label style={{ display: 'block', cursor: 'pointer' }}>
                                                {fotoPreviews[cat.key] ? (
                                                    <img
                                                        src={fotoPreviews[cat.key]}
                                                        alt={cat.label}
                                                        style={{ display: "block", margin: "0 auto 0.5rem auto", width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                                                    />
                                                ) : (
                                                    <div style={{ background: '#f5f5f5', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                                        <span style={{ color: '#999', fontSize: '2rem' }}>+</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/jpeg, image/png, image/webp"
                                                    onChange={(e) => handleFotoFileChange(cat.key, e)}
                                                    style={{ display: 'none' }}
                                                />
                                                <span className="btn btn--small" style={{ display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
                                                    {fotoPreviews[cat.key] ? "Alterar Foto" : "Adicionar Foto"}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <label className="republica-form__field republica-form__field--full">
                                <span>Descrição</span>
                                <textarea
                                    className="field__textarea"
                                    name="descripcion"
                                    rows="3"
                                    value={republicaForm.descripcion}
                                    onChange={handleRepublicaFormChange}
                                    placeholder="Descreva sua república..."
                                ></textarea>
                            </label>
                        </div>
                        <div className="republica-form__actions">
                            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando..." : editingRepublica ? "Atualizar república" : "Cadastrar república"}
                            </button>
                            <button type="button" className="btn" onClick={cancelRepublicaForm}>Cancelar</button>
                        </div>
                    </form>
                ) : !miRepublica && !loadingRepublicas ? (
                    <div className="empty-state" role="status">
                        <p>Você ainda não cadastrou nenhuma república.</p>
                        <button className="btn btn--primary" onClick={openCreateForm} style={{ marginTop: "0.5rem" }}>
                            Cadastrar minha república
                        </button>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
