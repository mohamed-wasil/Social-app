import bootstrap from "./src/main.js"
bootstrap()




// // Bonus one 
// const lengthOfLastWord = function (s) {
//     [].lastIndexOf
//     s = s.trim().split(" ").pop().length
//     return s
// };

// console.log(lengthOfLastWord(" any thing "));

// // Bonus two 
// function nimeGame(n) {
//     return n % 4 !== 0;
// }
// console.log(nimeGame(6));

// // Bonus tree 
// const strStr = function (haystack, needle) {

//     return haystack.indexOf(needle);
// };

// console.log(strStr("sadbutsad", 'sad'));

// const romanMap = {
//     'I': 1, 'V': 5, 'X': 10, 'L': 50,
//     'C': 100, 'D': 500, 'M': 1000
// };

// var romanToInt = function (s) {
//     let total = 0
//     for (let i = 0; i < s.length; i++) {
//         let c = romanMap[i]
//         let next = romanMap[i + 1]

//         if (c > next) {
//             total = + c;
//         }
//         else {
//             total = -c;
//         }

//     }
//     return total
// };