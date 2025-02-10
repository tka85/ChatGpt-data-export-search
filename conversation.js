document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get("q");

    if (!searchTerm) return;

    const decodedSearchTerm = decodeURIComponent(searchTerm).trim();
    const regex = new RegExp(decodedSearchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "gi");

    let matches = [];
    let currentMatch = 0;

    function highlightText(node) {
        if (node.nodeType === 3) { // Text node
            const match = node.nodeValue.match(regex);
            if (match) {
                const span = document.createElement("span");
                span.className = "highlight";
                span.innerHTML = node.nodeValue.replace(regex, `<span class="highlight-pink">$&</span>`);
                node.replaceWith(span);
            }
        } else if (node.nodeType === 1 && node.childNodes) { // Element node
            for (let i = 0; i < node.childNodes.length; i++) {
                highlightText(node.childNodes[i]);
            }
        }
    }

    highlightText(document.body);

    const highlightElements = document.querySelectorAll(".highlight-pink");

    function scrollToMatch(index) {
        if (highlightElements.length === 0) return;

        highlightElements.forEach(el => el.classList.remove("highlight-green"));
        highlightElements[index].classList.add("highlight-green");

        highlightElements[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function nextMatch() {
        if (highlightElements.length === 0) return;
        currentMatch = (currentMatch + 1) % highlightElements.length;
        scrollToMatch(currentMatch);
    }

    function prevMatch() {
        if (highlightElements.length === 0) return;
        currentMatch = (currentMatch - 1 + highlightElements.length) % highlightElements.length;
        scrollToMatch(currentMatch);
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "n" && !e.shiftKey) {
            e.preventDefault();
            nextMatch();
        } else if (e.key === "N" && e.shiftKey) {
            e.preventDefault();
            prevMatch();
        }
    });

    const widget = document.createElement("div");
    widget.style.position = "fixed";
    widget.style.top = "5px";
    widget.style.right = "5px";
    widget.style.padding = "5px";
    widget.style.background = "yellow";
    widget.style.color = "black";
    widget.style.fontSize = "larger";
    widget.style.fontWeight = "bold";
    widget.style.zIndex = "1000";
    widget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    widget.style.display = "flex";
    widget.style.alignItems = "center";
    widget.style.gap = "5px";

    const label = document.createElement("span");
    label.innerText = `Search: "${decodedSearchTerm}"`;

    const prevButton = document.createElement("button");
    prevButton.innerText = "Prev";
    prevButton.onclick = prevMatch;

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.onclick = nextMatch;

    widget.appendChild(label);
    widget.appendChild(prevButton);
    widget.appendChild(nextButton);
    document.body.appendChild(widget);

    if (highlightElements.length > 0) {
        scrollToMatch(0);
    }
});
