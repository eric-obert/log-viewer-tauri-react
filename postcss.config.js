import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

export default () => {
  return {
    plugins: [tailwindcss],
  };
};
