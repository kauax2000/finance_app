"use client"

import * as React from "react"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type DatePickerProps = {
    id?: string
    "aria-labelledby"?: string
    value?: Date
    onChange: (date: Date | undefined) => void
    disabled?: boolean
    className?: string
    placeholder?: string
    /** Short numeric pt-BR label for tight layouts (e.g. dd/mm/aaaa). */
    displayStyle?: "default" | "numeric"
    classNamePopoverContent?: string
}

function formatSelectedDate(
    value: Date,
    displayStyle: DatePickerProps["displayStyle"]
) {
    if (displayStyle === "numeric") {
        return value.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }
    return value.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

export function DatePicker({
    id,
    "aria-labelledby": ariaLabelledBy,
    value,
    onChange,
    disabled,
    className,
    placeholder = "Selecione a data",
    displayStyle = "default",
    classNamePopoverContent,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover modal={false} open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={disabled}
                    aria-labelledby={ariaLabelledBy}
                    className={cn(
                        "w-full min-w-0 justify-start text-left text-sm font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 size-3.5 shrink-0" />
                    <span className="min-w-0 truncate">
                        {value ? (
                            formatSelectedDate(value, displayStyle)
                        ) : (
                            placeholder
                        )}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("z-[100] w-auto p-0", classNamePopoverContent)}
                align="start"
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(d) => {
                        onChange(d)
                        setOpen(false)
                    }}
                    defaultMonth={value}
                    locale={ptBR}
                />
            </PopoverContent>
        </Popover>
    )
}
