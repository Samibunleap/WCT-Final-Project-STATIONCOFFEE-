import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCoffee,
  FaDollarSign,
  FaShoppingBag,
  FaUser,
} from "react-icons/fa";

import {
  db,
} from "../firebase/firebase";

import {
  useAuth,
} from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Dashboard() {
  const location = useLocation();

  const {
    profile: customer,
    loadingAuth,
  } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
    Load only the orders belonging to
    the currently logged-in customer.

    Firestore order.customerId must be
    equal to the Firebase customer UID.
  */
  useEffect(() => {
    if (!customer?.uid) {
      setLoadingOrders(false);
      return undefined;
    }

    setLoadingOrders(true);
    setError("");

    const customerOrdersQuery = query(
      collection(db, "orders"),

      where(
        "customerId",
        "==",
        customer.uid
      )
    );

    const unsubscribe = onSnapshot(
      customerOrdersQuery,

      (snapshot) => {
        const orderList =
          snapshot.docs.map(
            (orderDocument) => ({
              id: orderDocument.id,
              ...orderDocument.data(),
            })
          );

        /*
          Sort in the browser so an additional
          Firestore composite index is not needed.

          Newest orders appear first.
        */
        orderList.sort(
          (
            firstOrder,
            secondOrder
          ) => {
            const firstTime =
              firstOrder.createdAt
                ?.toMillis?.() || 0;

            const secondTime =
              secondOrder.createdAt
                ?.toMillis?.() || 0;

            return (
              secondTime - firstTime
            );
          }
        );

        setOrders(orderList);
        setLoadingOrders(false);
      },

      (firebaseError) => {
        console.error(
          "Load customer orders error:",
          firebaseError
        );

        setError(
          `${firebaseError.code}: ${firebaseError.message}`
        );

        setLoadingOrders(false);
      }
    );

    return unsubscribe;
  }, [customer?.uid]);

  /*
    Calculate customer order statistics.
  */
  const orderStatistics = useMemo(() => {
    const pendingStatuses = [
      "pending",
      "payment_review",
      "confirmed",
      "preparing",
      "ready",
    ];

    const pendingOrders =
      orders.filter((order) =>
        pendingStatuses.includes(
          order.orderStatus ||
            "payment_review"
        )
      ).length;

    const completedOrders =
      orders.filter(
        (order) =>
          order.orderStatus ===
          "completed"
      ).length;

    /*
      This total includes all submitted orders.

      If you want only completed sales,
      filter completed orders before reduce().
    */
    const totalAmount =
      orders.reduce(
        (total, order) =>
          total +
          Number(order.total || 0),
        0
      );

    return {
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      totalAmount,
    };
  }, [orders]);

  function formatDate(timestamp) {
    if (!timestamp?.toDate) {
      return "Processing...";
    }

    return timestamp
      .toDate()
      .toLocaleString();
  }

  function formatStatus(status) {
    if (!status) {
      return "Pending";
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  }

  function getStatusClass(status) {
    if (
      status === "verified" ||
      status === "confirmed" ||
      status === "completed"
    ) {
      return "border-green-400/40 bg-green-500/10 text-green-300";
    }

    if (
      status === "rejected" ||
      status === "payment_rejected" ||
      status === "cancelled"
    ) {
      return "border-red-400/40 bg-red-500/10 text-red-300";
    }

    if (
      status === "preparing" ||
      status === "ready"
    ) {
      return "border-blue-400/40 bg-blue-500/10 text-blue-300";
    }

    return "border-yellow-400/40 bg-yellow-500/10 text-yellow-300";
  }

  /*
    AuthContext is still checking the
    Firebase session.
  */
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brown-dark)] px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--brown-light)] border-t-[var(--gold)]" />

          <p className="mt-4 text-sm text-[var(--muted)]">
            កំពុងពិនិត្យ Customer
            Account...
          </p>
        </div>
      </div>
    );
  }

  /*
    ProtectedRoute normally prevents this
    situation, but this avoids rendering errors.
  */
  if (!customer) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[var(--brown-dark)]">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
          {/* Page heading */}
          <section className="mb-6 sm:mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
              Station Coffee
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-[var(--gold-light)] sm:text-3xl lg:text-4xl">
              Customer Dashboard
            </h1>
          </section>

          {/* Message from another page */}
          {location.state?.message && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-300 sm:px-5 sm:py-4"
            >
              {location.state.message}
            </div>
          )}

          {/* Firestore error */}
          {error && (
            <div
              role="alert"
              className="mb-6 break-words rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300 sm:px-5 sm:py-4"
            >
              {error}
            </div>
          )}

          {/* Customer profile */}
          <section className="rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-5 shadow-xl sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--brown-main)] text-3xl text-[var(--gold)]">
                <FaUser aria-hidden="true" />
              </div>

              <div className="w-full min-w-0">
                

                <h2 className="mt-1 break-words text-2xl font-extrabold text-[var(--gold-light)] sm:text-3xl">
                  {customer.name ||
                    "Station Coffee Customer"}
                </h2>

                <div className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
                  <p className="break-all">
                    Email:{" "}
                    {customer.email ||
                      "No email"}
                  </p>

                  <p className="break-words">
                    Phone:{" "}
                    {customer.phone ||
                      "No phone"}
                  </p>

                  <p>
                    Role:{" "}

                    <span className="font-bold capitalize text-[var(--gold)]">
                      {customer.role}
                    </span>
                  </p>

                  <p>
                    Account:{" "}

                    <span className="font-bold capitalize text-green-300">
                      {customer.accountStatus ||
                        "active"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Order statistics */}
          <section className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 xl:grid-cols-4">
            <StatisticCard
              icon={<FaClipboardList />}
              label="Total Orders"
              value={
                orderStatistics.totalOrders
              }
              color="text-[var(--gold)]"
            />

            <StatisticCard
              icon={<FaClock />}
              label="Pending Orders"
              value={
                orderStatistics.pendingOrders
              }
              color="text-yellow-300"
            />

            <StatisticCard
              icon={<FaCheckCircle />}
              label="Completed Orders"
              value={
                orderStatistics.completedOrders
              }
              color="text-green-300"
            />

            <StatisticCard
              icon={<FaDollarSign />}
              label="Total Amount"
              value={`$${orderStatistics.totalAmount.toFixed(
                2
              )}`}
              color="text-green-300"
            />
          </section>

          {/* Quick actions
          <section className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
            <Link
              to="/menu"
              className="group rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-5 shadow-lg transition-all hover:-translate-y-1 hover:border-[var(--gold)] sm:p-6"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brown-main)] text-2xl text-[var(--gold)]">
                <FaCoffee
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-[var(--gold-light)]">
                Order Coffee
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                មើល Menu និងជ្រើសរើស
                ភេសជ្ជៈថ្មី។
              </p>
            </Link>

            <Link
              to="/cart"
              className="group rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-5 shadow-lg transition-all hover:-translate-y-1 hover:border-[var(--gold)] sm:p-6"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brown-main)] text-2xl text-[var(--gold)]">
                <FaShoppingBag
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-[var(--gold-light)]">
                My Cart
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                ពិនិត្យ Cart បង់ប្រាក់ និង
                Submit Order។
              </p>
            </Link>
          </section> */}

          {/* Order history */}
          <section className="mt-6 rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-5 shadow-xl sm:mt-8 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <FaClipboardList className="shrink-0 text-2xl text-[var(--gold)]" />

                  <h2 className="text-2xl font-extrabold text-[var(--gold-light)]">
                    My Order History
                  </h2>
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  ពិនិត្យ Drinks, Total,
                  Payment និង Order Status។
                </p>
              </div>

              <div className="w-fit rounded-xl bg-[var(--brown-dark)] px-4 py-2 text-sm font-bold text-[var(--gold)]">
                Total Orders:{" "}
                {orders.length}
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center sm:py-14">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--brown-light)] border-t-[var(--gold)]" />

                <p className="mt-4 text-sm text-[var(--muted)]">
                  កំពុងទាញ Order
                  History...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center sm:py-14">
                <FaClipboardList className="mx-auto text-4xl text-[var(--faint)]" />

                <p className="mt-4 font-bold text-[var(--gold-light)]">
                  មិនទាន់មាន Order
                </p>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
                  Order របស់អ្នកនឹងបង្ហាញ
                  នៅទីនេះបន្ទាប់ពី Submit
                  Order ជោគជ័យ។
                </p>

                <Link
                  to="/menu"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 font-extrabold text-[var(--brown-dark)] transition-colors hover:bg-[var(--gold-light)]"
                >
                  <FaCoffee
                    aria-hidden="true"
                  />

                  Order Coffee
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                {orders.map((order) => {
                  const paymentStatus =
                    order.payment?.status ||
                    "pending_review";

                  const orderStatus =
                    order.orderStatus ||
                    "payment_review";

                  return (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-2xl border border-[var(--brown-light)]/40 bg-[var(--brown-dark)] p-4 sm:p-5"
                    >
                      {/* Order header */}
                      <div className="flex flex-col gap-4 border-b border-[var(--brown-light)]/30 pb-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--faint)]">
                            Order ID
                          </p>

                          <h3 className="mt-1 break-all text-sm font-extrabold text-[var(--gold-light)] sm:text-base">
                            {order.orderId ||
                              order.id}
                          </h3>

                          <p className="mt-2 text-xs text-[var(--muted)] sm:text-sm">
                            {formatDate(
                              order.createdAt
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`max-w-full break-words rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase sm:text-xs ${getStatusClass(
                              paymentStatus
                            )}`}
                          >
                            Payment:{" "}
                            {formatStatus(
                              paymentStatus
                            )}
                          </span>

                          <span
                            className={`max-w-full break-words rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase sm:text-xs ${getStatusClass(
                              orderStatus
                            )}`}
                          >
                            Order:{" "}
                            {formatStatus(
                              orderStatus
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Customer snapshot */}
                      <div className="mt-4 grid gap-2 rounded-xl border border-[var(--brown-light)]/20 bg-[var(--brown-deep)] p-3 text-xs text-[var(--muted)] sm:grid-cols-2 sm:text-sm">
                        <p className="break-words">
                          Customer:{" "}
                          {order.customer
                            ?.name ||
                            customer.name}
                        </p>

                        <p className="break-words">
                          Phone:{" "}
                          {order.customer
                            ?.phone ||
                            customer.phone ||
                            "No phone"}
                        </p>
                      </div>

                      {/* Order items */}
                      <div className="mt-4 space-y-3 sm:mt-5">
                        {(order.items || []).map(
                          (item, index) => (
                            <div
                              key={`${order.id}-${
                                item.cartItemId ||
                                item.productId ||
                                index
                              }`}
                              className="flex flex-col gap-3 rounded-xl border border-[var(--brown-light)]/30 p-3 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="flex min-w-0 gap-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name || "Product"}
                                    className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
                                  />
                                )}

                                <div className="min-w-0">
                                  <p className="break-words font-bold text-[var(--gold-light)]">
                                    {item.name ||
                                      "Coffee"}{" "}
                                    ×{" "}
                                    {Number(
                                      item.quantity ||
                                        0
                                    )}
                                  </p>

                                  <p className="mt-1 break-words text-xs leading-5 text-[var(--muted)]">
                                    Size:{" "}
                                    {item.size ||
                                      "M"}
                                    {" · "}
                                    Sugar:{" "}
                                    {item.sugar ||
                                      "100%"}
                                    {" · "}
                                    Ice:{" "}
                                    {item.ice ||
                                      "ទឹកកកធម្មតា"}
                                  </p>

                                  <p className="mt-1 text-xs text-[var(--faint)]">
                                    Unit price: $
                                    {Number(
                                      item.price ||
                                        0
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <p className="shrink-0 font-extrabold text-[var(--gold)]">
                                $
                                {Number(
                                  item.itemTotal ||
                                    Number(
                                      item.price ||
                                        0
                                    ) *
                                      Number(
                                        item.quantity ||
                                          0
                                      )
                                ).toFixed(2)}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {/* Order summary */}
                      <div className="mt-5 space-y-2 border-t border-[var(--brown-light)]/30 pt-4">
                        <div className="flex items-center justify-between gap-4 text-sm text-[var(--muted)]">
                          <span>
                            Total Quantity
                          </span>

                          <span>
                            {Number(
                              order.totalQuantity ||
                                0
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="font-bold text-[var(--gold-light)]">
                            Total
                          </span>

                          <span className="text-xl font-extrabold text-[var(--gold)] sm:text-2xl">
                            $
                            {Number(
                              order.total || 0
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}

function StatisticCard({
  icon,
  label,
  value,
  color,
}) {
  return (
    <article className="rounded-2xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] p-5 shadow-lg">
      <div
        className={`text-2xl ${color}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-3xl font-extrabold ${color}`}
      >
        {value}
      </p>
    </article>
  );
}