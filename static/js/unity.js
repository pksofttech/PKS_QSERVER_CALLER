/**
 * Logs debug messages to the console.
 */
export const debug = console.log;

export function printLog(msg) {
    console.log(`%c${msg}`, "color: DodgerBlue; font-size: 10px;");
}
/**
 * Logs informational messages to the console.
 */
export const printInfo = console.info;

/**
 * Logs warning messages to the console.
 */
export const printWarn = console.warn;

/**
 * Logs error messages to the console.
 */
export const printError = console.error;
moment.locale("th");
toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: false,
    positionClass: "toast-top-left",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "3000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
};

preview_image_view;

window.show_preview_image = show_preview_image;
function show_preview_image(src) {
    const Dialog_obj = Dialog_Preview_Image;
    Dialog_obj.querySelector('[data-filed="image_box"]').src = src;
    Dialog_obj.showModal();
}

export function show_dialog_info({ title = "Info", msg = "info" } = {}) {
    const Dialog_obj = Dialog_Info;
    Dialog_obj.querySelector('[data-filed="title"]').innerHTML = title;
    Dialog_obj.querySelector('[data-filed="msg"]').innerHTML = msg;
    Dialog_obj.showModal();
}
export function show_dialog_success({ title = "Success", msg = "ดำเนินการสำเร็จ" } = {}) {
    const Dialog_obj = Dialog_Success;
    Dialog_obj.querySelector('[data-filed="title"]').innerHTML = title;
    Dialog_obj.querySelector('[data-filed="msg"]').innerHTML = msg;
    Dialog_obj.showModal();
}

export function show_dialog_warning({ title = "Warning!", msg = "info" } = {}) {
    const Dialog_obj = Dialog_Warning;
    Dialog_obj.querySelector('[data-filed="title"]').innerHTML = title;
    Dialog_obj.querySelector('[data-filed="msg"]').innerHTML = msg;
    Dialog_obj.showModal();
}

export function show_dialog_error({ title = "Error", msg = "info" } = {}) {
    const Dialog_obj = Dialog_Error;
    Dialog_obj.querySelector('[data-filed="title"]').innerHTML = title;
    Dialog_obj.querySelector('[data-filed="msg"]').innerHTML = msg;
    Dialog_obj.showModal();
}

export async function show_dialog_confirm({ title = "ยืนยันทำรายการ", content = "" } = {}) {
    const result = { confirm: false, value: null };
    function confirmEvent() {
        result.confirm = true;
    }
    const Dialog_obj = Dialog_Confirm;
    Dialog_obj.querySelector('[data-filed="title"]').innerHTML = title;
    Dialog_obj.querySelector('[data-filed="content"]').innerHTML = content;
    Dialog_obj.querySelector(`[data-filed="confim_btn"]`).onclick = confirmEvent;

    Dialog_obj.showModal();
    await delay(100);
    Dialog_obj.querySelector(`[data-filed="confim_btn"]`).focus();
    while (Dialog_obj.getAttribute("open") !== null) {
        await delay(100);
    }
    const returnValue = Dialog_obj.querySelector('[data-filed="returnValue"]');
    if (returnValue) {
        result.value = returnValue.value;
    }
    return result;
}

async function _dialog_confirm({ title = "ยืนยันทำรายการ", content = "" } = {}) {
    const result = await show_dialog_confirm({ title: title, content: content });
    return result.confirm;
}

export function checkIpAddress(ip) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

export function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

export async function dataURLtoFile(data_url, filename = "img") {
    if (data_url == "") {
        printError("data_url is null");
        return;
    }
    try {
        const blob = await (await fetch(data_url)).blob();
        return new File([blob], filename);
    } catch (error) {
        printError(error);
        return;
    }
}

export async function resizeImage(base64Str, w = 600, h = 600) {
    let img = new Image();
    img.src = base64Str;
    let canvas = document.createElement("canvas");
    const MAX_WIDTH = w;
    const MAX_HEIGHT = h;
    await img.decode();
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if ((width < MAX_WIDTH) & (height < MAX_HEIGHT)) {
        debug("Not resizeImage");
        return base64Str;
    }
    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    // debug(canvas.toDataURL())
    debug("resizeImage Image");
    return canvas.toDataURL();
}

window.showPreview = showPreview;
export async function showPreview(event, id) {
    if (event.target.files.length > 0) {
        const preview = document.getElementById(id);
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = async function () {
            preview.src = await resizeImage(reader.result, 128, 128);
        };
        reader.readAsDataURL(file);
    }
}

function showTime() {
    const date = new Date();
    let h = date.getHours(); // 0 - 23
    let m = date.getMinutes(); // 0 - 59
    let s = date.getSeconds(); // 0 - 59

    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    const time = h + ":" + m;
    const _clock = document.getElementById("AppClockDisplay");
    //debug(_clock);
    if (_clock) {
        {
            _clock.innerText = time;
            _clock.textContent = time;

            setTimeout(showTime, 10000);
        }
    }
}
showTime();

/**
 * Logs the contents of a FormData object to the console for debugging purposes.
 *
 * @param {FormData} formData - The FormData object to be debugged.
 */
export function debugForm(formData) {
    printLog("**************** DEBUG:FORM **********************");
    for (const pair of formData.entries()) {
        printLog(`${pair[0]}, ${pair[1]}`);
    }
    printLog("**************************************************");
}
let controlSound = false;
// document.getElementById("sound_control_switch").checked = true;
if (document.getElementById("sound_control_switch")) {
    const _controlSound = localStorage.getItem("SOUND_ENABLE");
    if (_controlSound) {
        if (_controlSound == "true") {
            document.getElementById("sound_control_switch").checked = true;
        }
    }

    controlSound = document.getElementById("sound_control_switch").checked;
}

const soundBtn = new Howl({
    src: ["/static/sound/click-button-140881.mp3"],
});

const soundError = new Howl({
    src: ["/static/sound/computer-error-meme-jam-fx-1-00-02.mp3"],
});

const soundSuccess = new Howl({
    src: ["/static/sound/success-1-6297.mp3"],
});

function btnClickSound(params) {
    if (controlSound) {
        soundBtn.play();
    }
}

function errorSound(params) {
    if (controlSound) {
        soundError.play();
    }
}

function successSound(params) {
    if (controlSound) {
        soundSuccess.play();
    }
}
export function setControlSound(v) {
    controlSound = v;
}

window.preview_image_view = preview_image_view;

function preview_image_view(src) {
    Dialog_Preview_Image.querySelector('[data-filed="preview_image"]').src = src;
    Dialog_Preview_Image.showModal();
}

export async function dialogConfirm({ text = "การทำการลบข้อมูล", title = "คุณแน่ใจใช่ไหม?" } = {}) {
    return _dialog_confirm({ text: text, title: title });
}

/**
 * ***************************************************************
 */

/**
 * Introduces a delay in execution.
 *
 * @param {number} ms - The number of milliseconds to delay execution.
 * @returns {Promise<void>} - A promise that resolves after the specified delay.
 */
export async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toastr_notify({ icon = "info", title = null, msg = "msg" } = {}) {
    if (title) {
        toastr[icon](`<div class="text-lg ">${title}</div>${msg}`);
    } else {
        toastr[icon](`${msg}`);
    }
    switch (icon) {
        case "error":
            errorSound();
            break;
        case "success":
            successSound();
            break;
        default:
            break;
    }
}

export function formatToThaiBaht(amount) {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);
}

/**
 * Converts a dateTime object to a formatted string.
 *
 * @param {Date | string | number} dateTime - The date-time to format.
 * @param {string} [format="YYYY/MM/DD HH:mm:ss"] - The format string.
 * @param {number} [daysToAdd=0] - The number of days to add to the dateTime.
 * @returns {string} - The formatted date-time string.
 */

// YYYY/MM/DD HH:mm:ss
export function dateTimeToStr(dateTime, format = "DD/MM/YYYY HH:mm:ss", daysToAdd = 0) {
    if (!dateTime) {
        return "";
    }
    const momentObj = moment(dateTime);
    if (daysToAdd > 0) {
        momentObj.add(daysToAdd, "days");
    }
    return momentObj.format(format);
}

export function sec_to_duration(s) {
    const d = parseInt(s / (24 * 3600));
    const h = String(Math.floor(Math.floor((s % 86400) / 3600))).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    let duration = `${h}:${m}`;
    if (d) {
        duration = `${d} day ` + duration;
    }
    return duration;
}
/**
 * Calculates the difference between two date-time objects and returns it formatted as "HH:mm:ss".
 *
 * @param {Date | string | number} dateTimeStart - The start date-time.
 * @param {Date | string | number} dateTimeEnd - The end date-time.
 * @param {string} [format="YYYY/MM/DD HH:mm:ss"] - The format string for parsing the input date-times.
 * @returns {string} - The formatted time difference as "HH:mm:ss".
 */
export function dateTimeDiff(dateTimeStart, dateTimeEnd, format = "YYYY/MM/DD HH:mm:ss") {
    if (!dateTimeStart) {
        return "";
    }

    const startMoment = moment(dateTimeStart, format);
    const endMoment = dateTimeEnd ? moment(dateTimeEnd, format) : moment();

    const diffInMilliseconds = endMoment.diff(startMoment);
    const diffDuration = moment.duration(diffInMilliseconds);

    return moment.utc(diffDuration.asMilliseconds()).format("HH:mm:ss");
}

/**
 * Calculates the relative time difference between two date-time objects.
 *
 * @param {Date | string | number} dateTimeStart - The start date-time.
 * @param {Date | string | number} dateTimeEnd - The end date-time.
 * @param {string} [format="YYYY/MM/DD HH:mm:ss"] - The format string for parsing the input date-times.
 * @returns {string} - The relative time difference.
 */
export function timeRef(dateTimeStart, dateTimeEnd, format = "YYYY/MM/DD HH:mm:ss") {
    const startMoment = dateTimeStart ? moment(dateTimeStart, format) : moment();
    const endMoment = dateTimeEnd ? moment(dateTimeEnd, format) : moment();

    if (!dateTimeEnd) {
        return endMoment.to(startMoment);
    } else {
        return startMoment.to(endMoment, true);
    }
}

/**
 * Converts seconds to a human-readable duration format in Thai.
 *
 * @param {number} seconds - The total number of seconds.
 * @returns {string} - The formatted duration string in Thai.
 */
export function secToDurationLocal(seconds) {
    if (typeof seconds !== "number" || seconds < 0) {
        throw new Error("Input should be a non-negative number.");
    }

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let duration = `${hours} ชั่วโมง ${minutes} นาที`;
    if (days > 0) {
        duration = `${days} วัน ${duration}`;
    }

    return duration;
}

export function updateElementContent(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    Object.keys(data).forEach((key) => {
        const element = container.querySelector(`[name="${key}"]`);
        if (element) {
            updateElementBasedOnType(element, data[key]);
        }
    });
}

/**
 * Updates an HTML element based on its type with the given value.
 *
 * @param {HTMLElement} element - The HTML element to be updated. Must be a valid DOM element.
 * @param {string} value - The value to set on the element. The interpretation of this value depends on the element type:
 *   - For <input> and <textarea> elements, this sets the `value` property.
 *   - For <img> elements, this sets the `src` attribute, with a fallback to "/static/image/no_image.png" if the value is falsy.
 *   - For other elements, this sets the `innerHTML` property.
 *
 */
export function updateElementBasedOnType(element, value) {
    switch (element.tagName.toLowerCase()) {
        case "input":
        case "textarea":
            element.value = value;
            break;
        case "img":
            element.src = value || "/static/image/no_image.png";
            break;
        case "select":
            value = String(value);
            if (value == "true") {
                value = "ENABLE";
            }
            if (value == "false") {
                value = "DISABLE";
            }
            debug(value.split(","));
            $(element).val(value.split(",")).trigger("change"); // Notify any JS components that the value changed
            break;
        default:
            element.innerHTML = value;
            break;
    }
}

/**
 * Extracts data from form elements and maps them to a FormData object.
 *
 * @param {HTMLFormElement} formEle - The HTML form element to extract data from.
 * @param {boolean} [validation=true] - Indicates whether form validation should be performed.
 * @returns {Promise<FormData|null>} - A promise that resolves to a FormData object if validation succeeds, otherwise null.
 */
export async function mapToFormApi(formEle, validation = true) {
    let validationSuccess = true;
    const formData = new FormData();
    const elements = formEle.querySelectorAll("input, img, select,textarea");
    for (const element of elements) {
        if (element.name) {
            const key = element.name;
            const value = element.value;

            if (element.tagName === "IMG") {
                if (element.src.startsWith("data:image")) {
                    formData.append(key, await dataURLtoFile(element.src, key));
                } else {
                    continue;
                }
            } else {
                if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) && validation) {
                    element.classList.remove("is-invalid");
                    if (!value && element.required) {
                        element.classList.add("is-invalid");
                        validationSuccess = false;
                    }
                }
                if (element.name === "password" && element.value === "*") {
                    // ingnr password
                    continue;
                }
                if (element.tagName === "SELECT") {
                    const selected = Array.from(element.options)
                        .filter(function (option) {
                            return option.selected;
                        })
                        .map(function (option) {
                            return option.value;
                        });
                    formData.append(key, selected);
                    continue;
                }
                formData.append(key, value);
            }
        }
    }
    debugForm(formData);
    return validationSuccess ? formData : null;
}

/**
 * Clears the values of input fields and image elements within a given form.
 *
 * @param {HTMLFormElement} formEle - The HTML form element to clear.
 * @param {string[]} [disabled=[]] - An array of input names to be excluded from clearing.
 */
export function clearForm(formEle, disabled = []) {
    // debug(formEle);
    const elements = formEle.querySelectorAll("input, img,textarea,select");
    for (const element of elements) {
        if (element.name && !disabled.includes(element.name)) {
            switch (element.tagName) {
                case "INPUT":
                case "TEXTAREA":
                    element.value = "";
                    break;
                case "IMG":
                    element.src = "";
                    break;
                case "SELECT":
                    $(element).val(null).trigger("change");
                    break;
                default:
                    break;
            }
        }
    }
}

/**
 * Populates a select element with options.
 * @param {HTMLSelectElement} selectElement - The select element to populate.
 * @param {string[]} options - Array of option values to populate.
 */
export function populateSelectElement(selectElement, options) {
    if (!selectElement) return;

    // Clear existing options
    selectElement.innerHTML = "";

    // Populate the select element with new options
    options.forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        // option.classList.add("text-primary");
        selectElement.appendChild(option);
    });
}

$(document).ready(function () {
    document.addEventListener("click", (evnt) => {
        if (!evnt.target.parentNode) {
            return;
        }
        if (["BUTTON", "A"].includes(evnt.target.tagName) || ["BUTTON", "A"].includes(evnt.target.parentNode.tagName)) {
            btnClickSound();
        }
        // if (evnt.target.dataset.btnsound) {
        //     btnClickSound();
        // }
    });
});

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

export function clearAllCookies() {
    // Get all cookies as a single string
    const cookies = document.cookie.split(";");
    // Loop through each cookie and clear it
    cookies.forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim();
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
}

export function setCookie(cname, value, expire = 0) {
    if (isASCII(value)) {
        let _expires = "";
        if (expire != 0) {
            const d = new Date();
            d.setTime(d.getTime() + expire * 1000);
            _expires = d.toGMTString() + ";";
        }
        const expires = "expires=" + _expires;
        const _cookie = `${cname}=${value}; ${expires} path=/`;
        document.cookie = _cookie;
        debug("Set Cookie:" + _cookie);
    } else {
        debug("Not set Cookie " + value);
    }
}

export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

export async function get_headers() {
    const _token = getCookie("Authorization");
    const headers_json = {
        accept: "application/json",
        Authorization: _token,
        "Content-Type": "application/json",
    };
    return headers_json;
}
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 3000 } = options;

    const controller = new AbortController();
    // console.log(timeout);
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);

    return response;
}

export async function fetchApi(
    path = "",
    method = "get",
    body = null,
    returnType = "text",
    header = true,
    timeout = 15000
) {
    // debug(String(typeof body));
    const _token = getCookie("Authorization");
    const headers_json = {
        accept: "application/json",
        Authorization: _token,
        "Content-Type": "application/json",
    };
    const headers_form = {
        accept: "application/json",
        Authorization: _token,
        // 'Content-Type': 'multipart/form-data',
    };

    let headers = headers_json;
    if (typeof body == "object") {
        // debug("multipart/form-data")
        headers = headers_form;
    }

    let response = null;
    try {
        //const options = { timeout = 15000 };
        if (header) {
            response = await fetchWithTimeout(path, {
                method: method,
                headers: headers,
                body: body,
                timeout: timeout,
            });
        } else {
            response = await fetchWithTimeout(path, {
                method: method,
                mode: "no-cors",
                //body: body,
                timeout: timeout,
            });
        }
    } catch (err) {
        printWarn("fetchApi not response or error: " + err);
        return null;
    } finally {
        //swal.close();
    }

    switch (response.status) {
        case 401:
            debug(response.status);
            // document.cookie = "Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            clearAllCookies();
            show_dialog_warning({ title: "Login-System", msg: "Oops... session expires" });
            break;
        case 200:
            if (returnType === "text") {
                let _t = await response.text();
                return _t;
            }
            if (returnType === "json") {
                let data = await response.json();
                data.status = response.status;
                return data;
            }
            break;
        case 422:
            response.msg = "CODE:422 (Unprocessable Entity)";
            toastr_notify({ icon: "error", msg: `${response.statusText}\n${await response.text()}` });
            debug(response);

            return response;
            break;
        case 500:
            show_dialog_error({ msg: "ข้อผิดพลาด ระบบทำงานพกพร่องโปรดแจ้งเจ้าหน้าที่ให้แก้ไขครับ....!" });
            break;

        default:
            // debug(response)
            toastr_notify({ icon: "error", msg: `${response.statusText}\n${await response.text()}` });
            break;
    }
    return response;
}

// Common Page
let ws_event_subscription = (e) => {};
let ws;
let reconnectInterval = 10000; // 10 seconds
let maxReconnectAttempts = 10;
let reconnectAttempts = 0;
function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(function () {
            printLog("Attempting to reconnect...");
            reconnectAttempts++;
            wsService();
        }, reconnectInterval);
    } else {
        printError("Max reconnect attempts reached. Giving up.");
        location.reload();
    }
}
export function wsService(_ws_event_subscription = null) {
    if (_ws_event_subscription) {
        ws_event_subscription = _ws_event_subscription;
    }
    printLog("connect WebSocket in page");
    const host_server = location.host;
    let ws_str = "wss://";
    if (location.protocol !== "https:") {
        printLog("http in WebSocket");
        ws_str = "ws://";
    }
    ws = new WebSocket(ws_str + host_server + "/ws");
    ws.onopen = function () {
        toastr_notify({
            icon: "success",
            title: "ws_service",
            msg: "Server is connect Successful",
        });
    };

    ws.onclose = async function (e) {
        console.log("Socket is closed. Reconnect will be attempted in 10 second.", e.reason);
        toastr_notify({
            icon: "warning",
            title: "ws_service",
            msg: "Socket is closed. Reconnect will be attempted in 10 second.",
        });
        // attemptReconnect();
        setTimeout(function () {
            location.reload();
        }, 3000);
    };

    ws.onerror = function (err) {
        console.error("Socket encountered error: ", err.message, "Closing socket");
        ws.close();
    };

    ws.onmessage = function (event) {
        if (ws_event_subscription) {
            const msg_from_ws = event.data;
            let json_msg = null;
            // debug(event);
            try {
                json_msg = JSON.parse(event.data);
            } catch (error) {
                printLog(msg_from_ws);
            }
            if (json_msg) {
                ws_event_subscription(json_msg);
            }
        }
    };
}

window.logout = logout;
async function logout() {
    const result = await show_dialog_confirm();
    debug(result);
    if (result.confirm) {
        // document.cookie = "Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        clearAllCookies();
        location.reload();
    }
}

const ul_menu = document.getElementById("ul_menu");
if (ul_menu) {
    let _a_menus = ul_menu.getElementsByTagName("a");
    const _herf = window.location.href;
    for (let _a of _a_menus) {
        if (_herf == _a.href) {
            _a.classList.add("text-primary");
            // _a.classList.add("bg-base-100");
            _a.classList.add("ml-4");
            _a.href = "#";
            const parentElement = _a.parentElement.parentElement.parentElement;
            if (parentElement.nodeName === "DETAILS") {
                debug(parentElement.nodeName);
                parentElement.open = true;
            }
        }
    }
}

const message_dropdown_content = document.getElementById("message_dropdown_content");
if (message_dropdown_content) {
    message_dropdown_content.addEventListener("transitionend", (event) => {
        if (window.getComputedStyle(message_dropdown_content).visibility === "hidden") {
            message_dropdown_content.innerHTML = "";
        }
    });
}
window.message_dropdown_btn_clock = message_dropdown_btn_clock;
async function message_dropdown_btn_clock(params) {
    const message_dropdown_content = document.getElementById("message_dropdown_content");
    if (message_dropdown_content) {
        message_dropdown_content.innerHTML = `<span class="loading loading-dots loading-lg"></span>`;
        await delay(1000);
        message_dropdown_content.innerHTML = "";
        const temp = document.getElementById("message_dropdown_content_li");
        const _c = temp.content.cloneNode(true);
        message_dropdown_content.appendChild(_c);
    }
}

export function toCurrency(value) {
    // debug(value);
    return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

window.sound_control_switch_event = sound_control_switch_event;

async function sound_control_switch_event(e) {
    // debug(e.checked);
    controlSound = e.checked;
    localStorage.setItem("SOUND_ENABLE", controlSound);
    btnClickSound();
}
