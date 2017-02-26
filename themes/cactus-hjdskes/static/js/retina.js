// Replaces images with their retina equivalents when the page is viewed on a
// retina device.
//
// To make images retina, simply give them a "2x" class and provide an image
// with @2x appended in the filename (e.g. "foo.png" and "foo@2x.png").

function isRetina() {
    var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
                      (min--moz-device-pixel-ratio: 1.5),\
                      (-o-min-device-pixel-ratio: 3/2),\
                      (min-resolution: 1.5dppx)";

    if (window.devicePixelRatio > 1) {
        return true;
    } else if (window.matchMedia && window.matchMedia(mediaQuery).matches) {
        return true;
    }

    return false;
};

function retina() {
    if (!isRetina()) {
        return;
    }

    var images = document.getElementsByClassName("2x");

    Array.prototype.forEach.call(images, function(element) {
        var path = element.getAttribute("src");
        path = path.replace(".png", "@2x.png");
        path = path.replace(".jpg", "@2x.jpg");
        element.setAttribute("src", path);
    });
};

retina();
