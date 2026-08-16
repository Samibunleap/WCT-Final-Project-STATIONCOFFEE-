import { useState } from "react";

import {
  Link,
} from "react-router-dom";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  FaArrowLeft,
  FaEnvelope,
  FaKey,
} from "react-icons/fa";

import {
  auth,
} from "../firebase/firebase";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "សូមបញ្ចូល Email របស់អ្នក។"
      );

      return;
    }

    setSubmitting(true);

    try {
      await sendPasswordResetEmail(
        auth,
        normalizedEmail
      );

      setSuccess(
        "Password Reset Link ត្រូវបានផ្ញើទៅ Email របស់អ្នក។ សូមពិនិត្យ Inbox និង Spam folder។"
      );

      setEmail("");
    } catch (firebaseError) {
      console.error(
        "Password reset error:",
        firebaseError
      );

      switch (firebaseError.code) {
        case "auth/invalid-email":
          setError(
            "សូមបញ្ចូល Email ឱ្យបានត្រឹមត្រូវ។"
          );
          break;

        case "auth/user-not-found":
          setError(
            "រកមិនឃើញ Account ដែលប្រើ Email នេះទេ។"
          );
          break;

        case "auth/too-many-requests":
          setError(
            "មានការស្នើ Reset Password ច្រើនពេក។ សូមរង់ចាំ ហើយព្យាយាមម្តងទៀត។"
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

        default:
          setError(
            firebaseError.message ||
              "មិនអាចផ្ញើ Password Reset Email បានទេ។"
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold)] text-2xl text-[var(--brown-dark)] shadow-lg">
                <FaKey aria-hidden="true" />
              </div>

              <h1 className="mt-5 text-3xl font-extrabold text-[var(--gold-light)]">
                Forgot Password
              </h1>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                បញ្ចូល Email ដើម្បីទទួល
                Password Reset Link។
              </p>
            </header>

            {/* Form area */}
            <div className="p-7 sm:p-8">
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mb-5 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-300"
                >
                  {success}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="reset-email"
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
                      id="reset-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="example@email.com"
                      autoComplete="email"
                      required
                      disabled={submitting}
                      className="relative z-10 w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] py-3 pl-11 pr-4 text-[var(--gold-light)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--gold)] px-5 py-3 font-extrabold uppercase tracking-wider text-[var(--brown-dark)] transition-all hover:-translate-y-0.5 hover:bg-[var(--gold-light)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Sending..."
                    : "Send Reset Link"}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
              >
                <FaArrowLeft aria-hidden="true" />

                Back to Login
              </Link>

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