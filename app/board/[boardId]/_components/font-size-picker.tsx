"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FontSizePickerProps {
    onChange: (size: number) => void;
    value?: number;
}

const SIZES = [
    { label: "S", value: 16 },
    { label: "M", value: 32 },
    { label: "L", value: 64 },
];

export const FontSizePicker = ({ onChange, value }: FontSizePickerProps) => {
    const [inputValue, setInputValue] = useState(value?.toString() || "32");

    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value.toString());
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed) && parsed > 0) {
            onChange(parsed);
        } else {
            setInputValue(value?.toString() || "32");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleInputBlur();
            e.currentTarget.blur();
        }
    };

    return (
        <div className="flex flex-wrap gap-1 items-center pr-2 mr-2 border-r border-neutral-200">
            {SIZES.map((size) => (
                <Button
                    key={size.value}
                    variant={value === size.value ? "boardActive" : "board"}
                    size="icon"
                    onClick={() => onChange(size.value)}
                    className="h-8 w-8 text-xs font-semibold"
                >
                    {size.label}
                </Button>
            ))}
            <Input
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                className="h-8 w-12 px-1 text-center text-xs ml-1"
                placeholder="Size"
            />
        </div>
    );
};
