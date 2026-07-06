import { useEffect, useMemo, useRef, useState } from "react";
import { loginDemo, checkStatus, registerUser, setAuthToken, clearAuthToken, getRepublicas, createRepublica, updateRepublica, deleteRepublica, uploadRepublicaFoto } from "../controllers/apiController";
import { UserProfile } from "../models/userProfileModel";
import { Republica } from "../models/republicaModel";
import "../styles/login.css";

const USER_MENU_ITEMS = [
    { label: "Meu Perfil", target: "meu-perfil" },
    { label: "Favoritos", target: "favoritos" },
    { label: "Configurações", target: "configuracoes" },
];

export default function HomeView() {
    const [mode, setMode] = useState("login");
    const [authUser, setAuthUser] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
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
    const userMenuRef = useRef(null);
    const userMenuPanelRef = useRef(null);
    const [profileEditMode, setProfileEditMode] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ name: "", phone: "" });

    // Republica states
    const [republicas, setRepublicas] = useState([]);
    const [allRepublicas, setAllRepublicas] = useState([]);
    const [favoriteRepublicaIds, setFavoriteRepublicaIds] = useState([]);
    const [loadingRepublicas, setLoadingRepublicas] = useState(false);
    const [filters, setFilters] = useState({ minPrecio: "", maxPrecio: "", habitaciones: "", genero: "" });
    const [selectedRepublica, setSelectedRepublica] = useState(null);

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
    });
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                await checkStatus();
            } catch (error) {
                // ignore
            }
        };
        checkBackend();
    }, []);

    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            const userString = localStorage.getItem("user");
            if (token && userString) {
                setAuthToken(token);
                setAuthUser(JSON.parse(userString));
            }
        } catch (e) {
            // ignore
        }
    }, []);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleDocumentClick = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleDocumentClick);

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick);
        };
    }, []);

    // Cerrar menú con Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && userMenuOpen) {
                setUserMenuOpen(false);
                // Devolver foco al trigger
                const trigger = userMenuRef.current?.querySelector(".user-menu__trigger");
                trigger?.focus();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [userMenuOpen]);

    useEffect(() => {
        const storageKey = `repop-favorites-${authUser?.id ?? "guest"}`;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setFavoriteRepublicaIds(JSON.parse(saved));
            } else {
                setFavoriteRepublicaIds([]);
            }
        } catch (e) {
            setFavoriteRepublicaIds([]);
        }
    }, [authUser?.id]);

    useEffect(() => {
        const storageKey = `repop-favorites-${authUser?.id ?? "guest"}`;
        try {
            localStorage.setItem(storageKey, JSON.stringify(favoriteRepublicaIds));
        } catch (e) {}
    }, [favoriteRepublicaIds, authUser?.id]);

    // Cargar repúblicas cuando el usuario esté autenticado
    useEffect(() => {
        if (authUser) {
            cargarRepublicas();
        }
    }, [authUser]);

    const cargarRepublicas = async () => {
        setLoadingRepublicas(true);
        try {
            const data = await getRepublicas();
            const mapped = Republica.fromList(data);
            setAllRepublicas(mapped);
            setRepublicas(mapped);
        } catch (e) {
            const fallbackData = [
                { id_republica: 1, nombre_republica: "República Horizonte", direccion: "Rua do Ouvidor, 123", precio: 850.00, num_habitaciones: 3, genero_permitido: "mixto", descripcion: "Próximo ao centro, ambiente tranquilo e regras claras para convivência." },
                { id_republica: 2, nombre_republica: "Casa das Ladeiras", direccion: "Rua dos Inconfidentes, 45", precio: 650.00, num_habitaciones: 2, genero_permitido: "solo mujeres", descripcion: "Quartos individuais, internet estável e perfil ideal para quem estuda à noite." },
                { id_republica: 3, nombre_republica: "Solar do Pilar", direccion: "Rua do Pilar, 789", precio: 720.00, num_habitaciones: 4, genero_permitido: "solo hombres", descripcion: "Espaço compartilhado com boa mobilidade e preferência para calouros." },
                { id_republica: 4, nombre_republica: "República Aurora", direccion: "Rua Direita, 200", precio: 900.00, num_habitaciones: 2, genero_permitido: "mixto", descripcion: "Centro histórico, 2 vagas, banho quente." },
                { id_republica: 5, nombre_republica: "República Mineira", direccion: "Bauxita, 56", precio: 550.00, num_habitaciones: 1, genero_permitido: "solo hombres", descripcion: "Ambiente silencioso, ideal para estudos." },
                { id_republica: 6, nombre_republica: "República Acácia", direccion: "Rosário, 340", precio: 780.00, num_habitaciones: 4, genero_permitido: "mixto", descripcion: "Área de estudos, ótima convivência." },
            ];
            const mappedFallback = Republica.fromList(fallbackData);
            setAllRepublicas(mappedFallback);
            setRepublicas(mappedFallback);
        }
        setLoadingRepublicas(false);
    };

    const aplicarFiltros = async () => {
        setLoadingRepublicas(true);
        try {
            const filtros = {};
            if (filters.minPrecio) filtros.minPrecio = Number(filters.minPrecio);
            if (filters.maxPrecio) filtros.maxPrecio = Number(filters.maxPrecio);
            if (filters.habitaciones) filtros.habitaciones = Number(filters.habitaciones);
            if (filters.genero) filtros.genero = filters.genero;
            const data = await getRepublicas(filtros);
            setRepublicas(Republica.fromList(data));
        } catch (e) {
            let fuente = allRepublicas.length > 0 ? allRepublicas : Republica.fromList([
                { id_republica: 1, nombre_republica: "República Horizonte", direccion: "Rua do Ouvidor, 123", precio: 850.00, num_habitaciones: 3, genero_permitido: "mixto", descripcion: "Próximo ao centro, ambiente tranquilo." },
                { id_republica: 2, nombre_republica: "Casa das Ladeiras", direccion: "Rua dos Inconfidentes, 45", precio: 650.00, num_habitaciones: 2, genero_permitido: "solo mujeres", descripcion: "Quartos individuais, internet estável." },
                { id_republica: 3, nombre_republica: "Solar do Pilar", direccion: "Rua do Pilar, 789", precio: 720.00, num_habitaciones: 4, genero_permitido: "solo hombres", descripcion: "Espaço compartilhado, boa mobilidade." },
            ]);
            let filtradas = [...fuente];
            if (filters.minPrecio) filtradas = filtradas.filter(r => r.precio >= Number(filters.minPrecio));
            if (filters.maxPrecio) filtradas = filtradas.filter(r => r.precio <= Number(filters.maxPrecio));
            if (filters.habitaciones) filtradas = filtradas.filter(r => r.habitaciones >= Number(filters.habitaciones));
            if (filters.genero) filtradas = filtradas.filter(r => r.genero === filters.genero);
            setRepublicas(filtradas);
        }
        setLoadingRepublicas(false);
    };

    const limpiarFiltros = () => {
        setFilters({ minPrecio: "", maxPrecio: "", habitaciones: "", genero: "" });
        if (allRepublicas.length > 0) {
            setRepublicas(allRepublicas);
        } else {
            cargarRepublicas();
        }
    };

    const toggleFavorite = (rep) => {
        const repId = rep.id;
        const alreadyFavorite = favoriteRepublicaIds.includes(repId);
        setFavoriteRepublicaIds((prev) => alreadyFavorite
            ? prev.filter((id) => id !== repId)
            : [...prev, repId]);
        setStatus({
            type: "success",
            message: alreadyFavorite
                ? "República removida dos favoritos."
                : "República adicionada aos favoritos.",
        });
    };

    const favoriteRepublicas = useMemo(() =>
        allRepublicas.filter((rep) => favoriteRepublicaIds.includes(rep.id)),
        [allRepublicas, favoriteRepublicaIds]
    );

    const handleSelectRepublica = (rep) => {
        setSelectedRepublica(rep);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBackToList = () => {
        setSelectedRepublica(null);
    };

    const isUfopEmail = useMemo(
        () => registerData.correo.trim().toLowerCase().endsWith("@aluno.ufop.edu.br"),
        [registerData.correo]
    );

    const userInitials = useMemo(() => {
        if (!authUser?.name) {
            return "R";
        }

        const nameParts = authUser.name.trim().split(/\s+/).filter(Boolean);
        const firstInitial = nameParts[0]?.[0] ?? "R";
        const secondInitial = nameParts[1]?.[0] ?? authUser.name.trim()[1] ?? "";

        return `${firstInitial}${secondInitial}`.toUpperCase();
    }, [authUser]);

    const userProfile = useMemo(() => UserProfile.fromAuthUser(authUser), [authUser]);
    const esDuenho = authUser?.role === "dueño";

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
            if (response.access_token) {
                setAuthToken(response.access_token);
            }
            try {
                localStorage.setItem("user", JSON.stringify(response.user));
            } catch (e) {}

            setAuthUser(response.user);
            setUserMenuOpen(false);
            setStatus({ type: "success", message: response.message });
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

    const handleLogout = () => {
        setAuthUser(null);
        setUserMenuOpen(false);
        setProfileEditMode(false);
        clearAuthToken();
        try {
            localStorage.removeItem("user");
        } catch (e) {}
        setStatus({ type: "idle", message: "Sesión cerrada. Puedes volver a ingresar." });
    };

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
            const updatedUser = {
                ...authUser,
                name: profileFormData.name.trim() || authUser.name,
                phone: profileFormData.phone.trim(),
            };
            setAuthUser(updatedUser);
            try {
                localStorage.setItem("user", JSON.stringify(updatedUser));
            } catch (e) {}
            setProfileEditMode(false);
            setStatus({ type: "success", message: "Perfil atualizado com sucesso." });
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Dueño - Repubblica form handlers
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

    const openCreateForm = () => {
        setEditingRepublica(null);
        setRepublicaForm({
            nombre_republica: "",
            direccion: "",
            precio: "",
            num_habitaciones: "",
            genero_permitido: "mixto",
            descripcion: "",
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
            precio: String(rep.precio),
            num_habitaciones: String(rep.habitaciones),
            genero_permitido: rep.genero,
            descripcion: rep.descripcion || "",
        });
        setFotoFile(null);
        setFotoPreview(rep.fotoUrl || null);
        setShowRepublicaForm(true);
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

            // Si el dueño seleccionó una foto, la subimos ahora
            if (fotoFile && savedRepublica?.id_republica) {
                await uploadRepublicaFoto(savedRepublica.id_republica, fotoFile);
            }

            setShowRepublicaForm(false);
            setEditingRepublica(null);
            setFotoFile(null);
            setFotoPreview(null);
            cargarRepublicas();
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRepublica = async (id) => {
        if (!confirm("¿Estás seguro de eliminar esta república?")) return;
        try {
            await deleteRepublica(id);
            setStatus({ type: "success", message: "República eliminada." });
            cargarRepublicas();
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        }
    };

    const cancelRepublicaForm = () => {
        setShowRepublicaForm(false);
        setEditingRepublica(null);
    };

    // Navegación por scroll con secciones
    const scrollToSection = (target) => {
        if (esDuenho) {
            const sectionMap = {
                "meu-perfil": "duenho-perfil",
                "minha-republica": "duenho-republica",
                "favoritos": "duenho-favoritos",
                "configuracoes": "duenho-config",
            };
            const el = document.getElementById(sectionMap[target] || target);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            const el = document.getElementById(target);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setUserMenuOpen(false);
    };

    const DUENHO_NAV_ITEMS = [
        { label: "Minha Rep", target: "minha-republica" },
        { label: "Gerenciar", target: "gerenciar" },
        { label: "Meu Perfil", target: "meu-perfil" },
    ];

    const BUSCADOR_NAV_ITEMS = [
        { label: "Repúblicas", target: "buscador-grid" },
        { label: "Favoritos", target: "favoritos" },
        { label: "Meu Perfil", target: "meu-perfil" },
    ];

    // ────────────────────────
    // R E N D E R   C A R D   (reutilizable)
    // ────────────────────────
    const renderRepublicaCard = (rep, isFavorite) => (
        <article key={rep.id} className="republica-card" aria-label={`República ${rep.nombre}`}>
            <button
                type="button"
                className="republica-card__link"
                onClick={() => handleSelectRepublica(rep)}
                aria-label={`Ver detalles de ${rep.nombre}`}
            >
                <div className="republica-card__image">
                    {rep.fotoSrc ? (
                        <img
                            src={rep.fotoSrc}
                            alt={`Foto da república ${rep.nombre}`}
                            className="republica-card__img"
                            loading="lazy"
                        />
                    ) : (
                        <div className="republica-card__placeholder" aria-hidden="true">
                            <span>🏠</span>
                        </div>
                    )}
                    <span className="republica-card__genero">{rep.generoLabel}</span>
                </div>
                <div className="republica-card__body">
                    <h3 className="republica-card__title">{rep.nombre}</h3>
                    <p className="republica-card__direccion">{rep.direccion}</p>
                    <p className="republica-card__descripcion">{rep.descripcion}</p>
                    <div className="republica-card__details">
                        <span className="republica-card__precio">{rep.precioFormateado}</span>
                        <span className="republica-card__habitaciones">{rep.habitaciones} quarto{rep.habitaciones !== 1 ? "s" : ""}</span>
                    </div>
                </div>
            </button>
            <div className="republica-card__footer">
                <button
                    className={`btn btn--favorite ${isFavorite ? "btn--primary" : ""}`}
                    onClick={() => toggleFavorite(rep)}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? `Remover ${rep.nombre} dos favoritos` : `Adicionar ${rep.nombre} aos favoritos`}
                    type="button"
                >
                    {isFavorite ? "★ Favorito" : "☆ Favoritar"}
                </button>
            </div>
        </article>
    );

    // ────────────────────────
    // B U S C A D O R   V I E W
    // ────────────────────────
    const renderRepublicaDetailView = () => (
        <div className="dashboard-page">
            <section className="dashboard-section" aria-labelledby="republica-detalle-heading">
                <div className="dashboard-section__header">
                    <button className="btn btn--secondary" type="button" onClick={handleBackToList} aria-label="Volver a la lista de repúblicas">
                        ← Volver
                    </button>
                    <span className="badge-section" style={{ marginLeft: "1rem" }}>Detalle</span>
                    <h2 id="republica-detalle-heading">{selectedRepublica?.nombre}</h2>
                </div>

                <div className="republica-detail-card">
                    {selectedRepublica?.fotoSrc ? (
                        <img src={selectedRepublica.fotoSrc} alt={`Foto de ${selectedRepublica.nombre}`} className="republica-detail-card__img" />
                    ) : (
                        <div className="republica-detail-card__placeholder">🏠</div>
                    )}

                    <div className="republica-detail-card__content">
                        <p><strong>Dirección:</strong> {selectedRepublica?.direccion}</p>
                        <p><strong>Precio:</strong> {selectedRepublica?.precioFormateado}</p>
                        <p><strong>Cuartos:</strong> {selectedRepublica?.habitaciones}</p>
                        <p><strong>Género permitido:</strong> {selectedRepublica?.generoLabel}</p>
                        <p><strong>Descripción:</strong> {selectedRepublica?.descripcion || "Información de la república próximamente."}</p>
                        <p><strong>Más detalles:</strong> En construcción. Aquí se mostrará información adicional sobre la república.</p>
                        <div className="republica-detail-card__actions">
                            <button type="button" className="btn btn--secondary" aria-label="Contactar por email al decano">
                                Email
                            </button>
                            <button type="button" className="btn btn--secondary" aria-label="Contactar por Whatsapp al decano">
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderBuscadorView = () => {
        if (selectedRepublica) {
            return renderRepublicaDetailView();
        }

        return (
            <div className="dashboard-page">
                {/* Buscador + Filtros */}
                <section className="dashboard-section" id="buscador-grid" aria-labelledby="buscador-heading">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Buscar</span>
                        <h2 id="buscador-heading">Encontre a república ideal</h2>
                    </div>

                <div className="filtros-grid" role="search" aria-label="Filtros de búsqueda">
                    <div className="filtro-item">
                        <label htmlFor="filtro-minPrecio">Preço mín.</label>
                        <input
                            id="filtro-minPrecio"
                            className="field__input"
                            type="number"
                            placeholder="R$ 0"
                            value={filters.minPrecio}
                            onChange={(e) => setFilters(f => ({ ...f, minPrecio: e.target.value }))}
                        />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-maxPrecio">Preço máx.</label>
                        <input
                            id="filtro-maxPrecio"
                            className="field__input"
                            type="number"
                            placeholder="R$ 5000"
                            value={filters.maxPrecio}
                            onChange={(e) => setFilters(f => ({ ...f, maxPrecio: e.target.value }))}
                        />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-habitaciones">Quartos mín.</label>
                        <input
                            id="filtro-habitaciones"
                            className="field__input"
                            type="number"
                            placeholder="1"
                            value={filters.habitaciones}
                            onChange={(e) => setFilters(f => ({ ...f, habitaciones: e.target.value }))}
                        />
                    </div>
                    <div className="filtro-item">
                        <label htmlFor="filtro-genero">Gênero</label>
                        <select
                            id="filtro-genero"
                            className="field__select"
                            value={filters.genero}
                            onChange={(e) => setFilters(f => ({ ...f, genero: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            <option value="solo hombres">Solo hombres</option>
                            <option value="solo mujeres">Solo mujeres</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </div>
                    <div className="filtro-actions">
                        <button className="btn btn--primary" onClick={aplicarFiltros} aria-label="Aplicar filtros">Filtrar</button>
                        <button className="btn" onClick={limpiarFiltros} aria-label="Limpiar filtros">Limpar</button>
                    </div>
                </div>
            </section>

            {/* Grid de repúblicas */}
            <section className="dashboard-section" aria-labelledby="resultados-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Resultados</span>
                    <h2 id="resultados-heading">{republicas.length} república{republicas.length !== 1 ? "s" : ""} encontrada{republicas.length !== 1 ? "s" : ""}</h2>
                </div>

                {loadingRepublicas ? (
                    <div className="spinner" role="status" aria-live="polite">
                        <p>Buscando repúblicas...</p>
                    </div>
                ) : republicas.length === 0 ? (
                    <div className="spinner" role="status">
                        <p>Nenhuma república encontrada com esses filtros.</p>
                    </div>
                ) : (
                    <div className="republicas-grid" role="list" aria-label="Lista de repúblicas">
                        {republicas.map((rep) => renderRepublicaCard(rep, favoriteRepublicaIds.includes(rep.id)))}
                    </div>
                )}
            </section>

            {/* Favoritos */}
            <section className="dashboard-section" id="favoritos" aria-labelledby="favoritos-heading">
                <div className="dashboard-section__header">
                    <span className="badge-section">Favoritos</span>
                    <h2 id="favoritos-heading">Repúblicas que você salvou</h2>
                </div>
                {favoriteRepublicas.length === 0 ? (
                    <div className="spinner" role="status">
                        <p>Você ainda não salvou nenhuma república como favorita.</p>
                    </div>
                ) : (
                    <div className="republicas-grid" role="list" aria-label="Lista de favoritos">
                        {favoriteRepublicas.map((rep) => renderRepublicaCard(rep, true))}
                    </div>
                )}
            </section>

            {/* Perfil Seeker */}
            <section className="dashboard-section dashboard-section--profile" id="meu-perfil" aria-labelledby="perfil-heading">
                {renderProfileSection()}
            </section>

            <div className={`status-box status-box--${status.type}`} role="alert" aria-live="polite" aria-atomic="true">
                {status.message}
            </div>
        </div>
    );
};

    // ────────────────────────
    // D U E Ñ O   D A S H B O A R D
    // ────────────────────────
    const renderDuenhoDashboard = () => {
        const miRepublica = republicas.find(r => r.idDuenho === authUser?.id);

        return (
            <div className="dashboard-page">
                {/* Resumen */}
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

                {/* Gestión de la república */}
                <section className="dashboard-section" id="duenho-republica" aria-labelledby="duenho-republica-heading">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Minha Rep</span>
                        <h2 id="duenho-republica-heading">{miRepublica ? "Sua república" : "Cadastre sua república"}</h2>
                    </div>

                    {miRepublica && !showRepublicaForm ? (
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
                                        placeholder="Rua, número, bairro"
                                    />
                                </label>
                                <label className="republica-form__field">
                                    <span>Preço (R$) *</span>
                                    <input
                                        className="field__input"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        name="precio"
                                        value={republicaForm.precio}
                                        onChange={handleRepublicaFormChange}
                                        required
                                        placeholder="850.00"
                                    />
                                </label>
                                <label className="republica-form__field">
                                    <span>Nº de quartos *</span>
                                    <input
                                        className="field__input"
                                        type="number"
                                        min="1"
                                        name="num_habitaciones"
                                        value={republicaForm.num_habitaciones}
                                        onChange={handleRepublicaFormChange}
                                        required
                                        placeholder="3"
                                    />
                                </label>
                                <label className="republica-form__field">
                                    <span>Gênero permitido *</span>
                                    <select
                                        className="field__select"
                                        name="genero_permitido"
                                        value={republicaForm.genero_permitido}
                                        onChange={handleRepublicaFormChange}
                                        required
                                    >
                                        <option value="mixto">Mixto</option>
                                        <option value="solo hombres">Solo hombres</option>
                                        <option value="solo mujeres">Solo mujeres</option>
                                    </select>
                                </label>
                                <label className="republica-form__field republica-form__field--full">
                                    <span>Foto da república (opcional)</span>
                                    <input
                                        className="field__input"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFotoFileChange}
                                        style={{ padding: "0.4rem 0" }}
                                    />
                                    {fotoPreview && (
                                        <img
                                            src={fotoPreview}
                                            alt="Preview da foto da república"
                                            style={{
                                                marginTop: "0.6rem",
                                                width: "100%",
                                                maxHeight: "180px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                border: "1px solid var(--color-border)",
                                            }}
                                        />
                                    )}
                                    <small className="field__help">
                                        Formatos aceitos: JPG, PNG, WebP · Máx. 5 MB
                                    </small>
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
                    ) : !miRepublica ? (
                        <div className="spinner" role="status">
                            <p>Você ainda não cadastrou nenhuma república.</p>
                            <button className="btn btn--primary" onClick={openCreateForm} style={{ marginTop: "0.5rem" }}>
                                Cadastrar minha república
                            </button>
                        </div>
                    ) : null}

                    {miRepublica && !showRepublicaForm ? (
                        <div className="spinner" role="status" style={{ marginTop: "0.5rem" }}>
                            <button className="btn btn--primary" onClick={openCreateForm}>
                                Cadastrar nova república
                            </button>
                        </div>
                    ) : null}
                </section>

                {/* Gerenciar */}
                <section className="dashboard-section" id="duenho-favoritos" aria-labelledby="gerenciar-heading">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Gerenciar</span>
                        <h2 id="gerenciar-heading">Candidatos e mensagens</h2>
                    </div>
                    <div className="spinner" role="status">
                        <p>Nenhum candidato ainda. Quando alguém se interessar pela sua república, aparecerá aqui.</p>
                    </div>
                </section>

                <section className="dashboard-section" id="duenho-config" aria-labelledby="config-heading">
                    <div className="dashboard-section__header">
                        <span className="badge-section">Configurações</span>
                        <h2 id="config-heading">Ajustes da conta</h2>
                    </div>
                    <div className="spinner" role="status">
                        <p>Funcionalidade em desenvolvimento.</p>
                    </div>
                </section>

                {/* Perfil */}
                <section className="dashboard-section dashboard-section--profile" id="duenho-perfil" aria-labelledby="duenho-perfil-heading">
                    {renderProfileSection()}
                </section>

                <div className={`status-box status-box--${status.type}`} role="alert" aria-live="polite" aria-atomic="true">
                    {status.message}
                </div>
            </div>
        );
    };

    // ────────────────────────
    // P R O F I L E   (reutilizable)
    // ────────────────────────
    const renderProfileSection = () => (
        <>
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
                        <span className="profile-hero-card__email">{authUser?.email ?? formData.email}</span>
                        <div className="profile-hero-card__badges">
                            <span className="badge badge--role">
                                {userProfile?.roleIcon} {userProfile?.roleLabel || authUser?.role || "Sem função"}
                            </span>
                            {userProfile?.isUfopEmail ? (
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
        </>
    );

    // ────────────────────────
    // A P P   S H E L L   (header + contenido)
    // ────────────────────────
    const renderAuthShell = () => {
        const navItems = esDuenho ? DUENHO_NAV_ITEMS : BUSCADOR_NAV_ITEMS;

        return (
            <>
                {/* Skip-to-content link for keyboard users */}
                <a href="#main-content" className="skip-link">
                    Pular para o conteúdo principal
                </a>

                <div className="app-shell">
                    <header className="app-header" role="banner">
                        <div className="app-header__inner">
                            <a className="app-header__brand" href="#" onClick={(event) => event.preventDefault()} aria-label="RepOP - Ir para o início">
                                <img className="app-header__logo" src="/images/logo.png" alt="" aria-hidden="true" />
                                <span className="app-header__brand-text">
                                    <strong>RepOP</strong>
                                    <span>Moradias em Ouro Preto</span>
                                </span>
                            </a>

                            <nav className="app-header__nav" aria-label="Navegação principal">
                                {navItems.map((item) => (
                                    <button
                                        key={item.target}
                                        type="button"
                                        className="app-header__nav-link"
                                        onClick={() => scrollToSection(item.target)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>

                            <div className="app-header__actions">
                                <div className="user-menu" ref={userMenuRef}>
                                    <button
                                        type="button"
                                        className="user-menu__trigger"
                                        aria-haspopup="true"
                                        aria-expanded={userMenuOpen}
                                        aria-controls="user-menu-panel"
                                        onClick={() => setUserMenuOpen((current) => !current)}
                                    >
                                        <span className="user-menu__avatar" aria-hidden="true">{userInitials}</span>
                                        <span className="user-menu__copy">
                                            <strong>{authUser?.name ?? "Usuário logado"}</strong>
                                            <span>{esDuenho ? "Decano" : "Buscador"}</span>
                                        </span>
                                    </button>

                                    {userMenuOpen ? (
                                        <div
                                            id="user-menu-panel"
                                            className="user-menu__panel"
                                            role="menu"
                                            aria-label="Menu do usuário"
                                            ref={userMenuPanelRef}
                                        >
                                            {USER_MENU_ITEMS.map((item) => (
                                                <button
                                                    key={item.target}
                                                    type="button"
                                                    className="user-menu__item"
                                                    onClick={() => scrollToSection(item.target)}
                                                    role="menuitem"
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="user-menu__item user-menu__item--danger"
                                                onClick={handleLogout}
                                                role="menuitem"
                                            >
                                                Sair
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </header>

                    <main id="main-content">
                        {esDuenho ? renderDuenhoDashboard() : renderBuscadorView()}
                    </main>
                </div>
            </>
        );
    };

    // ────────────────────────
    // R E N D E R   L O G I N   /   A P P
    // ────────────────────────
    return (
        authUser ? (
            renderAuthShell()
        ) : (
            <>
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
            </>
        )
    );
}