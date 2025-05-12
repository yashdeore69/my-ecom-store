/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				slate1: "#1B2631",     // dark bluish gray
				slate2: "#2C3E50",     // darker blue gray
				blueAccent: "#4A90E2", // vibrant blue
				grayAccent: "#5D6D7E", // muted gray-blue
				pureBlack: "#000000",  // true black
     		}
		},
	},
	plugins: [],
};
