class BusinessError extends Error {
    constructor(message, code = 4001) {
        super(message)
        this.code = code
        this.name = 'BusinessError'
    }
}

export { BusinessError }