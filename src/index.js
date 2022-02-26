import {
  schedulerCallback,
  shouldYield,
  ImmediatePriority, UserBlockingPriority, NormalPriority, LowPriority, IdlePriority,
  cancelCallback
} from './scheduler';

let result = 0;
let i = 0;
function calc(didTimeout) {
  console.log('开始1');
  for (; i < 1000 && (!shouldYield() || didTimeout); i++) {
    result += 1;
  }
  if (i < 1000) return calc;
  console.log('1',result);
  return null; 
}

let result2 = 0;
let i2 = 0;
function calc2(didTimeout) {
  console.log('开始2');
  for (; i2 < 1000 && (!shouldYield() || didTimeout); i2++) {
    result2 += 1;
  }
  if (i2 < 1000) return calc2;
  console.log('2', result2);
  return null; 
}



const task = schedulerCallback(ImmediatePriority, calc);
const task2 = schedulerCallback(NormalPriority, calc2, { delay: 10000 });

cancelCallback(task2)