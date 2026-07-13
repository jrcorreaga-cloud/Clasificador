import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';

export default function Navbar() {
    const { authUser, logout } = useAuth();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const userMenuPanelRef = useRef(null);

    const esDuenho = authUser?.role === 'dueño';
    const userInitials = authUser?.name ? authUser.name.charAt(0).toUpperCase() : "U";

    const USER_MENU_ITEMS = [
        { label: authUser?.role === 'dueño' ? "Meu Perfil" : "Meu Perfil / Favoritos", target: "/profile" },
    ];

    const NAV_ITEMS = esDuenho 
        ? [{ label: "Minha República", target: "/duenho" }]
        : [{ label: "Buscar Repúblicas", target: "/" }];

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target) &&
                userMenuPanelRef.current &&
                !userMenuPanelRef.current.contains(event.target)
            ) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [userMenuOpen]);

    const handleNavigate = (path) => {
        setUserMenuOpen(false);
        navigate(path);
    };

    const handleLogout = () => {
        setUserMenuOpen(false);
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
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.target}
                            type="button"
                            className="app-header__nav-link"
                            onClick={() => handleNavigate(item.target)}
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
                                        onClick={() => handleNavigate(item.target)}
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
    );
}
