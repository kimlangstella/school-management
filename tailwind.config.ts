import {heroui} from '@heroui/theme';
// import {nextui} from '@nextui-org/theme';
// import type { Config } from "tailwindcss";

// const config: Config = {
//
  // content: [
  //   "//     \"./src/pages/**/*.{js,ts,jsx,tsx,mdx}\"",
  //   "//     \"./src/components/**/*.{js,ts,jsx,tsx,mdx}\"",
  //   "//     \"./src/app/**/*.{js,ts,jsx,tsx,mdx}\"",
  //   "//     \"./node_modules/@nextui-org/theme/dist/components/(card|ripple).js\"\n//",
  //   "./node_modules/@heroui/theme/dist/components/(listbox|divider).js"
  // ],
//   theme: {
//     extend: {
//       backgroundImage: {
//         "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
//         "gradient-conic":
//           "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
//       },
//     },
//   },
//
  // plugins: [nextui(),heroui()],
// };
// export default config;
// /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',  // For Next.js 'app' folder structure
    './src/components/**/*.{js,ts,jsx,tsx}', // Include your components folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
