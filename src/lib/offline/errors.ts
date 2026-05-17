export class OfflineNotSupportedError extends Error {
    constructor(message = "Esta ação requer conexão com a internet.") {
        super(message)
        this.name = "OfflineNotSupportedError"
    }
}

export function isOfflineNotSupportedError(err: unknown): err is OfflineNotSupportedError {
    return err instanceof OfflineNotSupportedError
}
