import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
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
export class Korpa {
  displayedColumns = ['naziv', 'tip', 'uzrast', 'cena', 'status', 'ocena', 'options']
  editingReservation: string | null = null;
  editData: Partial<ReservationModel> = {};

  constructor(public router: Router) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }
  }

  reloadComponent() {
    this.router.navigateByUrl('/', { skipLocationChange: true })
      .then(() => {
        this.router.navigate(['/korpa'])
      })
  }

  getReservations(): ReservationModel[] {
    return AuthService.getAllReservations();
  }

  getReservationsByStatus(status: 'rezervisano' | 'pristiglo' | 'otkazano'): ReservationModel[] {
    return AuthService.getReservationsByStatus(status);
  }

  removeReservation(reservation: ReservationModel) {
    if (reservation.status === 'pristiglo') {
      Alerts.confirm(`Da li ste sigurni da želite da obrišete "${reservation.naziv}" iz korpe?`, () => {
        AuthService.deleteReservation(reservation.createdAt);
        this.reloadComponent();
      });
    } else {
      Alerts.error('Možete obrisati samo igračke sa statusom "pristiglo"!');
    }
  }

  cancelReservation(reservation: ReservationModel) {
    if (reservation.status === 'rezervisano') {
      Alerts.confirm(`Da li ste sigurni da želite da otkažete rezervaciju za "${reservation.naziv}"?`, () => {
        AuthService.cancelReservation(reservation.createdAt);
        this.reloadComponent();
      });
    }
  }

  updateReservationStatus(reservation: ReservationModel, newStatus: 'rezervisano' | 'pristiglo' | 'otkazano') {
    AuthService.updateReservationStatus(reservation.createdAt, newStatus);
    this.reloadComponent();
  }

  startEdit(reservation: ReservationModel) {
    if (reservation.status === 'rezervisano') {
      this.editingReservation = reservation.createdAt;
      this.editData = { ...reservation };
    } else {
      Alerts.error('Možete menjati samo igračke sa statusom "rezervisano"!');
    }
  }

  saveEdit() {
    if (this.editingReservation) {
      AuthService.updateReservation(this.editingReservation, this.editData);
      this.editingReservation = null;
      this.editData = {};
      this.reloadComponent();
    }
  }

  cancelEdit() {
    this.editingReservation = null;
    this.editData = {};
  }

  rateToy(reservation: ReservationModel, rating: number) {
    if (reservation.status === 'pristiglo') {
      AuthService.rateToy(reservation.createdAt, rating);
      this.reloadComponent();
    } else {
      Alerts.error('Možete ocenjivati samo igračke sa statusom "pristiglo"!');
    }
  }

  calculateTotal(): number {
    let total = 0;
    for (let reservation of this.getReservations()) {
      if (reservation.status !== 'otkazano') {
        total += reservation.cena;
      }
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
