
const fileInputRadio = document.getElementById("file-input");
const urlInputRadio = document.getElementById("url-input");
const mainInput = document.getElementById("input");
const mainInputLabel = document.getElementById("input-label")
const mainInputForm = document.getElementById("main-input");
const output = document.getElementById("output");
const supportedTypes = ["image/bmp", "image/jpeg", "image/png", "image/tiff"];
const mainInputStatus = document.getElementById("main-status");
let fileInputEnabled = true;


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
    mainInput.style.marginRight = "4.7em";  // compensate for smaller width of type text pulling the radio buttons and submit button to the left
    fileInputEnabled= false;
}

function setMainErrorStatus(msg) {
    mainInputStatus.style.display = "block";
    mainInputStatus.className = "errortext";
    mainInputStatus.innerText = msg;
}

function checkFileType(extension) {
    if (!supportedTypes.includes(extension)) {
        let msg = getSupportedTypesString();
        alert(msg);
        return false;
    }
    return true;
}

function validateFile(file) {
    if (!checkFileType(file.type)) {
        setMainErrorStatus(getSupportedTypesString());
        return false;
    }
    return true;
}

function validateURL(text) {
    try {
        let url = new URL(text);
        if (!URL.canParse(url)) {
            throw TypeError;
        }
        else if(!(url.href.endsWith(".bmp") || url.href.endsWith(".jpg") || url.href.endsWith(".jpeg") || url.href.endsWith(".png"))) {
            throw MediaError;
        }
        return true;
    }
    catch (error) {
        if (error instanceof TypeError) {
            setMainErrorStatus("Not a valid URL!");
        }
        if (error instanceof MediaError) {
            setMainErrorStatus(getSupportedTypesString());
        }
        return false;
    }
}

// event callbacks
async function onFormSubmit(e) {
    e.preventDefault();
    mainInputStatus.style.display = "none";
    const formData = new FormData(mainInputForm);
    const formDataObj = Object.fromEntries(formData.entries());
    var response;
    var result;
    
    if (fileInputEnabled) {
        console.log(formDataObj.input.type);
        if (!validateFile(mainInput.files[0])) { return; }
        response = await fetch("http://localhost:3000/submitFile", {
            method: "POST",
            body: formData
        })
        result = await response.text();
    } else {
        if (!validateURL(formData.get("input"))) { return; }
        response = await fetch("http://localhost:3000/submitURL", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formDataObj)
        })
        result = await response.text();
    }

    output.textContent = result;
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


