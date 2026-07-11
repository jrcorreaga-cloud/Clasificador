import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginDemo, registerUser } from '../controllers/apiController';
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';

export default function LoginView() {
    const [mode, setMode] = useState("login");
    const [formData, setFormData] = useState({
        email: "demo@repop.com",
        password: "repop123",
    });
    const [registerData, setRegisterData] = useState({
        nombre: "",
        correo: "",
        contrasenia: "",
        confirmPassword: "",
        telefono: "",
        rol: "",
    });
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const isUfopEmail = useMemo(
        () => registerData.correo.trim().toLowerCase().endsWith("@aluno.ufop.edu.br"),
        [registerData.correo]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleRegisterChange = (event) => {
        const { name, value } = event.target;
        setRegisterData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: "idle", message: "" });

        try {
            const response = await loginDemo(formData);
            login(response.user, response.access_token);
            navigate('/');
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: "idle", message: "" });

        const requiredFields = ["nombre", "correo", "contrasenia", "confirmPassword", "rol"];
        const hasEmptyField = requiredFields.some((field) => !registerData[field].trim());

        if (hasEmptyField) {
            setStatus({ type: "error", message: "Completa todos los campos obligatorios para registrarte." });
            setIsSubmitting(false);
            return;
        }

        if (registerData.contrasenia !== registerData.confirmPassword) {
            setStatus({ type: "error", message: "Las contraseñas no coinciden." });
            setIsSubmitting(false);
            return;
        }

        try {
            const userData = {
                nombre: registerData.nombre,
                correo: registerData.correo,
                contrasenia: registerData.contrasenia,
                telefono: registerData.telefono || null,
                rol: registerData.rol,
            };

            const response = await registerUser(userData);
            setStatus({
                type: "success",
                message: `${response.nombre}, tu cuenta fue creada exitosamente. Ahora puedes iniciar sesión.`,
            });
            setMode("login");
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <a href="#login-content" className="skip-link">
                Pular para o conteúdo
            </a>

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
                                <button type="button" className="btn btn--full" onClick={() => setMode("register")}>
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
                                <fieldset className="rol-fieldset">
                                    <legend>Rol</legend>
                                    <div className="rol-options">
                                        <label>
                                            <input type="radio" name="rol" value="dueño" checked={registerData.rol === "dueño"} onChange={handleRegisterChange} />
                                            Dueño (quiero alquilar)
                                        </label>
                                        <label>
                                            <input type="radio" name="rol" value="buscador" checked={registerData.rol === "buscador"} onChange={handleRegisterChange} />
                                            Buscador (quiero alquilar)
                                        </label>
                                    </div>
                                </fieldset>
                                <div className="login-form__grid">
                                    <label className="field">
                                        <span className="field__label">Contraseña</span>
                                        <input
                                            className="field__input"
                                            type="password"
                                            name="contrasenia"
                                            value={registerData.contrasenia}
                                            onChange={handleRegisterChange}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                        />
                                    </label>
                                    <label className="field">
                                        <span className="field__label">Confirmar contraseña</span>
                                        <input
                                            className="field__input"
                                            type="password"
                                            name="confirmPassword"
                                            value={registerData.confirmPassword}
                                            onChange={handleRegisterChange}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                        />
                                    </label>
                                </div>
                                <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                                    {isSubmitting ? "Registrando..." : "Crear cuenta"}
                                </button>
                                <button type="button" className="btn btn--full" onClick={() => setMode("login")}>Ya tengo cuenta</button>
                            </form>
                        )}
                    </div>

                    <div className={`status-box status-box--${status.type}`} role="alert" aria-live="polite" aria-atomic="true">
                        {status.message}
                    </div>
                </section>
            </main>
        </div>
    );
}
