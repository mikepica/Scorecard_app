export interface DataProvider<T> {
  fetch(): Promise<T>
  save?(data: T): Promise<void>
} 