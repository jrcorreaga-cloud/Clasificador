import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../models/userProfileModel';

const USER_MENU_ITEMS = [
    { label: "Meu Perfil", target: "/profile" },
    { label: "Favoritos", target: "/?section=favoritos" },
    { label: "Configurações", target: "/profile" },
];

export default function Navbar() {
    const { authUser, logout } = useAuth();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const esDuenho = authUser?.role === "dueño";

    const DUENHO_NAV_ITEMS = [
        { label: "Minha Rep", target: "/?section=minha-republica" },
        { label: "Gerenciar", target: "/?section=gerenciar" },
        { label: "Meu Perfil", target: "/profile" },
    ];

    const BUSCADOR_NAV_ITEMS = [
        { label: "Repúblicas", target: "/" },
        { label: "Favoritos", target: "/?section=favoritos" },
        { label: "Meu Perfil", target: "/profile" },
    ];

    const navItems = esDuenho ? DUENHO_NAV_ITEMS : BUSCADOR_NAV_ITEMS;

    const userInitials = useMemo(() => {
        if (!authUser?.name) return "R";
        const nameParts = authUser.name.trim().split(/\s+/).filter(Boolean);
        const firstInitial = nameParts[0]?.[0] ?? "R";
        const secondInitial = nameParts[1]?.[0] ?? authUser.name.trim()[1] ?? "";
        return `${firstInitial}${secondInitial}`.toUpperCase();
    }, [authUser]);

    useEffect(() => {
        const handleDocumentClick = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && userMenuOpen) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [userMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header" role="banner">
            <div className="app-header__inner">
                <Link className="app-header__brand" to="/" aria-label="RepOP - Ir para o início">
                    <img className="app-header__logo" src="/images/logo.png" alt="" aria-hidden="true" />
                    <span className="app-header__brand-text">
                        <strong>RepOP</strong>
                        <span>Moradias em Ouro Preto</span>
                    </span>
                </Link>

                <nav className="app-header__nav" aria-label="Navegação principal">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.target}
                            className="app-header__nav-link"
                        >
                            {item.label}
                        </Link>
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

                        {userMenuOpen && (
                            <div
                                id="user-menu-panel"
                                className="user-menu__panel"
                                role="menu"
                                aria-label="Menu do usuário"
                            >
                                {USER_MENU_ITEMS.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.target}
                                        className="user-menu__item"
                                        onClick={() => setUserMenuOpen(false)}
                                        role="menuitem"
                                    >
                                        {item.label}
                                    </Link>
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
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
