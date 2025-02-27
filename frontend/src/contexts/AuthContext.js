import axios from "axios";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const INACTIVITY_TIMEOUT = 300000; // 10000 = 10 seconds for testing (adjust to 300000 for 5 minutes)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", user.email);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      resetInactivityTimeout(); // Reset timer after login

      return user;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      const { user, token } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      resetInactivityTimeout(); // Reset timer after signup

      return user;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Signup failed");
    }
  };

  // Logout function
  const logout = () => {
    try {
      axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      navigate("/login");
    }
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
      resetInactivityTimeout(); // Reset timer if auth check succeeds
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Reset inactivity timeout (exposed to components)
  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    // Only start timer if user is authenticated
    if (user) {
      inactivityTimeoutRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Handle user activity to reset timer
  useEffect(() => {
    const handleActivity = () => {
      if (user) {
        resetInactivityTimeout(); // Reset timer only if user is authenticated
      }
    };

    if (user) {
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("keydown", handleActivity);
      window.addEventListener("touchstart", handleActivity);
      window.addEventListener("scroll", handleActivity);
    }

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [user]); // Re-run when user changes

  // Initial auth check on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, signup, resetInactivityTimeout }}
    >
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
