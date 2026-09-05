// ============================================
// FUTURE PLUS STUDY Classes
// Main JavaScript
// ============================================


// ================= MOBILE MENU =================

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

if (menuBtn && mainNav) {

    menuBtn.addEventListener("click", () => {
        mainNav.classList.toggle("active");
    });


    // Mobile menu link click ke baad close
    const navLinks = mainNav.querySelectorAll("a");

    navLinks.forEach(link => {

        link.addEventListener("click", () => {
            mainNav.classList.remove("active");
        });

    });

}


// ================= CURRENT YEAR =================

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// ================= PWA =================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("PWA Service Worker Registered");
            })
            .catch(error => {
                console.log(
                    "Service Worker Error:",
                    error
                );
            });

    });

}


// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", () => {

    console.log(
        "Future Plus Study Classes website loaded successfully."
    );

});
