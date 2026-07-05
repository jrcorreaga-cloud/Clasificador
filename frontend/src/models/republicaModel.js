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

  get fotoSrc() {
    return this.fotoUrl || "/images/default-republica.jpg";
  }

  static fromList(dataList) {
    return (dataList || []).map((d) => new Republica(d));
  }
}