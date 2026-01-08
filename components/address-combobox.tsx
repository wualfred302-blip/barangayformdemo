"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface AddressOption {
  code: string
  name: string
  zip_code?: string
  type?: string
}

interface AddressComboboxProps {
  value: string
  onValueChange: (value: string, code?: string, zipCode?: string) => void
  placeholder: string
  type: "province" | "city" | "barangay"
  parentCode?: string
  wasScanned?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
}

export function AddressCombobox({
  value,
  onValueChange,
  placeholder,
  type,
  parentCode,
  wasScanned = false,
  disabled = false,
  required = false,
  className,
}: AddressComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<AddressOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [customMode, setCustomMode] = React.useState(false)
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch options when dropdown opens or search changes
  const fetchOptions = React.useCallback(
    async (searchQuery: string) => {
      if (type === "barangay" && !parentCode) {
        setOptions([])
        return
      }

      setLoading(true)
      try {
        let url = ""
        switch (type) {
          case "province":
            url = `/api/address/provinces?search=${encodeURIComponent(searchQuery)}`
            break
          case "city":
            url = `/api/address/cities?search=${encodeURIComponent(searchQuery)}${parentCode ? `&province_code=${parentCode}` : ""}`
            break
          case "barangay":
            url = `/api/address/barangays?search=${encodeURIComponent(searchQuery)}&city_code=${parentCode}`
            break
        }

        const response = await fetch(url)
        const data = await response.json()

        if (type === "province") {
          setOptions(data.provinces || [])
        } else if (type === "city") {
          setOptions(data.cities || [])
        } else {
          setOptions(data.barangays || [])
        }
      } catch (error) {
        console.error(`[v0] Failed to fetch ${type}:`, error)
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [type, parentCode],
  )

  // Debounced search
  React.useEffect(() => {
    if (!open) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchOptions(search)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [search, open, fetchOptions])

  // Initial fetch when opening
  React.useEffect(() => {
    if (open && options.length === 0) {
      fetchOptions("")
    }
  }, [open, options.length, fetchOptions])

  // Reset when parent changes
  React.useEffect(() => {
    setOptions([])
    setSearch("")
  }, [parentCode])

  const handleSelect = (option: AddressOption) => {
    onValueChange(option.name, option.code, option.zip_code)
    setOpen(false)
    setSearch("")
    setCustomMode(false)
  }

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value, undefined, undefined)
  }

  const isDisabled = disabled || (type === "barangay" && !parentCode)

  // Custom input mode
  if (customMode) {
    return (
      <div className="space-y-1">
        <Input
          value={value}
          onChange={handleCustomInput}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("h-12 w-full", wasScanned && value && "border-emerald-300 bg-emerald-50/50", className)}
        />
        <button type="button" onClick={() => setCustomMode(false)} className="text-xs text-emerald-600 hover:underline">
          Switch back to suggestions
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className={cn(
              "h-12 w-full justify-between font-normal",
              !value && "text-muted-foreground",
              wasScanned && value && "border-emerald-300 bg-emerald-50/50",
              className,
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={`Search ${type}...`} value={search} onValueChange={setSearch} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : options.length === 0 ? (
                <CommandEmpty>
                  <div className="py-2 text-center text-sm">
                    <p className="text-muted-foreground">No results found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMode(true)
                        setOpen(false)
                      }}
                      className="mt-2 text-emerald-600 hover:underline"
                    >
                      Enter manually instead
                    </button>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.code}
                      value={option.code}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === option.name ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1">{option.name}</span>
                      {option.type && <span className="text-xs text-muted-foreground">{option.type}</span>}
                      {option.zip_code && (
                        <span className="text-xs text-muted-foreground ml-2">ZIP: {option.zip_code}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={() => setCustomMode(true)}
        className="text-xs text-gray-500 hover:text-emerald-600 hover:underline"
      >
        Can&apos;t find your {type}? Enter manually
      </button>
    </div>
  )
}
