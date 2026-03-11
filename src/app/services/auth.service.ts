import { ToyModel } from "../../models/toy.model"
import { ReservationModel } from "../../models/reservation.model"
import { UserModel } from "../../models/user.model"

const USERS = 'users'
const ACTIVE = 'active'

export class AuthService {
    static getUsers(): UserModel[] {
        const baseUser: UserModel = {
            email: 'user@example.com',
            password: 'user123',
            firstName: 'Example',
            lastName: 'User',
            phone: '0653093267',
            address: 'Danijelova 32',
            omiljeneVrsteIgračaka: ['konstruktor', 'slagalica'],
            reservations: []
        }

        if (localStorage.getItem(USERS) == null) {
            localStorage.setItem(USERS, JSON.stringify([baseUser]))
        }

        return JSON.parse(localStorage.getItem(USERS)!)
    }

    static login(email: string, password: string) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === email && u.password === password) {
                localStorage.setItem(ACTIVE, email)
                return true
            }
        }

        return false
    }

    static getActiveUser(): UserModel | null {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                return u
            }
        }

        return null
    }

    static updateActiveUser(newUserData: UserModel) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                u.firstName = newUserData.firstName
                u.lastName = newUserData.lastName
                u.address = newUserData.address
                u.phone = newUserData.phone
                u.omiljeneVrsteIgračaka = newUserData.omiljeneVrsteIgračaka
            }
        }
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static updateActiveUserPassword(newPassword: string) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                u.password = newPassword
            }
        }
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static logout() {
        localStorage.removeItem(ACTIVE)
    }

    static createReservation(toy: ToyModel) {
        const reservation: ReservationModel = {
            toyId: toy.id,
            naziv: toy.naziv,
            opis: toy.opis,
            tip: toy.tip,
            uzrast: toy.uzrast,
            ciljnaGrupa: toy.ciljnaGrupa,
            datumProizvodnje: toy.datumProizvodnje,
            cena: toy.cena,
            status: 'rezervisano',
            createdAt: new Date().toISOString()
        }

        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                u.reservations.push(reservation)
            }
        }
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static getReservationsByStatus(status: 'rezervisano' | 'pristiglo' | 'otkazano'): ReservationModel[] {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                return u.reservations.filter((r) => r.status === status)
            }
        }

        return []
    }

    static getAllReservations(): ReservationModel[] {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                return u.reservations
            }
        }

        return []
    }

    static cancelReservation(createdAt: string) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                for (let r of u.reservations) {
                    if (r.status === 'rezervisano' && r.createdAt === createdAt) {
                        r.status = 'otkazano'
                    }
                }
            }
        }

        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static deleteReservation(createdAt: string) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                u.reservations = u.reservations.filter(r => r.createdAt !== createdAt)
            }
        }
        
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static updateReservationStatus(createdAt: string, newStatus: 'rezervisano' | 'pristiglo' | 'otkazano') {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                for (let r of u.reservations) {
                    if (r.createdAt === createdAt) {
                        r.status = newStatus
                        if (newStatus !== 'pristiglo') {
                            delete r.ocena
                        }
                    }
                }
            }
        }
        
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static rateToy(createdAt: string, ocena: number) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                for (let r of u.reservations) {
                    if (r.createdAt === createdAt && r.status === 'pristiglo') {
                        r.ocena = ocena
                    }
                }
            }
        }
        
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static updateReservation(createdAt: string, updatedData: Partial<ReservationModel>) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                for (let r of u.reservations) {
                    if (r.createdAt === createdAt && r.status === 'rezervisano') {
                        Object.assign(r, updatedData)
                    }
                }
            }
        }
        
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static createUser(user: Partial<UserModel>) {
        const users = this.getUsers()
        user.reservations = []
        user.omiljeneVrsteIgračaka = user.omiljeneVrsteIgračaka || []
        users.push(user as UserModel)
        localStorage.setItem(USERS, JSON.stringify(users))
    }

    static existsByEmail(email: string) {
        const users = this.getUsers()
        for (let u of users) {
            if (u.email === email) return true
        }

        return false
    }
}
