import { ReservationModel } from "./reservation.model"
import { ToyType } from "./toy.model"

export interface UserModel {
    firstName: string
    lastName: string
    email: string
    password: string
    phone: string 
    address: string
    omiljeneVrsteIgračaka: ToyType[] 
    reservations: ReservationModel[] 
}
