const fileInputRadio = document.getElementById("file-input");
const urlInputRadio = document.getElementById("url-input");
const mainInput = document.getElementById("input");
const mainInputLabel = document.getElementById("input-label")
let fileInputEnabled = true;

function enableFileInput() {
    if (fileInputEnabled) {
        return;
    }
    mainInput.setAttribute("type", "file");
    mainInputLabel.innerText = "File: ";
    mainInput.style.marginRight = "unset";
    fileInputEnabled = true;
}

function enableURLInput() {
    if (!fileInputEnabled) {
        return;
    }
    mainInput.setAttribute("type", "text");
    mainInputLabel.innerText = "URL: ";
    mainInput.style.marginRight = "4.7em";
    fileInputEnabled= false;
}

fileInputRadio.addEventListener("click", enableFileInput);
urlInputRadio.addEventListener("click", enableURLInput)

