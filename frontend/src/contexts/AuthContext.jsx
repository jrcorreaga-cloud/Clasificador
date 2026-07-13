import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken, clearAuthToken } from "../controllers/apiController";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            const userString = localStorage.getItem("user");
            if (token && userString) {
                setAuthToken(token);
                setAuthUser(JSON.parse(userString));
            }
        } catch (e) {
            console.error("Error loading auth from local storage", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData, token) => {
        setAuthToken(token);
        setAuthUser(userData);
        try {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
        } catch (e) {
            console.error("Error saving auth to local storage", e);
        }
    };

    const logout = () => {
        setAuthUser(null);
        clearAuthToken();
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        } catch (e) {
            console.error("Error removing auth from local storage", e);
        }
    };

    const updateUser = (updatedUserData) => {
        setAuthUser(updatedUserData);
        try {
            localStorage.setItem("user", JSON.stringify(updatedUserData));
        } catch (e) {
            console.error("Error updating user in local storage", e);
        }
    }

    if (loading) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ authUser, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
