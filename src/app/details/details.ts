import { Component, signal, AfterViewInit } from '@angular/core';
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
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-detalji-igracke',
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    Loading,
    CommonModule,
    MatChipsModule,
    RouterLink
  ],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class DetaljiIgracke implements AfterViewInit {
  public authService = AuthService
  public console = console
  toy = signal<ToyModel | null>(null)
  isLoading = signal(true)
  private currentToyId: number | null = null

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
      
      this.currentToyId = id
      await this.loadToy(id)
    })
  }

  async loadToy(id: number) {
    try {
      this.isLoading.set(true)
      const toy = await ToyService.getToyById(id)
      console.log('Loaded toy:', toy)
      console.log('Toy reviews:', toy.recenzije)
      if (toy.recenzije) {
        console.log('Review details:', toy.recenzije.map(r => ({ 
          author: r.author, 
          rating: r.rating, 
          comment: r.comment, 
          hasComment: !!r.comment,
          commentLength: r.comment ? r.comment.length : 0
        })))
      }
      this.toy.set(toy)
      this.isLoading.set(false)
      
      setTimeout(() => {
        this.animateCards()
      }, 100)
    } catch (error) {
      console.error('Greška pri učitavanju igračke:', error)
      Alerts.error('Greška pri učitavanju igračke. Pokušajte ponovo.')
      this.isLoading.set(false)
    }
  }

  async refreshToy() {
    if (this.currentToyId !== null) {
      await this.loadToy(this.currentToyId)
    }
  }

  ngAfterViewInit() {
    this.setupScrollAnimations()
  }

  animateCards() {
    const cards = document.querySelectorAll('.details-card')
    cards.forEach((card, index) => {
      setTimeout(() => {
        (card as HTMLElement).style.opacity = '1'
      }, index * 150)
    })
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    setTimeout(() => {
      document.querySelectorAll('.details-card, .review-item').forEach(el => {
        el.classList.add('animate-on-scroll')
        observer.observe(el)
      })
    }, 500)
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

    // Proveri da li je igračka već rezervisana od strane bilo kog korisnika
    const isReservedByAnyUser = AuthService.isToyReservedByAnyUser(toy.id)
    console.log('Is toy reserved by any user?', isReservedByAnyUser)
    
    if (isReservedByAnyUser) {
      // Proveri da li je rezervisana od strane trenutnog korisnika
      const existingReservations = AuthService.getAllReservations()
      const alreadyReservedByMe = existingReservations.some(
        r => r.toyId === toy.id && r.status !== 'otkazano'
      )
      
      if (alreadyReservedByMe) {
        Alerts.error('Ova igračka je već u vašoj korpi!')
        this.router.navigate(['/korpa'])
      } else {
        Alerts.error('Ova igračka je već rezervisana od strane drugog korisnika!')
      }
      return
    }

    try {
      console.log('Calling createReservation...')
      AuthService.createReservation(toy)
      console.log('createReservation completed successfully')
      
      const afterReservations = AuthService.getAllReservations()
      console.log('Reservations after adding:', afterReservations)
      
      Alerts.success(`Igračka "${toy.naziv}" je dodata u korpu rezervacija!`)
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
