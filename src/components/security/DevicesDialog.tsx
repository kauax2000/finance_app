"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Monitor, Smartphone, MapPin, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Device {
    id: string
    name: string
    type: "desktop" | "mobile" | "tablet"
    browser: string
    os: string
    location: string
    last_active: string
    is_current: boolean
}

interface DevicesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DevicesDialog({ open, onOpenChange }: DevicesDialogProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [devices, setDevices] = useState<Device[]>([])
    const [removing, setRemoving] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchDevices()
        }
    }, [open])

    const fetchDevices = async () => {
        setLoading(true)
        // Mock devices for demo
        const mockDevices: Device[] = [
            {
                id: "1",
                name: "MacBook Pro",
                type: "desktop",
                browser: "Chrome 120",
                os: "macOS 14.2",
                location: "São Paulo, Brasil",
                last_active: new Date().toISOString(),
                is_current: true,
            },
        ]
        setDevices(mockDevices)
        setLoading(false)
    }

    const handleRemoveDevice = async (deviceId: string) => {
        setRemoving(deviceId)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setDevices((prev) => prev.filter((d) => d.id !== deviceId))
        setRemoving(null)
    }

    const getDeviceIcon = (type: Device["type"]) => {
        switch (type) {
            case "mobile":
                return Smartphone
            default:
                return Monitor
        }
    }

    const formatLastActive = (date: string) => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const minutes = Math.floor(diff / 60000)
        if (minutes < 60) return `${minutes}min atrás`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h atrás`
        return `${Math.floor(hours / 24)}d atrás`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Dispositivos Conectados
                    </DialogTitle>
                    <DialogDescription>
                        Gerencie os dispositivos que têm acesso à sua conta
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
                    {loading ? (
                        <>
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            {devices.map((device) => {
                                const DeviceIcon = getDeviceIcon(device.type)
                                return (
                                    <div
                                        key={device.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border",
                                            device.is_current && "bg-primary/5 border-primary/30"
                                        )}
                                    >
                                        <div className="p-2 rounded-full bg-muted">
                                            <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">{device.name}</p>
                                                {device.is_current && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                        Atual
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span>{device.browser}</span>
                                                <span>•</span>
                                                <span>{device.os}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {device.location}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Última atividade: {formatLastActive(device.last_active)}
                                            </p>
                                        </div>
                                        {!device.is_current && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveDevice(device.id)}
                                                disabled={removing === device.id}
                                            >
                                                {removing === device.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}

                            {devices.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                    <p>Todos os dispositivos foram removidos</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
