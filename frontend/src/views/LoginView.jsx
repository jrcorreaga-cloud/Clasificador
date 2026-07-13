import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginDemo, checkStatus, registerUser } from '../controllers/apiController';
import { UserProfile } from '../models/userProfileModel';
import '../styles/login.css';

export default function LoginView() {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [mode, setMode] = useState("login");
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({ nombre: "", correo: "", password: "", telefono: "", rol: "seeker" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState({ type: "idle", message: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: "idle", message: "" });
        try {
            const data = await loginDemo(formData.email, formData.password);
            const user = new UserProfile(
                data.user.id_usuario,
                data.user.nombre,
                data.user.correo,
                data.user.rol,
                data.user.es_verificado_ufop,
                data.user.telefono
            );
            login(user, data.access_token);
        } catch (err) {
            setStatus({ type: "error", message: err.message || "Credenciales incorrectas" });
        }
        setIsSubmitting(false);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: "idle", message: "" });
        try {
            const res = await registerUser(registerData);
            setStatus({ type: "success", message: res.msg || "Registro exitoso. Ahora puedes iniciar sesión." });
            setMode("login");
            setFormData({ email: registerData.correo, password: registerData.password });
        } catch (err) {
            setStatus({ type: "error", message: err.message || "Error al registrarse" });
        }
        setIsSubmitting(false);
    };

    const isUfopEmail = registerData.correo.endsWith("@aluno.ufop.edu.br");

    return (
        <main className="login-shell" id="login-content">
            <section className="login-hero">
                <div className="hero-copy">
                    <div className="hero-title-row">
                        <h1>RepOP - Moradias em Ouro Preto</h1>
                        <img className="hero-logo" src="/images/logo.png" alt="Logo do RepOP - Moradias em Ouro Preto" />
                    </div>
                </div>
            </section>

            <section className="login-card" aria-label={mode === "login" ? "Formulário de login" : "Formulário de registro"}>
                <div key={mode} className={`auth-view auth-view--${mode}`}>
                    <div className="login-card__header">
                        <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
                    </div>

                    {status.message && (
                        <div className={`status-message status-message--${status.type}`} role="alert">
                            {status.message}
                        </div>
                    )}

                    {mode === "login" ? (
                        <form className="login-form" onSubmit={handleSubmit} noValidate>
                            <label className="field">
                                <span className="field__label">Correo electrónico</span>
                                <input
                                    className="field__input"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="tu@correo.com"
                                    autoComplete="email"
                                />
                            </label>
                            <label className="field">
                                <span className="field__label">Contraseña</span>
                                <input
                                    className="field__input"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </label>
                            <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                                {isSubmitting ? "Ingresando..." : "Entrar"}
                            </button>
                            <button type="button" className="btn btn--full" onClick={() => { setMode("register"); setStatus({type: "idle", message: ""}) }}>
                                Registrarme
                            </button>
                        </form>
                    ) : (
                        <form className="login-form login-form--register" onSubmit={handleRegisterSubmit} noValidate>
                            <label className="field">
                                <span className="field__label">Nombre completo</span>
                                <input
                                    className="field__input"
                                    type="text"
                                    name="nombre"
                                    value={registerData.nombre}
                                    onChange={handleRegisterChange}
                                    placeholder="Tu nombre completo"
                                    autoComplete="name"
                                />
                            </label>
                            <label className="field">
                                <span className="field__label">Correo electrónico</span>
                                <input
                                    className="field__input"
                                    type="email"
                                    name="correo"
                                    value={registerData.correo}
                                    onChange={handleRegisterChange}
                                    placeholder="tu@correo.com"
                                    autoComplete="email"
                                />
                                {isUfopEmail ? (
                                    <span className="badge badge--ufop">Correo UFOP verificado</span>
                                ) : (
                                    <span className="badge badge--subtle">Usa @aluno.ufop.edu.br para verificación UFOP</span>
                                )}
                            </label>
                            <label className="field">
                                <span className="field__label">Teléfono (opcional)</span>
                                <input
                                    className="field__input"
                                    type="tel"
                                    name="telefono"
                                    value={registerData.telefono}
                                    onChange={handleRegisterChange}
                                    placeholder="+55 31 99999-9999"
                                    autoComplete="tel"
                                />
                            </label>
                            <div className="field-group">
                                <label className="field">
                                    <span className="field__label">Contraseña</span>
                                    <input
                                        className="field__input"
                                        type="password"
                                        name="password"
                                        value={registerData.password}
                                        onChange={handleRegisterChange}
                                        placeholder="Mín. 6 caracteres"
                                        autoComplete="new-password"
                                    />
                                </label>
                                <label className="field">
                                    <span className="field__label">¿Qué buscas?</span>
                                    <select
                                        className="field__select"
                                        name="rol"
                                        value={registerData.rol}
                                        onChange={handleRegisterChange}
                                    >
                                        <option value="seeker">Busco una república</option>
                                        <option value="owner">Soy dueño de república</option>
                                    </select>
                                </label>
                            </div>
                            <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                                {isSubmitting ? "Registrando..." : "Confirmar registro"}
                            </button>
                            <button type="button" className="btn btn--full" onClick={() => { setMode("login"); setStatus({type: "idle", message: ""}) }}>
                                Ya tengo cuenta
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
