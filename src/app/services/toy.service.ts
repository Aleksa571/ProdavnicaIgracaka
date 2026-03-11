import axios from 'axios';
import { ToyModel, Review } from '../../models/toy.model';
import { AuthService } from './auth.service';

const client = axios.create({
    baseURL: 'https://toy.pequla.com/api',
    headers: {
        'Accept': 'application/json',
        'X-Name': 'KVA_2026/dev'
    },
    validateStatus(status) {
        return status >= 200 && status < 300
    }
})

export class ToyService {
    static async getToys(): Promise<ToyModel[]> {
        try {
            const response = await client.get<any[]>('/toy')
            console.log('API Response:', response.data)
            return response.data.map(this.mapToyData)
        } catch (error: any) {
            console.error('Error fetching toys:', error)
            if (error.response) {
                console.error('Response status:', error.response.status)
                console.error('Response data:', error.response.data)
            }
            throw error
        }
    }

    private static mapToyData(item: any): ToyModel {
        let tipValue: any = item.tip || item.type || ''
        if (tipValue && typeof tipValue === 'object' && tipValue !== null) {
            tipValue = tipValue.name || tipValue.type || tipValue.value || String(tipValue)
        }
        const tip = String(tipValue)
        
        let uzrastValue: any = item.uzrast || item.ageGroup || item.age || ''
        if (uzrastValue && typeof uzrastValue === 'object' && uzrastValue !== null) {
            uzrastValue = uzrastValue.name || uzrastValue.age || uzrastValue.value || String(uzrastValue)
        }
        const uzrast = String(uzrastValue)
        
        let ciljnaGrupaValue: any = item.ciljnaGrupa || item.targetGroup || item.target || 'svi'
        if (ciljnaGrupaValue && typeof ciljnaGrupaValue === 'object' && ciljnaGrupaValue !== null) {
            ciljnaGrupaValue = ciljnaGrupaValue.name || ciljnaGrupaValue.group || ciljnaGrupaValue.value || 'svi'
        }
        const ciljnaGrupa = String(ciljnaGrupaValue)
        
        let idValue: any = item.id || item.toyId || item._id
        if (idValue === undefined || idValue === null) {
            console.warn('Toy item missing ID:', item)
            throw new Error('Toy item must have an ID field')
        }
        const id = typeof idValue === 'number' ? idValue : parseInt(String(idValue))
        
        if (isNaN(id)) {
            console.error('Invalid toy ID:', idValue, 'from item:', item)
            throw new Error(`Invalid toy ID: ${idValue}`)
        }
        
        const toyId = id
        const apiReviews: Review[] = item.recenzije || item.reviews || []
        const localReviews = AuthService.getReviewsForToy(toyId)
        
        console.log('Loading toy:', toyId, 'API reviews:', apiReviews, 'Local reviews:', localReviews)
        
        // Kombinuj recenzije iz API-ja sa lokalnim recenzijama
        // Lokalne recenzije imaju prioritet ako postoji duplikat po autoru
        const allReviews: Review[] = [...apiReviews]
        const authorSet = new Set(apiReviews.map(r => r.author))
        
        for (const localReview of localReviews) {
            console.log('Processing local review:', localReview)
            console.log('Local review comment:', localReview.comment, 'Type:', typeof localReview.comment)
            
            // Konvertuj u Review format ako je potrebno
            const review: Review = {
                author: localReview.author,
                rating: localReview.rating,
                comment: localReview.comment || '',
                date: localReview.date
            }
            
            if (authorSet.has(review.author)) {
                // Zameni API recenziju lokalnom ako postoji
                const index = allReviews.findIndex(r => r.author === review.author)
                if (index >= 0) {
                    allReviews[index] = review
                    console.log('Replaced API review with local:', allReviews[index])
                    console.log('Replaced review comment:', allReviews[index].comment)
                }
            } else {
                // Dodaj novu lokalnu recenziju
                allReviews.push(review)
                console.log('Added local review:', allReviews[allReviews.length - 1])
                console.log('Added review comment:', allReviews[allReviews.length - 1].comment)
            }
        }
        
        console.log('Final combined reviews:', allReviews)
        allReviews.forEach((r, idx) => {
            console.log(`Final review ${idx}:`, { author: r.author, rating: r.rating, comment: r.comment, commentLength: r.comment ? r.comment.length : 0 })
        })
        
        return {
            id: id,
            naziv: item.naziv || item.name || item.title || '',
            opis: item.opis || item.description || '',
            tip: tip as any,
            uzrast: uzrast,
            ciljnaGrupa: ciljnaGrupa as any,
            datumProizvodnje: item.datumProizvodnje || item.productionDate || item.date || '',
            cena: item.cena || item.price || 0,
            recenzije: allReviews,
            imageUrl: item.imageUrl || item.image || item.image_url || ''
        }
    }

    static async getToyById(id: number): Promise<ToyModel> {
        try {
            const response = await client.get<any>(`/toy/${id}`)
            return this.mapToyData(response.data)
        } catch (error: any) {
            console.error('Error fetching toy by id:', error)
            throw error
        }
    }

    static async getToyByPermalink(permalink: string): Promise<ToyModel> {
        try {
            const response = await client.get<any>(`/toy/permalink/${permalink}`)
            return this.mapToyData(response.data)
        } catch (error: any) {
            console.error('Error fetching toy by permalink:', error)
            throw error
        }
    }

    static async getToysByIds(ids: number[]): Promise<ToyModel[]> {
        try {
            const response = await client.post<any[]>('/toy/list', ids)
            return response.data.map(this.mapToyData)
        } catch (error: any) {
            console.error('Error fetching toys by ids:', error)
            throw error
        }
    }

    static async getAgeGroups(): Promise<string[]> {
        try {
            const response = await client.get<any[]>('/age-group')
            const data = response.data || []
            return data.map(item => {
                if (typeof item === 'string') {
                    return item
                } else if (item && typeof item === 'object') {
                    return item.name || item.age || item.value || String(item)
                }
                return String(item)
            })
        } catch (error: any) {
            console.error('Error fetching age groups:', error)
            return []
        }
    }

    static async getToyTypes(): Promise<string[]> {
        try {
            const response = await client.get<any[]>('/type')
            const data = response.data || []
            return data.map(item => {
                if (typeof item === 'string') {
                    return item
                } else if (item && typeof item === 'object') {
                    return item.name || item.type || item.value || String(item)
                }
                return String(item)
            })
        } catch (error: any) {
            console.error('Error fetching toy types:', error)
            return []
        }
    }

    static searchToys(toys: ToyModel[], criteria: {
        naziv?: string;
        opis?: string;
        tip?: string;
        uzrast?: string;
        ciljnaGrupa?: string;
        datumProizvodnje?: string;
        cenaMin?: number;
        cenaMax?: number;
        minRating?: number;
    }): ToyModel[] {
        let filtered = toys

        if (criteria.naziv) {
            filtered = filtered.filter(t => 
                t.naziv.toLowerCase().includes(criteria.naziv!.toLowerCase())
            )
        }

        if (criteria.opis) {
            filtered = filtered.filter(t => 
                t.opis.toLowerCase().includes(criteria.opis!.toLowerCase())
            )
        }

        if (criteria.tip) {
            filtered = filtered.filter(t => t.tip === criteria.tip)
        }

        if (criteria.uzrast) {
            filtered = filtered.filter(t => t.uzrast === criteria.uzrast)
        }

        if (criteria.ciljnaGrupa) {
            filtered = filtered.filter(t => t.ciljnaGrupa === criteria.ciljnaGrupa || t.ciljnaGrupa === 'svi')
        }

        if (criteria.datumProizvodnje) {
            filtered = filtered.filter(t => t.datumProizvodnje === criteria.datumProizvodnje)
        }

        if (criteria.cenaMin !== undefined) {
            filtered = filtered.filter(t => t.cena >= criteria.cenaMin!)
        }

        if (criteria.cenaMax !== undefined) {
            filtered = filtered.filter(t => t.cena <= criteria.cenaMax!)
        }

        if (criteria.minRating !== undefined) {
            filtered = filtered.filter(t => {
                if (!t.recenzije || t.recenzije.length === 0) return false
                const avgRating = t.recenzije.reduce((sum, r) => sum + r.rating, 0) / t.recenzije.length
                return avgRating >= criteria.minRating!
            })
        }

        return filtered
    }

    static getImageUrl(toy: ToyModel): string {
        if (!toy.imageUrl) {
            return ''
        }
        return `https://toy.pequla.com${toy.imageUrl}`
    }
}
