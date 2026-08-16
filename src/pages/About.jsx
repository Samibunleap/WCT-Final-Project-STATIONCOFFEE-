import React from "react";
import aboutImage from "../assets/images/background1.JPG";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function About() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--brown-dark)]">
      <Navbar />
      <main className="min-h-screen bg-[var(--brown-dark)] px-4 pb-16 pt-24 text-[#fff3dc] sm:px-6 md:pt-28 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Page title */}
          <header className="mb-10 text-center md:mb-12">
            <h1 className="text-4xl font-black tracking-[8px] sm:text-5xl sm:tracking-[12px] md:text-6xl">
              ABOUT
            </h1>

            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-amber-400" />
          </header>

          {/* About content */}
          <section className="overflow-hidden rounded-3xl bg-[#32170c] shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
            {/* Image */}
            <div className="group overflow-hidden">
              <img
                src={aboutImage}
                alt="About Station Coffee"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </div>

            {/* Simple information */}
            <div className="px-6 py-10 text-center sm:px-10 sm:py-12 md:px-16">
              <p className="text-xs font-bold uppercase tracking-[4px] text-amber-400 sm:text-sm">
                Station Coffee
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
                I'm Hom Chanrath
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#f4ddc4] sm:text-lg">
                I'm just someone who always likes to drink coffee.
              </p>

              <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-[#f4ddc4]/80 sm:text-lg">
                Station Coffee shares new flavors with coffee lovers.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;