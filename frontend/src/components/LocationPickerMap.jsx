import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const OURO_PRETO_CENTER = [-20.385574, -43.503578];

function LocationMarker({ position, setPosition, onLocationSelected }) {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);

            // Reverse geocoding with Nominatim
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await response.json();
                
                if (data && data.display_name) {
                    onLocationSelected({
                        lat,
                        lon: lng,
                        address: data.display_name
                    });
                }
            } catch (error) {
                console.error("Error reverse geocoding:", error);
            }
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function LocationPickerMap({ onLocationSelected, initialPosition = null }) {
    const [position, setPosition] = useState(initialPosition);

    useEffect(() => {
        if (initialPosition) {
            setPosition(initialPosition);
        }
    }, [initialPosition]);

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '0.5rem', border: '1px solid #ccc' }}>
            <MapContainer center={initialPosition || OURO_PRETO_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} onLocationSelected={onLocationSelected} />
            </MapContainer>
        </div>
    );
}
