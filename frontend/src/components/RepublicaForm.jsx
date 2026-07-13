import React, { useState, useEffect } from 'react';
import { createRepublica, updateRepublica, uploadRepublicaFoto } from '../controllers/apiController';

const CATEGORIAS_FOTOS = [
    { id: 'casa', label: 'Fachada / Portada', required: true },
    { id: 'sala', label: 'Sala de Estar', required: false },
    { id: 'cuartos', label: 'Habitaciones', required: false },
    { id: 'cocina', label: 'Cocina', required: false },
    { id: 'patio', label: 'Patio / Exterior', required: false },
    { id: 'banhos', label: 'Baños', required: false },
];

export default function RepublicaForm({ editingRepublica, onCancel, onSuccess, setStatus }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [republicaForm, setRepublicaForm] = useState({
        nombre_republica: "",
        direccion: "",
        precio: "",
        num_habitaciones: "",
        genero_permitido: "mixto",
        descripcion: "",
    });

    // Estado para manejar las fotos y previas por categoría
    const [fotosData, setFotosData] = useState({
        casa: { file: null, preview: null },
        sala: { file: null, preview: null },
        cuartos: { file: null, preview: null },
        cocina: { file: null, preview: null },
        patio: { file: null, preview: null },
        banhos: { file: null, preview: null },
    });

    useEffect(() => {
        if (editingRepublica) {
            setRepublicaForm({
                nombre_republica: editingRepublica.nombre,
                direccion: editingRepublica.direccion,
                precio: String(editingRepublica.precio),
                num_habitaciones: String(editingRepublica.habitaciones),
                genero_permitido: editingRepublica.genero,
                descripcion: editingRepublica.descripcion || "",
            });

            // Cargar fotos existentes en las previas
            const initialFotos = { ...fotosData };
            
            // Si usamos la nueva arquitectura con fotos categorizadas:
            if (editingRepublica.fotosPorCategoria) {
                Object.keys(editingRepublica.fotosPorCategoria).forEach(cat => {
                    const fotoObj = editingRepublica.fotosPorCategoria[cat];
                    if (fotoObj?.foto_url) {
                        initialFotos[cat] = { file: null, preview: editingRepublica.resolveFotoUrl(fotoObj.foto_url) };
                    }
                });
            } else if (editingRepublica.fotoSrc) {
                // Fallback para propiedades antiguas
                initialFotos.casa = { file: null, preview: editingRepublica.fotoSrc };
            }
            
            setFotosData(initialFotos);
        }
    }, [editingRepublica]);

    const handleRepublicaFormChange = (e) => {
        const { name, value } = e.target;
        setRepublicaForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFotoChange = (categoria, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFotosData(prev => ({
            ...prev,
            [categoria]: {
                file: file,
                preview: URL.createObjectURL(file)
            }
        }));
    };

    const handleRepublicaSubmit = async (e) => {
        e.preventDefault();
        
        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }

        // Validar foto obligatoria
        if (!editingRepublica && !fotosData.casa.file) {
            setStatus({ type: "error", message: "La foto de la fachada es obligatoria para crear la república." });
            return;
        }

        setIsSubmitting(true);

        const data = {
            nombre_republica: republicaForm.nombre_republica,
            direccion: republicaForm.direccion,
            precio: Number(republicaForm.precio),
            num_habitaciones: Number(republicaForm.num_habitaciones),
            genero_permitido: republicaForm.genero_permitido,
            descripcion: republicaForm.descripcion || null,
        };

        try {
            let savedRepublica;
            if (editingRepublica) {
                savedRepublica = await updateRepublica(editingRepublica.id, data);
                setStatus({ type: "success", message: "República actualizada correctamente." });
            } else {
                savedRepublica = await createRepublica(data);
                setStatus({ type: "success", message: "República creada correctamente." });
            }

            // Subir cada foto que haya sido modificada (tiene 'file')
            if (savedRepublica?.id_republica) {
                const uploadPromises = Object.entries(fotosData)
                    .filter(([_, data]) => data.file !== null)
                    .map(([categoria, data]) => uploadRepublicaFoto(savedRepublica.id_republica, data.file, categoria));
                
                if (uploadPromises.length > 0) {
                    await Promise.all(uploadPromises);
                }
            }

            onSuccess();
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="republica-form" onSubmit={handleRepublicaSubmit} noValidate>
            <div className="republica-form__grid">
                <label className="republica-form__field republica-form__field--full">
                    <span>Nome da república *</span>
                    <input className="field__input" type="text" name="nombre_republica" value={republicaForm.nombre_republica} onChange={handleRepublicaFormChange} required placeholder="Ex: República Horizonte" />
                </label>
                <label className="republica-form__field republica-form__field--full">
                    <span>Endereço *</span>
                    <input className="field__input" type="text" name="direccion" value={republicaForm.direccion} onChange={handleRepublicaFormChange} required placeholder="Rua, número, bairro" />
                </label>
                <label className="republica-form__field">
                    <span>Preço (R$) *</span>
                    <input className="field__input" type="number" step="0.01" min="1" name="precio" value={republicaForm.precio} onChange={handleRepublicaFormChange} required placeholder="850.00" />
                </label>
                <label className="republica-form__field">
                    <span>Nº de quartos *</span>
                    <input className="field__input" type="number" min="1" name="num_habitaciones" value={republicaForm.num_habitaciones} onChange={handleRepublicaFormChange} required placeholder="3" />
                </label>
                <label className="republica-form__field">
                    <span>Gênero permitido *</span>
                    <select className="field__select" name="genero_permitido" value={republicaForm.genero_permitido} onChange={handleRepublicaFormChange} required>
                        <option value="mixto">Mixto</option>
                        <option value="solo hombres">Solo hombres</option>
                        <option value="solo mujeres">Solo mujeres</option>
                    </select>
                </label>
                <label className="republica-form__field republica-form__field--full">
                    <span>Descrição</span>
                    <textarea className="field__textarea" name="descripcion" rows="3" value={republicaForm.descripcion} onChange={handleRepublicaFormChange} placeholder="Descreva sua república..."></textarea>
                </label>

                {/* Sección de carga de imágenes */}
                <div className="republica-form__field republica-form__field--full">
                    <span style={{ fontSize: "1.1rem", fontWeight: 600, borderBottom: "2px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "block" }}>
                        Fotos da República
                    </span>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        Suba imagens representativas de cada área para destacar seu anúncio. Apenas a foto da Fachada é obrigatória.
                    </p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                        {CATEGORIAS_FOTOS.map((cat) => (
                            <div key={cat.id} className="foto-upload-box" style={{ border: "1px dashed var(--border-color)", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", backgroundColor: "var(--bg-secondary)", position: "relative", overflow: "hidden" }}>
                                {fotosData[cat.id].preview ? (
                                    <>
                                        <img src={fotosData[cat.id].preview} alt={cat.label} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "4px", marginBottom: "0.5rem" }} />
                                        <label className="btn btn--small" style={{ cursor: "pointer", width: "100%", padding: "0.25rem" }}>
                                            Trocar
                                            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => handleFotoChange(cat.id, e)} />
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: "2rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>📸</span>
                                        <span style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.5rem" }}>{cat.label} {cat.required ? '*' : ''}</span>
                                        <label className="btn btn--small btn--secondary" style={{ cursor: "pointer", width: "100%", padding: "0.25rem" }}>
                                            Fazer upload
                                            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => handleFotoChange(cat.id, e)} />
                                        </label>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="republica-form__actions">
                <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : editingRepublica ? "Atualizar república" : "Cadastrar república"}
                </button>
                <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            </div>
        </form>
    );
}
