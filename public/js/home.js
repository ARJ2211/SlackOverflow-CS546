// home.js

document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("howItWorksTrack");
    if (!track) return; // not on this page

    const slides = Array.from(track.children);
    const prevBtn = document.getElementById("howItWorksPrev");
    const nextBtn = document.getElementById("howItWorksNext");
    const dots = Array.from(document.querySelectorAll("[data-step-dot]"));

    let current = 0;

    const updateCarousel = (index) => {
        if (!slides.length) return;

        // wrap around
        const total = slides.length;
        current = (index + total) % total;

        // move track
        track.style.transform = `translateX(-${current * 100}%)`;

        // update dots
        dots.forEach((dot, i) => {
            if (i === current) {
                dot.classList.remove("bg-gray-300");
                dot.classList.add("bg-[#F0BD66]");
            } else {
                dot.classList.remove("bg-[#F0BD66]");
                dot.classList.add("bg-gray-300");
            }
        });
    };

    // buttons
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            updateCarousel(current - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            updateCarousel(current + 1);
        });
    }

    // dots
    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => updateCarousel(i));
    });

    // initial state
    updateCarousel(0);
});
