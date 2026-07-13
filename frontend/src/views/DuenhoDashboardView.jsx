import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRepublicas, createRepublica, updateRepublica, deleteRepublica, uploadRepublicaFoto } from '../controllers/apiController';
import { Republica } from '../models/republicaModel';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/login.css';

export default function DuenhoDashboardView() {
    const { authUser } = useAuth();
    const [republicas, setRepublicas] = useState([]);
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
        descripcion: ""
    });
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authUser?.role === 'dueño') {
            cargarRepublicas();
        }
    }, [authUser]);

    const cargarRepublicas = async () => {
        setLoadingRepublicas(true);
        try {
            // Fetch enough items to guarantee we find the owner's republica
            const data = await getRepublicas({ limit: 100 });
            const items = data.items || data;
            const mapped = Republica.fromList(Array.isArray(items) ? items : []);
            setRepublicas(mapped);
        } catch (e) {
            console.error("Error loading republicas:", e);
        }
        setLoadingRepublicas(false);
    };

    const handleRepublicaFormChange = (e) => {
        setRepublicaForm({ ...republicaForm, [e.target.name]: e.target.value });
    };

    const handleFotoFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    const openCreateForm = () => {
        setEditingRepublica(null);
        setRepublicaForm({
            nombre_republica: "",
            direccion: "",
            precio: "",
            num_habitaciones: "",
            genero_permitido: "mixto",
            descripcion: ""
        });
        setFotoFile(null);
        setFotoPreview(null);
        setShowRepublicaForm(true);
    };

    const openEditForm = (rep) => {
        setEditingRepublica(rep);
        setRepublicaForm({
            nombre_republica: rep.nombre,
            direccion: rep.direccion,
            precio: rep.precio,
            num_habitaciones: rep.habitaciones,
            genero_permitido: rep.generoPermitido,
            descripcion: rep.descripcion || ""
        });
        setFotoFile(null);
        setFotoPreview(rep.fotoSrc || null);
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
                repId = nuevaRep.id_republica;
                alert("República cadastrada com sucesso!");
            }

            if (fotoFile) {
                try {
                    await uploadRepublicaFoto(repId, fotoFile);
                } catch (err) {
                    console.error("Erro no upload da foto", err);
                    alert("A república foi salva, mas ocorreu um erro no upload da foto.");
                }
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

    const miRepublica = republicas.find(r => r.idDuenho === authUser?.id);

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
                                <span>Endereço *</span>
                                <input
                                    className="field__input"
                                    type="text"
                                    name="direccion"
                                    value={republicaForm.direccion}
                                    onChange={handleRepublicaFormChange}
                                    required
                                    placeholder="Ex: Rua Direita, 200, Ouro Preto"
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
                            <label className="republica-form__field republica-form__field--full">
                                <span>Foto (Opcional)</span>
                                <input
                                    className="field__input field__input--file"
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp"
                                    onChange={handleFotoFileChange}
                                />
                                <small className="field__help">
                                    Formatos aceitos: JPG, PNG, WebP · Máx. 5 MB
                                </small>
                                {fotoPreview && (
                                    <img
                                        src={fotoPreview}
                                        alt="Preview"
                                        style={{ display: "block", marginTop: "1rem", maxWidth: "200px", borderRadius: "8px" }}
                                    />
                                )}
                            </label>
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
