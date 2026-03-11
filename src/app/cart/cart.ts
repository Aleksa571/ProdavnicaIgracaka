import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { ReservationModel } from '../../models/reservation.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Alerts } from '../alerts';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-korpa',
  imports: [
    MatCardModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule,
    CommonModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Korpa implements OnInit, OnDestroy {
  // Kolone za rezervisano - samo pregled i uklanjanje
  displayedColumnsRezervisano = ['naziv', 'opis', 'tip', 'uzrast', 'ciljnaGrupa', 'datumProizvodnje', 'cena', 'status', 'options']
  // Kolone za pristiglo - sa ocenjivanjem
  displayedColumnsPristiglo = ['naziv', 'opis', 'tip', 'uzrast', 'ciljnaGrupa', 'datumProizvodnje', 'cena', 'status', 'ocena', 'options']
  // Kolone za otkazano - samo pregled
  displayedColumnsOtkazano = ['naziv', 'opis', 'tip', 'uzrast', 'ciljnaGrupa', 'datumProizvodnje', 'cena', 'status']
  private routerSubscription?: Subscription;
  
  // Signal za sve rezervacije
  private reservationsSignal = signal<ReservationModel[]>([])
  
  // Computed signale za različite statuse
  rezervisano = computed(() => 
    this.reservationsSignal().filter(r => r.status === 'rezervisano')
  )
  pristiglo = computed(() => 
    this.reservationsSignal().filter(r => r.status === 'pristiglo')
  )
  otkazano = computed(() => 
    this.reservationsSignal().filter(r => r.status === 'otkazano')
  )

  constructor(public router: Router) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }
    
    // Osveži podatke kada se navigira na ovu stranicu
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/korpa') {
          console.log('Navigated to korpa, refreshing reservations')
          this.loadReservations()
        }
      })
  }

  ngOnInit() {
    this.loadReservations()
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe()
    }
  }

  loadReservations() {
    const reservations = AuthService.getAllReservations()
    console.log('Loading reservations:', reservations)
    console.log('Rezervisano count:', reservations.filter(r => r.status === 'rezervisano').length)
    this.reservationsSignal.set(reservations)
    console.log('Signal updated. Rezervisano signal:', this.rezervisano().length)
  }

  reloadComponent() {
    this.loadReservations()
    // Alternativno, možemo koristiti router reload
    // this.router.navigateByUrl('/', { skipLocationChange: true })
    //   .then(() => {
    //     this.router.navigate(['/korpa'])
    //   })
  }

  getReservations(): ReservationModel[] {
    return this.reservationsSignal()
  }

  getReservationsByStatus(status: 'rezervisano' | 'pristiglo' | 'otkazano'): ReservationModel[] {
    return this.reservationsSignal().filter(r => r.status === status)
  }

  removeReservation(reservation: ReservationModel) {
    if (reservation.status === 'pristiglo') {
      Alerts.confirm(`Da li ste sigurni da želite da obrišete "${reservation.naziv}" iz korpe?`, () => {
        AuthService.deleteReservation(reservation.createdAt);
        this.loadReservations();
      });
    } else {
      Alerts.error('Možete obrisati samo igračke sa statusom "pristiglo"!');
    }
  }

  cancelReservation(reservation: ReservationModel) {
    if (reservation.status === 'rezervisano') {
      Alerts.confirm(`Da li ste sigurni da želite da uklonite "${reservation.naziv}" iz korpe?`, () => {
        AuthService.cancelReservation(reservation.createdAt);
        this.loadReservations();
      });
    }
  }

  updateReservationStatus(reservation: ReservationModel, newStatus: 'rezervisano' | 'pristiglo' | 'otkazano') {
    AuthService.updateReservationStatus(reservation.createdAt, newStatus);
    this.loadReservations();
  }

  rateToy(reservation: ReservationModel, rating: number) {
    if (reservation.status === 'pristiglo') {
      AuthService.rateToy(reservation.createdAt, rating);
      this.loadReservations();
    } else {
      Alerts.error('Možete ocenjivati samo igračke sa statusom "pristiglo"!');
    }
  }

  calculateTotal(): number {
    // Računaj samo rezervisane igračke
    let total = 0;
    for (let reservation of this.rezervisano()) {
      total += reservation.cena;
    }
    return total;
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('sr-RS')} RSD`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('sr-RS');
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'rezervisano': return 'primary';
      case 'pristiglo': return 'accent';
      case 'otkazano': return 'warn';
      default: return '';
    }
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? 'star' : 'star_border');
    }
    return stars;
  }
}
