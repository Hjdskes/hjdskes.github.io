// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Copyright (C) Jens John <dev@2ion.de>
// Copyright (C) Jente Hidskes <hjdskes@gmail.com>

// If the user accesses the site using a non-SSL connection,
// a hyperref is displayed which upon clicking will redirect the user
// to the HTTPS version.

function include_lock(selector, text) {
    if (window.location.protocol === "https:") {
        return;
    }

    var node = document.querySelector(selector);
    if (node === null) {
        return;
    }

    var a = document.createElement("a");
    a.setAttribute("class", "lock");
    a.setAttribute("href", "https://" + window.location.host + window.location.pathname);
    a.setAttribute("title", "Switch to an SSL-secured connection");

    var t = document.createTextNode(text);
    a.appendChild(t);
    node.appendChild(a);
};

const SELECTOR = ".main-nav";
const TEXT = "Use https";
include_lock(SELECTOR, TEXT);

