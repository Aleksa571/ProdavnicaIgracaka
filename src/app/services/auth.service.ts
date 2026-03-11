import { ToyModel } from "../../models/toy.model"
import { ReservationModel } from "../../models/reservation.model"
import { UserModel } from "../../models/user.model"

const USERS = 'users'
const ACTIVE = 'active'
const REVIEWS = 'toy_reviews'

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

    static isToyReservedByAnyUser(toyId: number): boolean {
        const users = this.getUsers()
        for (let u of users) {
            if (u.reservations && u.reservations.some(r => r.toyId === toyId && r.status === 'rezervisano')) {
                return true
            }
        }
        return false
    }

    static getToyReservationsByAllUsers(toyId: number): ReservationModel[] {
        const users = this.getUsers()
        const allReservations: ReservationModel[] = []
        for (let u of users) {
            if (u.reservations) {
                const toyReservations = u.reservations.filter(r => r.toyId === toyId && r.status === 'rezervisano')
                allReservations.push(...toyReservations)
            }
        }
        return allReservations
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

    static rateToy(createdAt: string, ocena: number, comment: string = '') {
        const users = this.getUsers()
        const activeUser = this.getActiveUser()
        let toyId: number | null = null
        
        // Postavi ocenu na rezervaciju
        for (let u of users) {
            if (u.email === localStorage.getItem(ACTIVE)) {
                for (let r of u.reservations) {
                    if (r.createdAt === createdAt && r.status === 'pristiglo') {
                        r.ocena = ocena
                        toyId = r.toyId
                    }
                }
            }
        }
        
        localStorage.setItem(USERS, JSON.stringify(users))
        
        // Dodaj recenziju na igračku
        if (toyId !== null && activeUser) {
            this.addReviewToToy(toyId, {
                author: `${activeUser.firstName} ${activeUser.lastName}`,
                rating: ocena,
                comment: comment,
                date: new Date().toISOString()
            })
        }
    }

    static addReviewToToy(toyId: number, review: { author: string; rating: number; comment: string; date: string }) {
        const reviews = this.getReviews()
        if (!reviews[toyId]) {
            reviews[toyId] = []
        }
        
        console.log('Adding review for toy:', toyId, review)
        console.log('Review comment value:', review.comment, 'Type:', typeof review.comment, 'Length:', review.comment ? review.comment.length : 0)
        
        // Proveri da li korisnik već ima recenziju za ovu igračku
        const existingIndex = reviews[toyId].findIndex(r => r.author === review.author)
        if (existingIndex >= 0) {
            reviews[toyId][existingIndex] = { ...review }
            console.log('Updated existing review:', reviews[toyId][existingIndex])
            console.log('Updated review comment:', reviews[toyId][existingIndex].comment)
        } else {
            reviews[toyId].push({ ...review })
            console.log('Added new review:', reviews[toyId][reviews[toyId].length - 1])
            console.log('New review comment:', reviews[toyId][reviews[toyId].length - 1].comment)
        }
        
        localStorage.setItem(REVIEWS, JSON.stringify(reviews))
        const saved = JSON.parse(localStorage.getItem(REVIEWS) || '{}')
        console.log('Saved reviews to localStorage:', saved)
        if (saved[toyId]) {
            console.log('Reviews for toy', toyId, ':', saved[toyId])
            saved[toyId].forEach((r: any, idx: number) => {
                console.log(`Review ${idx}:`, { author: r.author, comment: r.comment, hasComment: !!r.comment })
            })
        }
    }

    static getReviews(): { [toyId: number]: Array<{ author: string; rating: number; comment: string; date: string }> } {
        const stored = localStorage.getItem(REVIEWS)
        if (!stored) {
            return {}
        }
        try {
            return JSON.parse(stored)
        } catch {
            return {}
        }
    }

    static getReviewsForToy(toyId: number): Array<{ author: string; rating: number; comment: string; date: string }> {
        const reviews = this.getReviews()
        return reviews[toyId] || []
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
