let scheduledHostCallback = null;
const messageChannel = new MessageChannel();
messageChannel.port1.onmessage = performWorkUntilDeadline;

let deadline = 0;
let yieldInterval = 5;
let taskTimeout;

export function getCurrentTime() {
    return performance.now();
}

function performWorkUntilDeadline() {
    const currentTime = getCurrentTime();
    deadline = currentTime + yieldInterval;
    const hasMoreWork = scheduledHostCallback(currentTime);
    if (hasMoreWork) {
        messageChannel.port2.postMessage(null);
    }
}

function requestHostCallback(callback) {   
    scheduledHostCallback = callback;
    messageChannel.port2.postMessage(null);
}

function shouldYieldToHost() {
    return getCurrentTime() - deadline > 0
}

function requestHostTimeout(callback, ms) {
    taskTimeout = setTimeout(() => {
        callback(getCurrentTime())
    }, ms); 
}

export {
    requestHostTimeout,
    requestHostCallback,
    shouldYieldToHost,
}