import { useEffect, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DrinkCard from "../components/DrinkCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Drink images
import greenTeaImage from "../assets/drinks/green tea.png";
import iceLatteImage from "../assets/drinks/ice latte .png";
import coconutLatteImage from "../assets/drinks/ice lattle cconut.png";
import icedCoffeeImage from "../assets/drinks/ice lattle.png";
import matchaLatteImage from "../assets/drinks/Matcha lattle.png";
import orangeTeaImage from "../assets/drinks/oranige tea.png";
import passionSodaImage from "../assets/drinks/pssion soda.png";

const DRINKS = [
  {
    id: 1,
    name: "Green Tea",
    description:
      "Refreshing green tea with a smooth taste and natural tea aroma.",
    price: 1,
    image: greenTeaImage,
  },
  {
    id: 2,
    name: "Iced Latte",
    description:
      "Espresso mixed with creamy milk and served cold over ice.",
    price: 1.5,
    image: iceLatteImage,
  },
  {
    id: 3,
    name: "Coconut Latte",
    description:
      "Creamy iced latte mixed with the smooth flavor of coconut.",
    price: 2.5,
    image: coconutLatteImage,
  },
  {
    id: 4,
    name: "Iced Coffee",
    description:
      "Freshly brewed coffee served cold for a refreshing coffee experience.",
    price: 1.50,
    image: icedCoffeeImage,
  },
  {
    id: 5,
    name: "Matcha Latte",
    description:
      "Rich green matcha blended with smooth and creamy fresh milk.",
    price: 2.75,
    image: matchaLatteImage,
  },
  {
    id: 6,
    name: "Orange Tea",
    description:
      "Refreshing tea mixed with sweet and citrusy orange flavor.",
    price: 1.45,
    image: orangeTeaImage,
  },
  {
    id: 7,
    name: "Passion Soda",
    description:
      "Sparkling soda mixed with sweet and refreshing passion fruit.",
    price: 2.5,
    image: passionSodaImage,
  },
];

function getSavedItems(key) {
  try {
    const savedItems = localStorage.getItem(key);
    const parsedItems = savedItems ? JSON.parse(savedItems) : [];

    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch {
    return [];
  }
}

export default function Menu() {
  const navigate = useNavigate();

    const {
      profile: customer,
    } = useAuth();
  
  const [cart, setCart] = useState(() =>
    getSavedItems("stationCoffeeCart")
  );

  const [favorites, setFavorites] = useState(() =>
    getSavedItems("stationCoffeeFavorites")
  );

  const [message, setMessage] = useState("");
  const messageTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      "stationCoffeeCart",
      JSON.stringify(cart)
    );

    window.dispatchEvent(new Event("cartUpdated"));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      "stationCoffeeFavorites",
      JSON.stringify(favorites)
    );
  }, [favorites]);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  function showMessage(text) {
    setMessage(text);

    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }

    messageTimerRef.current = window.setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  function handleAddToCart(drink, options) {

  // User must login before adding to cart
  if (!customer) {

    showMessage(
      "Please login before adding items to cart."
    );

    setTimeout(() => {
      navigate("/login");
    }, 800);

    return;
  }

  const quantity = Number(options.quantity);
  const size = options.size || "M";
  const sugar = Number(options.sugar ?? 100);
  const ice = options.ice || "ទឹកកកធម្មតា";

  const cartItemId =
    `${drink.id}-${size}-${sugar}-${ice}`;

  setCart((currentCart) => {

    const existingItem =
      currentCart.find(
        (item) =>
          item.cartItemId === cartItemId
      );

    if (existingItem) {

      return currentCart.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              quantity:
                Number(item.quantity) +
                quantity,
            }
          : item
      );
    }

    return [
      ...currentCart,
      {
        ...drink,
        cartItemId,
        quantity,
        size,
        sugar,
        ice,
      },
    ];
  });

  showMessage(
    `${quantity} ${drink.name} added to your cart`
  );
}
  function handleToggleFavorite(drink) {
    const drinkIsFavorite = favorites.some(
      (item) => item.id === drink.id
    );

    if (drinkIsFavorite) {
      setFavorites((currentFavorites) =>
        currentFavorites.filter(
          (item) => item.id !== drink.id
        )
      );

      showMessage(`${drink.name} removed from favorites`);
      return;
    }

    setFavorites((currentFavorites) => [
      ...currentFavorites,
      drink,
    ]);

    showMessage(`${drink.name} added to favorites`);
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--brown-dark)]">
        <Navbar />

        <main className="mx-auto max-w-7xl px-5 pb-20 pt-32 sm:px-6 md:px-8 lg:px-12">
          <section className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">
              Station Coffee
            </p>

            <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-wider text-[var(--gold-light)] sm:text-5xl">
              Drink Menu
            </h1>
          </section>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className="fixed left-1/2 top-24 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[var(--gold)]/50 bg-[var(--brown-deep)] px-5 py-4 text-center text-sm font-semibold text-[var(--gold-light)] shadow-2xl sm:left-auto sm:right-5 sm:w-auto sm:translate-x-0"
            >
              ✓ {message}
            </div>
          )}

          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {DRINKS.map((drink) => (
              <DrinkCard
                key={drink.id}
                drink={drink}
                isFavorite={favorites.some(
                  (item) => item.id === drink.id
                )}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}
