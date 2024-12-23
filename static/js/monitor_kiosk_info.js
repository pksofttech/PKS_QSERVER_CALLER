import * as unity from "./unity.js";
// import * as datatable from "./datatable.js";
unity.debug("********************************************");
unity.debug("    load script monitor_kiosk_info.js");
unity.debug("********************************************");

unity.toastr_notify({ icon: "info", msg: "ยินดีต้อนรับระบบ Q PSK ขอบคุณที่ใช้บริการค่ะ" });

const key_call = "Arriving Now";
const qpks_start = new Howl({
    src: [`${SOUNDS_PATH}qpks_start.mp3`],
});

let ON_Play = false;
const QUEUE_WORLD = [];
const QUEUE_SOUNDS = [];
const QPKS_SOUNDS = {};

//qpks_start.play();
//sound_get_card.play();

function play_QUEUE_SOUNDS() {
    const sound = QUEUE_SOUNDS.shift();
    if (sound !== undefined) {
        ON_Play = true;
        try {
            QPKS_SOUNDS[sound].play();
        } catch (error) {
            // console.error(error);
            unity.printWarn("Not Sound:" + error);
            QPKS_SOUNDS["infobleep"].play();
        }
    } else {
        ON_Play = false;
    }
}

async function init_sounds_modules() {
    const sound_list = "0123456789ABCDEFGHIกขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ";
    for (let i in sound_list) {
        const char_sound = sound_list[i];
        QPKS_SOUNDS[char_sound] = new Howl({
            src: [`${SOUNDS_PATH}${char_sound}.mp3`],
            onend: play_QUEUE_SOUNDS,
        });
    }
    QPKS_SOUNDS["call_number"] = new Howl({
        src: [`${SOUNDS_PATH}call_number.mp3`],
        onend: play_QUEUE_SOUNDS,
    });
    QPKS_SOUNDS["at_counter"] = new Howl({
        src: [`${SOUNDS_PATH}at_counter.mp3`],
        onend: play_QUEUE_SOUNDS,
    });

    QPKS_SOUNDS["infobleep"] = new Howl({
        src: [`${SOUNDS_PATH}infobleep.mp3`],
        onend: play_QUEUE_SOUNDS,
    });

    QPKS_SOUNDS["end"] = new Howl({
        src: [`${SOUNDS_PATH}end.mp3`],
        onend: function () {
            play_QUEUE_SOUNDS();
            unity.debug("End of Sound ");
            const world_play = QUEUE_WORLD.shift();
            if (world_play === undefined) {
                unity.debug("End of Sound QUEUE_WORLD");
                QPKS_SOUNDS["thank"].play();
            }
            // call_active_table_service(world_play);
        },
    });

    QPKS_SOUNDS["thank"] = new Howl({
        src: [`${SOUNDS_PATH}thank.mp3`],
        //onend: play_QUEUE_SOUNDS,
    });
}
init_sounds_modules();
function add_str_sound(sequence_sound) {
    if (typeof add_str_sound.lock == "undefined") {
        add_str_sound.lock = false;
    }
    while (add_str_sound.lock);
    add_str_sound.lock = true;
    for (let i = 0; i <= sequence_sound.length - 1; i++) {
        QUEUE_SOUNDS.push(sequence_sound[i]);
    }
    add_str_sound.lock = false;
}

function getTimeString() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

const TABLE_ROW = 15;
async function insert_feed_table_service(col01, col02) {
    const _table = document.getElementById("table_service");
    const _tbody = document.getElementById("tbody_service");

    if (_tbody.rows.length > 0) {
        const r = _tbody.rows[0].getElementsByTagName("td");
        if (r[0].innerText == col01) {
            return;
        }
    }

    const temp = document.getElementById("template_content_service");
    if (_table.rows.length > TABLE_ROW) {
        _table.deleteRow(-1);
    }
    const _c = temp.content.cloneNode(true);
    _c.querySelectorAll('[name="col01"]')[0].innerText = col01;
    _c.querySelectorAll('[name="col02"]')[0].innerText = "in the parking lot";

    _tbody.insertBefore(_c, _tbody.firstChild);
}

async function insert_feed_table_service_process(col01) {
    const _table = document.getElementById("table_service_process");
    const _tbody = document.getElementById("tbody_service_process");

    if (_tbody.rows.length > 0) {
        const r = _tbody.rows[0].getElementsByTagName("td");
        if (r[0].innerText == col01) {
            return;
        }
    }

    const temp = document.getElementById("template_content_service_process");
    if (_table.rows.length > TABLE_ROW) {
        _table.deleteRow(-1);
    }
    const _c = temp.content.cloneNode(true);
    _c.querySelectorAll('[name="col01"]')[0].innerText = col01;
    _c.querySelectorAll('[name="col02"]')[0].innerText = "has arrived";

    _tbody.insertBefore(_c, _tbody.firstChild);
}

async function update_feed_table_service(col01) {
    const _tbody = document.getElementById("tbody_service");
    const remove_list = [];
    for (let index = 0; index < _tbody.rows.length; index++) {
        const r = _tbody.rows[index].getElementsByTagName("td");
        // unity.debug(r);
        if (r[0].innerText == col01) {
            remove_list.push(index);
            // r[1].innerHTML = `<div class="badge-call">${key_call}</div>`;
        }
    }

    if (remove_list.length > 0) {
        insert_feed_table_service_process(col01);
    }
    remove_list.sort((a, b) => b - a);
    remove_list.forEach((index) => {
        if (index >= 0 && index < _tbody.rows.length) {
            _tbody.deleteRow(index);
        }
    });
}

async function update_feed_table_success(col01) {
    // const _table = document.getElementById("table_service_process");
    const _tbody = document.getElementById("tbody_service_process");

    const remove_list = [];
    for (let index = 0; index < _tbody.rows.length; index++) {
        const r = _tbody.rows[index].getElementsByTagName("td");
        // unity.debug(r);
        if (r[0].innerText == col01) {
            remove_list.push(index);
            // r[1].innerHTML = `<div class="badge-call">${key_call}</div>`;
        }
    }
    remove_list.sort((a, b) => b - a);
    remove_list.forEach((index) => {
        if (index >= 0 && index < _tbody.rows.length) {
            _tbody.deleteRow(index);
        }
    });
}

async function push_QUEUE_WORLD(mode, msg1, msg2) {
    document.getElementById("current_call").innerText = msg1;
    if (QUEUE_WORLD.includes(msg1)) {
        unity.debug(msg1 + " already in queue for playback");
        return;
    }
    QUEUE_WORLD.push(msg1);

    //debug(QUEUE_WORLD);
    const numbers = msg1.split("");
    let world_players = [];
    world_players.push("call_number");
    world_players = world_players.concat(numbers);
    // world_players.push("at_counter");
    world_players.push(msg2);
    // world_players.push("end");
    // world_players.splice(1, 1);
    add_str_sound(world_players);
    if (!ON_Play) {
        QUEUE_WORLD.shift();
        ON_Play = true;
        QPKS_SOUNDS["infobleep"].play();
        // call_active_table_service(msg1);
    }
    const info_msg = `<div class="text-7xl animate-bounce">${msg1}</div>`;
    unity.toastr_notify({ icon: "info", msg: info_msg });
}

// add_str_sound(["call_number", "A", "0", "0", "1", "at_counter", "1", "end"]);
//add_str_sound(["call_number", "B", "0", "0", "2", "at_counter", "2", "end"]);

QPKS_SOUNDS["infobleep"].play();

unity.wsService((e) => {
    const monitor_kiosk = e.monitor_kiosk;
    const caller_kiosk = e.caller_kiosk;
    if (monitor_kiosk) {
        if (monitor_kiosk.reload) {
            toastr["warning"](`Q PSK RELOAD`);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            return;
        }
        const col01 = `${monitor_kiosk.number}`;
        const col02 = `${monitor_kiosk.caller_device}`;

        if (monitor_kiosk.status == 202) {
            // insert_feed_table_service(col01, col02);
            // const msg = `<div class="p-4 text-3xl badge badge-info">${col01}</div> <div class="p-4 text-3xl badge badge-info">${col02}</div>`;
            // show_info(msg, "CAll-หมายเลข", "warning");
            push_QUEUE_WORLD(202, col01, col02);
            update_feed_table_service(col01);
            // update_info_service_counts();
        } else if (monitor_kiosk.status == 301) {
            push_QUEUE_WORLD(301, col01, col02);
            update_feed_table_service(col01);
        } else if (monitor_kiosk.status == 300) {
            update_feed_table_success(col01);
        } else if (monitor_kiosk.status == 401) {
            push_QUEUE_WORLD(301, col01, col02);
        }
    }

    if (caller_kiosk) {
        unity.debug(caller_kiosk);
        if (caller_kiosk.cmd == "update") {
            caller_kiosk.number = caller_kiosk.number.slice(1);
            insert_feed_table_service(caller_kiosk.number, "new");
        }
    }
});

function updateClock() {
    const clockElement = document.getElementById("clock_display");
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    // clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    clockElement.textContent = `${now}`;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Initialize the clock immediately
updateClock();
