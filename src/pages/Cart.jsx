import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import QRCode from "react-qr-code";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaTrash,
} from "react-icons/fa";

import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

import {
  useAuth,
} from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ABA_PAYMENT_URL =
  "https://pay.ababank.com/oRF8/ojoy58fx";

export default function Cart() {
  const {
    firebaseUser,
    profile,
    loadingAuth,
    isCustomer,
  } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem(
          "stationCoffeeCart"
        );

      const parsedCart = savedCart
        ? JSON.parse(savedCart)
        : [];

      return Array.isArray(parsedCart)
        ? parsedCart
        : [];
    } catch (error) {
      console.error(
        "Load cart error:",
        error
      );

      return [];
    }
  });

  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [
    submittedOrderId,
    setSubmittedOrderId,
  ] = useState("");

  /*
    Fill customer information from
    the Firestore customer profile.
  */
  useEffect(() => {
    if (!profile) {
      return;
    }

    setCustomerName(
      profile.name || ""
    );

    setCustomerPhone(
      profile.phone || ""
    );
  }, [profile]);

  /*
    Save the current cart in localStorage.
  */
  useEffect(() => {
    localStorage.setItem(
      "stationCoffeeCart",
      JSON.stringify(cart)
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }, [cart]);

  /*
    Calculate cart totals.
  */
  const totals = useMemo(() => {
    const totalQuantity = cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

    const subtotal = cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );

    return {
      totalQuantity,
      subtotal,
    };
  }, [cart]);

  function getItemKey(item, index) {
    return String(
      item.cartItemId ??
        item.id ??
        `${item.name}-${index}`
    );
  }

  function formatSugar(sugar) {
    if (
      sugar === undefined ||
      sugar === null
    ) {
      return "100%";
    }

    const value = String(sugar);

    return value.includes("%")
      ? value
      : `${value}%`;
  }

  function increaseQuantity(itemKey) {
    setCart((currentCart) =>
      currentCart.map(
        (item, index) =>
          getItemKey(item, index) ===
          itemKey
            ? {
                ...item,

                quantity:
                  Number(
                    item.quantity || 0
                  ) + 1,
              }
            : item
      )
    );
  }

  function decreaseQuantity(itemKey) {
    setCart((currentCart) =>
      currentCart
        .map((item, index) =>
          getItemKey(item, index) ===
          itemKey
            ? {
                ...item,

                quantity:
                  Number(
                    item.quantity || 0
                  ) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(item.quantity || 0) >
            0
        )
    );
  }

  function removeItem(itemKey) {
    setCart((currentCart) =>
      currentCart.filter(
        (item, index) =>
          getItemKey(item, index) !==
          itemKey
      )
    );
  }

  function clearCart() {
    const shouldClear =
      window.confirm(
        "តើអ្នកចង់សម្អាត Cart ទាំងអស់មែនទេ?"
      );

    if (!shouldClear) {
      return;
    }

    setCart([]);
    setSubmitError("");
    setSubmittedOrderId("");
  }

  async function submitOrder(event) {
    event.preventDefault();

    setSubmitError("");
    setSubmittedOrderId("");

    if (loadingAuth) {
      setSubmitError(
        "Firebase កំពុងពិនិត្យ Account។ សូមរង់ចាំបន្តិច។"
      );

      return;
    }

    if (
      !firebaseUser ||
      !isCustomer
    ) {
      setSubmitError(
        "សូម Login ជា Customer មុន Submit Order។"
      );

      return;
    }

    if (cart.length === 0) {
      setSubmitError(
        "Cart របស់អ្នកគ្មានទំនិញទេ។"
      );

      return;
    }

    if (!customerName.trim()) {
      setSubmitError(
        "សូមបញ្ចូលឈ្មោះអតិថិជន។"
      );

      return;
    }

    const phonePattern =
      /^[0-9+\-()\s]{8,25}$/;

    if (
      !phonePattern.test(
        customerPhone.trim()
      )
    ) {
      setSubmitError(
        "សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ។"
      );

      return;
    }

    if (
      !Number.isFinite(
        totals.subtotal
      ) ||
      totals.subtotal <= 0
    ) {
      setSubmitError(
        "តម្លៃសរុបមិនត្រឹមត្រូវ។"
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /*
        Create a Firestore Order ID.
      */
      const orderReference = doc(
        collection(db, "orders")
      );

      const orderId =
        orderReference.id;

      /*
        Save a permanent copy of every
        cart item in the Order document.
      */
      const orderItems = cart.map(
        (item) => {
          const price = Number(
            item.price || 0
          );

          const quantity = Number(
            item.quantity || 0
          );

          return {
            productId: String(
              item.id ?? ""
            ),

            cartItemId: String(
              item.cartItemId ??
                item.id ??
                ""
            ),

            name: String(
              item.name ?? "Coffee"
            ),

            image: String(
              item.image ?? ""
            ),

            price,

            quantity,

            size: String(
              item.size ?? "M"
            ),

            sugar: formatSugar(
              item.sugar
            ),

            ice: String(
              item.ice ??
                "ទឹកកកធម្មតា"
            ),

            itemTotal: Number(
              (
                price * quantity
              ).toFixed(2)
            ),
          };
        }
      );

      /*
        Save this Order to Firestore.

        customerId connects Order History
        to the logged-in Customer account.
      */
      const orderData = {
        orderId,

        customerId:
          firebaseUser.uid,

        customer: {
          name:
            customerName.trim(),

          phone:
            customerPhone.trim(),

          email:
            firebaseUser.email ||
            profile?.email ||
            "",
        },

        items: orderItems,

        totalQuantity:
          totals.totalQuantity,

        subtotal: Number(
          totals.subtotal.toFixed(2)
        ),

        total: Number(
          totals.subtotal.toFixed(2)
        ),

        currency: "USD",

        payment: {
          method: "ABA QR",

          paymentUrl:
            ABA_PAYMENT_URL,

          /*
            Receipt upload is temporarily
            disabled because Firebase Storage
            is returning a CORS error.
          */
          receiptUrl: "",
          receiptPath: "",

          status:
            "pending_review",
        },

        orderStatus:
          "payment_review",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      console.log(
        "Saving order to Firestore:",
        orderData
      );

      /*
        Save History before clearing Cart.
      */
      await setDoc(
        orderReference,
        orderData
      );

      console.log(
        "Order saved successfully:",
        orderId
      );

      /*
        Show success message.
      */
      setSubmittedOrderId(orderId);

      /*
        Automatically clear the Cart only
        after Firestore Save succeeds.
      */
      setCart([]);

      localStorage.removeItem(
        "stationCoffeeCart"
      );

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      setCustomerName(
        profile?.name || ""
      );

      setCustomerPhone(
        profile?.phone || ""
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (firebaseError) {
      console.error(
        "Save order error:",
        {
          code: firebaseError?.code,
          message:
            firebaseError?.message,
          error: firebaseError,
        }
      );

      switch (firebaseError?.code) {
        case "permission-denied":
        case "firestore/permission-denied":
          setSubmitError(
            "Firestore មិនអនុញ្ញាតឱ្យ Save Order។ សូមពិនិត្យ Firestore Rules។"
          );
          break;

        case "unavailable":
        case "firestore/unavailable":
          setSubmitError(
            "Firebase មិនអាចភ្ជាប់បាន។ សូមពិនិត្យ Internet Connection។"
          );
          break;

        default:
          setSubmitError(
            `${
              firebaseError?.code ||
              "save-error"
            }: ${
              firebaseError?.message ||
              "មិនអាច Save Order បានទេ។"
            }`
          );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[var(--brown-dark)]smooth-card p-5 sm:p-8">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
          {/* Page heading */}
          <section className="mb-7">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--gold)]"
            >
              <FaArrowLeft
                aria-hidden="true"
              />

              Continue shopping
            </Link>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
                  Station Coffee
                </p>

                <h1 className="mt-2 text-3xl font-extrabold text-[var(--gold-light)] sm:text-4xl">
                  Your Cart
                </h1>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-red-400/40 px-3 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
                >
                  <FaTrash
                    aria-hidden="true"
                  />

                  <span className="hidden sm:inline">
                    Clear Cart
                  </span>
                </button>
              )}
            </div>
          </section>

          {/* Success message */}
          {submittedOrderId && (
            <section className="mb-6 rounded-2xl border border-green-400/40 bg-green-500/10 p-5 text-green-300">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="mt-1 shrink-0 text-xl" />

                <div className="min-w-0">
                  <h2 className="font-extrabold">
                    Order របស់អ្នកត្រូវបាន
                    Submit ជោគជ័យ!
                  </h2>

                  <p className="mt-2 break-all text-sm">
                    Order ID:{" "}
                    {submittedOrderId}
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    Cart ត្រូវបានសម្អាត ហើយ
                    Order History ត្រូវបានរក្សាទុក
                    ក្នុង Customer Account។
                  </p>

                  <Link
                    to="/dashboard"
                    className="mt-4 inline-flex rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-400"
                  >
                    View My Order History
                  </Link>
                </div>
              </div>
            </section>
          )}

          {cart.length === 0 ? (
            <section className="rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] px-6 py-16 text-center shadow-xl">
              <FaShoppingBag className="mx-auto text-4xl text-[var(--gold)]" />

              <h2 className="mt-5 text-2xl font-extrabold text-[var(--gold-light)]">
                Your cart is empty
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                {submittedOrderId
                  ? "Order របស់អ្នកត្រូវបានរក្សាទុកក្នុង Customer Dashboard។"
                  : "You have not added any drinks yet."}
              </p>

              <Link
                to="/menu"
                className="mt-6 inline-flex rounded-xl bg-[var(--gold)] px-6 py-3 font-bold text-[var(--brown-dark)] transition-colors hover:bg-[var(--gold-light)]"
              >
                View Menu
              </Link>
            </section>
          ) : (
            <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* Cart products */}
              <section className="min-w-0 space-y-4">
                {cart.map(
                  (item, index) => {
                    const itemKey =
                      getItemKey(
                        item,
                        index
                      );

                    const itemTotal =
                      Number(
                        item.price || 0
                      ) *
                      Number(
                        item.quantity || 0
                      );

                    return (
                      <article
                        key={itemKey}
                        className="overflow-hidden rounded-2xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-4 shadow-lg sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row">
                          {/* Product image */}
                          <div className="h-48 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--brown-dark)] sm:h-28 sm:w-28">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-3xl text-[var(--gold)]">
                                <FaShoppingBag
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                          </div>

                          {/* Product information */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h2 className="break-words text-xl font-extrabold text-[var(--gold-light)]">
                                  {item.name ||
                                    "Coffee"}
                                </h2>

                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  $
                                  {Number(
                                    item.price ||
                                      0
                                  ).toFixed(2)}{" "}
                                  each
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    itemKey
                                  )
                                }
                                aria-label={`Remove ${
                                  item.name ||
                                  "item"
                                }`}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-300 transition-colors hover:bg-red-500 hover:text-white"
                              >
                                <FaTrash
                                  aria-hidden="true"
                                />
                              </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <OptionBadge>
                                Size:{" "}
                                {item.size ??
                                  "M"}
                              </OptionBadge>

                              <OptionBadge>
                                Sugar:{" "}
                                {formatSugar(
                                  item.sugar
                                )}
                              </OptionBadge>

                              <OptionBadge>
                                Ice:{" "}
                                {item.ice ??
                                  "ទឹកកកធម្មតា"}
                              </OptionBadge>
                            </div>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--brown-light)]/30 pt-4">
                          <div className="flex items-center overflow-hidden rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)]">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  itemKey
                                )
                              }
                              aria-label="Decrease quantity"
                              className="flex h-10 w-10 items-center justify-center text-[var(--gold-light)] transition-colors hover:bg-[var(--brown-main)]"
                            >
                              <FaMinus
                                aria-hidden="true"
                              />
                            </button>

                            <span className="flex h-10 min-w-10 items-center justify-center border-x border-[var(--brown-light)] px-3 font-bold text-[var(--gold-light)]">
                              {Number(
                                item.quantity ||
                                  0
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  itemKey
                                )
                              }
                              aria-label="Increase quantity"
                              className="flex h-10 w-10 items-center justify-center text-[var(--gold-light)] transition-colors hover:bg-[var(--brown-main)]"
                            >
                              <FaPlus
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          <p className="text-xl font-extrabold text-[var(--gold)]">
                            $
                            {itemTotal.toFixed(
                              2
                            )}
                          </p>
                        </div>
                      </article>
                    );
                  }
                )}
              </section>

              {/* Order summary */}
              <aside className="w-full min-w-0 rounded-2xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-5 shadow-xl xl:sticky xl:top-28">
                <h2 className="text-xl font-extrabold text-[var(--gold-light)]">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-3 border-b border-[var(--brown-light)]/40 pb-5">
                  <div className="flex justify-between text-sm text-[var(--muted)]">
                    <span>Drinks</span>

                    <span>
                      {
                        totals.totalQuantity
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--gold-light)]">
                      Total
                    </span>

                    <strong className="text-2xl text-[var(--gold)]">
                      $
                      {totals.subtotal.toFixed(
                        2
                      )}
                    </strong>
                  </div>
                </div>

                {/* ABA Payment */}
                <div className="pt-5">
                  <h3 className="text-center text-lg font-extrabold text-[var(--gold-light)]">
                    ABA Payment
                  </h3>

                  <p className="mt-2 text-center text-sm leading-6 text-[var(--muted)]">
                    Scan the QR code or open
                    the ABA payment link.
                  </p>

                  <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4">
                    <QRCode
                      value={
                        ABA_PAYMENT_URL
                      }
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                    />
                  </div>

                  <a
                    href={ABA_PAYMENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block rounded-xl bg-[var(--gold)] px-5 py-3 font-extrabold text-[var(--brown-dark)] transition-colors hover:bg-[var(--gold-light)]"
                  >
                    Pay with ABA

                    <FaExternalLinkAlt
                      aria-hidden="true"
                    />
                  </a>
                </div>

                {/* Submit order form */}
                <form
                  onSubmit={submitOrder}
                  className="mt-6 space-y-4 border-t border-[var(--brown-light)]/40 pt-5"
                >
                  <p className="break-all text-sm leading-6 text-green-300">
                    Customer account:{" "}
                    {firebaseUser?.email ||
                      profile?.email ||
                      "No email"}
                  </p>

                  <FormField
                    id="customerName"
                    label="Customer Name"
                    type="text"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  />

                  <FormField
                    id="customerPhone"
                    label="Phone Number"
                    type="tel"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerPhone(
                        event.target.value
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  />

                  {/* <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-200">
                    ABA Receipt Upload
                    ត្រូវបានបិទបណ្ដោះអាសន្ន
                    ដើម្បីជៀសវាង Firebase
                    Storage CORS Error។ Order
                    នឹងត្រូវបានរក្សាទុកក្នុង
                    Customer History។
                  </div> */}

                  {submitError && (
                    <div
                      role="alert"
                      className="break-words rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
                    >
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      loadingAuth
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3.5 font-extrabold text-[var(--brown-dark)] transition-colors hover:bg-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaCheckCircle
                      aria-hidden="true"
                    />

                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Order"}
                  </button>
                </form>
              </aside>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}

function OptionBadge({ children }) {
  return (
    <span className="max-w-full break-words rounded-lg border border-[var(--brown-light)]/40 bg-[var(--brown-dark)] px-3 py-1.5 text-xs font-semibold text-[var(--gold-light)]">
      {children}
    </span>
  );
}

function FormField({
  id,
  label,
  type,
  value,
  onChange,
  disabled,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-[var(--gold-light)]"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className="w-full rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)] px-4 py-3 text-[var(--gold-light)] outline-none focus:border-[var(--gold)] disabled:opacity-60"
      />
    </div>
  );
}