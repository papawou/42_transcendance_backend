export function isDef<T>(v: T): v is Exclude<T, null | undefined> {
    return v !== undefined && v !== null
}