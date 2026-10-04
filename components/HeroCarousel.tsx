"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BOOK_URL, HOSPITAL } from "@/lib/hospital";

interface HeroSlide {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  image: string;
  imageAlt: string;
}

const slides: HeroSlide[] = [
  {
    eyebrow: "Compassionate Care · Modern Medicine",
    title: "Your Health,",
    highlight: "Our Priority.",
    description:
      "Comprehensive healthcare for you and your family, delivered with compassion, dignity and professionalism.",
    image: "/images/hero/lisa-hero-1.jpg",
    imageAlt: "Healthcare professional caring for a patient",
  },
  {
    eyebrow: "24-Hour Emergency Care",
    title: "Care When",
    highlight: "You Need It.",
    description:
      "Our emergency services are available around the clock, every day of the week, for urgent medical needs.",
    image: "/images/hero/lisa-hero-2.jpg",
    imageAlt: "Healthcare professional providing medical care",
  },
  {
    eyebrow: "Comprehensive Medical Services",
    title: "One Hospital,",
    highlight: "Complete Care.",
    description:
      "From specialist clinics and laboratory services to maternity, pharmacy, radiology and critical care.",
    image: "/images/hero/lisa-hero-3.jpg",
    imageAlt: "Doctor consulting with a patient",
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    // Respect the "reduce motion" system setting: no automatic sliding.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  const slide = slides[active];

  return (
    <section
      className="relative overflow-hidden bg-[var(--navy)]"
      aria-label="Lisa Hospitals introduction"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full opacity-10"
        style={{ background: "var(--teal)" }}
      />

      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[350px] w-[350px] rounded-full opacity-5"
        style={{ background: "var(--teal)" }}
      />

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        {/* CONTENT */}
        <div className="relative z-20 flex items-center px-6 py-16 sm:px-10 sm:py-20 lg:px-12 xl:px-16">
          <div className="w-full max-w-xl">
            {/* Eyebrow */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                color: "#75e4e7",
                background: "rgba(0,150,154,0.13)",
                border: "1px solid rgba(0,150,154,0.25)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--teal)" }}
              />

              {slide.eyebrow}
            </div>

            {/* Heading */}
            <h1
              className="text-4xl leading-[0.98] text-white min-[400px]:text-5xl sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {slide.title}
              <br />
              <em
                className="not-italic"
                style={{ color: "#61dfe2" }}
              >
                {slide.highlight}
              </em>
            </h1>

            {/* Description */}
            <p
              className="mt-7 max-w-lg text-base leading-7 sm:text-lg"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              {slide.description}
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={BOOK_URL}
                className="rounded-lg px-7 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: "var(--teal)" }}
              >
                Book an Appointment
              </Link>

              <Link
                href="/services"
                className="rounded-lg px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                style={{
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                Explore Services
              </Link>
            </div>

            {/* Emergency information */}
            <div className="mt-10 flex items-center gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "rgba(232,160,32,0.13)",
                  color: "var(--gold)",
                }}
              >
                <span className="text-lg">+</span>
              </div>

              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  24-Hour Emergency Line
                </div>

                <a
                  href={`tel:${HOSPITAL.phoneTel}`}
                  className="text-sm font-bold text-white hover:underline"
                >
                  {HOSPITAL.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* IMAGE */}
        <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
          {slides.map((item, index) => (
            <div
              key={item.image}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={index !== active}
            >
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />

              {/* Image overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(11,37,69,0.92) 0%, rgba(11,37,69,0.25) 35%, rgba(11,37,69,0.05) 100%)",
                }}
              />

              <div
                className="absolute inset-0 lg:hidden"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(11,37,69,0.9) 0%, rgba(11,37,69,0.1) 70%)",
                }}
              />
            </div>
          ))}

          {/* Image information card — desktop only (on phones it collided with the dots and arrows) */}
          <div className="absolute bottom-8 left-8 z-10 hidden lg:block">
            <div
              className="max-w-xs rounded-xl p-4 backdrop-blur-md"
              style={{
                background: "rgba(11,37,69,0.78)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ background: "var(--teal)" }}
                >
                  +
                </div>

                <div>
                  <div className="text-sm font-bold text-white">
                    Lisa Hospitals
                  </div>

                  <div
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    Namba Okana · Kisumu
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel controls */}
          <div className="absolute bottom-8 right-6 z-20 flex items-center gap-2 sm:right-8">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/20"
              style={{
                background: "rgba(11,37,69,0.65)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              ←
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/20"
              style={{
                background: "rgba(11,37,69,0.65)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Slide indicators: centred under the image on phones/tablets, left-aligned with the text on desktop */}
        <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center lg:left-12 lg:translate-x-0 xl:left-16">
          {slides.map((item, index) => (
            <button
              key={item.image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active}
              className="flex h-8 items-center px-1"
            >
              <span
                className="block h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: index === active ? "34px" : "8px",
                  background:
                    index === active
                      ? "var(--teal)"
                      : "rgba(255,255,255,0.3)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
