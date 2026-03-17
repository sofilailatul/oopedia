import { Transition } from "@headlessui/react";
import { Link } from "@inertiajs/react";
import { createContext, useContext, useState } from "react";

const DropDownContext = createContext();

const Dropdown = ({ children, className = "" }) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen((previousState) => !previousState);
  };

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div className={`relative inline-block text-left ${className}`.trim()}>{children}</div>
    </DropDownContext.Provider>
  );
};

const Trigger = ({ children }) => {
  const { open, setOpen, toggleOpen } = useContext(DropDownContext);

  return (
    <>
      <div onClick={toggleOpen} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/10"
          onClick={() => setOpen(false)}
        ></div>
      )}
    </>
  );
};

const Content = ({
  align = "right",
  width = "48",
  contentClasses = "p-1 bg-white/95",
  children,
}) => {
  const { open, setOpen } = useContext(DropDownContext);

  let alignmentClasses = "origin-top";

  if (align === "left") {
    alignmentClasses = "ltr:origin-top-left rtl:origin-top-right start-0";
  } else if (align === "right") {
    alignmentClasses = "ltr:origin-top-right rtl:origin-top-left end-0";
  }

  let widthClasses = "";
  if (width === "48") widthClasses = "w-48";
  if (width === "56") widthClasses = "w-56";
  if (width === "64") widthClasses = "w-64";

  return (
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
        className={`absolute z-50 mt-2 ${alignmentClasses} ${widthClasses}`}
        onClick={() => setOpen(false)}
      >
        <div
          className={`rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur ${contentClasses}`}
        >
          {children}
        </div>
      </div>
    </Transition>
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

/**
 * ✅ Tambahan: Item (button) untuk aksi non-navigasi (misal pilih difficulty)
 * - Support disabled state
 */
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
