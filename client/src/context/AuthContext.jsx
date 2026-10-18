import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import API from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "skillsetu_token";
const USER_KEY = "skillsetu_user";


// =====================================================
// REMOVE LARGE BASE64 DATA FROM LOCAL STORAGE
// =====================================================

const makeSafeUser = (user) => {
  if (!user) {
    return null;
  }

  const safeUser = {
    ...user,
  };

  /*
    Base64 images are too large for localStorage.

    Example:
    data:image/jpeg;base64,/9j/4AAQ...

    Remove only Base64 avatar.
    Normal image URLs are allowed.
  */

  if (
    typeof safeUser.avatar === "string" &&
    safeUser.avatar.startsWith("data:")
  ) {
    delete safeUser.avatar;
  }

  return safeUser;
};


// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  // ===================================================
  // LOAD AUTH
  // ===================================================

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    const savedUser =
      localStorage.getItem(USER_KEY);


    /*
      No token = not logged in.
    */

    if (!token) {
      setLoading(false);
      return;
    }


    /*
      Load cached user first.
    */

    if (savedUser) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);

      } catch (error) {
        console.error(
          "Failed to load saved user:",
          error
        );

        localStorage.removeItem(USER_KEY);
      }
    }


    /*
      Get latest profile from backend.

      This keeps profile information
      synchronized after refresh.
    */

    const loadFreshUser = async () => {
      try {
        const response =
          await API.get("/users/me");


        if (response.data?.success) {
          const freshUser =
            response.data.user;


          /*
            Full user stays in React state.
          */

          setUser(freshUser);


          /*
            Only safe/lightweight user goes
            into localStorage.
          */

          const safeUser =
            makeSafeUser(freshUser);


          try {
            localStorage.setItem(
              USER_KEY,
              JSON.stringify(safeUser)
            );

          } catch (storageError) {
            console.warn(
              "Could not save user locally:",
              storageError
            );
          }
        }

      } catch (error) {
        console.error(
          "Failed to restore user:",
          error
        );


        /*
          Only remove authentication if
          backend says token is invalid.
        */

        if (error.response?.status === 401) {
          localStorage.removeItem(
            TOKEN_KEY
          );

          localStorage.removeItem(
            USER_KEY
          );

          setUser(null);
        }

      } finally {
        setLoading(false);
      }
    };


    loadFreshUser();

  }, []);


  // ===================================================
  // SAVE AUTH
  // ===================================================

  const saveAuth = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error(
        "Invalid authentication response"
      );
    }


    /*
      Save JWT.
    */

    localStorage.setItem(
      TOKEN_KEY,
      data.token
    );


    /*
      Save safe user only.
    */

    const safeUser =
      makeSafeUser(data.user);


    try {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(safeUser)
      );

    } catch (error) {
      console.warn(
        "Could not save user:",
        error
      );
    }


    /*
      Full user remains available
      inside React state.
    */

    setUser(data.user);
  };


  // ===================================================
  // REGISTER
  // ===================================================

  const register = async (formData) => {
    const response =
      await API.post(
        "/auth/register",
        formData
      );

    saveAuth(response.data);

    return response.data;
  };


  // ===================================================
  // LOGIN
  // ===================================================

  const login = async (
    identifier,
    password
  ) => {
    const response =
      await API.post(
        "/auth/login",
        {
          identifier,
          password,
        }
      );

    saveAuth(response.data);

    return response.data;
  };


  // ===================================================
  // UPDATE USER
  // ===================================================

  const updateUser = (updatedUser) => {
    if (!updatedUser) {
      return;
    }


    /*
      Update React state immediately.

      This allows the profile image to appear
      instantly in:
      - Profile
      - Bottom Navigation
      - Home
    */

    setUser(updatedUser);


    /*
      Do NOT put Base64 avatar into localStorage.
    */

    const safeUser =
      makeSafeUser(updatedUser);


    try {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(safeUser)
      );

    } catch (error) {
      console.warn(
        "Could not persist updated user:",
        error
      );
    }
  };


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    setUser(null);
  };


  // ===================================================
  // CONTEXT
  // ===================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        register,
        login,

        updateUser,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  return useContext(AuthContext);
}