const fileInputRadio = document.getElementById("file-input");
const urlInputRadio = document.getElementById("url-input");
const mainInput = document.getElementById("input");
const mainInputLabel = document.getElementById("input-label")
const mainInputForm = document.getElementById("main-input");
const output = document.getElementById("output");
const supportedTypes = ["image/bmp", "image/jpeg", "image/png", "image/tiff"];

let inputtedFile;
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

function getSupportedTypesString() {
    let msg = "";
    msg += "Supported file types include:"
    for (let i = 0; i < supportedTypes.length; i++) {
        msg += " " + supportedTypes[i].slice(6) // remove the "image/";
        if (i < supportedTypes.length - 1) {
            msg += ",";
        }
        else {
            msg += "."
        }
    }
    return msg;
}

function checkFileType(extension) {
    console.log(extension);
    if (!supportedTypes.includes(extension)) {
        let msg = getSupportedTypesString();
        alert(msg);
        return false;
    }
    return true;
}

function enableURLInput() {
    if (!fileInputEnabled) {
        return;
    }
    mainInput.setAttribute("type", "text");
    mainInputLabel.innerText = "URL: ";
    mainInput.style.marginRight = "4.7em";  // compensate for smaller width of type text pulling the radio buttons and submit button to the left
    fileInputEnabled= false;
}

function onFormSubmit(e) {
    e.preventDefault();
    document.getElementById("main-status").style.display = "none";
    // validation
    if (!checkFileType(mainInput.files[0].type)) {
        document.getElementById("main-status").style.display = "block";
        document.getElementById("main-status").className = "errortext";
        document.getElementById("main-status").innerText = getSupportedTypesString();
        return;
    }
    
    output.style.height = output.scrollHeight + "px";
}

function onMainInputChange() {
    if (fileInputEnabled) {
        if (!checkFileType(mainInput.files[0].type)) {
            return;
        }
    }
}

fileInputRadio.addEventListener("click", enableFileInput);
urlInputRadio.addEventListener("click", enableURLInput);
mainInputForm.addEventListener("submit", onFormSubmit);
mainInput.addEventListener("change", onMainInputChange);


