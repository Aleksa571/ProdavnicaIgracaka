export interface OrderModel {
    flightId: number
    flightNumber: string
    destination: string
    scheduledAt: string
    airlineId: number
    seatingTypeId: number
    ageGroup: 'a' | 'c'
    state: 'w' | 'c' | 'p'
    count: number,
    createdAt: string
}