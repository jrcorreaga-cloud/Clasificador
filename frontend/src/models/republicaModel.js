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
    this.latitud = data.latitud;
    this.longitud = data.longitud;
    this.fotosRaw = data.fotos || [];
    
    // Agrupar fotos por categoría
    this.fotosPorCategoria = {
      casa: this.fotosRaw.find(f => f.categoria === 'casa'),
      sala: this.fotosRaw.find(f => f.categoria === 'sala'),
      cuartos: this.fotosRaw.find(f => f.categoria === 'cuartos'),
      cocina: this.fotosRaw.find(f => f.categoria === 'cocina'),
      patio: this.fotosRaw.find(f => f.categoria === 'patio'),
      banhos: this.fotosRaw.find(f => f.categoria === 'banhos'),
    };
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
   * Resuelve una URL relativa a absoluta si es necesario.
   */
  resolveFotoUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_BASE}${url}`;
  }

  /**
   * Retorna la URL completa de la foto principal (fachada).
   * Prioriza la foto de categoría 'casa' de la nueva tabla, si no, usa fotoUrl legacy.
   */
  get fotoSrc() {
    const fachada = this.fotosPorCategoria?.casa?.foto_url;
    if (fachada) return this.resolveFotoUrl(fachada);
    if (this.fotoUrl) return this.resolveFotoUrl(this.fotoUrl);
    return "";
  }

  static fromList(dataList) {
    return (dataList || []).map((d) => new Republica(d));
  }
}
