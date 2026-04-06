import { parse } from 'https://unpkg.com/smol-toml?module';

const CONFIG = {
    missionStart: new Date('2026-04-01T18:35:00-04:00'),
    imageBounds: {xStart: 645, xEnd: 5287, width: 5500},
};

let metSeconds = 0;
const localTimeFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
});

const countdownFormat = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});
let localTimeString = "";

function computeEventOffset(days, hours, minutes, seconds) {
    return days * (24 * 60 * 60 * 1000) + hours * (60 * 60 * 1000) + minutes * (60 * 1000) + seconds * 1000;
}

async function fetchAndParseEvents() {
    try {
        // Adding a timestamp to the URL prevents the browser from 
        // caching an old version of the TOML file.
        const response = await fetch(`events.toml?nocache=${Date.now()}`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const text = await response.text();
        const data = parse(text);
        
        // Ensure we return the events array
        return data.events || []; 
    } catch (error) {
        console.error("Fetch error:", error);
        return events; // Return existing events if fetch fails
    }
}

async function syncEvents() {
    console.log("Syncing events from TOML...");
    events = await fetchAndParseEvents();
}

async function loadUpdates() {
    try {
        // Fetch the text file with a cache-buster
        const response = await fetch('updates.txt?v=' + Date.now());
        const text = await response.text();

        // Split the text into an array by newlines
        // This handles both Windows (\r\n) and Unix (\n) line endings
        const lines = text.split(/\r?\n/);

        // Clear existing content in the element
        updatesElem.innerHTML = '';

        // Loop through lines and add them to the element
        lines.forEach(line => {
            if (line.trim() !== "") { // Skip empty lines
                const lineSpan = document.createElement('span');
                lineSpan.textContent = line;
                updatesElem.appendChild(lineSpan);
                updatesElem.appendChild(document.createElement('br'));
            } else {
                updatesElem.textContent = "No updates available.";
            }
        });
    } catch (error) {
        console.error("Error loading updates:", error);
        updatesElem.textContent = "Failed to load mission updates.";
    }
}

// do initializations
window.addEventListener('DOMContentLoaded', () => {
    syncEvents();
    loadUpdates();
    updateMET();
    updateTimeline();
    setInterval(updatePage, 1000);
    setInterval(() => {
        syncEvents();
        loadUpdates();
    }, 300000); // Sync events every 5 minutes
});

const timelineImage = document.getElementById('timeline-image');
const timelineBar = document.getElementById('timeline-bar');
const cursorOutput = document.getElementById('cursor-coords');
const localTime = document.getElementById('local');
const metTime = document.getElementById('met');
const countdownElem = document.getElementById('next-event-countdown');
const nextEventMet = document.getElementById('next-event-met');
const nextEventName = document.getElementById('next-event-description');
const updatesElem = document.getElementById('updates-text');
let nextImage = null;
let events = [];

function init() {
    updateMET();
    updateTimeline();
}

if (timelineImage.complete) {
    init();
} else {
    timelineImage.addEventListener('load', init);
}

window.addEventListener('mousemove', (event) => {
    cursorOutput.textContent = `Cursor: x=${event.clientX}, y=${event.clientY}`;
});

function getImageName(flight_day_index) {
    return `media/FD${String(flight_day_index).padStart(2, '0')}.png`;
}

// Cursor visibility toggle
const showCursorCoords = false; // set false to hide cursor display
cursorOutput.style.display = showCursorCoords ? 'block' : 'none';

function updatePage() {
    const now = new Date();
    localTimeString = localTimeFormat.format(now);
    localTime.textContent = `Local Time: ${localTimeString}`;
    const { totalSeconds, days, hours, minutes, seconds } = updateMET(now);
    metSeconds = totalSeconds;
    const metString = `${days}/${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    metTime.textContent = `MET: ${metString}`;

    updateActiveEvent();

    updateTimeline();
}

function updateActiveEvent() {
    if (!events || events.length === 0) return;

    // 1. Calculate the current MET in milliseconds for precision
    const currentMs = metSeconds * 1000;

    // 2. Find the first event whose offset is GREATER than current time
    const nextEvent = events.find(event => {
        const offset = computeEventOffset(event.days, event.hours, event.minutes, event.seconds);
        return offset > currentMs;
    });

    // 3. Update the UI if an event is found
    if (nextEvent) {
        nextEventName.textContent = nextEvent.title;
        
        // Format the target MET string for display
        const targetMET = `${nextEvent.days}/${String(nextEvent.hours).padStart(2,'0')}:${String(nextEvent.minutes).padStart(2,'0')}:00`;
        nextEventMet.textContent = `MET ${targetMET}`;
        
        // Update the countdown timer
        const targetSeconds = computeEventOffset(nextEvent.days, nextEvent.hours, nextEvent.minutes, nextEvent.seconds) / 1000;
        countdownElem.textContent = getTTE(targetSeconds);
    } else {
        nextEventName.textContent = "No Upcoming Events";
        nextEventMet.textContent = "";
    }
}

function getTTE(targetMETSeconds) {
    // 1. Calculate raw difference
    let diff = targetMETSeconds - metSeconds; // metSeconds is your global current MET

    // 2. Handle past events
    if (diff <= 0) return "Event Started";

    // 3. Math to extract hours, minutes, and seconds
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);

    // 4. Format with leading zeros (00:00:00)
    return `T-${[hours, minutes, seconds]
        .map(val => String(val).padStart(2, '0'))
        .join(':')}`;
}
function updateMET(current_time) {
    // Calculate MET (days/hours/minutes/seconds from mission start)
    const elapsed = current_time - CONFIG.missionStart;
    const totalSeconds = Math.floor(elapsed / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { totalSeconds, days, hours, minutes, seconds };
}

function updateTimeline() {
    const fdStartOffsetSeconds = -7 * 3600;
    const fdDurationSeconds = 24 * 3600;

    // which flight day are we on?
    const fdIndex = Math.floor((metSeconds - fdStartOffsetSeconds) / fdDurationSeconds);
    const fdOrdinal = fdIndex + 1;
    const imageName = `media/FD${String(fdOrdinal).padStart(2, '0')}.png`;

    // Only update the image if it has actually changed to prevent flickering
    if (!timelineImage.src.endsWith(imageName)) {
        timelineImage.src = imageName;
    }

    // preload next image
    const nextImageName = getImageName(fdOrdinal + 1);

    // if we havent preloaded this one yet, preload it
    if (!nextImage || !nextImage.src.endsWith(nextImageName)) {
        nextImage = new Image();
        nextImage.src = nextImageName;
        console.log("Preloading: " + nextImageName);
    }

    // calculate horizontal progress
    let fdStartSeconds = fdStartOffsetSeconds + fdIndex * fdDurationSeconds;
    let progressInFD = (metSeconds - fdStartSeconds) / fdDurationSeconds;
    progressInFD = Math.min(Math.max(progressInFD, 0), 1);

    // map progress to active image area
    const startPercent = (CONFIG.imageBounds.xStart / CONFIG.imageBounds.width) * 100.0;
    //console.log(startPercent); 11.78%
    const endPercent = (CONFIG.imageBounds.xEnd / CONFIG.imageBounds.width) * 100.0;
    const currentPos = startPercent + (progressInFD * (endPercent - startPercent));
    timelineBar.style.setProperty("--progress", `${currentPos}%`);
}