import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  FaBars,
  FaCheck,
  FaClipboardList,
  FaClock,
  FaDollarSign,
  FaEnvelope,
  FaHome,
  FaShoppingBag,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";

import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

const NAVIGATION_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: FaHome,
  },
  {
    id: "orders",
    label: "Manage Orders",
    icon: FaClipboardList,
  },
  {
    id: "messages",
    label: "Contact Messages",
    icon: FaEnvelope,
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const successTimer = useRef(null);

  const {
    profile: admin,
    loadingAuth,
    logout,
  } = useAuth();

  const [activePage, setActivePage] =
    useState("overview");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /*
    Load Firestore data in real time.
  */
  useEffect(() => {
    if (!admin?.uid) {
      return undefined;
    }

    setLoadingData(true);
    setErrorMessage("");

    let usersLoaded = false;
    let ordersLoaded = false;
    let messagesLoaded = false;

    function finishLoading() {
      if (
        usersLoaded &&
        ordersLoaded &&
        messagesLoaded
      ) {
        setLoadingData(false);
      }
    }

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),

      (snapshot) => {
        setUsers(
          snapshot.docs.map((userDocument) => ({
            id: userDocument.id,
            ...userDocument.data(),
          }))
        );

        usersLoaded = true;
        finishLoading();
      },

      (error) => {
        handleLoadError("Users", error);

        usersLoaded = true;
        finishLoading();
      }
    );

    const unsubscribeOrders = onSnapshot(
      collection(db, "orders"),

      (snapshot) => {
        const orderList = snapshot.docs.map(
          (orderDocument) => ({
            id: orderDocument.id,
            ...orderDocument.data(),
          })
        );

        orderList.sort((firstOrder, secondOrder) => {
          const firstTime =
            firstOrder.createdAt?.toMillis?.() || 0;

          const secondTime =
            secondOrder.createdAt?.toMillis?.() || 0;

          return secondTime - firstTime;
        });

        setOrders(orderList);

        ordersLoaded = true;
        finishLoading();
      },

      (error) => {
        handleLoadError("Orders", error);

        ordersLoaded = true;
        finishLoading();
      }
    );

    const unsubscribeMessages = onSnapshot(
      collection(db, "messages"),

      (snapshot) => {
        const messageList = snapshot.docs.map(
          (messageDocument) => ({
            id: messageDocument.id,
            ...messageDocument.data(),
          })
        );

        messageList.sort(
          (firstMessage, secondMessage) => {
            const firstTime =
              firstMessage.createdAt?.toMillis?.() ||
              0;

            const secondTime =
              secondMessage.createdAt?.toMillis?.() ||
              0;

            return secondTime - firstTime;
          }
        );

        setMessages(messageList);

        messagesLoaded = true;
        finishLoading();
      },

      (error) => {
        handleLoadError("Messages", error);

        messagesLoaded = true;
        finishLoading();
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
      unsubscribeMessages();
    };
  }, [admin?.uid]);

  /*
    Close Mobile Menu using Escape key.
  */
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /*
    Prevent body scrolling when the
    Mobile Sidebar is open.
  */
  useEffect(() => {
    document.body.style.overflow =
      mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  /*
    Clear message timer.
  */
  useEffect(() => {
    return () => {
      if (successTimer.current) {
        window.clearTimeout(
          successTimer.current
        );
      }
    };
  }, []);

  function handleLoadError(
    collectionName,
    error
  ) {
    console.error(
      `Load ${collectionName} error:`,
      error
    );

    setErrorMessage(
      `${collectionName}: ${
        error?.message ||
        "មិនអាចទាញទិន្នន័យបានទេ។"
      }`
    );
  }

  function showSuccess(message) {
    setSuccessMessage(message);
    setErrorMessage("");

    if (successTimer.current) {
      window.clearTimeout(
        successTimer.current
      );
    }

    successTimer.current =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
  }

  function openPage(pageName) {
    setActivePage(pageName);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSignOut() {
    setActionLoading("sign-out");
    setErrorMessage("");

    try {
      await logout();

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Admin signed out successfully.",
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);

      setErrorMessage(
        "Admin Sign Out មិនបានជោគជ័យ។"
      );
    } finally {
      setActionLoading("");
    }
  }

  /*
    Approve or reject payment.
  */
  async function reviewPayment(
    orderId,
    paymentStatus,
    orderStatus
  ) {
    setActionLoading(orderId);
    setErrorMessage("");

    try {
      await updateDoc(
        doc(db, "orders", orderId),
        {
          "payment.status": paymentStatus,
          orderStatus,
          reviewedBy: admin.uid,
          reviewedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      showSuccess(
        paymentStatus === "verified"
          ? "Payment ត្រូវបាន Approve។"
          : "Payment ត្រូវបាន Reject។"
      );
    } catch (error) {
      console.error(
        "Review payment error:",
        error
      );

      setErrorMessage(
        "មិនអាចកែ Payment Status បានទេ។ សូមពិនិត្យ Firestore Rules។"
      );
    } finally {
      setActionLoading("");
    }
  }

  /*
    Update order progress.
  */
  async function updateOrderStatus(
    orderId,
    orderStatus
  ) {
    setActionLoading(orderId);
    setErrorMessage("");

    try {
      await updateDoc(
        doc(db, "orders", orderId),
        {
          orderStatus,
          updatedAt: serverTimestamp(),
        }
      );

      showSuccess(
        "Order Status ត្រូវបានកែប្រែ។"
      );
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      setErrorMessage(
        "មិនអាចកែ Order Status បានទេ។"
      );
    } finally {
      setActionLoading("");
    }
  }

  /*
    Update Message status.
  */
  async function updateMessageStatus(
    messageId,
    status
  ) {
    setActionLoading(messageId);
    setErrorMessage("");

    try {
      await updateDoc(
        doc(db, "messages", messageId),
        {
          status,
          updatedAt: serverTimestamp(),
        }
      );

      showSuccess(
        `Message ត្រូវបានកំណត់ជា ${status}។`
      );
    } catch (error) {
      console.error(
        "Update message error:",
        error
      );

      setErrorMessage(
        "មិនអាចកែ Message Status បានទេ។"
      );
    } finally {
      setActionLoading("");
    }
  }

  /*
    Delete Message.
  */
  async function deleteMessage(messageId) {
    const shouldDelete = window.confirm(
      "តើអ្នកពិតជាចង់លុប Message នេះមែនទេ?"
    );

    if (!shouldDelete) {
      return;
    }

    setActionLoading(messageId);
    setErrorMessage("");

    try {
      await deleteDoc(
        doc(db, "messages", messageId)
      );

      showSuccess("Message ត្រូវបានលុប។");
    } catch (error) {
      console.error(
        "Delete message error:",
        error
      );

      setErrorMessage(
        "មិនអាចលុប Message បានទេ។"
      );
    } finally {
      setActionLoading("");
    }
  }

  function formatDate(timestamp) {
    if (!timestamp?.toDate) {
      return "Processing...";
    }

    return timestamp
      .toDate()
      .toLocaleString();
  }

  function formatShortDate(timestamp) {
    if (!timestamp?.toDate) {
      return "Processing...";
    }

    return timestamp
      .toDate()
      .toLocaleDateString();
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

  /*
    Calculate accurate Overview values.
  */
  const statistics = useMemo(() => {
    /*
      All accounts except Admin are counted
      as Customer accounts.
    */
    const customerUsers = users.filter(
      (user) => user.role !== "admin"
    );

    /*
      Pending Orders include Orders that
      have not reached Completed/Cancelled.
    */
    const pendingOrders = orders.filter(
      (order) => {
        const paymentStatus =
          order.payment?.status ||
          "pending_review";

        const orderStatus =
          order.orderStatus ||
          "payment_review";

        return (
          paymentStatus === "pending" ||
          paymentStatus === "pending_review" ||
          orderStatus === "pending" ||
          orderStatus === "payment_review" ||
          orderStatus === "confirmed" ||
          orderStatus === "preparing" ||
          orderStatus === "ready"
        );
      }
    );

    const completedOrders = orders.filter(
      (order) =>
        order.orderStatus === "completed"
    );

    const unreadMessages = messages.filter(
      (message) =>
        !message.status ||
        message.status === "unread"
    );

    /*
      Sales include verified or completed
      Orders, but exclude rejected/cancelled.
    */
    const validSalesOrders = orders.filter(
      (order) => {
        const paymentStatus =
          order.payment?.status || "";

        const orderStatus =
          order.orderStatus || "";

        const accepted =
          paymentStatus === "verified" ||
          orderStatus === "completed";

        const rejected =
          paymentStatus === "rejected" ||
          orderStatus === "payment_rejected" ||
          orderStatus === "cancelled";

        return accepted && !rejected;
      }
    );

    const totalSales = validSalesOrders.reduce(
      (total, order) => {
        const amount = Number(
          order.total ??
            order.subtotal ??
            0
        );

        return Number.isFinite(amount)
          ? total + amount
          : total;
      },
      0
    );

    return {
      customers: customerUsers.length,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      completedOrders:
        completedOrders.length,
      totalSales,
      unreadMessages:
        unreadMessages.length,
    };
  }, [users, orders, messages]);

  if (loadingAuth) {
    return <LoadingScreen />;
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#160a05] text-[#f4ddbd]">
      <AdminTopbar
        pageTitle={getPageTitle(activePage)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={
          setMobileMenuOpen
        }
        actionLoading={actionLoading}
        handleSignOut={handleSignOut}
      />

      <div className="flex min-h-[calc(100vh-72px)]">
        <DesktopSidebar
          admin={admin}
          activePage={activePage}
          openPage={openPage}
          statistics={statistics}
        />

        <MobileSidebar
          admin={admin}
          open={mobileMenuOpen}
          setOpen={setMobileMenuOpen}
          activePage={activePage}
          openPage={openPage}
          statistics={statistics}
          actionLoading={actionLoading}
          handleSignOut={handleSignOut}
          navigate={navigate}
        />

        <main className="min-w-0 flex-1 bg-[#1c0d07] p-3 sm:p-5 lg:p-7 xl:p-8">
          {errorMessage && (
            <AlertMessage type="error">
              {errorMessage}
            </AlertMessage>
          )}

          {successMessage && (
            <AlertMessage type="success">
              {successMessage}
            </AlertMessage>
          )}

          {loadingData ? (
            <LoadingSection />
          ) : (
            <>
              {activePage === "overview" && (
                <OverviewSection
                  statistics={statistics}
                  orders={orders}
                  messages={messages}
                  openPage={openPage}
                  formatShortDate={
                    formatShortDate
                  }
                  formatStatus={formatStatus}
                />
              )}

              {activePage === "orders" && (
                <OrdersSection
                  orders={orders}
                  actionLoading={
                    actionLoading
                  }
                  reviewPayment={
                    reviewPayment
                  }
                  updateOrderStatus={
                    updateOrderStatus
                  }
                  formatDate={formatDate}
                  formatStatus={formatStatus}
                />
              )}

              {activePage === "messages" && (
                <MessagesSection
                  messages={messages}
                  actionLoading={
                    actionLoading
                  }
                  updateMessageStatus={
                    updateMessageStatus
                  }
                  deleteMessage={
                    deleteMessage
                  }
                  formatDate={formatDate}
                  formatStatus={formatStatus}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminTopbar({
  pageTitle,
  mobileMenuOpen,
  setMobileMenuOpen,
  actionLoading,
  handleSignOut,
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between border-b border-[#6f3f22]/40 bg-[#241107] px-4 shadow-lg sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              (currentValue) => !currentValue
            )
          }
          aria-label="Open administration menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#7a482a]/50 bg-[#3c210f] text-lg text-[#f4ddbd] lg:hidden"
        >
          {mobileMenuOpen ? (
            <FaTimes aria-hidden="true" />
          ) : (
            <FaBars aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#d9aa64]">
            Station Coffee Admin
          </p>

          <h1 className="truncate text-lg font-extrabold text-[#fff4df] sm:text-xl">
            {pageTitle}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={actionLoading === "sign-out"}
        className="hidden min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-red-500 disabled:opacity-50 sm:flex"
      >
        <FaSignOutAlt aria-hidden="true" />

        {actionLoading === "sign-out"
          ? "Signing Out..."
          : "Logout"}
      </button>
    </header>
  );
}

function DesktopSidebar({
  admin,
  activePage,
  openPage,
  statistics,
}) {
  return (
    <aside className="hidden w-[270px] shrink-0 flex-col border-r border-[#6f3f22]/35 bg-[#201007] lg:flex">
      <div className="border-b border-[#6f3f22]/35 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d9aa64] text-xl text-[#241107]">
            <FaUserShield aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d9aa64]">
              Station Coffee
            </p>

            <p className="mt-1 text-sm font-bold text-[#fff4df]">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#96745d]">
          Admin Management
        </p>

        <nav className="mt-4 space-y-2">
          {NAVIGATION_ITEMS.map((item) => {
            const count =
              item.id === "orders"
                ? statistics.pendingOrders
                : item.id === "messages"
                  ? statistics.unreadMessages
                  : 0;

            return (
              <SidebarButton
                key={item.id}
                item={item}
                active={activePage === item.id}
                count={count}
                onClick={() =>
                  openPage(item.id)
                }
              />
            );
          })}
        </nav>
      </div>

      <AdminProfile admin={admin} />
    </aside>
  );
}

function MobileSidebar({
  admin,
  open,
  setOpen,
  activePage,
  openPage,
  statistics,
  actionLoading,
  handleSignOut,
  navigate,
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close administration menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[86vw] flex-col border-r border-[#6f3f22]/40 bg-[#201007] shadow-2xl transition-transform duration-300 lg:hidden ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-[72px] items-center justify-between border-b border-[#6f3f22]/40 px-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d9aa64]">
              Station Coffee
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-[#fff4df]">
              Admin Portal
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b2113] text-[#f4ddbd]"
            aria-label="Close menu"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {NAVIGATION_ITEMS.map((item) => {
            const count =
              item.id === "orders"
                ? statistics.pendingOrders
                : item.id === "messages"
                  ? statistics.unreadMessages
                  : 0;

            return (
              <SidebarButton
                key={item.id}
                item={item}
                active={activePage === item.id}
                count={count}
                onClick={() =>
                  openPage(item.id)
                }
              />
            );
          })}
        </nav>

        <div className="border-t border-[#6f3f22]/40 p-4">
          <AdminProfile admin={admin} compact />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#704126] bg-[#32190d] px-4 py-3 text-sm font-bold text-[#f4ddbd]"
          >
            <FaHome aria-hidden="true" />
            Visit Website
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={actionLoading === "sign-out"}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            <FaSignOutAlt aria-hidden="true" />

            {actionLoading === "sign-out"
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarButton({
  item,
  active,
  count,
  onClick,
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${
        active
          ? "bg-[#d9aa64] text-[#241107] shadow-lg"
          : "text-[#d8bea2] hover:bg-[#3b2113] hover:text-white"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-black/10"
            : "bg-[#3b2113] text-[#d9aa64]"
        }`}
      >
        <Icon aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1 truncate">
        {item.label}
      </span>

      {count > 0 && (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
            active
              ? "bg-[#241107]/15"
              : "bg-red-500 text-white"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function AdminProfile({
  admin,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-[#6f3f22]/40 bg-[#2d160b] p-3"
          : "border-t border-[#6f3f22]/35 p-4"
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d9aa64] font-extrabold text-[#241107]">
          {String(
            admin.name ||
              admin.email ||
              "A"
          )
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#fff4df]">
            {admin.name ||
              "Station Coffee Admin"}
          </p>

          <p className="truncate text-xs text-[#a98c73]">
            {admin.email || "No email"}
          </p>

          <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#d9aa64]">
            Administrator
          </p>
        </div>
      </div>
    </div>
  );
}

function OverviewSection({
  statistics,
  orders,
  messages,
  openPage,
  formatShortDate,
  formatStatus,
}) {
  const cards = [
    {
      label: "Total Customers",
      value: statistics.customers,
      icon: FaUsers,
      color: "text-blue-300",
      background: "bg-blue-500/10",
      page: "overview",
    },
    {
      label: "Total Orders",
      value: statistics.totalOrders,
      icon: FaShoppingBag,
      color: "text-[#d9aa64]",
      background: "bg-[#d9aa64]/10",
      page: "orders",
    },
    {
      label: "Pending Orders",
      value: statistics.pendingOrders,
      icon: FaClock,
      color: "text-yellow-300",
      background: "bg-yellow-500/10",
      page: "orders",
    },
    {
      label: "Completed Orders",
      value: statistics.completedOrders,
      icon: FaCheck,
      color: "text-green-300",
      background: "bg-green-500/10",
      page: "orders",
    },
    {
      label: "Total Sales",
      value: `$${Number(
        statistics.totalSales || 0
      ).toFixed(2)}`,
      icon: FaDollarSign,
      color: "text-green-300",
      background: "bg-green-500/10",
      page: "orders",
    },
    {
      label: "Unread Messages",
      value: statistics.unreadMessages,
      icon: FaEnvelope,
      color: "text-orange-300",
      background: "bg-orange-500/10",
      page: "messages",
    },
  ];

  const recentOrders = orders.slice(0, 5);
  const recentMessages = messages.slice(0, 3);

  return (
    <div>
      <section className="flex flex-col gap-4 rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d9aa64]">
            Administration
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-[#fff4df]">
            Overview
          </h2>

          <p className="mt-1 text-sm text-[#a98c73]">
            Current Station Coffee activity and
            statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openPage("orders")}
          className="w-full rounded-xl bg-[#d9aa64] px-5 py-3 text-sm font-extrabold text-[#241107] shadow-lg hover:bg-[#f3d49d] sm:w-auto"
        >
          Manage All Orders
        </button>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.label}
              type="button"
              onClick={() =>
                openPage(card.page)
              }
              className="rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] p-5 text-left shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#d9aa64]/60"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.background} ${card.color}`}
              >
                <Icon aria-hidden="true" />
              </div>

              <p className="mt-4 text-sm text-[#ad9078]">
                {card.label}
              </p>

              <p
                className={`mt-2 break-words text-3xl font-extrabold ${card.color}`}
              >
                {card.value}
              </p>
            </button>
          );
        })}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] shadow-lg">
        <div className="flex items-center justify-between border-b border-[#6f3f22]/35 px-5 py-4">
          <div>
            <h3 className="font-extrabold text-[#fff4df]">
              Recent Order Activity
            </h3>

            <p className="mt-1 text-xs text-[#92745e]">
              Latest five Customer Orders
            </p>
          </div>

          <span className="rounded-full bg-[#d9aa64]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#d9aa64]">
            Live Data
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-[#a98c73]">
            No recent Orders available.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#32190d] text-xs uppercase tracking-wider text-[#a98c73]">
                  <tr>
                    <th className="px-5 py-4">
                      Customer
                    </th>
                    <th className="px-5 py-4">
                      Date
                    </th>
                    <th className="px-5 py-4">
                      Total
                    </th>
                    <th className="px-5 py-4">
                      Payment
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#6f3f22]/25">
                  {recentOrders.map((order) => {
                    const paymentStatus =
                      order.payment?.status ||
                      "pending_review";

                    const orderStatus =
                      order.orderStatus ||
                      "payment_review";

                    return (
                      <tr key={order.id}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#f4ddbd]">
                            {order.customer?.name ||
                              "Unknown Customer"}
                          </p>

                          <p className="mt-1 text-xs text-[#8f735e]">
                            {order.customer?.email ||
                              "No email"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#b99a7c]">
                          {formatShortDate(
                            order.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4 font-extrabold text-[#d9aa64]">
                          $
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={paymentStatus}
                            label={formatStatus(
                              paymentStatus
                            )}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={orderStatus}
                            label={formatStatus(
                              orderStatus
                            )}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openPage("orders")
                            }
                            className="rounded-lg bg-[#d9aa64]/10 px-3 py-2 text-xs font-bold text-[#d9aa64]"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#6f3f22]/25 md:hidden">
              {recentOrders.map((order) => (
                <article
                  key={order.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-bold text-[#f4ddbd]">
                        {order.customer?.name ||
                          "Unknown Customer"}
                      </p>

                      <p className="mt-1 text-xs text-[#8f735e]">
                        {formatShortDate(
                          order.createdAt
                        )}
                      </p>
                    </div>

                    <p className="shrink-0 font-extrabold text-[#d9aa64]">
                      $
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openPage("orders")
                    }
                    className="mt-4 w-full rounded-xl bg-[#d9aa64]/10 px-4 py-2.5 text-sm font-bold text-[#d9aa64]"
                  >
                    Manage Order
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] shadow-lg">
        <div className="flex items-center justify-between border-b border-[#6f3f22]/35 px-5 py-4">
          <div>
            <h3 className="font-extrabold text-[#fff4df]">
              Recent Messages
            </h3>

            <p className="mt-1 text-xs text-[#92745e]">
              Latest Customer Messages
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openPage("messages")
            }
            className="rounded-lg bg-[#d9aa64]/10 px-3 py-2 text-xs font-bold text-[#d9aa64]"
          >
            View All
          </button>
        </div>

        {recentMessages.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#a98c73]">
            No recent Messages.
          </div>
        ) : (
          <div className="divide-y divide-[#6f3f22]/25">
            {recentMessages.map((message) => (
              <article
                key={message.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-words font-bold text-[#f4ddbd]">
                    {message.subject ||
                      "Contact Message"}
                  </p>

                  <p className="mt-1 text-sm text-[#a98c73]">
                    {message.name ||
                      "Unknown Customer"}
                  </p>
                </div>

                <StatusBadge
                  status={
                    message.status || "unread"
                  }
                  label={formatStatus(
                    message.status || "unread"
                  )}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrdersSection({
  orders,
  actionLoading,
  reviewPayment,
  updateOrderStatus,
  formatDate,
  formatStatus,
}) {
  return (
    <div>
      <SectionHeading
        title="Manage Orders"
        description="Review payments and update Customer Order progress."
        icon={<FaClipboardList />}
      />

      <div className="mt-5 space-y-4">
        {orders.length === 0 ? (
          <EmptyState
            icon={<FaShoppingBag />}
            title="No Customer Orders"
            description="New Customer Orders will appear here."
          />
        ) : (
          orders.map((order) => {
            const paymentStatus =
              order.payment?.status ||
              "pending_review";

            const orderStatus =
              order.orderStatus ||
              "payment_review";

            const isLoading =
              actionLoading === order.id;

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] p-4 shadow-lg sm:p-5"
              >
                <div className="flex flex-col gap-4 border-b border-[#6f3f22]/35 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8f735e]">
                      Order ID
                    </p>

                    <h3 className="mt-1 break-all font-extrabold text-[#fff4df]">
                      {order.orderId || order.id}
                    </h3>

                    <p className="mt-2 text-xs text-[#a98c73]">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      status={paymentStatus}
                      label={`Payment: ${formatStatus(
                        paymentStatus
                      )}`}
                    />

                    <StatusBadge
                      status={orderStatus}
                      label={`Order: ${formatStatus(
                        orderStatus
                      )}`}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 rounded-xl border border-[#6f3f22]/30 bg-[#32190d] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8f735e]">
                      Customer
                    </p>

                    <p className="mt-2 font-bold text-[#f4ddbd]">
                      {order.customer?.name ||
                        "Unknown Customer"}
                    </p>

                    <p className="mt-1 break-all text-xs text-[#a98c73]">
                      {order.customer?.email ||
                        "No email"}
                    </p>

                    <p className="mt-1 text-xs text-[#a98c73]">
                      {order.customer?.phone ||
                        "No phone"}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8f735e]">
                      Order Total
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-[#d9aa64]">
                      $
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </p>

                    <p className="mt-1 text-xs text-[#a98c73]">
                      Quantity:{" "}
                      {Number(
                        order.totalQuantity || 0
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(order.items || []).map(
                    (item, index) => (
                      <div
                        key={`${order.id}-${
                          item.cartItemId ||
                          item.productId ||
                          index
                        }`}
                        className="flex flex-col gap-2 rounded-xl border border-[#6f3f22]/25 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#f4ddbd]">
                            {item.name || "Coffee"} ×{" "}
                            {Number(
                              item.quantity || 0
                            )}
                          </p>

                          <p className="mt-1 text-xs text-[#9d7d65]">
                            Size: {item.size || "M"}
                            {" · "}
                            Sugar:{" "}
                            {item.sugar || "100%"}
                            {" · "}
                            Ice: {item.ice || "Normal"}
                          </p>
                        </div>

                        <p className="font-extrabold text-[#d9aa64]">
                          $
                          {Number(
                            item.itemTotal || 0
                          ).toFixed(2)}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {paymentStatus ===
                  "pending_review" && (
                  <div className="mt-5 grid gap-3 border-t border-[#6f3f22]/35 pt-5 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        reviewPayment(
                          order.id,
                          "verified",
                          "confirmed"
                        )
                      }
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      <FaCheck aria-hidden="true" />

                      {isLoading
                        ? "Updating..."
                        : "Approve Payment"}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        reviewPayment(
                          order.id,
                          "rejected",
                          "payment_rejected"
                        )
                      }
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      <FaTimes aria-hidden="true" />

                      {isLoading
                        ? "Updating..."
                        : "Reject Payment"}
                    </button>
                  </div>
                )}

                {paymentStatus === "verified" && (
                  <div className="mt-5 border-t border-[#6f3f22]/35 pt-5">
                    <label
                      htmlFor={`status-${order.id}`}
                      className="mb-2 block text-sm font-bold text-[#f4ddbd]"
                    >
                      Update Order Status
                    </label>

                    <select
                      id={`status-${order.id}`}
                      value={orderStatus}
                      disabled={isLoading}
                      onChange={(event) =>
                        updateOrderStatus(
                          order.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#704126] bg-[#1b0d07] px-4 py-3 text-[#f4ddbd] outline-none focus:border-[#d9aa64] disabled:opacity-50"
                    >
                      <option value="confirmed">
                        Confirmed
                      </option>

                      <option value="preparing">
                        Preparing
                      </option>

                      <option value="ready">
                        Ready
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function MessagesSection({
  messages,
  actionLoading,
  updateMessageStatus,
  deleteMessage,
  formatDate,
  formatStatus,
}) {
  return (
    <div>
      <SectionHeading
        title="Contact Messages"
        description="Read and manage Customer Contact Messages."
        icon={<FaEnvelope />}
      />

      <div className="mt-5 space-y-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={<FaEnvelope />}
            title="No Contact Messages"
            description="New Contact Messages will appear here."
          />
        ) : (
          messages.map((message) => {
            const status =
              message.status || "unread";

            const isLoading =
              actionLoading === message.id;

            const email = message.email || "";

            const subject = encodeURIComponent(
              `Station Coffee: ${
                message.subject || "Your message"
              }`
            );

            const replyLink =
              `mailto:${email}?subject=${subject}`;

            return (
              <article
                key={message.id}
                className="rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] p-4 shadow-lg sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[#fff4df]">
                      {message.subject ||
                        "Contact Message"}
                    </h3>

                    <p className="mt-2 font-bold text-[#f4ddbd]">
                      {message.name ||
                        "Unknown Customer"}
                    </p>

                    <p className="mt-1 break-all text-xs text-[#a98c73]">
                      {email || "No email"}
                    </p>

                    <p className="mt-1 text-xs text-[#a98c73]">
                      {message.phone || "No phone"}
                    </p>

                    <p className="mt-2 text-xs text-[#8f735e]">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>

                  <StatusBadge
                    status={status}
                    label={formatStatus(status)}
                  />
                </div>

                <p className="mt-4 whitespace-pre-wrap rounded-xl border border-[#6f3f22]/30 bg-[#32190d] p-4 text-sm leading-7 text-[#c9ad91]">
                  {message.message ||
                    "No message content"}
                </p>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  <a
                    href={replyLink}
                    onClick={() =>
                      updateMessageStatus(
                        message.id,
                        "replied"
                      )
                    }
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#d9aa64] px-4 py-2.5 text-sm font-extrabold text-[#241107] hover:bg-[#f3d49d]"
                  >
                    <FaEnvelope aria-hidden="true" />
                    Reply
                  </a>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      updateMessageStatus(
                        message.id,
                        "read"
                      )
                    }
                    className="min-h-11 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    Mark Read
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      updateMessageStatus(
                        message.id,
                        "replied"
                      )
                    }
                    className="min-h-11 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    Mark Replied
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      deleteMessage(message.id)
                    }
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <FaTrash aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  icon,
}) {
  return (
    <header className="flex items-start gap-4 rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] p-5 shadow-lg sm:p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d9aa64]/10 text-xl text-[#d9aa64]">
        {icon}
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-[#fff4df]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-[#a98c73]">
          {description}
        </p>
      </div>
    </header>
  );
}

function StatusBadge({
  status,
  label,
}) {
  const statusStyles = {
    verified:
      "border-green-400/40 bg-green-500/10 text-green-300",

    confirmed:
      "border-green-400/40 bg-green-500/10 text-green-300",

    completed:
      "border-green-400/40 bg-green-500/10 text-green-300",

    replied:
      "border-green-400/40 bg-green-500/10 text-green-300",

    rejected:
      "border-red-400/40 bg-red-500/10 text-red-300",

    payment_rejected:
      "border-red-400/40 bg-red-500/10 text-red-300",

    cancelled:
      "border-red-400/40 bg-red-500/10 text-red-300",

    pending:
      "border-yellow-400/40 bg-yellow-500/10 text-yellow-300",

    pending_review:
      "border-yellow-400/40 bg-yellow-500/10 text-yellow-300",

    payment_review:
      "border-yellow-400/40 bg-yellow-500/10 text-yellow-300",

    unread:
      "border-yellow-400/40 bg-yellow-500/10 text-yellow-300",

    preparing:
      "border-blue-400/40 bg-blue-500/10 text-blue-300",

    ready:
      "border-blue-400/40 bg-blue-500/10 text-blue-300",

    read:
      "border-blue-400/40 bg-blue-500/10 text-blue-300",
  };

  const selectedStyle =
    statusStyles[status] ||
    "border-[#6f3f22]/50 bg-[#32190d] text-[#b99a7c]";

  return (
    <span
      className={`h-fit w-fit max-w-full break-words rounded-full border px-3 py-1.5 text-[9px] font-extrabold uppercase sm:text-xs ${selectedStyle}`}
    >
      {label || status}
    </span>
  );
}

function AlertMessage({
  type,
  children,
}) {
  const style =
    type === "success"
      ? "border-green-400/30 bg-green-500/10 text-green-300"
      : "border-red-400/30 bg-red-500/10 text-red-300";

  return (
    <div
      className={`mb-4 rounded-xl border p-4 text-sm leading-6 ${style}`}
    >
      {children}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] px-5 py-14 text-center shadow-lg">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#d9aa64]/10 text-xl text-[#d9aa64]">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-[#fff4df]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-[#a98c73]">
        {description}
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#160a05] px-4">
      <div className="rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] px-8 py-10 text-center shadow-xl">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#6f3f22]/40 border-t-[#d9aa64]" />

        <p className="mt-4 text-sm text-[#a98c73]">
          Checking administrator access...
        </p>
      </div>
    </div>
  );
}

function LoadingSection() {
  return (
    <div className="rounded-2xl border border-[#6f3f22]/40 bg-[#2a140a] py-20 text-center shadow-lg">
      <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#6f3f22]/40 border-t-[#d9aa64]" />

      <p className="mt-4 text-sm text-[#a98c73]">
        Loading administration data...
      </p>
    </div>
  );
}

function getPageTitle(activePage) {
  if (activePage === "orders") {
    return "Manage Orders";
  }

  if (activePage === "messages") {
    return "Contact Messages";
  }

  return "Admin Portal";
}