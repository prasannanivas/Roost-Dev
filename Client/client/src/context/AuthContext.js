import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem("authroost");
    return savedAuth ? JSON.parse(savedAuth) : null;
  });

  const login = (userData) => {
    console.log(userData);
    setAuth(userData);
    localStorage.setItem("authroost", JSON.stringify(userData));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("authroost");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
