import React from 'react';
import { Link } from 'react-router-dom';

export default function RepublicaCard({ rep, isFavorite, toggleFavorite }) {
    return (
        <article className="republica-card" aria-label={`República ${rep.nombre}`}>
            <Link
                to={`/republica/${rep.id}`}
                className="republica-card__link"
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
            </Link>
            <div className="republica-card__footer">
                <button
                    className={`btn btn--favorite ${isFavorite ? "btn--primary" : ""}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(rep);
                    }}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? `Remover ${rep.nombre} dos favoritos` : `Adicionar ${rep.nombre} aos favoritos`}
                    type="button"
                >
                    {isFavorite ? "★ Favorito" : "☆ Favoritar"}
                </button>
            </div>
        </article>
    );
}
