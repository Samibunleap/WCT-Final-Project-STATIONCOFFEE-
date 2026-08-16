import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import background1 from "../assets/images/background1.JPG";

export default function Home() {
  return (
    <>
      <section
        className="relative flex min-h-screen flex-col bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(
            180deg,
            rgba(30, 15, 5, 0.8) 0%,
            rgba(46, 26, 12, 0.45) 40%,
            rgba(30, 15, 5, 0.75) 100%
          ), url(${background1})`,
        }}
      >
        <Navbar />

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-32 text-center">
          <h1 className="text-4xl font-extrabold uppercase leading-tight tracking-[0.2em] text-[var(--gold-light)] drop-shadow-lg sm:text-6xl md:text-8xl">
            Station
            <br />
            Coffee
          </h1>

          {/* <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          Fresh coffee, handcrafted drinks, and a comfortable place to enjoy
            every moment.
          </p> */}

          <Link
            to="/menu"
            className="mt-10 rounded-full border-2 border-[var(--gold)] px-11 py-4 text-sm font-bold uppercase tracking-widest text-[var(--gold-light)] transition-all duration-300 hover:bg-[var(--gold)] hover:text-[var(--brown-dark)]"
          >
            View Menu
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}