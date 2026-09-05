import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface CustomSelectProps {
  className?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  children?: React.ReactNode;
  options?: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export function CustomSelect({
  className = "",
  value,
  onChange,
  children,
  options: optionsProp,
  style,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: { value: string; label: string }[] = [];
  if (optionsProp) {
    options.push(...optionsProp);
  } else {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as { value?: string | number; children?: React.ReactNode };
        const val = childProps.value !== undefined ? childProps.value : childProps.children?.toString() || "";
        const label = childProps.children?.toString() || String(val);
        options.push({ value: String(val), label });
      }
    });
  }

  const selectedOption = options.find((o) => String(o.value) === String(value)) || options[0];
  const displayLabel = selectedOption ? selectedOption.label : (value || "");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper ${className}`}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="custom-select-label">{displayLabel}</span>
        <ChevronDown size={14} className={`custom-select-arrow ${open ? "custom-select-arrow--open" : ""}`} />
      </button>
      {open && (
        <div className="custom-select-menu">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value + "-" + opt.label}
                type="button"
                className={`custom-select-option ${isSelected ? "custom-select-option--selected" : ""}`}
                onClick={() => {
                  if (onChange) {
                    onChange({ target: { value: opt.value } });
                  }
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
