import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  toy = signal<ToyModel | null>(null)
  isLoading = signal(true)

  constructor(route: ActivatedRoute) {
    route.params.subscribe(async params => {
      const id = parseInt(params['id'])
      try {
        const toy = await ToyService.getToyById(id)
        this.toy.set(toy)
        this.isLoading.set(false)
      } catch (error) {
        console.error('Greška pri učitavanju igračke:', error)
        this.isLoading.set(false)
      }
    })
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('sr-RS')} RSD`
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('sr-RS')
  }

  getAverageRating(): number {
    const toy = this.toy()
    if (!toy || !toy.recenzije || toy.recenzije.length === 0) return 0
    const sum = toy.recenzije.reduce((acc, r) => acc + r.rating, 0)
    return sum / toy.recenzije.length
  }

  reserveToy() {
    const toy = this.toy()
    if (!toy) return
    
    if (!AuthService.getActiveUser()) {
      Alerts.error('Morate se prijaviti da biste rezervisali igračku!')
      return
    }

    AuthService.createReservation(toy)
    Alerts.success(`Igračka "${toy.naziv}" je dodata u korpu rezervacija!`)
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
