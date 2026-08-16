import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTelegramPlane,
  FaTiktok,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

const contactLinks = [
  {
    label: "Station Coffee Page",
    href: "https://www.facebook.com/share/1EDDHmCzg3/?mibextid=wwXIfr",
    icon: FaFacebookF,
    iconStyle: "bg-[#1877f2]",
  },
  {
    label: "@Charnothhom | Telegram: +855 71 968 9698",
    href: "https://t.me/Charnothhom",
    icon: FaTelegramPlane,
    iconStyle: "bg-[#229ed9]",
  },
  {
    label: "Station Coffee.com",
    href: "https://www.tiktok.com/",
    icon: FaTiktok,
    iconStyle: "bg-black",
  },
  {
    label: "(+855) 71 968 9698",
    href: "tel:+855719689698",
    icon: FaPhoneAlt,
    iconStyle: "border border-[#d89a5b] bg-transparent",
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#3b1f0f] text-[#f4ede4]">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand section */}
          <div>
            <h2 className="text-2xl font-extrabold uppercase tracking-widest text-[#e6ad6d]">
              Station Coffee
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-7 text-[#ead8c5]">
              Enjoy freshly brewed coffee, handcrafted drinks, and a welcoming
              atmosphere at Station Coffee.
            </p>

            <div className="mt-6 space-y-4 text-sm text-[#e6ad6d]">
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt aria-hidden="true" />

                <span>Phnom Penh, Cambodia</span>
              </div>

              <a
                href="mailto:stationcoffee@gmail.com"
                className="flex items-center gap-3 transition-colors hover:text-white"
              >
                <FaEnvelope aria-hidden="true" />

                <span>stationcoffee@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-[#e6ad6d]">
              Quick Links
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-amber-300"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/menu"
                  className="transition-colors hover:text-amber-300"
                >
                  Menu
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className="transition-colors hover:text-amber-300"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  to="/location"
                  className="transition-colors hover:text-amber-300"
                >
                  Location
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="transition-colors hover:text-amber-300"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social media and phone */}
          <div>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-[#e6ad6d]">
              Connect With Us
            </h3>

            <div className="space-y-5">
              {contactLinks.map((item) => {
                const Icon = item.icon;
                const isExternalLink = item.href.startsWith("http");

                return (
                  <a
                    href={item.href}
                    target={isExternalLink ? "_blank" : undefined}
                    rel={isExternalLink ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 transition-colors group"
                  > 
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${item.iconStyle}`}
                    >
                      <Icon aria-hidden="true" />
                    </span>

                    <span className="text-sm text-[#e6ad6d] transition-colors group-hover:text-white sm:text-base">
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-[#e6ad6d]/20 pt-6 text-center">
          <p className="text-sm text-[#d5b28e]">
            © {new Date().getFullYear()} Station Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}