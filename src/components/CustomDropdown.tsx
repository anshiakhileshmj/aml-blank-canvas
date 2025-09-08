
import { useState, useRef, useEffect } from 'react';

interface CustomDropdownProps {
  options: { value: string; label: string }[];
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

const CustomDropdown = ({
  options,
  placeholder,
  value,
  onChange,
  required = false,
}: CustomDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "";

  return (
    <div
      ref={ref}
      className="flip-card__input"
      tabIndex={0}
      style={{
        position: "relative",
        background: "var(--bg-color)",
        boxShadow: "4px 4px var(--main-color)",
        border: "2px solid var(--main-color)",
        borderRadius: 5,
        fontWeight: 600,
        fontSize: 15,
        color: value ? "var(--font-color)" : "var(--font-color-sub)",
        minWidth: 0,
        maxWidth: 250,
        flex: 1,
        cursor: "pointer",
        padding: 0,
        margin: 0,
        height: 40,
        display: "flex",
        alignItems: "center",
        outline: open ? "2px solid var(--input-focus)" : "none",
      }}
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
    >
      <div style={{ padding: "0 10px", width: "100%", userSelect: "none" }}>
        {selectedLabel || (
          <span style={{ opacity: 0.8 }}>{placeholder}</span>
        )}
      </div>
      <span style={{ marginRight: 10, fontSize: 18, color: "#666" }}>▼</span>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 42,
            left: 0,
            right: 0,
            background: "var(--bg-color)",
            border: "2px solid var(--main-color)",
            borderRadius: 5,
            zIndex: 10,
            maxHeight: 200,
            overflowY: "auto",
            boxShadow: "4px 4px var(--main-color)",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                background: value === opt.value ? "#666" : "var(--bg-color)",
                color: value === opt.value ? "#fff" : "var(--font-color)",
                fontWeight: value === opt.value ? 700 : 600,
                transition: "background 0.15s",
              }}
              onMouseDown={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "#666";
                (e.currentTarget as HTMLDivElement).style.color = "#fff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background =
                  value === opt.value ? "#666" : "var(--bg-color)";
                (e.currentTarget as HTMLDivElement).style.color =
                  value === opt.value ? "#fff" : "var(--font-color)";
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
      {required && (
        <input
          tabIndex={-1}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
          value={value}
          required
          readOnly
        />
      )}
    </div>
  );
};

export default CustomDropdown;
