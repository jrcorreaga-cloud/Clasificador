import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function RepublicaMap({ republicas }) {
    const OURO_PRETO_CENTER = [-20.385574, -43.503578];

    return (
        <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
            <MapContainer center={OURO_PRETO_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {republicas.map(rep => {
                    if (!rep.latitud || !rep.longitud) return null;
                    return (
                        <Marker key={rep.id} position={[Number(rep.latitud), Number(rep.longitud)]}>
                            <Popup>
                                <strong>{rep.nombre}</strong><br />
                                {rep.direccion}<br />
                                <b>R$ {Number(rep.precio).toFixed(2)}</b>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
