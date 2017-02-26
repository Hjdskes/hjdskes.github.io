// This script allows the user to browse through the gallery of images. See
// layouts/shortcodes/gallery.html for this.
// Inspired by http://www.w3schools.com/w3css/w3css_slideshow.asp

function resetSlides(slides) {
    for (var i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
}

function resetThumbnails(thumbnails) {
    for (var i = 0; i < thumbnails.length; i++) {
        thumbnails[i].className = thumbnails[i].className.replace(" selected", "");
    }
}

function showSlide(slideIndex) {
    var slides = document.querySelectorAll(".gallery > img");
    if (slides.length === 0) {
        return;
    }
    var thumbnails = document.querySelectorAll(".gallery-thumbnail");
    if (thumbnails.length === 0) {
        return;
    }

    resetSlides(slides);
    resetThumbnails(thumbnails);

    if (slideIndex > slides.length) {
        slideIndex = 0;
    } else if (slideIndex < 0) {
        slideIndex = slides.length;
    }

    slides[slideIndex].style.display = "block";
    thumbnails[slideIndex].className += " selected";
}

showSlide(0);
