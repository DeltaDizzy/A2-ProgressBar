"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var smol_toml_module_1 = require("https://unpkg.com/smol-toml?module");
var CONFIG = {
    missionStart: new Date('2026-04-01T18:35:00-04:00'),
    imageBounds: { xStart: 645, xEnd: 5287, width: 5500 },
};
var metSeconds = 0;
var localTimeFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
});
var countdownFormat = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});
var localTimeString = "";
function computeEventOffset(days, hours, minutes, seconds) {
    return days * (24 * 60 * 60 * 1000) + hours * (60 * 60 * 1000) + minutes * (60 * 1000) + seconds * 1000;
}
// do initializations
window.addEventListener('DOMContentLoaded', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                updateMET();
                updateTimeline();
                setInterval(updatePage, 1000);
                return [4 /*yield*/, loadEvents()];
            case 1:
                events = _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var timelineImage = document.getElementById('timeline-image');
var timelineBar = document.getElementById('timeline-bar');
var cursorOutput = document.getElementById('cursor-coords');
var localTime = document.getElementById('local');
var metTime = document.getElementById('met');
var countdownElem = document.getElementById('next-event-countdown');
var nextImage = null;
var events = null;
function init() {
    updateMET();
    updateTimeline();
}
if (timelineImage.complete) {
    init();
}
else {
    timelineImage.addEventListener('load', init);
}
window.addEventListener('mousemove', function (event) {
    cursorOutput.textContent = "Cursor: x=".concat(event.clientX, ", y=").concat(event.clientY);
});
function getImageName(flight_day_index) {
    return "media/FD".concat(String(flight_day_index).padStart(2, '0'), ".png");
}
// Cursor visibility toggle
var showCursorCoords = false; // set false to hide cursor display
cursorOutput.style.display = showCursorCoords ? 'block' : 'none';
function loadEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var response, text, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('events.toml')];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _a.sent();
                    data = (0, smol_toml_module_1.parse)(text);
                    return [2 /*return*/, data.events];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to load mission events:", error_1);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function updatePage() {
    // update MET 
    var now = new Date();
    localTimeString = localTimeFormat.format(now);
    localTime.textContent = "Local Time: ".concat(localTimeString);
    var _a = updateMET(now), totalSeconds = _a.totalSeconds, days = _a.days, hours = _a.hours, minutes = _a.minutes, seconds = _a.seconds;
    metSeconds = totalSeconds;
    var metString = "".concat(days, "/").concat(String(hours).padStart(2, '0'), ":").concat(String(minutes).padStart(2, '0'), ":").concat(String(seconds).padStart(2, '0'));
    metTime.textContent = "MET: ".concat(metString);
    // find next event
    if (events && events.length > 0) {
    }
    var eventOffset = computeEventOffset(2, 2, 10, 0);
    var nextEventTime = new Date(CONFIG.missionStart.getTime() + eventOffset);
    countdownElem.textContent = getTTE(updateMET(nextEventTime).totalSeconds);
    updateTimeline();
}
function getTTE(targetMETSeconds) {
    // 1. Calculate raw difference
    var diff = targetMETSeconds - metSeconds; // metSeconds is your global current MET
    // 2. Handle past events
    if (diff <= 0)
        return "Event Started";
    // 3. Math to extract hours, minutes, and seconds
    var hours = Math.floor(diff / 3600);
    var minutes = Math.floor((diff % 3600) / 60);
    var seconds = Math.floor(diff % 60);
    // 4. Format with leading zeros (00:00:00)
    return "T-".concat([hours, minutes, seconds]
        .map(function (val) { return String(val).padStart(2, '0'); })
        .join(':'));
}
function updateMET(current_time) {
    // Calculate MET (days/hours/minutes/seconds from mission start)
    var elapsed = current_time - CONFIG.missionStart;
    var totalSeconds = Math.floor(elapsed / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    return { totalSeconds: totalSeconds, days: days, hours: hours, minutes: minutes, seconds: seconds };
}
function updateTimeline() {
    var fdStartOffsetSeconds = -7 * 3600;
    var fdDurationSeconds = 24 * 3600;
    // which flight day are we on?
    var fdIndex = Math.floor((metSeconds - fdStartOffsetSeconds) / fdDurationSeconds);
    var fdOrdinal = fdIndex + 1;
    var imageName = "media/FD".concat(String(fdOrdinal).padStart(2, '0'), ".png");
    // Only update the image if it has actually changed to prevent flickering
    if (!timelineImage.src.endsWith(imageName)) {
        timelineImage.src = imageName;
    }
    // preload next image
    var nextImageName = getImageName(fdOrdinal + 1);
    // if we havent preloaded this one yet, preload it
    if (!nextImage || !nextImage.src.endsWith(nextImageName)) {
        nextImage = new Image();
        nextImage.src = nextImageName;
        console.log("Preloading: " + nextImageName);
    }
    // calculate horizontal progress
    var fdStartSeconds = fdStartOffsetSeconds + fdIndex * fdDurationSeconds;
    var progressInFD = (metSeconds - fdStartSeconds) / fdDurationSeconds;
    progressInFD = Math.min(Math.max(progressInFD, 0), 1);
    // map progress to active image area
    var startPercent = (CONFIG.imageBounds.xStart / CONFIG.imageBounds.width) * 100.0;
    //console.log(startPercent); 11.78%
    var endPercent = (CONFIG.imageBounds.xEnd / CONFIG.imageBounds.width) * 100.0;
    var currentPos = startPercent + (progressInFD * (endPercent - startPercent));
    timelineBar.style.setProperty("--progress", "".concat(currentPos, "%"));
}
