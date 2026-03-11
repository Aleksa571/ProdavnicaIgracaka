import axios from 'axios';
import { ToyModel } from '../../models/toy.model';

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
        // Ekstraktuj tip - može biti string ili objekat
        let tipValue: any = item.tip || item.type || ''
        if (tipValue && typeof tipValue === 'object' && tipValue !== null) {
            tipValue = tipValue.name || tipValue.type || tipValue.value || String(tipValue)
        }
        const tip = String(tipValue)
        
        // Ekstraktuj uzrast - može biti string ili objekat
        let uzrastValue: any = item.uzrast || item.ageGroup || item.age || ''
        if (uzrastValue && typeof uzrastValue === 'object' && uzrastValue !== null) {
            uzrastValue = uzrastValue.name || uzrastValue.age || uzrastValue.value || String(uzrastValue)
        }
        const uzrast = String(uzrastValue)
        
        // Ekstraktuj ciljnu grupu
        let ciljnaGrupaValue: any = item.ciljnaGrupa || item.targetGroup || item.target || 'svi'
        if (ciljnaGrupaValue && typeof ciljnaGrupaValue === 'object' && ciljnaGrupaValue !== null) {
            ciljnaGrupaValue = ciljnaGrupaValue.name || ciljnaGrupaValue.group || ciljnaGrupaValue.value || 'svi'
        }
        const ciljnaGrupa = String(ciljnaGrupaValue)
        
        // Ekstraktuj ID - može biti pod različitim nazivima
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
        
        return {
            id: id,
            naziv: item.naziv || item.name || item.title || '',
            opis: item.opis || item.description || '',
            tip: tip as any,
            uzrast: uzrast,
            ciljnaGrupa: ciljnaGrupa as any,
            datumProizvodnje: item.datumProizvodnje || item.productionDate || item.date || '',
            cena: item.cena || item.price || 0,
            recenzije: item.recenzije || item.reviews || [],
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
            // Ako API vraća objekte, ekstraktujemo string vrednosti
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
            // Ako API vraća objekte, ekstraktujemo string vrednosti
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
