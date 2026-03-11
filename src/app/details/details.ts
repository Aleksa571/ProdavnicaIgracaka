import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToyModel } from '../../models/toy.model';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { ToyService } from '../services/toy.service';
import { Loading } from '../loading/loading';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { Alerts } from '../alerts';

@Component({
  selector: 'app-detalji-igracke',
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    Loading,
    CommonModule,
    MatChipsModule
  ],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class DetaljiIgracke {
  public authService = AuthService
  public console = console // Dodajemo console u template
  toy = signal<ToyModel | null>(null)
  isLoading = signal(true)

  constructor(route: ActivatedRoute, private router: Router) {
    route.params.subscribe(async params => {
      const id = parseInt(params['id'])
      console.log('Details page - ID:', id, 'params:', params)
      
      if (isNaN(id)) {
        console.error('Invalid ID:', params['id'])
        Alerts.error('Neispravan ID igračke!')
        this.isLoading.set(false)
        return
      }
      
      try {
        const toy = await ToyService.getToyById(id)
        console.log('Loaded toy:', toy)
        this.toy.set(toy)
        this.isLoading.set(false)
      } catch (error) {
        console.error('Greška pri učitavanju igračke:', error)
        Alerts.error('Greška pri učitavanju igračke. Pokušajte ponovo.')
        this.isLoading.set(false)
      }
    })
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('sr-RS')} RSD`
  }

  formatDate(date: string): string {
    if (!date || date === '' || date === 'Invalid Date') {
      return 'Nije dostupno'
    }
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return 'Nije dostupno'
      }
      return dateObj.toLocaleDateString('sr-RS')
    } catch (error) {
      console.error('Error formatting date:', date, error)
      return 'Nije dostupno'
    }
  }

  getAverageRating(): number {
    const toy = this.toy()
    if (!toy || !toy.recenzije || toy.recenzije.length === 0) return 0
    const sum = toy.recenzije.reduce((acc, r) => acc + r.rating, 0)
    return sum / toy.recenzije.length
  }

  reserveToy() {
    console.log('reserveToy() called')
    const toy = this.toy()
    console.log('Current toy:', toy)
    
    if (!toy) {
      console.error('No toy data available')
      Alerts.error('Podaci o igrački nisu dostupni. Pokušajte ponovo.')
      return
    }
    
    if (!toy.id) {
      console.error('Toy missing ID:', toy)
      Alerts.error('Igračka nema validan ID. Ne možete je rezervisati.')
      return
    }
    
    const activeUser = AuthService.getActiveUser()
    console.log('Active user:', activeUser)
    
    if (!activeUser) {
      Alerts.error('Morate se prijaviti da biste rezervisali igračku!')
      this.router.navigate(['/login'])
      return
    }

    // Proveri da li igračka već postoji u korpi
    const existingReservations = AuthService.getAllReservations()
    console.log('Existing reservations:', existingReservations)
    const alreadyReserved = existingReservations.some(
      r => r.toyId === toy.id && r.status !== 'otkazano'
    )
    console.log('Already reserved?', alreadyReserved)
    
    if (alreadyReserved) {
      Alerts.error('Ova igračka je već u vašoj korpi!')
      this.router.navigate(['/korpa'])
      return
    }

    try {
      console.log('Calling createReservation...')
      AuthService.createReservation(toy)
      console.log('createReservation completed successfully')
      
      // Proveri da li je stvarno dodato
      const afterReservations = AuthService.getAllReservations()
      console.log('Reservations after adding:', afterReservations)
      
      Alerts.success(`Igračka "${toy.naziv}" je dodata u korpu rezervacija!`)
      // Preusmeri na korpu nakon kratke pauze
      setTimeout(() => {
        console.log('Navigating to cart...')
        this.router.navigate(['/korpa'])
      }, 500)
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      Alerts.error(`Greška pri rezervaciji igračke: ${error.message || error}`)
    }
  }

  getStars(): string[] {
    const rating = Math.round(this.getAverageRating())
    const stars: string[] = []
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? 'star' : 'star_border')
    }
    return stars
  }

  getReviewStars(rating: number): string[] {
    const stars: string[] = []
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? 'star' : 'star_border')
    }
    return stars
  }

  getImageUrl(): string {
    const toy = this.toy()
    if (!toy) return ''
    return ToyService.getImageUrl(toy)
  }

  hasReviews(): boolean {
    const toy = this.toy()
    return !!(toy && toy.recenzije && toy.recenzije.length > 0)
  }

  getReviews() {
    const toy = this.toy()
    return toy?.recenzije || []
  }
}
