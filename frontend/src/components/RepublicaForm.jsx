import React, { useState, useEffect } from 'react';
import { createRepublica, updateRepublica, uploadRepublicaFoto } from '../controllers/apiController';

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
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

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
            setFotoPreview(editingRepublica.fotoSrc || null);
        }
    }, [editingRepublica]);

    const handleRepublicaFormChange = (e) => {
        const { name, value } = e.target;
        setRepublicaForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFotoFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFotoFile(file);
        setFotoPreview(URL.createObjectURL(file));
    };

    const handleRepublicaSubmit = async (e) => {
        e.preventDefault();
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

            if (fotoFile && savedRepublica?.id_republica) {
                await uploadRepublicaFoto(savedRepublica.id_republica, fotoFile);
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
                    <span>Foto da república (opcional)</span>
                    <input className="field__input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFotoFileChange} />
                    {fotoPreview && <img src={fotoPreview} alt="Preview" style={{ marginTop: "0.6rem", width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "8px" }} />}
                </label>
                <label className="republica-form__field republica-form__field--full">
                    <span>Descrição</span>
                    <textarea className="field__textarea" name="descripcion" rows="3" value={republicaForm.descripcion} onChange={handleRepublicaFormChange} placeholder="Descreva sua república..."></textarea>
                </label>
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
