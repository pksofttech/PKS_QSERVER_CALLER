import * as unity from "./unity.js";
import * as datatable from "./datatable.js";
unity.debug("********************************************");
unity.debug("    load script system_config.js");
unity.debug("********************************************");

const API_SYSTEM_USER = "/api/systems_user/";
let current_system_user_id = 0;

window.get_systems_user = get_systems_user;
async function get_systems_user() {
    const data = await unity.fetchApi(`${API_SYSTEM_USER}system_user_type`, "get", null, "json");
    unity.debug(data);
    let html_system_user_type = "";
    for (let i = 0; i < data.length; i++) {
        const _s = data[i].System_User_Type;
        const _temp = `<option value="${_s.id}">${_s.user_type}</option>`;
        html_system_user_type += _temp;
    }

    document.getElementById("system_user_type_id").innerHTML = html_system_user_type;
    const columns_table = [
        {
            data: "System_Users.id",
            title: "ID",
            name: "ID",
            render: function (data, type) {
                return String(data).padStart(5, "0");
            },
        },
        {
            data: "System_Users.id",
            title: "จัดการ",
            orderable: false,
            render: function (data, type, row) {
                return `<div class="inline-flex border border-blue-600 rounded-md shadow-sm" role="group">
								<a class="btn_tool" onclick="manager_system_user(${data})"> <i class="fas fa-user-edit"></i></a>
								<a class="btn_tool" onclick="remove_system_user(${data})"><i class="far fa-trash-alt"></i></a>
							</div>`;
            },
        },
        {
            data: "System_Users.pictureUrl",
            title: "pictureUrl",
            orderable: false,
            render: function (data) {
                if (data == "") {
                    return "Not Image";
                }
                return `<div class="image">
								<img src="${data}" class="w-10 h-10 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500" alt="User Image">
							</div>`;
            },
        },
        {
            data: "System_Users.username",
            title: "Login name",
        },
        {
            data: "System_Users.name",
            title: "ชื่อสมาชิก",
        },
        {
            data: "System_Users.createDate",
            title: "วันลงทะเบียน",
            render: function (data) {
                //let _d = moment(data);
                //return _d.fromNow();
                return moment(data);
            },
        },
        {
            data: "System_Users.create_by",
            title: "create_by",
        },
        {
            data: "System_Users.status",
            title: "status",
        },
        {
            data: "System_User_Type.user_type",
            title: "user_type",
        },
        {
            data: "System_Users.remark",
            title: "หมายเหตุ",
            orderable: false,
        },
    ];

    //debug(columns_table)
    let headers = await unity.get_headers();

    let system_user_table = $("#system_user_table").DataTable({
        //dom: "Blfip",
        dom: '<"top"iB>rt<"bottom"flp><"clear">',
        //dom: 'Plfrtip',
        buttons: ["csv", "excel", "print", "colvis"],
        columnDefs: columnDefs,
        destroy: true,
        autoWidth: false,
        pageLength: 10,
        scrollCollapse: true,
        scrollY: "50vh",
        sScrollX: true,
        //fixedColumns: true,
        // "paging": false
        // data: dataSet,
        columns: columns_table,
        order: [[0, "desc"]],
        processing: true,
        serverSide: true,
        search: {
            return: true,
        },
        ajax: {
            headers: headers,
            type: "GET",
            url: `${API_SYSTEM_USER}datatable`,
            data: function (d) {
                d.table = "system_user_table";
            },
            error: function (xhr, textStatus, errorThrown) {
                Swal.fire({
                    icon: "error",
                    title: "Successful",
                    text: "error ",
                });
                //window.location.reload();
            },
        },
    });
}
get_systems_user();
async function remove_system_user(id) {
    if (!(await dialog_confirm())) return;

    let _reply = await unity.fetchApi(`${API_SYSTEM_USER}${id}`, "delete", null, "json");
    //debug(_reply);
    if (_reply.success == true) {
        Swal.fire({
            icon: "info",
            title: "Successful",
            html: _reply.msg,
        }).then(() => {
            window.location.reload();
        });
    } else {
        debug(_reply);
        toastMixin.fire({
            title: JSON.stringify(_reply),
            icon: "error",
        });
    }
}

async function submit_form_item(id_form) {
    debug("submit_form_item");

    const _from_e = document.getElementById(id_form);
    if (_from_e == null) {
        Swal.fire("Form data error", id_form, "error");
    }
    const _api_path = API_SYSTEM_USER;
    //debug(_from_e.elements.length);
    const formData = new FormData();
    if (current_system_user_id > 0) {
        formData.append("id", current_system_user_id);
    }
    for (let i = 0; i < _from_e.elements.length; i++) {
        let _f_e = _from_e.elements[i];
        if (_f_e.name != "") {
            let k = _f_e.name;
            let v = _f_e.value;

            if ((k == "image_upload") & (v != "")) {
                formData.append(k, await dataURLtoFile(document.getElementById("preview-img-of-item").src, v));
                debug("form is already uploaded file");
                continue;
            }
            if ((_f_e.name == "password") & (_f_e.value == "*")) continue;
            formData.append(k, v);

            debug("key :" + k + " : " + v);
        }
    }

    //debug(formData)
    let _reply = await unity.fetchApi(_api_path, "post", formData, "json");
    //debug(_reply);
    if (!!_reply) {
        if (_reply.success == true) {
            Swal.fire({
                icon: "info",
                title: "Successful",
                html: _reply.msg,
            }).then(() => {
                //window.location.reload();
                get_systems_user();
                //Modal_System_Users.hideModal();
            });
        } else {
            debug(_reply);
            toastMixin.fire({
                title: JSON.stringify(_reply),
                icon: "error",
            });
        }
    }
}

async function manager_system_user(id = 0) {
    current_system_user_id = id;
    if (id == 0) {
        //document.getElementById("form-modal-title").innerText = "ADD MODE";
    } else {
        //document.getElementById("form-modal-title").innerText = "EDIT MODE ID :" + id;

        let _datas = await unity.fetchApi(`${API_SYSTEM_USER}?id=${id}`, "get", null, "json");
        if (!!_datas) {
            const _system_user = _datas.System_User;
            if (_System_Users.id) {
                const _from_e = document.getElementById("form_system_user");
                for (let i = 0; i < _from_e.elements.length; i++) {
                    let _f_e = _from_e.elements[i];

                    if (_f_e.name != "") {
                        if (_f_e.name == "image_upload") {
                            document.getElementById("preview-img-of-item").src = _system_user["pictureUrl"];
                            //debug(document.getElementById("preview-img-of-item").src)
                            continue;
                        }
                        if (_f_e.name == "password") {
                            _f_e.value = "*";
                            continue;
                        }

                        _f_e.value = _system_user[_f_e.name];
                    }
                }
            } else {
                debug(_system_user);
                toastMixin.fire({
                    title: JSON.stringify(_system_user),
                    icon: "error",
                });
                return;
            }
        }
    }

    Modal_System_Users.showModal();
}
//get_systems_user();
//manager_system_user();
