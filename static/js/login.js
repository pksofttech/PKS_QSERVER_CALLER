import * as unity from "./unity.js";
// import * as datatable from "./datatable.js";
unity.debug("********************************************");
unity.debug("    load script login.js");
unity.debug("********************************************");
// unity.toastr_notify({ icon: "success", msg: "login" });

// For Login Page
const TOKEN_EXP = 86400 * 30;
unity.clearAllCookies();
async function get_user_session() {
    const user_session = await unity.fetchApi("/login_session", "get", null, "json");
    // const ss_user = user_session.username;
    unity.debug(user_session);
    // window.location.reload();
}

const input_username_box = document.getElementById("input_username_box");
const input_password_box = document.getElementById("input_password_box");
const input_app_mode = document.getElementById("input_app_mode");
input_username_box.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        input_password_box.focus();
    }
});

input_password_box.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        submit_login();
    }
});

async function login(_user, _password, _remember_check, _app_mode) {
    unity.debug("Login :" + _user + "@" + _password + ":" + String(_remember_check));

    const params_oauth = new URLSearchParams();
    params_oauth.append("username", _user);
    params_oauth.append("password", _password);

    const response = await fetch("oauth", {
        method: "POST",
        body: params_oauth,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const responseData = await response.json();
    unity.debug(responseData);
    if (responseData.access_token != null) {
        const token = `${responseData.token_type} ${responseData.access_token}`;
        console.log(_remember_check);
        if (_remember_check) {
            unity.setCookie("Authorization", token, TOKEN_EXP);
            unity.debug("Remember user :" + TOKEN_EXP);
        } else {
            unity.setCookie("Authorization", token, 0);
            unity.debug("Remember user : Not expire");
        }
        unity.setCookie("app_mode", _app_mode, TOKEN_EXP);
        unity.debug(unity.getCookie("Authorization"));
        await get_user_session();
        window.location.reload();
        // window.location.href = HOME_ROUTE
    } else {
        unity.debug(responseData);
        unity.show_dialog_error({ title: "ข้อผิดพลาด", msg: String(responseData.detail) });
    }
}

window.submit_login = submit_login;
async function submit_login() {
    const _user_name = input_username_box.value;
    const _password = input_password_box.value;
    const _app_mode = input_app_mode.value;

    if (_user_name == "") {
        unity.show_dialog_warning({ msg: "ข้อมูลไม่ครบ" });
        return;
    }
    if (_password == "") {
        unity.show_dialog_warning({ msg: "ข้อมูลไม่ครบ" });
        return;
    }
    const remember_check = document.getElementById("remember_check_box").checked;
    login(_user_name, _password, remember_check, _app_mode);
}

window.eye_password = eye_password;
async function eye_password(t, id) {
    const _e = document.getElementById(id);
    if (_e) {
        if (_e.getAttribute("type") == "password") {
            _e.setAttribute("type", "text");
            t.innerHTML = `<i class="fa-regular fa-eye"></i>`;
        } else {
            _e.setAttribute("type", "password");
            t.innerHTML = `<i class="fa-regular fa-eye-slash"></i>`;
        }
    }
}
