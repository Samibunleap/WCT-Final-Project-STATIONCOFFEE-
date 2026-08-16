import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaSignInAlt,
} from "react-icons/fa";

import {
  auth,
  db,
} from "../firebase/firebase";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  /*
    Update form field based on input name.

    name="email" updates formData.email.
    name="password" updates formData.password.
  */
  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const email = formData.email
      .trim()
      .toLowerCase();

    const password = formData.password;

    if (!email || !password) {
      setError(
        "សូមបញ្ចូល Email និង Password។"
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
        Keep the Firebase login session after
        refreshing or reopening the browser.
      */
      await setPersistence(
        auth,
        browserLocalPersistence
      );

      /*
        Authenticate the account.
      */
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const firebaseUser =
        userCredential.user;

      /*
        Read the account profile from Firestore.

        The document ID must be the same as
        the Firebase Authentication UID.
      */
      const profileSnapshot = await getDoc(
        doc(
          db,
          "users",
          firebaseUser.uid
        )
      );

      /*
        Authentication account exists but the
        Firestore profile is missing.
      */
      if (!profileSnapshot.exists()) {
        await signOut(auth);

        setError(
          "រកមិនឃើញ User Profile ក្នុង Firestore។"
        );

        return;
      }

      const profileData =
        profileSnapshot.data();

      /*
        A blocked account cannot enter
        the system.
      */
      if (
        profileData.accountStatus ===
        "blocked"
      ) {
        await signOut(auth);

        setError(
          "Account របស់អ្នកត្រូវបាន Block។ សូមទាក់ទង Station Coffee។"
        );

        return;
      }

      /*
        Admin account.
      */
      if (profileData.role === "admin") {
        window.dispatchEvent(
          new Event("adminUpdated")
        );

        navigate("/admin", {
          replace: true,
        });

        return;
      }

      /*
        Customer account.
      */
      if (
        profileData.role === "customer"
      ) {
        window.dispatchEvent(
          new Event("customerUpdated")
        );

        /*
          If ProtectedRoute sent the customer
          to Login, return to the requested page.

          Example:
          /cart → /login → /cart
        */
        const redirectTo =
          location.state?.redirectTo;

        const customerDestination =
          redirectTo &&
          redirectTo !== "/admin"
            ? redirectTo
            : "/dashboard";

        navigate(customerDestination, {
          replace: true,
        });

        return;
      }

      /*
        Reject unsupported account roles.
      */
      await signOut(auth);

      setError(
        "Account role មិនត្រឹមត្រូវ។ សូមទាក់ទង Station Coffee។"
      );
    } catch (firebaseError) {
      console.error(
        "Login error:",
        firebaseError
      );

      switch (firebaseError.code) {
        case "auth/invalid-email":
          setError(
            "សូមបញ្ចូល Email ឱ្យបានត្រឹមត្រូវ។"
          );
          break;

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError(
            "Email ឬ Password មិនត្រឹមត្រូវ។"
          );
          break;

        case "auth/user-disabled":
          setError(
            "Account នេះត្រូវបាន Disable ក្នុង Firebase Authentication។"
          );
          break;

        case "auth/too-many-requests":
          setError(
            "មានការព្យាយាម Login ច្រើនពេក។ សូមរង់ចាំ ហើយព្យាយាមម្តងទៀត។"
          );
          break;

        case "auth/network-request-failed":
          setError(
            "សូមពិនិត្យ Internet Connection។"
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Email/Password Authentication មិនទាន់បានបើកក្នុង Firebase Console។"
          );
          break;

        case "permission-denied":
        case "firestore/permission-denied":
          setError(
            "Firestore មិនអនុញ្ញាតឱ្យអាន User Profile។ សូមពិនិត្យ Firestore Rules។"
          );
          break;

        default:
          setError(
            firebaseError.message ||
              "Login មិនបានជោគជ័យ។ សូមព្យាយាមម្តងទៀត។"
          );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--brown-dark)]">
        <Navbar />

        <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
          <section className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] shadow-2xl">
            {/* Header */}
            <header className="border-b border-[var(--brown-light)]/30 bg-[var(--brown-mid)] px-7 py-8 text-center">
              

              <h1 className="mt-5 text-3xl font-extrabold text-[var(--gold-light)]">
                Account Login
              </h1>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Login ទៅ Customer ឬ Admin
                Dashboard។
              </p>
            </header>

            {/* Form area */}
            <div className="p-7 sm:p-8">
              {/* Message sent from another page */}
              {location.state?.message && (
                <div
                  role="status"
                  className="mb-6 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-3 text-sm leading-6 text-[var(--gold-light)]"
                >
                  {location.state.message}
                </div>
              )}

              {/* Login error */}
              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-semibold text-[var(--muted)]"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <FaEnvelope
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-[var(--faint)]"
                    />

                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      autoComplete="email"
                      required
                      disabled={submitting}
                      className="relative z-10 w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] py-3 pl-11 pr-4 text-[var(--gold-light)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-semibold text-[var(--muted)]"
                    >
                      Password
                    </label>

                    {/*
                      We will create the
                      /forgot-password page next.
                    */}
                    <Link
                      to="/forgot-password"
                      className="text-xs font-bold text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <div className="relative">
                    <FaLock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-[var(--faint)]"
                    />

                    <input
                      id="login-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.password
                      }
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      disabled={submitting}
                      className="relative z-10 w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] py-3 pl-11 pr-12 text-[var(--gold-light)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (currentValue) =>
                            !currentValue
                        )
                      }
                      disabled={submitting}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-4 top-1/2 z-20 -translate-y-1/2 text-[var(--faint)] transition-colors hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword ? (
                        <FaEyeSlash
                          aria-hidden="true"
                        />
                      ) : (
                        <FaEye
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--gold)] px-6 py-3 font-extrabold uppercase tracking-wider text-[var(--brown-dark)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaSignInAlt
                    aria-hidden="true"
                  />

                  {submitting
                    ? "Signing In..."
                    : "Login"}
                </button>
              </form>

              {/* Registration link */}
              <p className="mt-7 text-center text-sm leading-6 text-[var(--muted)]">
                មិនទាន់មាន Customer Account?{" "}

                <Link
                  to="/register"
                  className="font-bold text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
                >
                  Register
                </Link>
              </p>

              {/* Home link */}
              <Link
                to="/"
                className="mt-4 block text-center text-sm text-[var(--faint)] transition-colors hover:text-[var(--gold)]"
              >
                ត្រឡប់ទៅ Home
              </Link>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}