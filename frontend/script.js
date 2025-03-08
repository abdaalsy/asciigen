const ROOT = "https://asciiweb.onrender.com";
const fileInputRadio = document.getElementById("file-input");
const urlInputRadio = document.getElementById("url-input");
const mainInput = document.getElementById("input");
const mainInputLabel = document.getElementById("main-input-label")
const mainInputForm = document.getElementById("main-input");
const output = document.getElementById("output");
const supportedTypes = ["image/bmp", "image/jpeg", "image/png", "image/tiff"];
const mainInputStatus = document.getElementById("main-status");
const unlockForm = document.getElementById("unlock-form");
const vaultEditForm = document.getElementById("load-delete");
const saveForm = document.getElementById("save");
var userData = {};
let fileInputEnabled = true;
document.getElementById("submit-vault-edit").disabled = true;
document.getElementById("save-btn").disabled = true;

function getCurrentDate() {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    return `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
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

function enableFileInput() {
    if (fileInputEnabled) {
        return;
    }
    mainInput.setAttribute("type", "file");
    mainInputLabel.textContent = "File: ";
    mainInput.style.marginRight = "unset";
    fileInputEnabled = true;
}

function enableURLInput() {
    if (!fileInputEnabled) {
        return;
    }
    mainInput.setAttribute("type", "text");
    mainInputLabel.textContent = "URL: ";
    mainInput.style.marginRight = "4.7em";  // compensate for smaller width of type text pulling the radio buttons and submit button to the left
    fileInputEnabled= false;
}

function setMainErrorStatus(msg) {
    mainInputStatus.style.display = "block";
    mainInputStatus.className = "errortext";
    mainInputStatus.innerText = msg;
}

function setMainSuccessMessage(msg) {
    mainInputStatus.style.display = "block";
    mainInputStatus.className = "correcttext";
    mainInputStatus.innerText = msg;
}

function setVaultDefaultMessage() {
    let status = document.getElementById("keystatus");
    status.className = "aqua";
    status.innerText = "Enter your email to begin";
}

function setVaultSuccessMessage(msg) {
    let status = document.getElementById("keystatus");
    status.className = "correcttext";;
    status.innerText = msg;
}

function setVaultErrorMessage(msg) {
    let status = document.getElementById("keystatus");
    status.className = "errortext";
    status.innerText = msg;
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
    if (file.size > 1024*1024*8) {
        setMainErrorStatus("This file is too big! The maximum file size is 8MB");
        return false;
    }
    return true;
}

function validateURL(text) {
    try {
        let url = new URL(text);
        console.log(url.href);
        if (!URL.canParse(url)) {
            throw TypeError;
        }
        return true;
    }
    catch (error) {
        if (error instanceof TypeError) {
            setMainErrorStatus("Not a valid URL!");
        }
        return false;
    }
}

function loadVaultData() {
    let rows = document.querySelector(`#vault-data tbody`).childNodes;
    for (let i=0; i < userData.conversions.length; i++) {
        let row = rows[i*2 + 1].childNodes;
        // 1: name, 3: date
        row[1].textContent = userData.conversions[i].name;
        row[3].textContent = userData.conversions[i].date;
    }
}

function clearVaultData() {
    let rows = document.querySelector(`#vault-data tbody`).childNodes;
    for (let i=1; i < rows.length; i += 2) {
        let row = rows[i].childNodes;
        // 1: name, 3: date
        row[1].innerText = "";
        row[3].innerText = "";
    }
}

function loadConversion(rowIndex) {
    if (rowIndex > userData.conversions.length - 1) { return; }
    output.textContent = userData.conversions[rowIndex].text;
    output.style.height = output.scrollHeight + "px";
}

async function deleteConversion(rowIndex) {
    if (rowIndex > userData.conversions.length - 1) { return; }
    var response = await fetch(`${ROOT}/data/${userData.email}/${rowIndex}`, {
        method: "DELETE"
    })
    if (response.ok) {
        const result = await response.json();
        userData = result.document;
        clearVaultData();
        loadVaultData();
        setVaultSuccessMessage(result.message);
    }
    else {
        const result = await response.json();
        setVaultErrorMessage(result.message);
    }
    return;
}

function onVaultSuccess() {
    clearVaultData();
    document.getElementById("submit-vault-edit").disabled = false;
    document.getElementById("save-btn").disabled = false;
    loadVaultData();
}

function onVaultFail() {
    document.getElementById("submit-vault-edit").disabled = true;
    document.getElementById("save-btn").disabled = true;
    userData = {};
    clearVaultData();
    output.textContent = "";
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
        if (!validateFile(mainInput.files[0])) { return; }
    }
    else {
        if (!validateURL(formData.get("input"))) { return; }
    }
        
    response = await fetch(fileInputEnabled ? `${ROOT}/submitFile` : `${ROOT}/submitURL`, {
        method: "POST",
        headers: fileInputEnabled ? {} : {"Content-Type": "application/json"},
        body: fileInputEnabled ? formData : JSON.stringify(formDataObj)
    })
    if (response.ok) {
        result = await response.json();
        output.textContent = result.text;
        output.style.height = "0px";
        output.style.height = output.scrollHeight + "px";
        setMainSuccessMessage(result.message);
    } else {
        result = await response.json();
        setMainErrorStatus(result.message);
    }
}

function onMainInputChange() {
    if (fileInputEnabled) {
        if (!checkFileType(mainInput.files[0].type)) {
            return;
        }
    }
}

async function onUnlock(e) {
    e.preventDefault();
    unlockForm.removeEventListener("submit", onUnlock)
    const email = document.getElementById("email-input").value
    const response = await fetch(`${ROOT}/data/${email}`);
    if (response.ok) {
        const result = await response.json();
        userData = result.document;
        setVaultSuccessMessage(result.message);
        onVaultSuccess();
    }
    else {
        const result = await response.json();
        setVaultErrorMessage(result.message);
        onVaultFail();
    } 
    unlockForm.addEventListener("submit", onUnlock);
}

async function submitVaultEdit(e) {
    e.preventDefault();
    vaultEditData = new FormData(vaultEditForm);
    let action = vaultEditData.get("action-select");
    let rowIndex = Number(vaultEditData.get("row-select")) - 1;
    switch (action) {
        case "Load":
            loadConversion(rowIndex);
            break;
        case "Delete":
            deleteConversion(rowIndex);
            return;
        default:
            return;;
    }
}

async function onSubmitSaveForm(e) {
    e.preventDefault();
    const saveFormData = new FormData(saveForm);
    const response = await fetch(`${ROOT}/data/${userData.email}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: saveFormData.get("name"),
            date: getCurrentDate(),
            text: output.textContent
        })
    })
    if (response.ok) {
        const result = await response.json();
        userData = result.document;
        loadVaultData();
        setVaultSuccessMessage(result.message);
    }
    else {
        const result = await response.json();
        setVaultErrorMessage(result.message);
    }
}

fileInputRadio.addEventListener("click", enableFileInput);
urlInputRadio.addEventListener("click", enableURLInput);
mainInputForm.addEventListener("submit", onFormSubmit);
mainInput.addEventListener("change", onMainInputChange);
unlockForm.addEventListener("submit", onUnlock);
vaultEditForm.addEventListener("submit", submitVaultEdit);
saveForm.addEventListener("submit", onSubmitSaveForm);