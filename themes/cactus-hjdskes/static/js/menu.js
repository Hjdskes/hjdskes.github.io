// Adds a click handler for the hamburger menu.

function toggleMenu() {
    var nav = document.querySelector(".main-nav");
    if (nav === null) {
        return;
    } else if (nav.className === "main-nav") {
        nav.className += " responsive";
    } else {
        nav.className = "main-nav";
    }
}

function addHandler(id, ev, func) {
    var node = document.getElementById(id);
    if (node === null) {
        return;
    }
    node.addEventListener(ev, func);
}

addHandler("hamburger", "click", toggleMenu);

