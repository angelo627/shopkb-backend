import {
  getCurrentBusinessDate,
  getDayRange,
  getMonthRange,
} from "./date.util";

// console.log("Current business date:");
// console.log(getCurrentBusinessDate());

// console.log("\nDay range:");
// console.log(getDayRange("2026-08-13"));

// console.log("\nMonth range:");
// console.log(getMonthRange(2026, 8));

// npx ts-node src/shared/utils/date.util.test.ts

import {
  getWeekRange,
} from "./date.util";

const currentDate = getCurrentBusinessDate();

console.log("Current business date:");
console.log(currentDate);

console.log("\nDay range:");
console.log(getDayRange(currentDate));

console.log("\nWeek range:");
console.log(getWeekRange(currentDate));

console.log("\nMonth range:");
console.log(
  getMonthRange(
    Number(currentDate.slice(0, 4)),
    Number(currentDate.slice(5, 7)),
  ),
);