const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export class Republica {
  constructor(data) {
    this.id = data.id_republica;
    this.nombre = data.nombre_republica;
    this.direccion = data.direccion;
    this.precio = data.precio;
    this.habitaciones = data.num_habitaciones;
    this.genero = data.genero_permitido;
    this.fotoUrl = data.foto_url;
    this.descripcion = data.descripcion;
    this.idDuenho = data.id_duenho;
    this.fechaCreacion = data.fecha_creacion;
  }

  get generoLabel() {
    const labels = {
      "solo hombres": "Solo hombres",
      "solo mujeres": "Solo mujeres",
      "mixto": "Mixto",
    };
    return labels[this.genero] || this.genero;
  }

  get precioFormateado() {
    return `R$ ${Number(this.precio).toFixed(2).replace(".", ",")}`;
  }

  /**
   * Retorna la URL completa hacia el backend.
   * Si la fotoUrl es relativa, se antepone API_BASE.
   * Si es absoluta (S3), se usa directamente.
   */
  get fotoSrc() {
    if (!this.fotoUrl) return "";
    if (this.fotoUrl.startsWith("http://") || this.fotoUrl.startsWith("https://")) {
      return this.fotoUrl;
    }
    // Es una ruta relativa como "/static/uploads/abc.jpg" → la completa con el backend
    return `${API_BASE}${this.fotoUrl}`;
  }

  static fromList(dataList) {
    return (dataList || []).map((d) => new Republica(d));
  }
}
