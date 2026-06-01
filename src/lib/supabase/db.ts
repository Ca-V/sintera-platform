// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const row  = <T>(v: T) => v as any as never
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rows = <T>(v: T[]) => v as any as never[]
