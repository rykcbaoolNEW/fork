import clsx from "clsx";
import nav from "../styles/nav.module.css";
import theme from "../styles/theming.module.css";
import { useEffect } from "react";

export default function Background({ children, backgroundStyle }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = backgroundStyle;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [backgroundStyle]);

  return (
    <div className={clsx(nav.nav, theme.background)}>
      {children}
    </div>
  );
}
