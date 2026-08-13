import {
  getCurrentBusinessDate,
  getDayRange,
  getMonthRange,
} from "./date.util";

console.log("Current business date:");
console.log(getCurrentBusinessDate());

console.log("\nDay range:");
console.log(getDayRange("2026-08-13"));

console.log("\nMonth range:");
console.log(getMonthRange(2026, 8));

// npx ts-node src/shared/utils/date.util.test.ts