import { useState } from "react";
import {
  FaHeart,
  FaMinus,
  FaPlus,
  FaShoppingBag,
} from "react-icons/fa";

const SUGAR_OPTIONS = [10, 30, 50, 70, 100];

const ICE_OPTIONS = [
  "ទឹកកកធម្មតា",
  "ទឹកកកក្រៅ",
];

export default function DrinkCard({
  drink,
  isFavorite = false,
  onAddToCart,
  onToggleFavorite,
}) {
  const [quantity, setQuantity] = useState(1);
  const [sugar, setSugar] = useState(100);
  const [ice, setIce] = useState("ទឹកកកធម្មតា");

  const size = "M";

  function increaseQuantity() {
    setQuantity((currentQuantity) => currentQuantity + 1);
  }

  function decreaseQuantity() {
    setQuantity((currentQuantity) =>
      currentQuantity > 1 ? currentQuantity - 1 : 1
    );
  }

  function handleAddToCart() {
    if (onAddToCart) {
      onAddToCart(drink, {
        quantity,
        size,
        sugar,
        ice,
      });
    }

    setQuantity(1);
  }

  function handleToggleFavorite() {
    if (onToggleFavorite) {
      onToggleFavorite(drink);
    }
  }

  const totalPrice = Number(drink.price) * quantity;

  return (
    <article className="group overflow-hidden rounded-3xl border border-[var(--brown-light)]/40 bg-[var(--brown-deep)] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[var(--gold)]/50 hover:shadow-2xl">
      {/* Drink image */}
      <div className="relative h-72 overflow-hidden bg-[var(--brown-mid)]">
        <img
          src={drink.image}
          alt={drink.name}
          className="h-full w-full object-cover"
        />

        {/* Price */}
        <span className="absolute left-4 top-4 rounded-full bg-[var(--brown-dark)]/90 px-4 py-2 text-sm font-extrabold text-[var(--gold)] shadow-lg backdrop-blur-sm">
          ${Number(drink.price).toFixed(2)}
        </span>

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={
            isFavorite
              ? `Remove ${drink.name} from favorites`
              : `Add ${drink.name} to favorites`
          }
          className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-[var(--brown-dark)]/85 text-[var(--gold-light)] hover:bg-red-500 hover:text-white"
          }`}
        >
          <FaHeart aria-hidden="true" />
        </button>
      </div>

      {/* Drink information */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[var(--gold-light)]">
            {drink.name}
          </h2>

          {isFavorite && (
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
              Favorite
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {drink.description}
        </p>

        {/* Size */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--faint)]">
            Size
          </p>

          <button
            type="button"
            aria-pressed="true"
            className="rounded-lg border border-[var(--gold)] bg-[var(--gold)] px-5 py-2 text-xs font-extrabold text-[var(--brown-dark)]"
          >
            M
          </button>
        </div>

        {/* Sugar */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--faint)]">
            Sugar
          </p>

          <div className="flex flex-wrap gap-2">
            {SUGAR_OPTIONS.map((sugarOption) => (
              <button
                key={sugarOption}
                type="button"
                onClick={() => setSugar(sugarOption)}
                aria-pressed={sugar === sugarOption}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  sugar === sugarOption
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--brown-dark)]"
                    : "border-[var(--brown-light)] bg-[var(--brown-dark)] text-[var(--gold-light)] hover:border-[var(--gold)]"
                }`}
              >
                {sugarOption}%
              </button>
            ))}
          </div>
        </div>

        {/* Ice */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--faint)]">
            Ice
          </p>

          <div className="flex flex-wrap gap-2">
            {ICE_OPTIONS.map((iceOption) => (
              <button
                key={iceOption}
                type="button"
                onClick={() => setIce(iceOption)}
                aria-pressed={ice === iceOption}
                className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                  ice === iceOption
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--brown-dark)]"
                    : "border-[var(--brown-light)] bg-[var(--brown-dark)] text-[var(--gold-light)] hover:border-[var(--gold)]"
                }`}
              >
                {iceOption}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity and total */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--brown-light)]/30 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
              Total
            </p>

            <p className="mt-1 text-xl font-extrabold text-[var(--gold)]">
              ${totalPrice.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center overflow-hidden rounded-xl border border-[var(--brown-light)] bg-[var(--brown-dark)]">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity === 1}
              aria-label={`Decrease ${drink.name} quantity`}
              className="flex h-10 w-10 items-center justify-center text-xs text-[var(--gold-light)] transition-colors hover:bg-[var(--brown-main)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaMinus aria-hidden="true" />
            </button>

            <span className="flex h-10 min-w-11 items-center justify-center border-x border-[var(--brown-light)] px-3 font-extrabold text-[var(--gold-light)]">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              aria-label={`Increase ${drink.name} quantity`}
              className="flex h-10 w-10 items-center justify-center text-xs text-[var(--gold-light)] transition-colors hover:bg-[var(--brown-main)] hover:text-[var(--gold)]"
            >
              <FaPlus aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[var(--gold)] bg-[var(--gold)] px-6 py-3 text-sm font-extrabold uppercase tracking-wider text-[var(--brown-dark)] transition-all hover:bg-transparent hover:text-[var(--gold-light)] active:scale-[0.98]"
        >
          <FaShoppingBag aria-hidden="true" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}