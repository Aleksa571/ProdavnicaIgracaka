import { Component, signal, computed, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
  displayedColumnsRezervisano = ['naziv', 'tip', 'uzrast', 'ciljnaGrupa', 'datumProizvodnje', 'cena', 'status', 'options']
  displayedColumnsPristiglo = ['naziv', 'tip', 'uzrast', 'ciljnaGrupa', 'datumProizvodnje', 'cena', 'status', 'ocena', 'options']
  displayedColumnsOtkazano = ['naziv', 'tip', 'uzrast', 'ciljnaGrupa', 'datumProizvodnje', 'cena', 'status', 'options']
  private routerSubscription?: Subscription;
  ratingComment: string = ''
  ratingReservation: ReservationModel | null = null
  showRatingDialog: boolean = false
  selectedRating: number = 0

  private reservationsSignal = signal<ReservationModel[]>([])

  rezervisano = computed(() =>
    this.reservationsSignal().filter(r => r.status === 'rezervisano')
  )
  pristiglo = computed(() =>
    this.reservationsSignal().filter(r => r.status === 'pristiglo')
  )
  otkazano = computed(() =>
    this.reservationsSignal().filter(r => r.status === 'otkazano')
  )

  constructor(public router: Router, private cdr: ChangeDetectorRef) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }

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

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupScrollAnimations()
      this.animateTableRows()
    }, 300)
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe()
    }
  }

  animateTableRows() {
  const rows = document.querySelectorAll('.reservations-table mat-row');
  if (rows.length === 0) return;

  rows.forEach((row, index) => {
    setTimeout(() => {
      (row as HTMLElement).style.opacity = '1';
      (row as HTMLElement).style.transform = 'translateY(0)';
    }, index * 50); 
  });
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

    document.querySelectorAll('.reservations-table, .summary-section').forEach(el => {
      el.classList.add('animate-on-scroll')
      observer.observe(el)
    })
  }

  loadReservations() {
    const reservations = AuthService.getAllReservations();
    this.reservationsSignal.set(reservations);

    this.cdr.detectChanges();

    setTimeout(() => {
      this.cdr.detectChanges();
      this.animateTableRows();
      this.setupScrollAnimations();
    }, 100);

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 300);
  }

  reloadComponent() {
    this.loadReservations()
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
        // Use setTimeout to ensure the deletion is complete before reloading
        setTimeout(() => {
          this.loadReservations();
        }, 100);
      });
    } else {
      Alerts.error('Možete obrisati samo igračke sa statusom "pristiglo"!');
    }
  }

  cancelReservation(reservation: ReservationModel) {
    if (reservation.status === 'rezervisano') {
      Alerts.confirm(`Da li ste sigurni da želite da uklonite "${reservation.naziv}" iz korpe?`, () => {
        AuthService.cancelReservation(reservation.createdAt);
        // Use setTimeout to ensure the cancellation is complete before reloading
        setTimeout(() => {
          this.loadReservations();
        }, 100);
      });
    }
  }

  updateReservationStatus(reservation: ReservationModel, newStatus: 'rezervisano' | 'pristiglo' | 'otkazano') {
    AuthService.updateReservationStatus(reservation.createdAt, newStatus);
    // Use setTimeout to ensure the update is complete before reloading
    setTimeout(() => {
      this.loadReservations();
    }, 100);
  }

  openRatingDialog(reservation: ReservationModel) {
    if (reservation.status === 'pristiglo') {
      this.ratingReservation = reservation
      this.ratingComment = ''
      this.selectedRating = 0
      this.showRatingDialog = true
    } else {
      Alerts.error('Možete ocenjivati samo igračke sa statusom "pristiglo"!');
    }
  }

  selectRating(rating: number) {
    this.selectedRating = rating
  }

  submitRating() {
    if (!this.ratingReservation) return

    if (this.selectedRating === 0) {
      Alerts.error('Molimo izaberite ocenu!');
      return
    }

    AuthService.rateToy(this.ratingReservation.createdAt, this.selectedRating, this.ratingComment);
    this.showRatingDialog = false
    this.ratingReservation = null
    this.ratingComment = ''
    this.selectedRating = 0

    setTimeout(() => {
      this.loadReservations();
      Alerts.success('Recenzija je uspešno dodata!');
    }, 100);
  }

  cancelRating() {
    this.showRatingDialog = false
    this.ratingReservation = null
    this.ratingComment = ''
    this.selectedRating = 0
  }

  calculateTotal(): number {
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
    switch (status) {
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

  deleteCancelledReservation(reservation: ReservationModel) {
    if (reservation.status === 'otkazano') {
      Alerts.confirm(`Da li ste sigurni da želite trajno obrisati "${reservation.naziv}"?`, () => {
        AuthService.deleteReservation(reservation.createdAt);
        setTimeout(() => {
          this.loadReservations();
        }, 100);
      });
    }
  }

  clearCancelledReservations() {
    const cancelledCount = this.otkazano().length;
    if (cancelledCount === 0) {
      Alerts.error('Nema otkazanih rezervacija za brisanje.');
      return;
    }

    Alerts.confirm(`Da li ste sigurni da želite trajno obrisati sve otkazane rezervacije (${cancelledCount})?`, () => {
      const cancelledReservations = this.otkazano();
      for (const reservation of cancelledReservations) {
        AuthService.deleteReservation(reservation.createdAt);
      }
      setTimeout(() => {
        this.loadReservations();
        Alerts.success(`Uspešno obrisano ${cancelledCount} otkazanih rezervacija.`);
      }, 100);
    });
  }
}
