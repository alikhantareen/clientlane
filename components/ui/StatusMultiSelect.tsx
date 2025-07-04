import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface StatusMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}

export function StatusMultiSelect({ options, value, onChange, placeholder = "Status" }: StatusMultiSelectProps) {
  function handleToggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  }

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center bg-[#f5f5f5] rounded-md px-3 py-2 text-sm font-normal text-gray-700 w-full md:w-auto h-10 border border-[#ececec]"
          type="button"
        >
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
          <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-48" align="start">
        <div className="flex flex-col">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => handleToggle(opt.value)}
                className="mr-2 accent-black"
              />
              {opt.label}
              {value.includes(opt.value) && <Check className="w-4 h-4 ml-auto text-black" />}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 