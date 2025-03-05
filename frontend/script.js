const ROOT = "http://localhost:3000";
const fileInputRadio = document.getElementById("file-input");
const urlInputRadio = document.getElementById("url-input");
const mainInput = document.getElementById("input");
const mainInputLabel = document.getElementById("input-label")
const mainInputForm = document.getElementById("main-input");
const output = document.getElementById("output");
const supportedTypes = ["image/bmp", "image/jpeg", "image/png", "image/tiff"];
const mainInputStatus = document.getElementById("main-status");
const unlockForm = document.getElementById("unlock-form");
const vaultEditForm = document.getElementById("load-delete");
const saveForm = document.getElementById("save");
var userData;
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

function setVaultSuccessMessage(msg = `Logged in as ${userData.email}.`) {
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
    if (file.size > 1024*1024*32) {
        setMainErrorStatus("This file is too big! The maximum file size is 32MB");
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

function loadVaultData() {
    let rows = document.querySelector(`#vault-data tbody`).childNodes;
    for (let i=0; i < userData.conversions.length; i++) {
        let row = rows[i*2 + 1].childNodes;
        // 1: name, 3: date
        row[1].innerText = userData.conversions[i].name;
        row[3].innerText = userData.conversions[i].date;
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

function saveConversion() {

}

function loadConversion(rowIndex) {
    if (rowIndex > userData.conversions.length - 1) { return; }
    output.textContent = userData.conversions[rowIndex].text;
    output.style.height = output.scrollHeight + "px";
}

async function deleteConversion(rowIndex) {
    var response = await fetch(`${ROOT}/${userData.email}/${rowIndex}`, {
        method: "DELETE"
    })
    if (response.ok) {
        setVaultSuccessMessage("Deleted, but you can still access this conversion until reloading the page.");
    }
    else {
        setVaultErrorMessage("An error occurred while deleting this conversion.");
    }
    return;
}

function onVaultSuccess() {
    clearVaultData();
    document.getElementById("submit-vault-edit").disabled = false;
    document.getElementById("save-btn").disabled = false;
    loadVaultData();
    setVaultSuccessMessage();
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
        result = await response.text();
        output.textContent = result;
        output.style.height = output.scrollHeight + "px";
        setMainSuccessMessage("Success!");
    }
    else {
        setMainErrorStatus("An error occurred in processing this request.");
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
    //change this later to access other emails n shit
    const email = document.getElementById("email-input").value
    if (email == "abdaalsy@gmail.com") {
        const response = await fetch(`${ROOT}/${email}`);
        if (response.ok) {
            const result = await response.json();
            userData = result;
            onVaultSuccess();
        }
        else {
            const result = await response.json();
            setVaultErrorMessage(result.message);
        }
        
    }
    else {
        setVaultErrorMessage("This email does not exist.");
    }
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
    const response = await fetch(`${ROOT}/${userData.email}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: saveFormData.get("name"),
            date: getCurrentDate(),
            text: output.textContent
        })
    })
    if (response.ok) {
        setVaultSuccessMessage("Saved! Changes will be reflected after reloading the page.");
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


