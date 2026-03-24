"use client"

import { useState, useEffect } from "react"

interface UseSkeletonLoadingOptions {
    initialDelay?: number
    minDuration?: number
}

export function useSkeletonLoading(
    isLoading: boolean,
    options: UseSkeletonLoadingOptions = {}
) {
    const { initialDelay = 0, minDuration = 300 } = options
    const [showSkeleton, setShowSkeleton] = useState(false)
    const [startTime, setStartTime] = useState<number | null>(null)

    useEffect(() => {
        if (isLoading) {
            // Set a minimum delay before showing skeleton to prevent flickering
            const delayTimeout = setTimeout(() => {
                setShowSkeleton(true)
                setStartTime(Date.now())
            }, initialDelay)

            return () => clearTimeout(delayTimeout)
        } else {
            // If loading completes quickly, keep skeleton visible for minimum duration
            if (startTime) {
                const elapsed = Date.now() - startTime
                const remaining = Math.max(0, minDuration - elapsed)

                const hideTimeout = setTimeout(() => {
                    setShowSkeleton(false)
                    setStartTime(null)
                }, remaining)

                return () => clearTimeout(hideTimeout)
            } else {
                setShowSkeleton(false)
            }
        }
    }, [isLoading, initialDelay, minDuration, startTime])

    return showSkeleton
}

// Simpler version that just tracks loading state
export function useLoadingState(initialState: boolean = true) {
    const [loading, setLoading] = useState(initialState)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<Error | null>(null)

    const startLoading = () => {
        setLoading(true)
        setError(null)
    }

    const stopLoading = () => {
        setLoading(false)
    }

    const setResult = (result: any) => {
        setData(result)
        setLoading(false)
    }

    const setErrorState = (err: Error) => {
        setError(err)
        setLoading(false)
    }

    return {
        loading,
        data,
        error,
        startLoading,
        stopLoading,
        setResult,
        setError: setErrorState
    }
}
