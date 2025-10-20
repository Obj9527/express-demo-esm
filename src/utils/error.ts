class BusinessError extends Error {
  code: number;

  constructor(message: string, code = 4001) {
    super(message);
    this.code = code;
    this.name = 'BusinessError';
  }
}

export { BusinessError };
