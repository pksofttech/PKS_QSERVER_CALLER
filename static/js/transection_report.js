import * as unity from "./unity.js";
import * as datatable from "./datatable.js";
unity.debug("********************************************");
unity.debug("    load script transection_report.js");
unity.debug("********************************************");
// unity.toastr_notify({ icon: "success", msg: "transection_report" });
const HEADERS = await unity.get_headers();
let tab_select = 1;

async function build_transection_report_table() {
    const columns_table = [
        {
            data: "Transaction.id",
            title: "NO.",
        },
        {
            data: "Transaction.status",
            title: "สถานะบริการ",
            render: function (data, type) {
                let ret = "";
                switch (data) {
                    case 201:
                        ret = `<div class="badge badge-info ">รอรับบริการ</div>`;
                        break;
                    case 202:
                        ret = `<div class="badge badge-primary ">รับบริการ</div>`;
                        break;
                    case 301: // Recalled
                        ret = `<div class="badge badge-warning ">รับบริการ</div>`;
                        break;
                    case 300:
                        ret = `<div class="badge badge-success ">ดำเนินการสำเร็จ</div>`;
                        break;

                    case 400:
                        ret = `<div class="">ยกเลิก</div>`;
                        break;

                    default:
                        ret = `<div class="badge badge-info ">${data}</div>`;
                }
                return ret;
            },
        },
        {
            data: "Transaction.createDate",
            title: "วัน-เวลา",
            render: function (data, type) {
                const _d = unity.dateTimeToStr(data, "YYYY/MM/DD@HH:mm:ss");
                const datetime = _d.split("@");
                const warp_datatime = `<div class="badge badge-primary ">${datetime[0]}</div>
											<div class="badge badge-secondary ">${datetime[1]}</div>`;
                return warp_datatime;
            },
        },
        {
            data: "Service.group",
            title: "กลุ่ม",
        },
        {
            data: "Transaction.number",
            title: "หมายเลข",
        },
        {
            data: "Service.name",
            title: "รายการรับบริการ",
        },
        {
            data: "Service.tag",
            title: "รายละเอียดบริการ",
        },
        {
            data: "Transaction.machine",
            title: "เครื่องออก Slip",
        },
        {
            data: "Transaction.caller_device",
            title: "ช่องบริการ",
        },
        {
            data: "Transaction.callerDate",
            title: "เวลาเรียกรับบริการ",
            render: function (data, type) {
                const _d = unity.dateTimeToStr(data, "YYYY/MM/DD@HH:mm:ss");
                if (_d == "") {
                    return null;
                    return `<div class="badge-error ">รอรับบริการ</div>`;
                }
                const datetime = _d.split("@");
                const warp_datatime = `<div class="badge badge-primary ">${datetime[0]}</div>
											<div class="badge badge-secondary ">${datetime[1]}</div>`;
                return warp_datatime;
            },
        },
        {
            data: "Transaction.successDate",
            title: "เวลาให้บริการสำเร็จ",
            render: function (data, type) {
                const _d = unity.dateTimeToStr(data, "YYYY/MM/DD@HH:mm:ss");
                if (_d == "") {
                    return null;
                    return `<div class="badge-error ">รอรับบริการ</div>`;
                }
                const datetime = _d.split("@");
                const warp_datatime = `<div class="badge badge-primary ">${datetime[0]}</div>
											<div class="badge badge-secondary ">${datetime[1]}</div>`;
                return warp_datatime;
            },
        },
    ];

    $("#transection_report_table").DataTable({
        dom: '<"top"iB>rt<"bottom"lp><"clear">',
        buttons: [
            {
                text: "อัปเดทข้อมูล",
                className: "p-2  text-blue-500 hover:text-blue-700",
                action: function (e, dt, node, config) {
                    this.ajax.reload();
                },
            },
        ],
        language: {
            infoEmpty: "ไม่มีรายการข้อมูล",
            info: "แสดง หน้าข้อมูล _PAGE_ ใน _PAGES_ จากทั้งหมด _TOTAL_ รายการ",
        },
        columnDefs: datatable.columnDefs,
        destroy: true,
        autoWidth: true,
        lengthMenu: datatable.lengthMenu,
        pageLength: datatable.pageLength,
        scrollY: "50vh",
        scrollCollapse: true,
        sScrollX: "100%",
        //paging: false,
        columns: columns_table,
        order: [[0, "desc"]],
        processing: true,
        serverSide: true,
        search: {
            return: true,
        },
        //searching: false,
        select: false,
        ajax: {
            headers: HEADERS,
            type: "GET",
            url: `/api/transaction/datatable`,
            data: function (d) {
                d.date_range = build_transection_report_table.table_date_range;
            },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
            },
        },
    });
}

build_transection_report_table();
//build_transection_record_report_table();

async function build_transection_record_report_table(date_range = null) {
    if (typeof build_transection_record_report_table.table_date_range == "undefined") {
        build_transection_record_report_table.table_date_range = date_range;
        return;
    }
    if (date_range) {
        build_transection_record_report_table.table_date_range = date_range;
    }

    const columns_table = [
        //{
        //	data: "Transaction_Record.id",
        //	title: "Transaction_Record ID",
        //},
        {
            data: "Transaction_Record.machine",
            title: "เครื่องพิมพ์ Slip",
        },
        {
            data: "Service.group",
            title: "กลุ่ม",
        },
        {
            data: "Transaction_Record.number",
            title: "หมายเลข",
        },
        {
            data: "Service.name",
            title: "รายการรับบริการ",
        },
        {
            data: "Service.tag",
            title: "รายละเอียดบริการ",
            orderable: false,
        },

        {
            data: "Transaction_Record.caller_device",
            title: "caller_device",
            render: function (data, type) {
                const warp_data = `<div class="badge badge-lg badge-info ">${data}</div>`;
                return warp_data;
            },
        },
        {
            data: "Transaction_Record.createDate",
            title: "วันที่ออก Slip",
            render: function (data, type) {
                const _d = unity.dateTimeToStr(data, "YYYY/MM/DD@HH:mm:ss");
                const datetime = _d.split("@");
                const warp_datatime = `
					<div class="flex flex-col gap-2">
					<div class="badge-warning ">${datetime[0]}</div>
					<div class="badge-success ">${datetime[1]}</div>
					</div>`;
                return warp_datatime;
            },
        },
        {
            data: "Transaction_Record.callerDate",
            title: "เวลาเรียกรับบริการ",
            render: function (data, type) {
                if (data == null) return "";
                const _d = unity.dateTimeToStr(data, "YYYY/MM/DD@HH:mm:ss");
                const datetime = _d.split("@");
                const warp_datatime = `
					<div class="flex flex-col gap-2">
					<div class="badge-warning ">${datetime[1]}</div>
					</div>`;
                return warp_datatime;
            },
        },
        {
            data: "Transaction_Record.successDate",
            title: "เวลาทำรายการสำเร็จ",
            render: function (data, type) {
                if (data == null) return "";
                const _d = unity.dateTimeToStr(data, "YYYY/MM/DD@HH:mm:ss");
                const datetime = _d.split("@");
                const warp_datatime = `
					<div class="flex flex-col gap-2">
					<div class="badge-success ">${datetime[1]}</div>
					</div>`;
                return warp_datatime;
            },
        },
        {
            data: "Transaction_Record.createDate",
            title: "เวลารอเรียก",
            orderable: false,
            render: function (data, type, row) {
                const start_time = row.Transaction_Record.createDate;
                const end_time = row.Transaction_Record.callerDate;

                if (end_time == null) return "";
                return unity.dateTimeDiff(start_time, end_time);
            },
        },
        {
            data: "Transaction_Record.createDate",
            title: "เวลาให้บริการ",
            orderable: false,
            render: function (data, type, row) {
                const start_time = row.Transaction_Record.callerDate;
                const end_time = row.Transaction_Record.successDate;

                if (end_time == null) return "";
                return unity.dateTimeDiff(start_time, end_time);
            },
        },
        {
            data: "Transaction_Record.createDate",
            title: "เวลารวม (h:mm:ss)",
            orderable: false,
            render: function (data, type, row) {
                //unity.dateTimeDiff
                //const warp_data = `<div class="badge-error ">${data}</div>`
                const start_time = row.Transaction_Record.createDate;
                const end_time = row.Transaction_Record.successDate;

                if (end_time == null) return "";
                return unity.dateTimeDiff(start_time, end_time);
            },
        },
        {
            data: "Transaction_Record.review",
            title: "review",
            render: function (data, type) {
                if (data == 0) return "";
                const warp_data = `<div class="badge-error ">${data}</div>`;
                return warp_data;
            },
        },
    ];

    const header_document = "QPKS";
    const footer_document = "QPKS";

    $("#transection_record_report_table").DataTable({
        dom: '<"top"iBf>rt<"bottom"lp><"clear">',
        buttons: [
            {
                text: "อัปเดทข้อมูล",
                className: "p-2  text-blue-500 hover:text-blue-700",
                action: function (e, dt, node, config) {
                    this.ajax.reload();
                },
            },
            {
                extend: "print",
                footer: true,
                autoPrint: false,
                customize: function (win) {
                    $(win.document.body).css("font-size", "10pt").prepend(header_document);

                    $(win.document.body).css("font-size", "10pt").append(footer_document);

                    $(win.document.body).find("table").addClass("compact border").css("font-size", "inherit");
                },
            },
            {
                extend: "excelHtml5",
                footer: true,
                title: "Report",
                text: '<i class="fa fa-table fainfo" aria-hidden="true" ></i>',
                titleAttr: "Export Excel",
                oSelectorOpts: { filter: "applied", order: "current" },
                exportOptions: {
                    //columns: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,],
                    modifier: {
                        page: "all",
                    },
                    format: {
                        header: function (data, columnIdx) {
                            if (columnIdx == 1) {
                                //return 'column_1_header';
                                return data;
                            } else {
                                return data;
                            }
                        },
                    },
                },
            },
            "colvis",
        ],
        language: {
            infoEmpty: "ไม่มีรายการข้อมูล",
            info: "แสดง หน้าข้อมูล _PAGE_ ใน _PAGES_ จากทั้งหมด _TOTAL_ รายการ",
        },
        columnDefs: columnDefs,
        destroy: true,
        autoWidth: true,
        lengthMenu: datatable.lengthMenu,
        pageLength: datatable.pageLength,
        scrollY: "50vh",
        scrollCollapse: true,
        //sScrollX: "100%",
        scrollX: true,
        //paging: false,
        columns: columns_table,
        order: [[0, "asc"]],
        processing: true,
        serverSide: true,
        search: {
            return: true,
        },
        //searching: false,
        select: false,
        ajax: {
            headers: HEADERS,
            type: "GET",
            url: `/api/transaction/datatable_record`,
            data: function (d) {
                d.date_range = build_transection_record_report_table.table_date_range;
            },
            error: function (xhr, textStatus, errorThrown) {
                //window.location.reload();
            },
        },
    });
}

window.on_chang_datetime = on_chang_datetime;
async function on_chang_datetime(date_range) {
    toastr["info"](date_range);
    build_transection_record_report_table(date_range);
}

window.tab_transection_report_select = tab_transection_report_select;
async function tab_transection_report_select(_tab_select) {
    tab_select = _tab_select;
    build_transection_table(null);
}

window.on_chang_datetime_chart = on_chang_datetime_chart;
async function on_chang_datetime_chart(date_range) {
    toastr["success"](date_range);
    build_transection_table(date_range);
}
let chart;

window.build_transection_table = build_transection_table;
async function build_transection_table(date_range) {
    //debug(tab_select + "  : " + date_range);
    if (tab_select == 1) {
        build_transection_report_table();
    }
    if (tab_select == 2) {
        build_transection_record_report_table(date_range);
    }

    if (tab_select == 3) {
        const formData = new FormData();
        if (date_range == null) {
            date_range = document.getElementById("select_date_time_range_of_build_transection_chart").value;
        }
        formData.append("date_range", date_range);
        formData.append("chart_type_select", document.getElementById("chart_type_select").value);
        const _reply = await unity.fetchApi(`/api/transaction/chart`, "post", formData, "json");
        //document.getElementById("loader").style.display = "none";
        const chart_type_select = document.getElementById("chart_type_select").value;
        let backgroundColor = "#79AEC8";
        if (chart_type_select == "counters") {
            backgroundColor = "#FF9B50";
        }
        if (!!_reply) {
            if (_reply.success == true) {
                const data_list = _reply.data;
                const labels = [];
                const data = [];
                for (const d of data_list) {
                    if (chart_type_select == "counters") {
                        labels.push("Counter:" + d.caller_device);
                    } else {
                        labels.push(d.name);
                    }
                    data.push(d.count);
                }
                let ctx = document.getElementById("chart_div").getContext("2d");
                if (chart) {
                    chart.destroy();
                }
                chart = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: "Count of Q",
                                backgroundColor: backgroundColor,
                                //backgroundColor: Utils.transparentize(Utils.CHART_COLORS.blue, 0.5),
                                borderColor: "#417690",
                                borderWidth: 2,
                                borderRadius: 20,
                                data: data,
                            },
                        ],
                    },
                    options: {
                        title: {
                            text: "Chart",
                            display: true,
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    // This more specific font property overrides the global property
                                    font: {
                                        size: 20,
                                    },
                                },
                            },
                        },
                    },
                });
            } else {
                toastr["error"](JSON.stringify(_reply));
            }
        }
    }
}

$("#select_date_time_range_of_build_transection_report").daterangepicker({
    ranges: {
        วันนี้: [moment().hour(0).minute(0), moment().hour(23).minute(59)],
        เมื่อวานนี้: [moment().hour(0).minute(0).subtract(1, "days"), moment().hour(23).minute(59).subtract(1, "days")],
        "7 วันก่อน": [moment().subtract(6, "days"), moment()],
        "30 วันก่อน": [moment().subtract(29, "days"), moment()],
        เดือนนี้: [moment().startOf("month"), moment().endOf("month")],
        เดือนก่อน: [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
        ปีนี้: [moment().startOf("year"), moment().endOf("year")],
        ปีก่อน: [moment().subtract(1, "year").startOf("year"), moment().subtract(1, "year").endOf("year")],
    },
    timePicker24Hour: true,
    timePicker: true,
    timePickerIncrement: 1,
    locale: {
        format: "YYYY/MM/DD HH:mm",
    },
});

$("#select_date_time_range_of_build_transection_chart").daterangepicker({
    ranges: {
        วันนี้: [moment().hour(0).minute(0), moment().hour(23).minute(59)],
        เมื่อวานนี้: [moment().hour(0).minute(0).subtract(1, "days"), moment().hour(23).minute(59).subtract(1, "days")],
        "7 วันก่อน": [moment().subtract(6, "days"), moment()],
        "30 วันก่อน": [moment().subtract(29, "days"), moment()],
        เดือนนี้: [moment().startOf("month"), moment().endOf("month")],
        เดือนก่อน: [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
        ปีนี้: [moment().startOf("year"), moment().endOf("year")],
        ปีก่อน: [moment().subtract(1, "year").startOf("year"), moment().subtract(1, "year").endOf("year")],
    },
    timePicker24Hour: true,
    timePicker: true,
    timePickerIncrement: 1,
    locale: {
        format: "YYYY/MM/DD HH:mm",
    },
});
