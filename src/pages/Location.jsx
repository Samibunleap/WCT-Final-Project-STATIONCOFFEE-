import React from "react";
import locationImage from "../assets/images/location.png";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

import {
  FaFacebookF,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTiktok,
  FaClock,
} from "react-icons/fa";

function Location() {
  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[var(--brown-dark)]">
        <Navbar />

        <main className="min-h-screen bg-[var(--brown-dark)] px-4 pb-16 pt-24 text-white sm:px-6 md:pb-20 md:pt-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* Page Heading */}
          <header className="mb-10 text-center md:mb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[5px] text-amber-400 sm:text-sm md:tracking-[7px]">
              Visit Station Coffee
            </p>

            <h1 className="text-4xl font-black tracking-[6px] text-amber-100 sm:text-5xl sm:tracking-[9px] md:text-6xl lg:text-7xl">
              LOCATION
            </h1>

            <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-amber-400 md:w-28" />

            {/* <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-amber-100/80 sm:text-base md:text-lg">
              Visit our cafe and enjoy freshly prepared coffee in a relaxing
              atmosphere.
            </p> */}
          </header>

          {/* Main Location Content */}
          <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#30170d] shadow-[0_30px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[1.1fr_0.9fr]">
            {/* Clickable Location Image */}
            <a
              href="https://maps.app.goo.gl/FgJnMVfjHEnzoaW58"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Station Coffee location in Google Maps"
              className="group relative block min-h-[320px] overflow-hidden sm:min-h-[450px] lg:min-h-[650px]"
            >
              <img
                src={locationImage}
                alt="Station Coffee Location"
                className="absoluteblack/80 via-black/10 to-transparent transition duration-500 group-hover:bg-black/30" />

              {/* Google Maps Button */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="flex translate-y-5 items-center gap-3 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-[#2b1408] opacity-0 shadow-2xl transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:px-7 sm:py-4 sm:text-base">
                  <FaMapMarkerAlt className="text-lg sm:text-xl" />

                  <span>Open in Google Maps</span>
                </div>
              </div>

              {/* Bottom Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[4px] text-amber-300">
                  Station Coffee
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Your local coffee place
                </h2>

                <p className="mt-3 flex items-center gap-2 text-sm text-white/75">
                  <FaMapMarkerAlt className="shrink-0 text-amber-400" />

                  <span>Click the image to open Google Maps</span>
                </p>
              </div>
            </a>

            {/* Cafe Information */}
            <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
              {/* Cafe Heading */}
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-[#2b1408] shadow-lg sm:h-16 sm:w-16">
                  <FaMapMarkerAlt className="text-2xl" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[3px] text-amber-400">
                    Find Us
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-amber-100 sm:text-4xl">
                    Our Cafe
                  </h2>
                </div>
              </div>

              {/* Address */}
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-amber-400/40 hover:bg-white/10 sm:p-6">
                <div className="flex items-start gap-4">
                  <FaMapMarkerAlt className="mt-1 shrink-0 text-xl text-amber-400" />

                  <div>
                    <h3 className="mb-2 text-lg font-bold text-white">
                      Address
                    </h3>

                    <p className="text-sm leading-7 text-amber-100/80 sm:text-base">
                      Western International School
                      <br />
                      Street 99, Phnom Penh
                    </p>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-amber-400/40 hover:bg-white/10 sm:p-6">
                <div className="flex items-start gap-4">
                  <FaClock className="mt-1 shrink-0 text-xl text-amber-400" />

                  <div>
                    <h3 className="mb-2 text-lg font-bold text-white">
                      Opening Hours
                    </h3>

                    <p className="text-sm text-amber-100/70 sm:text-base">
                      Open every day
                    </p>

                    <p className="mt-1 text-xl font-black text-amber-400 sm:text-2xl">
                      7:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {/* <div className="space-y-3">
                {/* Facebook 
                <a
                  href="https://www.facebook.com/share/1EDDHmCzg3/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Station Coffee on Facebook"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#1877f2] hover:bg-[#1877f2] hover:shadow-xl"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white transition duration-300 group-hover:bg-white group-hover:text-[#1877f2]">
                    <FaFacebookF />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[2px] text-white/60 group-hover:text-white/80">
                      Follow us on Facebook
                    </p>

                    <p className="truncate font-bold text-white">
                      Station Coffee
                    </p>
                  </div>
                </a>
                <a
                  href="https://www.tiktok.com/@hom.chanrath?_r=1&_t=ZS-973zXUZhvU7"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Station Coffee on TikTok"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-black hover:shadow-xl"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white transition duration-300 group-hover:bg-white group-hover:text-black">
                    <FaTiktok />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[2px] text-white/60 group-hover:text-white/80">
                      Follow us on TikTok
                    </p>

                    <p className="truncate font-bold text-white">
                      @hom.chanrath
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+855719689698"
                  aria-label="Call Station Coffee"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-black hover:shadow-xl"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white transition duration-300 group-hover:bg-white group-hover:text-black">
                    <FaPhoneAlt />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[2px] text-white/60 group-hover:text-[#2b1408]/70">
                      Call us now
                    </p>

                    <p className="truncate font-bold text-white group-hover:text-[#2b1408]">
                      (+855) 71 968 9698
                    </p>
                  </div>
                </a>
              </div> */}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
}

export default Location;