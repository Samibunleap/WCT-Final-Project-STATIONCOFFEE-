import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaPhone,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

import {
  auth,
  db,
} from "../firebase/firebase";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  /*
    Update the correct form field.

    name="name" updates formData.name.
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

    const name = formData.name.trim();

    const phone = formData.phone.trim();

    const email = formData.email
      .trim()
      .toLowerCase();

    const password = formData.password;

    const confirmPassword =
      formData.confirmPassword;

    /*
      Validate required fields.
    */
    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "សូមបំពេញព័ត៌មានទាំងអស់។"
      );

      return;
    }

    /*
      Validate customer name.
    */
    if (name.length < 2) {
      setError(
        "ឈ្មោះត្រូវមានយ៉ាងតិច 2 តួអក្សរ។"
      );

      return;
    }

    /*
      Basic telephone validation.

      Keep numbers, spaces, plus, parentheses,
      and hyphens only.
    */
    const phonePattern =
      /^[0-9+\-()\s]{8,25}$/;

    if (!phonePattern.test(phone)) {
      setError(
        "លេខទូរស័ព្ទមិនត្រឹមត្រូវ។"
      );

      return;
    }

    /*
      Firebase requires a minimum password
      length of at least 6 characters unless
      another password policy is configured.
    */
    if (password.length < 6) {
      setError(
        "Password ត្រូវមានយ៉ាងតិច 6 តួអក្សរ។"
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Confirm Password មិនដូច Password ទេ។"
      );

      return;
    }

    setSubmitting(true);

    let createdCustomer = null;

    try {
      /*
        Create customer in Firebase
        Authentication.
      */
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      createdCustomer =
        userCredential.user;

      /*
        Save customer name in the Firebase
        Authentication profile.
      */
      await updateProfile(
        createdCustomer,
        {
          displayName: name,
        }
      );

      /*
        Create the customer profile in Firestore.

        The document ID must equal the Firebase
        Authentication UID.
      */
      await setDoc(
        doc(
          db,
          "users",
          createdCustomer.uid
        ),
        {
          uid: createdCustomer.uid,
          name,
          phone,
          email,

          /*
            Public registration can create only
            customer accounts.
          */
          role: "customer",

          /*
            New customer accounts start active.
            An administrator can block the account
            later from the Admin Dashboard.
          */
          accountStatus: "active",

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      window.dispatchEvent(
        new Event("customerUpdated")
      );

      /*
        Return to the requested customer page.

        A registration request must never redirect
        a customer to the Admin Dashboard.
      */
      const requestedDestination =
        location.state?.redirectTo;

      const customerDestination =
        requestedDestination &&
        requestedDestination !== "/admin"
          ? requestedDestination
          : "/dashboard";

      navigate(customerDestination, {
        replace: true,

        state: {
          message:
            "Registration successful. Welcome to Station Coffee!",
        },
      });
    } catch (firebaseError) {
      console.error(
        "Registration error:",
        firebaseError
      );

      /*
        If Firebase Authentication succeeds but
        Firestore profile creation fails, remove
        the incomplete Authentication account.

        This prevents an account without a
        users/{uid} profile.
      */
      if (
        createdCustomer &&
        (
          firebaseError.code ===
            "permission-denied" ||
          firebaseError.code ===
            "firestore/permission-denied"
        )
      ) {
        try {
          await deleteUser(createdCustomer);
        } catch (deleteError) {
          console.error(
            "Remove incomplete account error:",
            deleteError
          );
        }
      }

      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          setError(
            "Email នេះមាន Account រួចហើយ។ សូម Login ឬប្រើ Email ផ្សេង។"
          );
          break;

        case "auth/invalid-email":
          setError(
            "សូមបញ្ចូល Email ឱ្យបានត្រឹមត្រូវ។"
          );
          break;

        case "auth/weak-password":
          setError(
            "Password ខ្សោយពេក។ សូមប្រើ Password ដែលរឹងមាំជាងនេះ។"
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
            "Firestore មិនអនុញ្ញាតឱ្យបង្កើត Customer Profile ទេ។ សូមពិនិត្យ Firestore Rules។"
          );
          break;

        case "auth/too-many-requests":
          setError(
            "មានការស្នើបង្កើត Account ច្រើនពេក។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។"
          );
          break;

        default:
          setError(
            firebaseError.message ||
              "មិនអាចបង្កើត Account បានទេ។"
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
          <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] shadow-2xl">
            {/* Header */}
            <header className="border-b border-[var(--brown-light)]/30 bg-[var(--brown-mid)] px-6 py-8 text-center sm:px-7">
              

              <h1 className="mt-5 text-2xl font-extrabold text-[var(--gold-light)] sm:text-3xl">
                Customer Registration
              </h1>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                បង្កើត Customer Account សម្រាប់
                Station Coffee។
              </p>
            </header>

            {/* Form area */}
            <div className="p-6 sm:p-8">
              {location.state?.message && (
                <div
                  role="status"
                  className="mb-6 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-3 text-sm leading-6 text-[var(--gold-light)]"
                >
                  {location.state.message}
                </div>
              )}

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
                <FormInput
                  id="customer-name"
                  name="name"
                  type="text"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  icon={<FaUser />}
                  disabled={submitting}
                  maxLength={100}
                />

                <FormInput
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+855 12 345 678"
                  autoComplete="tel"
                  icon={<FaPhone />}
                  disabled={submitting}
                  maxLength={25}
                />

                <FormInput
                  id="customer-email"
                  name="email"
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  autoComplete="email"
                  icon={<FaEnvelope />}
                  disabled={submitting}
                  maxLength={254}
                />

                <PasswordInput
                  id="customer-password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  showPassword={showPassword}
                  onToggle={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={submitting}
                />

                <PasswordInput
                  id="confirm-password"
                  name="confirmPassword"
                  label="Confirm Password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  showPassword={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  disabled={submitting}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--gold)] px-6 py-3 font-extrabold uppercase tracking-wider text-[var(--brown-dark)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaUserPlus
                    aria-hidden="true"
                  />

                  {submitting
                    ? "Creating Account..."
                    : "Register"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm leading-6 text-[var(--muted)]">
                មាន Account រួចហើយ?{" "}

                <Link
                  to="/login"
                  className="font-bold text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
                >
                  Login
                </Link>
              </p>

              <p className="mt-4 text-center text-xs leading-6 text-[var(--faint)]">
                Password ត្រូវបានគ្រប់គ្រងដោយ
                Firebase Authentication ហើយមិនត្រូវ
                Save ក្នុង Firestore ទេ។
              </p>

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

function FormInput({
  id,
  name,
  type,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  disabled,
  maxLength,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[var(--muted)]"
      >
        {label}
      </label>

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-[var(--faint)]"
        >
          {icon}
        </span>

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required
          disabled={disabled}
          className="relative z-10 w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] py-3 pl-11 pr-4 text-[var(--gold-light)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  showPassword,
  onToggle,
  placeholder,
  autoComplete,
  disabled,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[var(--muted)]"
      >
        {label}
      </label>

      <div className="relative">
        <FaLock
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-[var(--faint)]"
        />

        <input
          id={id}
          name={name}
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={6}
          required
          disabled={disabled}
          className="relative z-10 w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] py-3 pl-11 pr-12 text-[var(--gold-light)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
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
  );
}