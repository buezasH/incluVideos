import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "Caregiver" | "Standard User";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role: "Caregiver" | "Standard User",
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isCaregiver: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isCaregiver = user?.role === "Caregiver";

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          try {
            const response = await fetch("/api/auth/profile", {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });

            if (!response.ok) {
              // Token is invalid, clear storage
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_user");
              setToken(null);
              setUser(null);
            }
          } catch (error) {
            console.error("Token validation error:", error);
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Login JSON parse error:", jsonError);
        throw new Error(`Login failed: Could not parse response`);
      }

      if (!response.ok) {
        const errorMessage =
          data.message ||
          `Login failed: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      setToken(data.token);
      setUser(data.user);

      // Store in localStorage
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      console.log(
        `✅ Login successful: ${data.user.username} (${data.user.role})`,
      );
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: "Caregiver" | "Standard User",
  ): Promise<void> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Registration JSON parse error:", jsonError);
        throw new Error(`Registration failed: Could not parse response`);
      }

      if (!response.ok) {
        const errorMessage =
          data.message ||
          `Registration failed: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      setToken(data.token);
      setUser(data.user);

      // Store in localStorage
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      console.log(
        `✅ Registration successful: ${data.user.username} (${data.user.role})`,
      );
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("userVideos"); // Clear user videos on logout

    console.log("✅ Logout successful");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isCaregiver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
