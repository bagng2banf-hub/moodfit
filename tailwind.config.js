export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 70px rgba(20, 20, 20, 0.10)",
        cute: "0 18px 50px rgba(244, 143, 177, 0.22)",
      },
      animation: {
        float: "float 4.8s ease-in-out infinite",
        pop: "pop 360ms cubic-bezier(.2,.9,.2,1)",
        runway: "runway 3.8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pop: {
          "0%": { transform: "scale(.96)", opacity: ".55" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        runway: {
          "0%, 100%": { transform: "translateY(0) rotateY(-5deg)" },
          "50%": { transform: "translateY(-10px) rotateY(5deg)" },
        },
      },
    },
  },
  plugins: [],
};
