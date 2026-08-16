import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  FaShoppingBag,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

import { auth, db } from "../firebase/firebase";

import logo from "../assets/logo/logo station coffee.ico";

const NAV_LINKS = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "Menu",
    to: "/menu",
  },
  {
    label: "About",
    to: "/about",
  },
  {
    label: "Location",
    to: "/location",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const accountMenuRef = useRef(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false);

  const [cartCount, setCartCount] =
    useState(0);

  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [userProfile, setUserProfile] =
    useState(null);

  const [checkingUser, setCheckingUser] =
    useState(true);

  /*
    គណនា Cart count ពី localStorage។
  */
  function updateCartCount() {
    try {
      const savedCart = localStorage.getItem(
        "stationCoffeeCart"
      );

      const parsedCart = savedCart
        ? JSON.parse(savedCart)
        : [];

      const cart = Array.isArray(parsedCart)
        ? parsedCart
        : [];

      const totalItems = cart.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      setCartCount(totalItems);
    } catch (error) {
      console.error(
        "Navbar cart count error:",
        error
      );

      setCartCount(0);
    }
  }

  /*
    ពិនិត្យ Firebase Login account។

    Anonymous User មិនត្រូវចាត់ទុកជា
    Customer account ដែលបាន Login ទេ។
  */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setCheckingUser(true);

        if (
          !currentUser ||
          currentUser.isAnonymous
        ) {
          setFirebaseUser(null);
          setUserProfile(null);
          setAccountMenuOpen(false);
          setCheckingUser(false);

          return;
        }

        try {
          const profileSnapshot = await getDoc(
            doc(db, "users", currentUser.uid)
          );

          setFirebaseUser(currentUser);

          if (profileSnapshot.exists()) {
            setUserProfile({
              uid: currentUser.uid,
              email: currentUser.email || "",
              ...profileSnapshot.data(),
            });
          } else {
            /*
              Fallback ក្នុងករណី Authentication
              account មាន ប៉ុន្តែ Firestore profile
              មិនមាន។
            */
            setUserProfile({
              uid: currentUser.uid,

              name:
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "Account",

              email: currentUser.email || "",
              role: "customer",
              accountStatus: "active",
            });
          }
        } catch (error) {
          console.error(
            "Navbar user profile error:",
            error
          );

          setFirebaseUser(currentUser);

          setUserProfile({
            uid: currentUser.uid,

            name:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "Account",

            email: currentUser.email || "",
            role: "customer",
            accountStatus: "active",
          });
        } finally {
          setCheckingUser(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /*
    បិទ Menus ពេលប្ដូរ Page។
  */
  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
    updateCartCount();
  }, [location.pathname]);

  /*
    Listen សម្រាប់ Cart update។
  */
  useEffect(() => {
    updateCartCount();

    function handleCartUpdate() {
      updateCartCount();
    }

    window.addEventListener(
      "storage",
      handleCartUpdate
    );

    window.addEventListener(
      "cartUpdated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleCartUpdate
      );

      window.removeEventListener(
        "cartUpdated",
        handleCartUpdate
      );
    };
  }, []);

  /*
    បិទ Menu ពេលចុច Escape។
  */
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAccountMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /*
    បិទ Account dropdown ពេលចុចខាងក្រៅ។
  */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(
          event.target
        )
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
    Sign Out ពី Firebase។
  */
  async function handleSignOut() {
    try {
      setAccountMenuOpen(false);
      setMenuOpen(false);

      await signOut(auth);

      setFirebaseUser(null);
      setUserProfile(null);

      window.dispatchEvent(
        new Event("customerUpdated")
      );

      window.dispatchEvent(
        new Event("adminUpdated")
      );

      navigate("/login", {
        replace: true,

        state: {
          message:
            "អ្នកបាន Sign Out ដោយជោគជ័យ។",
        },
      });
    } catch (error) {
      console.error(
        "Navbar sign out error:",
        error
      );
    }
  }

  const isLoggedIn =
    Boolean(firebaseUser) &&
    Boolean(userProfile) &&
    !firebaseUser?.isAnonymous;

  const dashboardPath =
    userProfile?.role === "admin"
      ? "/admin"
      : "/dashboard";

  const dashboardLabel =
    userProfile?.role === "admin"
      ? "Admin Dashboard"
      : "My Dashboard";

  const displayName =
    userProfile?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split("@")[0] ||
    "Account";

  const displayEmail =
    userProfile?.email ||
    firebaseUser?.email ||
    "";

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--brown-light)]/30 bg-[var(--brown-dark)]/95 shadow-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 lg:px-12">
        {/* Logo and brand */}
        <Link
          to="/"
          aria-label="Go to Station Coffee home page"
          onClick={() => {
            setMenuOpen(false);
            setAccountMenuOpen(false);
          }}
          className="group flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--brown-light)] transition-all duration-300 group-hover:scale-105 group-hover:ring-[var(--gold)] sm:h-14 sm:w-14">
          <img
              src={logo}
              alt="Station Coffee Logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold uppercase tracking-wider text-[var(--gold-light)] transition-colors duration-300 group-hover:text-[var(--gold)] sm:text-base lg:text-lg">
              Station
            </p>

            <p className="-mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--faint)] sm:text-[10px] lg:text-xs">
              Coffee
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `relative block rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 lg:px-4 lg:text-sm lg:tracking-widest ${
                    isActive
                      ? "bg-[var(--brown-main)] text-[var(--gold)]"
                      : "text-[var(--gold-light)] hover:bg-[var(--brown-mid)] hover:text-[var(--gold)]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}

                    <span
                      className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[var(--gold)] transition-all duration-300 ${
                        isActive ? "w-6" : "w-0"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Cart */}
          <NavLink
            to="/cart"
            title="Shopping cart"
            aria-label={`Shopping cart with ${cartCount} items`}
            className={({ isActive }) =>
              `group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-[var(--gold)] text-[var(--brown-dark)] shadow-lg"
                  : "bg-[var(--brown-mid)] text-[var(--gold-light)] hover:-translate-y-0.5 hover:bg-[var(--brown-main)] hover:text-[var(--gold)]"
              }`
            }
          >
            <FaShoppingBag
              aria-hidden="true"
              className="text-base transition-transform duration-300 group-hover:scale-110"
            />

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--brown-dark)] bg-[var(--gold)] px-1 text-[10px] font-extrabold text-[var(--brown-dark)]">
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </NavLink>

          <span
            aria-hidden="true"
            className="mx-1 h-7 w-px bg-[var(--brown-light)]/60"
          />

          {checkingUser ? (
            /*
              Loading account state។
            */
            <div className="h-10 w-28 animate-pulse rounded-xl bg-[var(--brown-mid)]" />
          ) : isLoggedIn ? (
            /*
              Logged-in account dropdown។
            */
            <div
              ref={accountMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setAccountMenuOpen(
                    (current) => !current
                  )
                }
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--brown-light)]/50 bg-[var(--brown-mid)] px-2.5 text-sm font-bold text-[var(--gold-light)] transition-all duration-300 hover:border-[var(--gold)] hover:bg-[var(--brown-main)] hover:text-[var(--gold)]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs text-[var(--brown-dark)]">
                  <FaUser aria-hidden="true" />
                </span>

                <span className="hidden max-w-28 truncate xl:block">
                  {displayName}
                </span>
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-[100] mt-3 w-64 overflow-hidden rounded-2xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] shadow-2xl"
                >
                  {/* Account information */}
                  <div className="border-b border-[var(--brown-light)]/30 px-4 py-4">
                    <p className="truncate font-extrabold text-[var(--gold-light)]">
                      {displayName}
                    </p>

                    <p className="mt-1 truncate text-xs text-[var(--muted)]">
                      {displayEmail}
                    </p>

                    <span className="mt-2 inline-flex rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-2.5 py-1 text-xs font-bold uppercase text-[var(--gold)]">
                      {userProfile?.role ||
                        "customer"}
                    </span>
                  </div>

                  {/* Dashboard link */}
                  <Link
                    to={dashboardPath}
                    role="menuitem"
                    onClick={() =>
                      setAccountMenuOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[var(--gold-light)] transition-colors hover:bg-[var(--brown-main)] hover:text-[var(--gold)]"
                  >
                    <FaTachometerAlt
                      aria-hidden="true"
                    />

                    {dashboardLabel}
                  </Link>

                  {/* Sign out */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 border-t border-[var(--brown-light)]/30 px-4 py-3 text-left text-sm font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
                  >
                    <FaSignOutAlt
                      aria-hidden="true"
                    />

                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /*
              User not logged in។
            */
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `group flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--brown-main)] text-[var(--gold)]"
                      : "text-[var(--gold-light)] hover:bg-[var(--brown-mid)] hover:text-[var(--gold)]"
                  }`
                }
              >
                <FaSignInAlt
                  aria-hidden="true"
                  className="text-sm transition-transform duration-300 group-hover:translate-x-0.5"
                />

                <span className="hidden xl:inline">
                  Login
                </span>
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `group flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-all duration-300 lg:px-4 ${
                    isActive
                      ? "bg-[var(--gold-light)] text-[var(--brown-dark)] shadow-lg"
                      : "bg-[var(--gold)] text-[var(--brown-dark)] hover:-translate-y-0.5 hover:bg-[var(--gold-light)] hover:shadow-lg"
                  }`
                }
              >
                <FaUserPlus
                  aria-hidden="true"
                  className="text-sm transition-transform duration-300 group-hover:scale-110"
                />

                <span className="hidden xl:inline">
                  Register
                </span>
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setMenuOpen(
              (current) => !current
            );

            setAccountMenuOpen(false);
          }}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brown-mid)] text-xl text-[var(--gold-light)] transition-all duration-300 hover:bg-[var(--gold)] hover:text-[var(--brown-dark)] md:hidden"
        >
          <span
            aria-hidden="true"
            className={`transition-transform duration-300 ${
              menuOpen
                ? "rotate-90"
                : "rotate-0"
            }`}
          >
            {menuOpen ? "✕" : "☰"}
          </span>

          {cartCount > 0 && !menuOpen && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--brown-dark)] bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--brown-dark)]">
              {cartCount > 99
                ? "99+"
                : cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-navigation"
        className={`overflow-hidden bg-[var(--brown-deep)] transition-all duration-300 md:hidden ${
          menuOpen
            ? "max-h-[900px] border-t border-[var(--brown-light)]/30 opacity-100"
            : "pointer-events-none max-h-0 border-t border-transparent opacity-0"
        }`}
      >
        <div className="px-4 py-5 sm:px-6">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-widest transition-all duration-300 ${
                      isActive
                        ? "bg-[var(--brown-main)] text-[var(--gold)]"
                        : "text-[var(--gold-light)] hover:bg-[var(--brown-mid)] hover:pl-5 hover:text-[var(--gold)]"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile cart */}
          <NavLink
            to="/cart"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `mt-4 flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${
                isActive
                  ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--brown-dark)]"
                  : "border-[var(--brown-light)] bg-[var(--brown-mid)] text-[var(--gold-light)] hover:border-[var(--gold)]"
              }`
            }
          >
            <span className="flex items-center gap-3 font-bold">
              <FaShoppingBag aria-hidden="true" />
              Cart
            </span>

            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--gold)] px-2 text-xs font-extrabold text-[var(--brown-dark)]">
              {cartCount}
            </span>
          </NavLink>

          {/* Mobile account section */}
          {checkingUser ? (
            <div className="mt-4 h-20 animate-pulse rounded-xl bg-[var(--brown-mid)]" />
          ) : isLoggedIn ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--brown-light)]/40 bg-[var(--brown-mid)]">
              {/* Account information */}
              <div className="flex items-center gap-3 border-b border-[var(--brown-light)]/30 px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--brown-dark)]">
                  <FaUser aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <p className="truncate font-extrabold text-[var(--gold-light)]">
                    {displayName}
                  </p>

                  <p className="truncate text-xs text-[var(--muted)]">
                    {displayEmail}
                  </p>

                  <p className="mt-1 text-xs font-bold uppercase text-[var(--gold)]">
                    {userProfile?.role ||
                      "customer"}
                  </p>
                </div>
              </div>

              {/* Mobile dashboard */}
              <Link
                to={dashboardPath}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[var(--gold-light)] transition-colors hover:bg-[var(--brown-main)] hover:text-[var(--gold)]"
              >
                <FaTachometerAlt
                  aria-hidden="true"
                />

                {dashboardLabel}
              </Link>

              {/* Mobile sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 border-t border-[var(--brown-light)]/30 px-4 py-3 text-left text-sm font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
              >
                <FaSignOutAlt
                  aria-hidden="true"
                />

                Sign Out
              </button>
            </div>
          ) : (
            /*
              Mobile Login and Register។
            */
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--brown-light)] bg-[var(--brown-mid)] px-3 py-3 text-sm font-bold text-[var(--gold-light)] transition-all duration-300 hover:border-[var(--gold)] hover:text-[var(--gold)]"
              >
                <FaSignInAlt aria-hidden="true" />
                Login
              </Link>

              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-3 py-3 text-sm font-bold text-[var(--brown-dark)] transition-all duration-300 hover:bg-[var(--gold-light)]"
              >
                <FaUserPlus aria-hidden="true" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}