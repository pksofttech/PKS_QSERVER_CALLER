import * as unity from "./unity.js";
// import * as datatable from "./datatable.js";
unity.debug("********************************************");
unity.debug("    load script call_key.js");
unity.debug("********************************************");

const DEVICE_CALLER = "caller_info";
async function req_service_qpks(number) {
    if (!number) {
        return;
    }
    let success = false;
    const formData = new FormData();
    formData.append("machine", DEVICE_CALLER);
    formData.append("service_id", 1);
    formData.append("number", number);
    const _reply = await unity.fetchApi("/api/transaction/", "post", formData, "json");
    if (!!_reply) {
        if (_reply.success == true) {
            const data = _reply.data;
            const transaction = data[0];
            unity.debug(_reply);
            success = true;
        } else {
            unity.toastr_notify({ icon: "error", msg: JSON.stringify(_reply) });
        }
    }
}

async function call_service_qpks(number) {
    // unity.debug(number);
    if (!number) {
        return;
    }
    unity.debug("call_service_trancaction of service " + 1);
    const _reply = await unity.fetchApi(
        `/api/service/service_call/?caller_device=${DEVICE_CALLER}&service_id=1&number=${number}`,
        "post",
        null,
        "json"
    );
    if (!!_reply) {
        if (_reply.success == true) {
            // const transaction = _reply.data;
            unity.debug(_reply);
        } else {
            unity.toastr_notify({ icon: "error", msg: JSON.stringify(_reply) });
        }
    }
}

window.update_transaction_success = update_transaction_success;
async function update_transaction_success() {
    // unity.debug(number);
    const number = document.getElementById("number_input_number_call").value;
    if (!number) {
        return;
    }
    const status_code = 300;
    const _reply = await unity.fetchApi(
        `/api/transaction/update/?status_code=${status_code}&number=${number}&caller_device=${DEVICE_CALLER}`,
        "post",
        null,
        "json"
    );
    if (!!_reply) {
        if (_reply.success == true) {
            // const transaction = _reply.data;
            unity.debug(_reply);
        } else {
            unity.toastr_notify({ icon: "error", msg: "รายการทะเบียนนี้ไม่มีในระบบ" });
        }
    }
}

window.add_service_transaction = add_service_transaction;
async function add_service_transaction() {
    const number = document.getElementById("number_input_number").value;
    req_service_qpks(number);
}

window.call_service_transaction = call_service_transaction;
async function call_service_transaction() {
    const number = document.getElementById("number_input_number_call").value;
    call_service_qpks(number);
}

window.set_date_time_server = set_date_time_server;
async function set_date_time_server() {
    const date_time = dialog_set_date_time_server.querySelector('[data-field="datetime"]');
    if (date_time) {
        const _dt = date_time.value;
        if (_dt.length == 19) {
            unity.debug(date_time.value);
            const api_server = `http://${window.location.hostname}:8080/set_date?date=${_dt}`;
            unity.debug(api_server);
            const _reply = await unity.fetchApi(api_server, "get", null, "text");
            if (!!_reply) {
                unity.debug(_reply);
            } else {
                unity.toastr_notify({ icon: "error", msg: JSON.stringify(_reply) });
            }
        }
    }
}

window.clear_transaction = clear_transaction;
async function clear_transaction() {
    const _reply = await unity.fetchApi("/api/transaction/clear_transaction/", "post", null, "json");
    if (!!_reply) {
        if (_reply.success == true) {
            const msg = _reply.msg;
            // unity.debug(msg);
            dialog_clear_transaction.close();
        } else {
            unity.toastr_notify({ icon: "error", msg: JSON.stringify(_reply) });
        }
    }
}
// /api/transaction
