import clsx from "clsx";
import nav from "../styles/nav.module.css";
import theme from "../styles/theming.module.css";

export default function NavBackground({ children, options, height }) {
  return (
    <div
      className={clsx(
        nav.nav,
        theme["nav-backgroundColor"],
        theme[`theme-${options.theme || "default"}`],
        "w-full shadow-x1/20 flex items-center pl-6 pr-5 gap-5 z-50"
      )}
      style={{ height }}
    >
      {children}
    </div>
  );
}
