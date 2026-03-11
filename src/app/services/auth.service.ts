import { ToyModel } from "../../models/toy.model"
import { ReservationModel } from "../../models/reservation.model"
import { UserModel } from "../../models/user.model"

const USERS = 'users'
const ACTIVE = 'active'

export class AuthService {
    static getUsers(): UserModel[] {
        const baseUser: UserModel = {
            email: 'aleksa.milosevic.23@singimail.rs',
            password: 'aleksa123',
            firstName: 'Aleksa',
            lastName: 'Milosevic',
            phone: '0653093267',
            address: 'Danijelova 32',
            omiljeneVrsteIgračaka: ['konstruktor', 'slagalica'],
            reservations: []
        }

        if (localStorage.getItem(USERS) == null) {
            localStorage.setItem(USERS, JSON.stringify([baseUser]))
            return [baseUser]
        }

        const users = JSON.parse(localStorage.getItem(USERS)!)
        
        for (let u of users) {
            if (!u.reservations) {
                u.reservations = []
            }
        }
        
        const defaultUserExists = users.some((u: UserModel) => u.email === baseUser.email)
        if (!defaultUserExists) {
            users.push(baseUser)
            localStorage.setItem(USERS, JSON.stringify(users))
        } else {
            const defaultUser = users.find((u: UserModel) => u.email === baseUser.email)
            if (defaultUser && !defaultUser.reservations) {
                defaultUser.reservations = []
                localStorage.setItem(USERS, JSON.stringify(users))
            }
        }

        return users
    }

    static login(email: string, password: string) {
        const users = this.getUsers()
        console.log('Pokušaj prijave sa email:', email)
        console.log('Dostupni korisnici:', users.map(u => u.email))
        
        for (let u of users) {
            if (u.email === email && u.password === password) {
                localStorage.setItem(ACTIVE, email)
                console.log('Uspešna prijava!')
                return true
            }
        }

        console.log('Neuspešna prijava - email ili lozinka nisu ispravni')
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
        console.log('createReservation called with toy:', toy)
        
        const activeEmail = localStorage.getItem(ACTIVE)
        console.log('Active user email:', activeEmail)
        
        if (!activeEmail) {
            throw new Error('Nema aktivnog korisnika!')
        }
        
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
        
        console.log('Created reservation object:', reservation)

        const users = this.getUsers()
        console.log('All users:', users)
        
        let found = false
        for (let u of users) {
            if (u.email === activeEmail) {
                console.log('Found user:', u.email)
                if (!u.reservations) {
                    u.reservations = []
                }
                u.reservations.push(reservation)
                found = true
                console.log('Reservation added. User reservations:', u.reservations)
                break
            }
        }
        
        if (!found) {
            console.error('User not found!', activeEmail)
            throw new Error(`Korisnik sa emailom ${activeEmail} nije pronađen!`)
        }
        
        localStorage.setItem(USERS, JSON.stringify(users))
        console.log('Users saved to localStorage')
        
        const savedUsers = JSON.parse(localStorage.getItem(USERS) || '[]')
        const savedUser = savedUsers.find((u: UserModel) => u.email === activeEmail)
        console.log('Verification - saved user reservations:', savedUser?.reservations)
    }

    static getReservationsByStatus(status: 'rezervisano' | 'pristiglo' | 'otkazano'): ReservationModel[] {
        const users = this.getUsers()
        const activeEmail = localStorage.getItem(ACTIVE)
        
        for (let u of users) {
            if (u.email === activeEmail) {
                const filtered = (u.reservations || []).filter((r) => r.status === status)
                console.log(`getReservationsByStatus(${status}) - Found ${filtered.length} reservations`)
                return filtered
            }
        }

        return []
    }

    static getAllReservations(): ReservationModel[] {
        const users = this.getUsers()
        const activeEmail = localStorage.getItem(ACTIVE)
        console.log('getAllReservations - Active email:', activeEmail)
        
        for (let u of users) {
            if (u.email === activeEmail) {
                console.log('getAllReservations - Found user:', u.email)
                console.log('getAllReservations - User reservations:', u.reservations)
                return u.reservations || []
            }
        }

        console.log('getAllReservations - User not found, returning empty array')
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
