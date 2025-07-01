import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";
// import { GoogleAuthProvider } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// export function AuthProvider({ children }) {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [userLoggedIn, setUserLoggedIn] = useState(false);
//   const [isEmailUser, setIsEmailUser] = useState(false);
//   const [isGoogleUser, setIsGoogleUser] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [isDeveloper, setIsDeveloper] = useState(false); 
//   const [isProjectManager, setIsProjectManager] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, initializeUser);
//     return unsubscribe;
//   }, []);

//   async function initializeUser(user) {
//     if (user) {

//       setCurrentUser({ ...user });

//       // check if provider is email and password login
//       const isEmail = user.providerData.some(
//         (provider) => provider.providerId === "password"
//       );
//       setIsEmailUser(isEmail);

//       // check if the auth provider is google or not
//     //   const isGoogle = user.providerData.some(
//     //     (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
//     //   );
//     //   setIsGoogleUser(isGoogle);

//       setUserLoggedIn(true);
//     } else {
//       setCurrentUser(null);
//       setUserLoggedIn(false);
//     }

//     setLoading(false);
//   }

//   const value = {
//     userLoggedIn,
//     isEmailUser,
//     isGoogleUser,
//     currentUser,
//     setCurrentUser,
//     isDeveloper,
//     setIsDeveloper,
//     isProjectManager,
//     setIsProjectManager
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// }

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loading, setLoading] = useState(true);
  // Initialize from localStorage if available, otherwise false
  const [isDeveloper, setIsDeveloper] = useState(() => {
    return localStorage.getItem('userRole') === 'developer';
  });
  const [isProjectManager, setIsProjectManager] = useState(() => {
    return localStorage.getItem('userRole') === 'projectManager';
  });

  // Modify your setIsDeveloper and setIsProjectManager to also update localStorage
  const updateIsDeveloper = (value) => {
    setIsDeveloper(value);
    if (value) {
      localStorage.setItem('userRole', 'developer');
      setIsProjectManager(false);
    }
  };

  const updateIsProjectManager = (value) => {
    setIsProjectManager(value);
    if (value) {
      localStorage.setItem('userRole', 'projectManager');
      setIsDeveloper(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user) {
    if (user) {
      setCurrentUser({ ...user });

      // check if provider is email and password login
      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      // Retrieve and set role from localStorage if it exists
      const savedRole = localStorage.getItem('userRole');
      if (savedRole === 'developer') {
        setIsDeveloper(true);
        setIsProjectManager(false);
      } else if (savedRole === 'projectManager') {
        setIsProjectManager(true);
        setIsDeveloper(false);
      }

      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
      // Clear role when user logs out
      localStorage.removeItem('userRole');
      setIsDeveloper(false);
      setIsProjectManager(false);
    }

    setLoading(false);
  }

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    setCurrentUser,
    isDeveloper,
    setIsDeveloper: updateIsDeveloper,
    isProjectManager,
    setIsProjectManager: updateIsProjectManager
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}