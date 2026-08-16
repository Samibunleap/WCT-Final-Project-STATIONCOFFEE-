import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FaEnvelope, FaPaperPlane } from "react-icons/fa";

import { db } from "../firebase/firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim()
    ) {
      setError(
        "សូមបំពេញឈ្មោះ Email និង Message។"
      );

      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, "messages"), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        subject:
          form.subject.trim() || "Contact Message",
        message: form.message.trim(),
        status: "unread",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(
        "សាររបស់អ្នកបានផ្ញើជោគជ័យ។ Station Coffee នឹងឆ្លើយតបឆាប់ៗ។"
      );

      setForm(EMPTY_FORM);
    } catch (firebaseError) {
      console.error(
        "Send contact message error:",
        firebaseError
      );

      setError(
        "មិនអាចផ្ញើ Message បានទេ។ សូមពិនិត្យ Firebase Rules។"
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--brown-dark)]">
        <Navbar />

        <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6">
          <section className="rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-6 shadow-xl sm:p-8">
            <div className="text-center">
              <FaEnvelope className="mx-auto text-4xl text-[var(--gold)]" />

              <h1 className="mt-5 text-3xl font-extrabold text-[var(--gold-light)]">
                Contact Station Coffee
              </h1>

              <p className="mt-2 text-[var(--muted)]">
                ផ្ញើសារ ឬសំណួររបស់អ្នកមកកាន់យើង។
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
            >
              <ContactInput
                label="ឈ្មោះ"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="បញ្ចូលឈ្មោះ"
                required
              />

              <ContactInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
              />

              <ContactInput
                label="លេខទូរស័ព្ទ"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="012 345 678"
              />

              <ContactInput
                label="ប្រធានបទ"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Order, payment, product..."
              />

              <div>
                <label className="mb-2 block font-bold text-[var(--gold-light)]">
                  Message
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  required
                  placeholder="សរសេរសាររបស់អ្នក..."
                  className="w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] px-4 py-3 text-[var(--gold-light)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--gold)]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-400/40 bg-green-500/10 p-4 text-green-300">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3.5 font-extrabold text-[var(--brown-dark)] disabled:opacity-50"
              >
                <FaPaperPlane />

                {sending
                  ? "កំពុងផ្ញើ..."
                  : "Send Message"}
              </button>
            </form>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}

function ContactInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[var(--gold-light)]">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] px-4 py-3 text-[var(--gold-light)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--gold)]"
      />
    </div>
  );
}