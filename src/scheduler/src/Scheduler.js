import { push, peek, pop } from './SchedulerMinHeap';
import { NoPriority, ImmediatePriority, UserBlockingPriority, NormalPriority, LowPriority, IdlePriority } from './SchedulerPriorities';
import { requestHostCallback, requestHostTimeout, getCurrentTime, shouldYieldToHost as shouldYield } from './SchedulerHostConfig';

var maxSigned31BitInt = 1073741823;
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
var USER_BLOCKING_PRIORITY = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
var IDLE_PRIORITY = maxSigned31BitInt;
let taskIdCounter = 0;
const taskQueue = []
const timerQueue = []
let currentTask;

function schedulerCallback(priorityLevel, callback, options) {
    let currentTime = getCurrentTime();
    let startTime = currentTime;
    if (options?.delay) {
        startTime = startTime + options.delay;
    }
    let timeout;
    // eslint-disable-next-line default-case
    switch (priorityLevel) {
        case ImmediatePriority:
            timeout = IMMEDIATE_PRIORITY_TIMEOUT;
            break;
        case UserBlockingPriority:
            timeout = USER_BLOCKING_PRIORITY;
            break;
        case NormalPriority:
            timeout = NORMAL_PRIORITY_TIMEOUT;
            break;
        case LowPriority:
            timeout = LOW_PRIORITY_TIMEOUT;
            break;
        case IdlePriority:
            timeout = IDLE_PRIORITY;
            break;
    }
    let expirationTime = currentTime + timeout;
    let newTask = {
        id: taskIdCounter ++,
        callback,
        priorityLevel,
        expirationTime,
        startTime,
        sortIndex: -1,
    }
    if (startTime > currentTime) {
        newTask.sortIndex = startTime
        push(timerQueue, newTask);
        if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
            requestHostTimeout(handleTimeout, startTime - currentTime);
        }
    } else {
        newTask.sortIndex = expirationTime;
        push(taskQueue, newTask)
        requestHostCallback(flushWork);
    }
    return newTask
}
function advanceTimers(currentTime) {
    let timer = peek(timerQueue);
    while (timer) {
        if (timer.callback === null) {
            pop(timerQueue)
        } else if (timer.startTime <= currentTime) {
            pop(timerQueue)
            timer.sortIndex = timer.expirationTime
            push(taskQueue, timer)
        } else {
            return;
        }
        timer = peek(timerQueue)
    }
}
function handleTimeout(currentTime) {
    advanceTimers(currentTime);
    if (peek(taskQueue) !== null) {
        requestHostCallback(flushWork)
    } else {
        const firstTimer = peek(timerQueue)
        if (firstTimer) {
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
    }
}

function flushWork(currentTime) {
    return workLoop(currentTime);
}

function workLoop(currentTime) {
    currentTask = peek(taskQueue)
    while (currentTask) {
        if (currentTask.expirationTime > currentTime && shouldYield()) {
            break;
        }
        const callback = currentTask.callback;
        if (typeof callback === 'function') {
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            const continuationCallback = callback(didUserCallbackTimeout);
            if (typeof continuationCallback === 'function') {
                currentTask.callback = continuationCallback;
            } else {
                pop(taskQueue)
            }
        } else {
            pop(taskQueue)
        }
        currentTask = peek(taskQueue, currentTask)
    }
    if (currentTask) {
        return true;
    } else {
        const firstTimer = peek(timerQueue)
        if (firstTimer) {
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
        return false;
    }
}
function cancelCallback(task) {
    task.callback = null;
}

export {
    schedulerCallback,
    shouldYield,
    cancelCallback,
    ImmediatePriority, UserBlockingPriority, NormalPriority, LowPriority, IdlePriority
}