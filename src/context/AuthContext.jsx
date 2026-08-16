import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loadingAuth, setLoadingAuth] =
    useState(true);

  const [authError, setAuthError] =
    useState("");

  /*
    Firebase ពិនិត្យ Account នៅពេល
    Website ចាប់ផ្ដើម ឬ Login state ផ្លាស់ប្តូរ។
  */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setLoadingAuth(true);
        setAuthError("");

        /*
          មិនទាន់ Login ឬជា Anonymous User។
        */
        if (
          !currentUser ||
          currentUser.isAnonymous
        ) {
          setFirebaseUser(null);
          setProfile(null);
          setLoadingAuth(false);

          return;
        }

        try {
          /*
            ទាញ Profile ពី users/{uid}។
          */
          const profileReference = doc(
            db,
            "users",
            currentUser.uid
          );

          const profileSnapshot = await getDoc(
            profileReference
          );

          /*
            Firebase Auth account មាន
            ប៉ុន្តែ Firestore profile មិនមាន។
          */
          if (!profileSnapshot.exists()) {
            await signOut(auth);

            setFirebaseUser(null);
            setProfile(null);

            setAuthError(
              "រកមិនឃើញ User Profile ក្នុង Firestore។"
            );

            return;
          }

          const profileData =
            profileSnapshot.data();

          /*
            Blocked account មិនអាច
            ចូលប្រើ System បាន។
          */
          if (
            profileData.accountStatus ===
            "blocked"
          ) {
            await signOut(auth);

            setFirebaseUser(null);
            setProfile(null);

            setAuthError(
              "Account របស់អ្នកត្រូវបាន Block។"
            );

            return;
          }

          /*
            អនុញ្ញាតតែ customer និង admin role។
          */
          if (
            profileData.role !== "customer" &&
            profileData.role !== "admin"
          ) {
            await signOut(auth);

            setFirebaseUser(null);
            setProfile(null);

            setAuthError(
              "Account role មិនត្រឹមត្រូវ។"
            );

            return;
          }

          /*
            Save Firebase User និង Firestore Profile
            សម្រាប់ប្រើក្នុង Project ទាំងមូល។
          */
          setFirebaseUser(currentUser);

          setProfile({
            ...profileData,

            uid: currentUser.uid,

            email:
              currentUser.email ||
              profileData.email ||
              "",
          });
        } catch (error) {
          console.error(
            "Load account profile error:",
            error
          );

          setFirebaseUser(null);
          setProfile(null);

          setAuthError(
            "មិនអាចទាញ Account Profile បានទេ។ សូមពិនិត្យ Firestore Rules។"
          );
        } finally {
          setLoadingAuth(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /*
    Sign Out សម្រាប់ Customer និង Admin។
  */
  async function logout() {
    try {
      await signOut(auth);

      setFirebaseUser(null);
      setProfile(null);
      setAuthError("");

      window.dispatchEvent(
        new Event("customerUpdated")
      );

      window.dispatchEvent(
        new Event("adminUpdated")
      );
    } catch (error) {
      console.error(
        "Sign out error:",
        error
      );

      setAuthError(
        "Sign Out មិនបានជោគជ័យ។"
      );

      throw error;
    }
  }

  /*
    Values ដែល Components ផ្សេងៗ
    អាចយកទៅប្រើ។
  */
  const contextValue = useMemo(
    () => ({
      firebaseUser,
      profile,
      loadingAuth,
      authError,
      logout,

      isLoggedIn:
        Boolean(firebaseUser) &&
        Boolean(profile),

      isCustomer:
        profile?.role === "customer",

      isAdmin:
        profile?.role === "admin",
    }),
    [
      firebaseUser,
      profile,
      loadingAuth,
      authError,
    ]
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}