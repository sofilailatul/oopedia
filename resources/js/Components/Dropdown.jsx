import { Transition } from "@headlessui/react";
import { Link } from "@inertiajs/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const DropDownContext = createContext();

const Dropdown = ({ children, className = "" }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const toggleOpen = () => {
    setOpen((previousState) => !previousState);
  };

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen, triggerRef }}>
      <div className={`relative block w-full text-left ${className}`.trim()}>
        {children}
      </div>
    </DropDownContext.Provider>
  );
};

const Trigger = ({ children }) => {
  const { open, setOpen, toggleOpen, triggerRef } = useContext(DropDownContext);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className="w-full cursor-pointer"
      >
        {children}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

const Content = ({
  align = "left",
  width = "full",
  contentClasses = "p-1 bg-white/95",
  children,
}) => {
  const { open, setOpen, triggerRef } = useContext(DropDownContext);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();

      let menuWidth = rect.width;

      if (width === "48") menuWidth = 192;
      if (width === "56") menuWidth = 224;
      if (width === "64") menuWidth = 256;
      if (width === "full") menuWidth = rect.width;

      const left =
        align === "right"
          ? rect.right - menuWidth
          : rect.left;

      setPosition({
        top: rect.bottom + 8,
        left,
        width: menuWidth,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align, width, triggerRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <Transition
      show={open}
      enter="transform transition ease-out duration-200"
      enterFrom="opacity-0 -translate-y-1 scale-95"
      enterTo="opacity-100 translate-y-0 scale-100"
      leave="transform transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0 scale-100"
      leaveTo="opacity-0 -translate-y-1 scale-95"
    >
      <div
        className="fixed z-[9999]"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
        onClick={() => setOpen(false)}
      >
        <div
          className={`max-h-60 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur ${contentClasses}`}
        >
          {children}
        </div>
      </div>
    </Transition>,
    document.body,
  );
};

const DropdownLink = ({ className = "", children, ...props }) => {
  return (
    <Link
      {...props}
      className={
        "block w-full rounded-xl px-3 py-2 text-start text-[13px] font-medium leading-5 text-slate-700 transition duration-150 ease-in-out hover:bg-slate-100/80 focus:bg-slate-100/80 focus:outline-none " +
        className
      }
    >
      {children}
    </Link>
  );
};

const DropdownItem = ({
  className = "",
  children,
  disabled = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
      className={[
        "block w-full rounded-xl px-3 py-2 text-start text-[13px] font-medium leading-5 transition duration-150 ease-in-out focus:outline-none",
        disabled
          ? "cursor-not-allowed bg-white text-slate-400"
          : "text-slate-700 hover:bg-slate-100/80 focus:bg-slate-100/80",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
Dropdown.Item = DropdownItem;

export default Dropdown;