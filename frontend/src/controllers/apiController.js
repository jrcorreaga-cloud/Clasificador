import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
            localStorage.setItem("token", token);
        } catch (e) {}
    } else {
        delete api.defaults.headers.common["Authorization"];
        try {
            localStorage.removeItem("token");
        } catch (e) {}
    }
}

export function clearAuthToken() {
    delete api.defaults.headers.common["Authorization"];
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    } catch (e) {}
}

const handleAxiosError = (err) => {
    if (err.response && err.response.data) {
        const data = err.response.data;
        // FastAPI validation errors (422) return detail as an array
        if (Array.isArray(data.detail)) {
            const messages = data.detail.map((e) => {
                const field = e.loc?.slice(1).join(".") || "campo";
                return `${field}: ${e.msg}`;
            });
            throw new Error(messages.join("; "));
        }
        throw new Error(data.detail || data.message || JSON.stringify(data));
    }
    throw err;
};

export const loginDemo = async (credentials) => {
    try {
        const res = await api.post("/api/auth/login", credentials);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

export const registerUser = async (userData) => {
    try {
        const res = await api.post("/api/auth/register", userData);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

export const checkStatus = async () => {
    try {
        const res = await api.get("/api/status", { headers: { "X-API-KEY": "demo-health-key" } });
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Obtiene los datos completos del perfil del usuario autenticado. */
export const getUserProfile = async () => {
    try {
        const res = await api.get("/api/auth/me");
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Actualiza los campos editables del perfil (nombre, teléfono). */
export const updateUserProfile = async (profileData) => {
    try {
        const res = await api.put("/api/auth/profile", profileData);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Obtiene todas las repúblicas con filtros opcionales */
export const getRepublicas = async (filters = {}) => {
    try {
        const params = {};
        if (filters.minPrecio) params.min_precio = filters.minPrecio;
        if (filters.maxPrecio) params.max_precio = filters.maxPrecio;
        if (filters.habitaciones) params.habitaciones = filters.habitaciones;
        if (filters.genero) params.genero = filters.genero;
        const res = await api.get("/api/republicas/", { params });
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Obtiene una república por ID */
export const getRepublica = async (id) => {
    try {
        const res = await api.get(`/api/republicas/${id}`);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Crea una nueva república (solo dueños) */
export const createRepublica = async (republicaData) => {
    try {
        const res = await api.post("/api/republicas/", republicaData);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Actualiza una república (solo el dueño) */
export const updateRepublica = async (id, republicaData) => {
    try {
        const res = await api.put(`/api/republicas/${id}`, republicaData);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Elimina una república (solo el dueño) */
export const deleteRepublica = async (id) => {
    try {
        await api.delete(`/api/republicas/${id}`);
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Obtiene las reseñas de una república */
export const getResenas = async (republicaId) => {
    try {
        const res = await api.get(`/api/republicas/${republicaId}/resenas`);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Crea una reseña en una república (solo buscadores) */
export const createResena = async (republicaId, resenaData) => {
    try {
        const res = await api.post(`/api/republicas/${republicaId}/resenas`, resenaData);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Edita mi reseña en una república */
export const updateMiResena = async (republicaId, resenaData) => {
    try {
        const res = await api.put(`/api/republicas/${republicaId}/resenas/mi-resena`, resenaData);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Elimina mi reseña de una república */
export const deleteMiResena = async (republicaId) => {
    try {
        await api.delete(`/api/republicas/${republicaId}/resenas/mi-resena`);
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Sube una foto a una república. Recibe el ID y un objeto File. */
export const uploadRepublicaFoto = async (id, file) => {
    try {
        const formData = new FormData();
        formData.append("foto", file);
        formData.append("categoria", categoria);
        const res = await api.post(`/api/republicas/${id}/foto`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Obtiene los IDs de las repúblicas favoritas del usuario autenticado. */
export const getFavoritos = async () => {
    try {
        const res = await api.get("/api/favoritos");
        return res.data.favoritos;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Agrega una república a favoritos del usuario autenticado. */
export const addFavorito = async (republicaId) => {
    try {
        const res = await api.post(`/api/favoritos/${republicaId}`);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};

/** Elimina una república de favoritos del usuario autenticado. */
export const removeFavorito = async (republicaId) => {
    try {
        const res = await api.delete(`/api/favoritos/${republicaId}`);
        return res.data;
    } catch (err) {
        handleAxiosError(err);
    }
};
