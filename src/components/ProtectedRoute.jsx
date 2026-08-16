import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const location = useLocation();

  const {
    profile,
    loadingAuth,
    isLoggedIn,
  } = useAuth();

  /*
    រង់ចាំ Firebase ពិនិត្យ Login Session។
  */
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brown-dark)] px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--brown-light)] border-t-[var(--gold)]" />

          <p className="mt-4 text-sm text-[var(--muted)]">
            កំពុងពិនិត្យ Account...
          </p>
        </div>
      </div>
    );
  }

  /*
    Visitor មិនទាន់ Login។
  */
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          redirectTo: location.pathname,

          message:
            "សូម Login មុនចូល Page នេះ។",
        }}
      />
    );
  }

  /*
    User បាន Login ប៉ុន្តែ Role
    មិនមានសិទ្ធិចូល Page នេះ។
  */
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(profile?.role)
  ) {
    const redirectPath =
      profile?.role === "admin"
        ? "/admin"
        : "/dashboard";

    return (
      <Navigate
        to={redirectPath}
        replace
        state={{
          message:
            "Account របស់អ្នកមិនមានសិទ្ធិចូល Page នេះទេ។",
        }}
      />
    );
  }

  return children;
}