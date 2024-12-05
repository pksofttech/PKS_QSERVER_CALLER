// ******************************************* //
// ******************************************* //
//              datatable module               //
// ******************************************* //
// ******************************************* //
// import * as unity from "./unity.js";
// const HEADERS = await unity.get_headers();

export const table_language = {
    infoEmpty: "ไม่มีรายการข้อมูล",
    info: "แสดง หน้าข้อมูล _PAGE_ ใน _PAGES_ จากทั้งหมด _TOTAL_ รายการ",
    infoFiltered: "(ข้อมูลทั้งหมด _MAX_ รายการ)",
};

export const lengthMenu = [
    [10, 25, 50, 100, 500, 1000],
    [10, 25, 50, 100, 500, "1K"],
];

export const columnDefs = [
    {
        className: "p-4 dt-left",
        targets: "_all",
    },
];

export function buttons_datatable(header_document = null) {
    return [
        {
            text: '<i class="fa-solid fa-rotate fa-2x text-primary"></i>',
            action: function (e, dt, node, config) {
                this.ajax.reload();
            },
        },
        {
            text: `<i class="fa-solid fa-print fa-2x text-info"></i>`,
            extend: "print",
            footer: true,
            autoPrint: false,
            exportOptions: {
                columns: ":visible",
            },
            customize: function (win) {
                $(win.document.body).css("font-size", "10pt").css("background-color", "white").prepend(header_document);

                $(win.document.body).find("table").addClass("compact border").css("font-size", "inherit");
            },
        },
        {
            extend: "excelHtml5",
            footer: true,
            title: "Report",
            text: '<i class="fa-solid fa-file-excel fa-2x text-success"></i>',
            titleAttr: "Export Excel",
            oSelectorOpts: { filter: "applied", order: "current" },
            exportOptions: {
                columns: ":visible",
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
        {
            extend: "csv",
            text: '<i class="fa-solid fa-file-csv fa-2x text-warning"></i>',
        },
        {
            extend: "colvis",
            text: '<i class="fa-solid fa-indent fa-2x text-error"></i>',
        },
    ];
}
